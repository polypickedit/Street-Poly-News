-- Migration: Add username_normalized and tracking columns
-- Purpose: Restore columns that were commented out in fix_schema_drift.sql due to partial apply.

DO $$
BEGIN
    -- 1. Add username_normalized if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='username_normalized') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_normalized TEXT;
        CREATE INDEX IF NOT EXISTS idx_profiles_username_normalized ON public.profiles(username_normalized);
    END IF;

    -- 2. Add username_last_changed_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='username_last_changed_at') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_last_changed_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- 3. Add username_change_count if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='username_change_count') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_change_count INTEGER DEFAULT 0;
    END IF;

    -- 4. Backfill username_normalized (Only if NOT generated)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='profiles' AND column_name='username_normalized' 
        AND (is_generated = 'ALWAYS' OR identity_generation = 'ALWAYS') -- Postgres 12+ uses is_generated
    ) THEN
        UPDATE public.profiles 
        SET username_normalized = lower(username) 
        WHERE username_normalized IS NULL AND username IS NOT NULL;
    END IF;

END $$;
