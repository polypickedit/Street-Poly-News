-- Migration: Create Media Outlets and Syndication logic
-- This adds the 'media_outlets' table and extends 'submissions' to support multi-outlet distribution.

-- 1. Media Outlets Table
CREATE TABLE IF NOT EXISTS public.media_outlets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    outlet_type TEXT NOT NULL DEFAULT 'blog' CHECK (outlet_type IN ('blog', 'news', 'playlist', 'community', 'social')),
    accepted_content_types TEXT[] DEFAULT '{music,story,announcement}',
    preferred_word_count INTEGER,
    requires_review BOOLEAN DEFAULT true,
    website_url TEXT,
    logo_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Extend Submissions for Syndication
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS submission_type TEXT NOT NULL DEFAULT 'music' CHECK (submission_type IN ('music', 'story', 'announcement')),
ADD COLUMN IF NOT EXISTS distribution_targets JSONB DEFAULT '[]'::jsonb, -- Array of outlet IDs and their specific status
ADD COLUMN IF NOT EXISTS content_bundle JSONB DEFAULT '{}'::jsonb; -- Holds long_form, short_form, etc.

-- 3. Submission Distribution Status (Join Table for granular tracking)
CREATE TABLE IF NOT EXISTS public.submission_distribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.media_outlets(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'scheduled')),
    published_url TEXT,
    published_at TIMESTAMPTZ,
    notes_internal TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(submission_id, outlet_id)
);

-- 4. RLS Policies for Outlets
ALTER TABLE public.media_outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_distribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active outlets" ON public.media_outlets
    FOR SELECT USING (active = true);

CREATE POLICY "Admins and Editors can manage outlets" ON public.media_outlets
    FOR ALL USING (public.is_admin_or_editor());

CREATE POLICY "Admins and Editors can view distribution status" ON public.submission_distribution
    FOR SELECT USING (public.is_admin_or_editor());

CREATE POLICY "Admins and Editors can update distribution status" ON public.submission_distribution
    FOR ALL USING (public.is_admin_or_editor());

-- 5. Seed initial outlets
INSERT INTO public.media_outlets (name, slug, description, outlet_type)
VALUES 
('StreetPoly News', 'streetpoly-news', 'The core newsroom and media hub for StreetPoly.', 'news'),
('Urban Beats Blog', 'urban-beats', 'Partner blog focusing on hip-hop and urban culture.', 'blog'),
('The Daily Feed', 'daily-feed', 'Community-driven news and announcement feed.', 'community')
ON CONFLICT (slug) DO NOTHING;
