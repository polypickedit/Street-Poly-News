-- Fix admin_actions foreign key to profiles for easier joins
ALTER TABLE public.admin_actions
DROP CONSTRAINT IF EXISTS admin_actions_admin_user_id_fkey;

ALTER TABLE public.admin_actions
ADD CONSTRAINT admin_actions_admin_user_id_fkey 
FOREIGN KEY (admin_user_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Ensure admin_actions has proper indexes for the dashboard
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user_id ON public.admin_actions(admin_user_id);
