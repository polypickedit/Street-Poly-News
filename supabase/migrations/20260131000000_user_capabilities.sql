-- Migration: User Capabilities System
-- Description: Replaces the credit-based system with a permission-based capability model.

-- 1. Create User Capabilities Table
CREATE TABLE IF NOT EXISTS public.user_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    capability TEXT NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, capability, granted_at) -- Allow multiple grants of the same capability if granted at different times
);

-- 2. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_capabilities_user_id ON public.user_capabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_capabilities_capability ON public.user_capabilities(capability);

-- 3. RLS Policies
ALTER TABLE public.user_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own capabilities" ON public.user_capabilities
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Function to check if a user has a specific capability
CREATE OR REPLACE FUNCTION public.has_capability(p_user_id UUID, p_capability TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_capabilities
        WHERE user_id = p_user_id
          AND capability = p_capability
          AND (expires_at IS NULL OR expires_at > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to consume a capability (deletes the oldest one)
CREATE OR REPLACE FUNCTION public.consume_capability(p_user_id UUID, p_capability TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id
    FROM public.user_capabilities
    WHERE user_id = p_user_id
      AND capability = p_capability
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY granted_at ASC
    LIMIT 1;

    IF v_id IS NOT NULL THEN
        DELETE FROM public.user_capabilities WHERE id = v_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Cleanup: We'll keep the old tables for now to avoid breaking data, 
-- but we mark them as deprecated in our mental model.
COMMENT ON TABLE public.account_ledger IS 'DEPRECATED: Use user_capabilities instead.';
COMMENT ON TABLE public.credit_packs IS 'DEPRECATED: Use products map in application code.';
