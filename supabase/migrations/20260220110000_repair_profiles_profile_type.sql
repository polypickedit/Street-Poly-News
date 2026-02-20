-- Repair missing profiles.profile_type on environments where earlier migrations drifted.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'profile_type'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_type TEXT;
  END IF;

  UPDATE public.profiles
  SET profile_type = 'viewer'
  WHERE profile_type IS NULL OR profile_type NOT IN ('artist', 'viewer');

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_profile_type_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_profile_type_check
      CHECK (profile_type IN ('artist', 'viewer'));
  END IF;

  -- Ensure no nulls exist before setting NOT NULL
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profile_type IS NULL) THEN
    ALTER TABLE public.profiles
      ALTER COLUMN profile_type SET DEFAULT 'viewer',
      ALTER COLUMN profile_type SET NOT NULL;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
