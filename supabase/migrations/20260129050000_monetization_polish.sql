-- 1. Consistent RLS for Payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_editor());

-- 2. RLS for Placements (User and Admin)
DROP POLICY IF EXISTS "Users can view own placements" ON public.placements;
CREATE POLICY "Users can view own placements" ON public.placements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = public.placements.submission_id
            AND s.user_id = auth.uid()
        ) 
        OR public.is_admin_or_editor()
    );

-- 3. Ensure payment_id is nullable on placements for flexibility but encouraged
ALTER TABLE public.placements ALTER COLUMN payment_id DROP NOT NULL;

-- 4. Add 'monetized' flag to slots to distinguish from free/internal slots
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS is_monetized BOOLEAN DEFAULT true;

-- 5. Helper function for frontend to check if a user has paid for a specific slot
CREATE OR REPLACE FUNCTION public.has_paid_for_slot(target_slot_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.submissions s
        JOIN public.payments p ON s.id = p.submission_id
        WHERE s.user_id = auth.uid()
        AND s.slot_id = target_slot_id
        AND p.status = 'succeeded'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
