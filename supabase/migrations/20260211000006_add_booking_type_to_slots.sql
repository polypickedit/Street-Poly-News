-- Add type column to slots table for explicit UI categorization
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS type TEXT;

-- Update existing slots with their canonical types based on slugs
UPDATE public.slots SET type = 'music' WHERE slug = 'new-music-monday';
UPDATE public.slots SET type = 'interview' WHERE slug = 'featured-interview';
UPDATE public.slots SET type = 'ad' WHERE slug = 'sidebar-ad';
UPDATE public.slots SET type = 'feature' WHERE slug = 'featured-showcase';

-- Add a check constraint to ensure data integrity
ALTER TABLE public.slots ADD CONSTRAINT slots_type_check 
CHECK (type IN ('music', 'interview', 'ad', 'feature'));

-- Set a default value for future slots
ALTER TABLE public.slots ALTER COLUMN type SET DEFAULT 'music';

-- Update RLS policies to be aware of the new column if necessary (usually not needed for simple select)
-- The existing policies already allow viewing public/active slots.
