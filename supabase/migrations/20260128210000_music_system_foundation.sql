-- 1. Roles & Foundation
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed roles
INSERT INTO public.roles (name) VALUES ('admin'), ('editor'), ('viewer')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role_id)
);

-- 2. Artists & Submissions
CREATE TABLE IF NOT EXISTS public.artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    track_title TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    spotify_track_url TEXT NOT NULL,
    release_date DATE NOT NULL,
    genre TEXT NOT NULL,
    mood TEXT NOT NULL,
    bpm INTEGER,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'pending_review', 'approved', 'declined', 'scheduled', 'published', 'archived')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    notes_internal TEXT,
    feedback_artist TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

-- 3. Playlists & Placements
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    spotify_playlist_url TEXT NOT NULL,
    primary_genre TEXT NOT NULL,
    primary_mood TEXT NOT NULL,
    max_tracks INTEGER DEFAULT 100,
    ideal_bpm_min INTEGER,
    ideal_bpm_max INTEGER,
    follower_count_snapshot INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Admin Activity Log
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    action_type TEXT NOT NULL CHECK (action_type IN ('approve_submission', 'decline_submission', 'create_placement', 'refund_payment')),
    target_type TEXT NOT NULL CHECK (target_type IN ('submission', 'placement', 'playlist')),
    target_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin or editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'editor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Roles & User Roles: Admin only
CREATE POLICY "Admins can manage roles" ON public.roles
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    ));

CREATE POLICY "Admins can manage user_roles" ON public.user_roles
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    ));

-- Artists: Public can insert, Admin/Editor can view/manage
CREATE POLICY "Public can insert artists" ON public.artists
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and Editors can view artists" ON public.artists
    FOR SELECT USING (public.is_admin_or_editor());

CREATE POLICY "Admins and Editors can update artists" ON public.artists
    FOR UPDATE USING (public.is_admin_or_editor());

-- Submissions: Public can insert, Admin/Editor can view/manage
CREATE POLICY "Public can insert submissions" ON public.submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and Editors can view submissions" ON public.submissions
    FOR SELECT USING (public.is_admin_or_editor());

CREATE POLICY "Admins and Editors can update submissions" ON public.submissions
    FOR UPDATE USING (public.is_admin_or_editor());

-- Playlists: Public can view active, Admin/Editor can manage
CREATE POLICY "Public can view active playlists" ON public.playlists
    FOR SELECT USING (active = true);

CREATE POLICY "Admins and Editors can manage playlists" ON public.playlists
    FOR ALL USING (public.is_admin_or_editor());

-- Placements: Admin/Editor only
CREATE POLICY "Admins and Editors can manage placements" ON public.placements
    FOR ALL USING (public.is_admin_or_editor());

-- Payments: Admin only
CREATE POLICY "Admins can view and manage payments" ON public.payments
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    ));

-- Admin Actions: Admin/Editor can view, System inserts
CREATE POLICY "Admins and Editors can view admin actions" ON public.admin_actions
    FOR SELECT USING (public.is_admin_or_editor());

CREATE POLICY "Admins and Editors can insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (public.is_admin_or_editor());
