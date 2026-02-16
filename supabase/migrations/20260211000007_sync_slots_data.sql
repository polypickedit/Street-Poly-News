-- Step 2, 3, 4: Update New Music Monday price, type, and status
UPDATE public.slots 
SET price = 300, 
    type = 'music', 
    is_active = true,
    visibility = 'public'
WHERE slug = 'new-music-monday';

-- Ensure featured-interview is also correct
UPDATE public.slots 
SET type = 'interview', 
    is_active = true,
    visibility = 'public'
WHERE slug = 'featured-interview';

-- Ensure sidebar-ad and featured-showcase are active
UPDATE public.slots 
SET type = 'ad', 
    is_active = true,
    visibility = 'public'
WHERE slug = 'sidebar-ad';

UPDATE public.slots 
SET type = 'feature', 
    is_active = true,
    visibility = 'public'
WHERE slug = 'featured-showcase';
