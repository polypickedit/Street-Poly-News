-- Normalize 'slots' into 'offers' mental model
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS duration_days INTEGER;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS entitlement_code TEXT;

-- Update existing slots with canonical codes and durations
UPDATE public.slots SET 
    entitlement_code = 'music_monday',
    duration_days = 7
WHERE slug = 'new-music-monday';

UPDATE public.slots SET 
    entitlement_code = 'featured_interview',
    duration_days = 0 -- Permanent content
WHERE slug = 'featured-interview';

UPDATE public.slots SET 
    entitlement_code = 'sidebar_ad',
    duration_days = 30
WHERE slug = 'sidebar-ad';

UPDATE public.slots SET 
    entitlement_code = 'featured_showcase',
    duration_days = 7
WHERE slug = 'featured-showcase';

-- Add a display_category for UI grouping
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS display_category TEXT DEFAULT 'service' CHECK (display_category IN ('service', 'ad', 'feature', 'booking'));

UPDATE public.slots SET display_category = 'service' WHERE slug IN ('new-music-monday', 'featured-interview');
UPDATE public.slots SET display_category = 'ad' WHERE slug = 'sidebar-ad';
UPDATE public.slots SET display_category = 'feature' WHERE slug = 'featured-showcase';
