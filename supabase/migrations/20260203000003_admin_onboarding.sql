-- Track admin onboarding walkthrough completion
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_walkthrough_completed_at TIMESTAMPTZ;

-- RLS: Only the user can view/update their own walkthrough status (already largely covered by profile rules, but being explicit)
-- Profiles table standard policy usually allows users to update their own row.
