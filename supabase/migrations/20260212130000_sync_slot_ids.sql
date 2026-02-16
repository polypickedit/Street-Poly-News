
-- Migration: Synchronize Slot IDs
-- Description: Ensures that slots have the canonical IDs expected by the frontend fallback logic.

-- 1. Clean up existing slots to avoid slug conflicts
DELETE FROM public.slots WHERE slug IN ('new-music-monday', 'featured-interview', 'sidebar-ad', 'featured-showcase');

-- 2. Insert with canonical IDs
INSERT INTO public.slots (id, name, slug, description, slot_type, visibility, monetization_model, price, is_active)
VALUES 
('00000000-0000-0000-0000-000000000001', 'New Music Monday Review', 'new-music-monday', 'Professional review and placement on New Music Monday playlist', 'service', 'public', 'one_time', 300.00, true),
('00000000-0000-0000-0000-000000000002', 'Featured Interview', 'featured-interview', 'Full length article and social media promotion', 'service', 'public', 'one_time', 150.00, true),
('00000000-0000-0000-0000-000000000003', 'Sidebar Skyscraper Ad', 'sidebar-ad', '30-day run for 240x600px sidebar advertisement', 'content', 'public', 'one_time', 75.00, true),
('00000000-0000-0000-0000-000000000004', 'Featured Showcase', 'featured-showcase', 'Front page featured section for 7 days', 'content', 'public', 'one_time', 50.00, true)
ON CONFLICT (id) DO UPDATE SET 
    slug = EXCLUDED.slug,
    price = EXCLUDED.price,
    name = EXCLUDED.name;
