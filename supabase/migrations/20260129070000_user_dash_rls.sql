-- Allow users to see their own placements and payments
DROP POLICY IF EXISTS "Users can view own placements" ON public.placements;
CREATE POLICY "Users can view own placements" ON public.placements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = placements.submission_id
            AND s.user_id = auth.uid()
        )
        OR public.is_admin_or_editor()
    );

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (
        auth.uid() = user_id 
        OR public.is_admin_or_editor()
    );

-- Also ensure submissions policy is robust
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
CREATE POLICY "Users can view own submissions" ON public.submissions
    FOR SELECT USING (
        auth.uid() = user_id 
        OR public.is_admin_or_editor()
    );
