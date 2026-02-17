-- Listening Sessions Revenue Engine
-- Structured, manual-scheduled curation events with tiered scarcity and paid submissions.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listening_session_status') THEN
    CREATE TYPE public.listening_session_status AS ENUM ('draft', 'open', 'closed', 'completed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listening_submission_status') THEN
    CREATE TYPE public.listening_submission_status AS ENUM ('submitted', 'reviewed', 'selected', 'rejected');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listening_purchase_status') THEN
    CREATE TYPE public.listening_purchase_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
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
  slots_filled INTEGER NOT NULL DEFAULT 0 CHECK (slots_filled >= 0),
  description TEXT,
  manually_closed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, tier_name)
);

CREATE TABLE IF NOT EXISTS public.listening_session_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.listening_sessions(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.listening_session_tiers(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  payment_id UUID NULL REFERENCES public.payments(id) ON DELETE SET NULL,
  status public.listening_purchase_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  UNIQUE (user_id, tier_id, status)
);

CREATE TABLE IF NOT EXISTS public.listening_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.listening_sessions(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.listening_session_tiers(id) ON DELETE RESTRICT,
  artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purchase_id UUID UNIQUE NOT NULL REFERENCES public.listening_session_purchases(id) ON DELETE RESTRICT,
  track_title TEXT NOT NULL,
  track_url TEXT NOT NULL,
  payment_id UUID NULL REFERENCES public.payments(id) ON DELETE SET NULL,
  status public.listening_submission_status NOT NULL DEFAULT 'submitted',
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listening_sessions_status_schedule
  ON public.listening_sessions(status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_listening_session_tiers_session
  ON public.listening_session_tiers(session_id);

CREATE INDEX IF NOT EXISTS idx_listening_session_purchases_user
  ON public.listening_session_purchases(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listening_session_purchases_session_tier
  ON public.listening_session_purchases(session_id, tier_id, status);

CREATE INDEX IF NOT EXISTS idx_listening_submissions_artist
  ON public.listening_submissions(artist_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listening_submissions_session_tier
  ON public.listening_submissions(session_id, tier_id);

CREATE OR REPLACE FUNCTION public.enforce_listening_tier_slot_limit_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slot_limit < NEW.slots_filled THEN
    RAISE EXCEPTION 'slot_limit (%) cannot be lower than slots_filled (%)', NEW.slot_limit, NEW.slots_filled;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listening_tiers_guard_slot_limit ON public.listening_session_tiers;
CREATE TRIGGER listening_tiers_guard_slot_limit
  BEFORE UPDATE OF slot_limit, slots_filled ON public.listening_session_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_listening_tier_slot_limit_update();

DROP TRIGGER IF EXISTS update_listening_sessions_updated_at ON public.listening_sessions;
CREATE TRIGGER update_listening_sessions_updated_at
  BEFORE UPDATE ON public.listening_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS update_listening_session_tiers_updated_at ON public.listening_session_tiers;
CREATE TRIGGER update_listening_session_tiers_updated_at
  BEFORE UPDATE ON public.listening_session_tiers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS update_listening_submissions_updated_at ON public.listening_submissions;
CREATE TRIGGER update_listening_submissions_updated_at
  BEFORE UPDATE ON public.listening_submissions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE FUNCTION public.record_listening_tier_purchase(
  p_user_id UUID,
  p_session_id UUID,
  p_tier_id UUID,
  p_stripe_session_id TEXT,
  p_status public.listening_purchase_status DEFAULT 'paid'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id UUID;
  v_tier RECORD;
  v_session_status public.listening_session_status;
BEGIN
  SELECT status INTO v_session_status
  FROM public.listening_sessions
  WHERE id = p_session_id;

  IF v_session_status IS NULL THEN
    RAISE EXCEPTION 'Listening session not found';
  END IF;

  -- Idempotency for retried webhooks.
  SELECT id INTO v_purchase_id
  FROM public.listening_session_purchases
  WHERE stripe_session_id = p_stripe_session_id;

  IF v_purchase_id IS NOT NULL THEN
    RETURN v_purchase_id;
  END IF;

  SELECT * INTO v_tier
  FROM public.listening_session_tiers
  WHERE id = p_tier_id
    AND session_id = p_session_id
  FOR UPDATE;

  IF v_tier.id IS NULL THEN
    RAISE EXCEPTION 'Listening tier not found for this session';
  END IF;

  IF v_session_status <> 'open' THEN
    RAISE EXCEPTION 'Session is not accepting purchases';
  END IF;

  IF v_tier.manually_closed THEN
    RAISE EXCEPTION 'Tier is manually closed';
  END IF;

  IF v_tier.slots_filled >= v_tier.slot_limit THEN
    RAISE EXCEPTION 'Tier is sold out';
  END IF;

  INSERT INTO public.listening_session_purchases (
    session_id,
    tier_id,
    user_id,
    stripe_session_id,
    status,
    paid_at
  ) VALUES (
    p_session_id,
    p_tier_id,
    p_user_id,
    p_stripe_session_id,
    p_status,
    CASE WHEN p_status = 'paid' THEN now() ELSE NULL END
  )
  RETURNING id INTO v_purchase_id;

  UPDATE public.listening_session_tiers
  SET slots_filled = slots_filled + CASE WHEN p_status = 'paid' THEN 1 ELSE 0 END
  WHERE id = p_tier_id;

  RETURN v_purchase_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_listening_submission(
  p_purchase_id UUID,
  p_track_title TEXT,
  p_track_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  v_profile RECORD;
  v_purchase RECORD;
  v_submission_id UUID;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, username, display_name
  INTO v_profile
  FROM public.profiles
  WHERE id = uid;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_profile.username IS NULL OR btrim(v_profile.username) = '' THEN
    RAISE EXCEPTION 'Username is required before submitting';
  END IF;

  IF v_profile.display_name IS NULL OR btrim(v_profile.display_name) = '' THEN
    RAISE EXCEPTION 'Display name is required before submitting';
  END IF;

  SELECT *
  INTO v_purchase
  FROM public.listening_session_purchases
  WHERE id = p_purchase_id
    AND user_id = uid
  FOR UPDATE;

  IF v_purchase.id IS NULL THEN
    RAISE EXCEPTION 'Purchase not found';
  END IF;

  IF v_purchase.status <> 'paid' THEN
    RAISE EXCEPTION 'Purchase must be paid before submission';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.listening_submissions WHERE purchase_id = p_purchase_id
  ) THEN
    RAISE EXCEPTION 'Submission already exists for this purchase';
  END IF;

  INSERT INTO public.listening_submissions (
    session_id,
    tier_id,
    artist_id,
    purchase_id,
    track_title,
    track_url,
    payment_id
  ) VALUES (
    v_purchase.session_id,
    v_purchase.tier_id,
    uid,
    p_purchase_id,
    nullif(btrim(p_track_title), ''),
    nullif(btrim(p_track_url), ''),
    v_purchase.payment_id
  )
  RETURNING id INTO v_submission_id;

  RETURN v_submission_id;
END;
$$;

ALTER TABLE public.listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_session_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_session_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Listening sessions readable" ON public.listening_sessions;
CREATE POLICY "Listening sessions readable"
  ON public.listening_sessions
  FOR SELECT
  USING (
    status <> 'draft'
    OR public.is_admin_or_editor()
  );

DROP POLICY IF EXISTS "Admins manage listening sessions" ON public.listening_sessions;
CREATE POLICY "Admins manage listening sessions"
  ON public.listening_sessions
  FOR ALL
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "Listening tiers readable" ON public.listening_session_tiers;
CREATE POLICY "Listening tiers readable"
  ON public.listening_session_tiers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.listening_sessions s
      WHERE s.id = listening_session_tiers.session_id
        AND (s.status <> 'draft' OR public.is_admin_or_editor())
    )
  );

DROP POLICY IF EXISTS "Admins manage listening tiers" ON public.listening_session_tiers;
CREATE POLICY "Admins manage listening tiers"
  ON public.listening_session_tiers
  FOR ALL
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "Users read own listening purchases" ON public.listening_session_purchases;
CREATE POLICY "Users read own listening purchases"
  ON public.listening_session_purchases
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_or_editor());

DROP POLICY IF EXISTS "Service role insert listening purchases" ON public.listening_session_purchases;
CREATE POLICY "Service role insert listening purchases"
  ON public.listening_session_purchases
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role update listening purchases" ON public.listening_session_purchases;
CREATE POLICY "Service role update listening purchases"
  ON public.listening_session_purchases
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users read own listening submissions" ON public.listening_submissions;
CREATE POLICY "Users read own listening submissions"
  ON public.listening_submissions
  FOR SELECT
  USING (auth.uid() = artist_id OR public.is_admin_or_editor());

DROP POLICY IF EXISTS "Users create own listening submissions" ON public.listening_submissions;
CREATE POLICY "Users create own listening submissions"
  ON public.listening_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

DROP POLICY IF EXISTS "Admins manage listening submissions" ON public.listening_submissions;
CREATE POLICY "Admins manage listening submissions"
  ON public.listening_submissions
  FOR ALL
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

GRANT EXECUTE ON FUNCTION public.record_listening_tier_purchase(UUID, UUID, UUID, TEXT, public.listening_purchase_status)
TO service_role;

GRANT EXECUTE ON FUNCTION public.create_listening_submission(UUID, TEXT, TEXT)
TO authenticated;

NOTIFY pgrst, 'reload schema';
