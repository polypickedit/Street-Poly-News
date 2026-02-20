-- Fix Schema Drift: Add missing columns to profiles
-- This migration ensures the profiles table matches frontend expectations.

DO $$
BEGIN
    -- 0. Add profile_type if missing (required by frontend profile query)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='profile_type') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_type TEXT;
    END IF;

    -- 1. Add username_normalized if missing
    /*
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

    -- 4. Backfill username_normalized
    UPDATE public.profiles 
    SET username_normalized = lower(username) 
    WHERE username_normalized IS NULL AND username IS NOT NULL;

    -- 5. Backfill and constrain profile_type
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

    -- Make profile_type required now that nulls are backfilled.
    -- Ensure no nulls exist before setting NOT NULL
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profile_type IS NULL) THEN
        ALTER TABLE public.profiles
          ALTER COLUMN profile_type SET DEFAULT 'viewer',
          ALTER COLUMN profile_type SET NOT NULL;
    END IF;
    */

END $$;

-- Ensure Listening Sessions tables exist (Idempotent check)
-- This is a safety measure in case the previous migration failed or wasn't run.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listening_session_status') THEN
    CREATE TYPE public.listening_session_status AS ENUM ('draft', 'open', 'closed', 'completed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.listening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status public.listening_session_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listening_session_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.listening_sessions(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  slot_limit INTEGER NOT NULL CHECK (slot_limit > 0),
  slots_filled INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  manually_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listening_session_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.listening_sessions(id),
    tier_id UUID NOT NULL REFERENCES public.listening_session_tiers(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_id TEXT, -- Stripe PaymentIntent ID
    stripe_session_id TEXT, -- Stripe Checkout Session ID
    amount_total_cents INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    paid_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_session_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_session_purchases ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users for reading open sessions
DROP POLICY IF EXISTS "Listening sessions readable" ON public.listening_sessions;
CREATE POLICY "Listening sessions readable"
  ON public.listening_sessions
  FOR SELECT
  USING (
    status <> 'draft'
    OR (auth.uid() IN (SELECT user_id FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'editor'))))
  );

-- Grant access to authenticated users for reading tiers
DROP POLICY IF EXISTS "Listening tiers readable" ON public.listening_session_tiers;
CREATE POLICY "Listening tiers readable"
  ON public.listening_session_tiers
  FOR SELECT
  USING (true);

-- Re-notify schema reload
NOTIFY pgrst, 'reload schema';
