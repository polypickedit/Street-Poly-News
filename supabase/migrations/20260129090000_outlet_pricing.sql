-- Migration: Add pricing to media outlets
ALTER TABLE public.media_outlets 
ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0;

-- Update initial outlets with some sample pricing
UPDATE public.media_outlets SET price_cents = 2500 WHERE slug = 'streetpoly-news';
UPDATE public.media_outlets SET price_cents = 1500 WHERE slug = 'urban-beats';
UPDATE public.media_outlets SET price_cents = 1000 WHERE slug = 'daily-feed';
