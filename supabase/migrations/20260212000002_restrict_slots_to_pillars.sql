-- Migration: Restrict Slots to Music and Interview Pillars
-- Description: Deactivates legacy ad/feature slots and restricts slot types to core pillars.

-- 1. Deactivate legacy slots
UPDATE public.slots 
SET is_active = false 
WHERE slug IN ('sidebar-ad', 'featured-showcase');

-- 2. Update canonical slots to ensure correct pricing and active status
UPDATE public.slots 
SET price = 300.00, is_active = true, type = 'music'
WHERE slug = 'new-music-monday';

UPDATE public.slots 
SET price = 150.00, is_active = true, type = 'interview'
WHERE slug = 'featured-interview';

-- 3. Update the type constraint to only allow music and interview
-- First, drop the old constraint
ALTER TABLE public.slots DROP CONSTRAINT IF EXISTS slots_type_check;

-- Update any existing slots that might have 'ad' or 'feature' types to 'music' (fallback)
-- though they should be inactive anyway.
UPDATE public.slots SET type = 'music' WHERE type NOT IN ('music', 'interview');

-- Add the new restricted constraint
ALTER TABLE public.slots ADD CONSTRAINT slots_type_check 
CHECK (type IN ('music', 'interview'));
