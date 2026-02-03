-- CONTENT PLACEMENTS & CMS SLOTS
-- Architecture: Control Room / Slot-based Assignment

CREATE TABLE IF NOT EXISTS public.content_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_key TEXT NOT NULL,            -- e.g. "home.hero"
    content_type TEXT NOT NULL CHECK (content_type IN ('video','article','ad','gallery')),
    content_id TEXT,                   -- ID of the target content
    priority INTEGER DEFAULT 0,        -- Used to resolve ties
    starts_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ,
    device_scope TEXT DEFAULT 'all' CHECK (device_scope IN ('all','mobile','desktop')),
    metadata JSONB DEFAULT '{}',       -- Layout specific tweaks
    active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Optimized Index: Match the site's read pattern (Slot lookup + Priority + Time Window)
CREATE INDEX IF NOT EXISTS idx_content_placements_active
ON public.content_placements (slot_key, priority DESC)
WHERE (active = true);

-- RLS
ALTER TABLE public.content_placements ENABLE ROW LEVEL SECURITY;

-- Public can read active placements
CREATE POLICY "content_placements_read" ON public.content_placements
    FOR SELECT USING (
        active = true AND 
        (starts_at IS NULL OR starts_at <= now()) AND 
        (ends_at IS NULL OR ends_at >= now())
    );

-- Admins/Editors can do everything
CREATE POLICY "content_placements_admin" ON public.content_placements
    FOR ALL USING (public.is_admin_or_editor());

-- Log admin actions
CREATE OR REPLACE FUNCTION log_content_placement_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_actions (admin_user_id, action_type, target_type, target_id, metadata)
    VALUES (
        auth.uid(),
        TG_OP,
        'content_placement',
        COALESCE(NEW.id, OLD.id)::text,
        jsonb_build_object(
            'slot_key', COALESCE(NEW.slot_key, OLD.slot_key), 
            'content_type', COALESCE(NEW.content_type, OLD.content_type),
            'previous_id', CASE WHEN TG_OP = 'UPDATE' THEN OLD.content_id ELSE NULL END
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_content_placement ON public.content_placements;
CREATE TRIGGER trigger_log_content_placement
AFTER INSERT OR UPDATE OR DELETE ON public.content_placements
FOR EACH ROW EXECUTE FUNCTION log_content_placement_action();
