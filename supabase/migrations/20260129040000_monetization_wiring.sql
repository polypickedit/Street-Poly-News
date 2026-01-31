-- 1. Schema Enhancements for Monetization
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS slot_id UUID REFERENCES public.slots(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.placements ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.payments(id);

-- 2. Seed Initial Monetized Slots
INSERT INTO public.slots (name, slug, description, slot_type, visibility, monetization_model, price, is_active)
VALUES 
('New Music Monday Review', 'new-music-monday', 'Professional review and placement on New Music Monday playlist', 'service', 'public', 'one_time', 25.00, true),
('Featured Interview', 'featured-interview', 'Full length article and social media promotion', 'service', 'public', 'one_time', 150.00, true),
('Sidebar Skyscraper Ad', 'sidebar-ad', '30-day run for 240x600px sidebar advertisement', 'content', 'public', 'one_time', 75.00, true),
('Featured Showcase', 'featured-showcase', 'Front page featured section for 7 days', 'content', 'public', 'one_time', 50.00, true)
ON CONFLICT (slug) DO UPDATE SET 
    price = EXCLUDED.price,
    description = EXCLUDED.description;

-- 3. Payment Enforcement Logic
-- Prevent submission approval if payment is not 'paid'
CREATE OR REPLACE FUNCTION public.check_payment_before_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        IF NEW.payment_status != 'paid' THEN
            RAISE EXCEPTION 'Cannot approve unpaid submission';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_payment_on_approval ON public.submissions;
CREATE TRIGGER enforce_payment_on_approval
    BEFORE UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE PROCEDURE public.check_payment_before_approval();

-- 4. Row Level Security (RLS) Updates

-- Artists: Users can view/manage their own, Admin/Editor can view all
DROP POLICY IF EXISTS "Users can view own artists" ON public.artists;
CREATE POLICY "Users can view own artists" ON public.artists
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_editor());

DROP POLICY IF EXISTS "Users can update own artists" ON public.artists;
CREATE POLICY "Users can update own artists" ON public.artists
    FOR UPDATE USING (auth.uid() = user_id);

-- Submissions: Users can view their own, Admin/Editor can view all
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
CREATE POLICY "Users can view own submissions" ON public.submissions
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_editor());

-- Payments: Users can view their own, Admin can view all
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id OR (EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )));

-- 5. Audit Logging for Payment Status Changes
CREATE OR REPLACE FUNCTION public.log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO public.admin_actions (admin_user_id, action_type, target_type, target_id, metadata)
        VALUES (
            auth.uid(), 
            'update_payment_status', 
            'submission', 
            NEW.submission_id, 
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_payment_status_change ON public.payments;
CREATE TRIGGER on_payment_status_change
    AFTER UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE PROCEDURE public.log_payment_status_change();
