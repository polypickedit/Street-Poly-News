-- Profile identity hardening: usernames, profile type, artist completion, cooldown updates.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS profile_type TEXT,
  ADD COLUMN IF NOT EXISTS username_last_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS username_change_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill existing rows before constraints.
UPDATE public.profiles
SET profile_type = 'viewer'
WHERE profile_type IS NULL;

UPDATE public.profiles
SET username = concat('user_', left(replace(id::text, '-', ''), 8))
WHERE username IS NULL OR btrim(username) = '';

UPDATE public.profiles
SET username = btrim(username),
    display_name = NULLIF(btrim(display_name), '')
WHERE TRUE;

-- Remove legacy single-column uniqueness to enforce normalized uniqueness instead.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Generated normalized username for case-insensitive uniqueness.
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS username_normalized;

ALTER TABLE public.profiles
  ADD COLUMN username_normalized TEXT GENERATED ALWAYS AS (lower(username)) STORED;

-- Required identity columns.
ALTER TABLE public.profiles
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN profile_type SET NOT NULL;

-- Allowed profile types.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_profile_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_profile_type_check
  CHECK (profile_type IN ('artist', 'viewer'));

-- Username format: 3-30 chars, safe charset, starts/ends with alphanumeric.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_format_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format_check
  CHECK (username ~ '^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_normalized_key
  ON public.profiles (username_normalized);

-- Keep updated_at current.
CREATE OR REPLACE FUNCTION public.touch_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_profile_updated_at();

-- Signup profile creation from auth metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_username TEXT;
  new_username TEXT;
  new_profile_type TEXT;
  new_display_name TEXT;
BEGIN
  raw_username := nullif(btrim(COALESCE(new.raw_user_meta_data->>'username', '')), '');

  IF raw_username IS NULL THEN
    -- OAuth fall-back to a deterministic unique placeholder; user can rename later.
    new_username := concat('user_', left(replace(new.id::text, '-', ''), 8));
  ELSE
    new_username := raw_username;
  END IF;

  IF new_username !~ '^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])$' THEN
    RAISE EXCEPTION 'Invalid username format';
  END IF;

  new_profile_type := lower(COALESCE(new.raw_user_meta_data->>'profile_type', 'viewer'));
  IF new_profile_type NOT IN ('artist', 'viewer') THEN
    new_profile_type := 'viewer';
  END IF;

  new_display_name := nullif(btrim(COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', '')), '');

  INSERT INTO public.profiles (id, full_name, username, display_name, profile_type)
  VALUES (
    new.id,
    nullif(btrim(COALESCE(new.raw_user_meta_data->>'full_name', '')), ''),
    new_username,
    new_display_name,
    new_profile_type
  )
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
      profile_type = COALESCE(EXCLUDED.profile_type, public.profiles.profile_type),
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.check_username_availability(
  p_username TEXT,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (available BOOLEAN, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
BEGIN
  candidate := nullif(btrim(COALESCE(p_username, '')), '');

  IF candidate IS NULL THEN
    RETURN QUERY SELECT FALSE, 'required'::TEXT;
    RETURN;
  END IF;

  IF candidate !~ '^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])$' THEN
    RETURN QUERY SELECT FALSE, 'invalid_format'::TEXT;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.username_normalized = lower(candidate)
      AND (p_current_user_id IS NULL OR p.id <> p_current_user_id)
  ) THEN
    RETURN QUERY SELECT FALSE, 'taken'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, 'available'::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_profile_setup(
  p_username TEXT,
  p_profile_type TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  normalized_type TEXT;
  cleaned_username TEXT;
  cleaned_display_name TEXT;
  result_row public.profiles;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  cleaned_username := nullif(btrim(COALESCE(p_username, '')), '');
  IF cleaned_username IS NULL OR cleaned_username !~ '^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])$' THEN
    RAISE EXCEPTION 'Username must be 3-30 characters and may only include letters, numbers, ., _, -';
  END IF;

  normalized_type := lower(COALESCE(p_profile_type, 'viewer'));
  IF normalized_type NOT IN ('artist', 'viewer') THEN
    RAISE EXCEPTION 'Invalid profile type';
  END IF;

  cleaned_display_name := nullif(btrim(COALESCE(p_display_name, '')), '');
  IF normalized_type = 'artist' AND cleaned_display_name IS NULL THEN
    RAISE EXCEPTION 'Artist display name is required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.username_normalized = lower(cleaned_username)
      AND p.id <> uid
  ) THEN
    RAISE EXCEPTION 'Username already taken. Try another.';
  END IF;

  INSERT INTO public.profiles (id, username, profile_type, display_name)
  VALUES (uid, cleaned_username, normalized_type, cleaned_display_name)
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      profile_type = EXCLUDED.profile_type,
      display_name = EXCLUDED.display_name
  RETURNING * INTO result_row;

  RETURN result_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_username(
  p_new_username TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  current_row public.profiles;
  cleaned_username TEXT;
  result_row public.profiles;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO current_row FROM public.profiles WHERE id = uid FOR UPDATE;
  IF current_row.id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  cleaned_username := nullif(btrim(COALESCE(p_new_username, '')), '');
  IF cleaned_username IS NULL OR cleaned_username !~ '^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])$' THEN
    RAISE EXCEPTION 'Username must be 3-30 characters and may only include letters, numbers, ., _, -';
  END IF;

  IF current_row.username_last_changed_at IS NOT NULL
     AND now() - current_row.username_last_changed_at < interval '30 days' THEN
    RAISE EXCEPTION 'Username edits allowed once every 30 days.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.username_normalized = lower(cleaned_username)
      AND p.id <> uid
  ) THEN
    RAISE EXCEPTION 'Username already taken. Try another.';
  END IF;

  UPDATE public.profiles
  SET username = cleaned_username,
      username_last_changed_at = now(),
      username_change_count = COALESCE(username_change_count, 0) + 1
  WHERE id = uid
  RETURNING * INTO result_row;

  RETURN result_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_username_availability(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_profile_setup(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_username(TEXT) TO authenticated;
