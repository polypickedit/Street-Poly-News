-- Migration: Submissions, Accounts, and Credit System
-- Description: Links submissions to accounts and implements a credit-based ledger.

-- 1. Update Submissions Table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id),
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'stripe' CHECK (payment_type IN ('stripe', 'credits')),
ADD COLUMN IF NOT EXISTS credits_consumed INTEGER DEFAULT 0;

-- 2. Create Credit Packs Table
CREATE TABLE IF NOT EXISTS public.credit_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    credit_amount INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed some credit packs
INSERT INTO public.credit_packs (name, credit_amount, price_cents) VALUES 
('Starter Pack', 5, 7500),  -- $75 for 5 credits ($15/ea)
('Pro Pack', 12, 15000),    -- $150 for 12 credits ($12.50/ea)
('Label Pack', 30, 30000)   -- $300 for 30 credits ($10/ea)
ON CONFLICT DO NOTHING;

-- 3. Create Account Ledger (Credits)
CREATE TABLE IF NOT EXISTS public.account_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive for credits added, negative for credits used
    description TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'consumption', 'refund', 'bonus')),
    reference_id UUID, -- Can link to submission_id or credit_pack_purchase_id
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Function to get account balance
CREATE OR REPLACE FUNCTION public.get_account_balance(target_account_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COALESCE(SUM(amount), 0) FROM public.account_ledger WHERE account_id = target_account_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies for Ledger
ALTER TABLE public.account_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their account ledger" ON public.account_ledger
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.account_members m
            WHERE m.account_id = account_ledger.account_id
              AND m.user_id = auth.uid()
        )
    );

-- 5b. Function to submit using credits
CREATE OR REPLACE FUNCTION public.submit_with_credits(
    p_account_id UUID,
    p_submission_data JSONB,
    p_credits_to_consume INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_balance INTEGER;
    v_submission_id UUID;
    v_has_access BOOLEAN;
BEGIN
    -- 0. Check membership and role
    SELECT EXISTS (
        SELECT 1 FROM public.account_members
        WHERE account_id = p_account_id
          AND user_id = auth.uid()
          AND role IN ('owner', 'manager')
    ) INTO v_has_access;

    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: You must be an owner or manager of this account';
    END IF;

    -- 1. Check balance
    v_balance := public.get_account_balance(p_account_id);
    IF v_balance < p_credits_to_consume THEN
        RAISE EXCEPTION 'Insufficient credit balance';
    END IF;

    -- 2. Create submission
    INSERT INTO public.submissions (
        account_id,
        artist_id,
        user_id,
        slot_id,
        track_title,
        artist_name,
        spotify_track_url,
        release_date,
        genre,
        mood,
        status,
        payment_status,
        payment_type,
        credits_consumed,
        notes_internal,
        submission_type,
        distribution_targets,
        content_bundle
    )
    VALUES (
        p_account_id,
        (p_submission_data->>'artist_id')::UUID,
        auth.uid(),
        (p_submission_data->>'slot_id')::UUID,
        p_submission_data->>'track_title',
        p_submission_data->>'artist_name',
        p_submission_data->>'spotify_track_url',
        (p_submission_data->>'release_date')::DATE,
        p_submission_data->>'genre',
        p_submission_data->>'mood',
        'pending',
        'paid', -- Marked as paid immediately
        'credits',
        p_credits_to_consume,
        p_submission_data->>'notes_internal',
        p_submission_data->>'submission_type',
        COALESCE(p_submission_data->'distribution_targets', '[]'::jsonb),
        p_submission_data->'content_bundle'
    )
    RETURNING id INTO v_submission_id;

    -- 2b. Create distribution records if targets exist
    IF p_submission_data ? 'distribution_targets' AND jsonb_array_length(p_submission_data->'distribution_targets') > 0 THEN
        INSERT INTO public.submission_distribution (submission_id, outlet_id, status)
        SELECT v_submission_id, (target_id)::UUID, 'pending'
        FROM jsonb_array_elements_text(p_submission_data->'distribution_targets') AS target_id;
    END IF;

    -- 3. Record in ledger
    INSERT INTO public.account_ledger (
        account_id,
        amount,
        description,
        transaction_type,
        reference_id
    )
    VALUES (
        p_account_id,
        -p_credits_to_consume,
        'Submission: ' || (p_submission_data->>'track_title'),
        'consumption',
        v_submission_id
    );

    RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Backfill existing submissions
-- First, ensure every user has an account
DO $$
DECLARE
    u RECORD;
    new_account_id UUID;
BEGIN
    FOR u IN SELECT id, email FROM auth.users LOOP
        -- Check if user already has an account they own
        SELECT id INTO new_account_id FROM public.accounts WHERE owner_user_id = u.id LIMIT 1;
        
        IF new_account_id IS NULL THEN
            -- Create a default individual account
            INSERT INTO public.accounts (name, type, owner_user_id)
            VALUES (COALESCE(u.email, 'Personal Account'), 'individual', u.id)
            RETURNING id INTO new_account_id;
            
            -- Add as owner member
            INSERT INTO public.account_members (account_id, user_id, role)
            VALUES (new_account_id, u.id, 'owner');
        END IF;
        
        -- Link submissions that don't have an account_id yet
        UPDATE public.submissions 
        SET account_id = new_account_id 
        WHERE user_id = u.id AND account_id IS NULL;
    END LOOP;
END $$;

-- 7. Update Submissions RLS to support account-based access
-- Drop old policies if they exist (they were likely based on user_id or public)
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins and Editors can view submissions" ON public.submissions;

CREATE POLICY "Account members can view submissions" ON public.submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.account_members m
            WHERE m.account_id = submissions.account_id
              AND m.user_id = auth.uid()
        ) OR public.is_admin_or_editor()
    );

-- 8. Seed Credit Packs
INSERT INTO public.credit_packs (name, description, credit_amount, price_cents)
VALUES 
    ('Starter Pack', '3 Distribution Credits - Perfect for a single release boost.', 3, 4500),
    ('Pro Pack', '10 Distribution Credits - Best for labels and active artists.', 10, 12500),
    ('Label Pack', '25 Distribution Credits - Bulk distribution for entire rosters.', 25, 25000)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Account members can update their own submissions" ON public.submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.account_members m
            WHERE m.account_id = submissions.account_id
              AND m.user_id = auth.uid()
              AND m.role IN ('owner', 'manager')
        ) OR public.is_admin_or_editor()
    );
