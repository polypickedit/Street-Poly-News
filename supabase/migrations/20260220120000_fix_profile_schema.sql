DO $$
BEGIN
    -- Add profile_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='profile_type') THEN
        ALTER TABLE public.profiles ADD COLUMN profile_type TEXT DEFAULT 'listener';
    END IF;

    -- Add username_last_changed_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='username_last_changed_at') THEN
        ALTER TABLE public.profiles ADD COLUMN username_last_changed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add username_change_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='username_change_count') THEN
        ALTER TABLE public.profiles ADD COLUMN username_change_count INTEGER DEFAULT 0;
    END IF;

    -- Add display_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='display_name') THEN
        ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
    END IF;
END $$;
