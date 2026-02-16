-- Migration: Add Radio and Show Promos as Media Outlets
-- Description: Converts legacy slot types into distribution targets (add-ons).

INSERT INTO public.media_outlets (name, slug, description, outlet_type, price_cents, accepted_content_types)
VALUES 
(
    'Radio Promo Upgrade', 
    'radio-promo', 
    'Airplay rotation and on-air shoutout for your submission.', 
    'social', 
    10000, 
    '{music}'
),
(
    'Show Promo / Live Feature', 
    'show-promo', 
    'Extended live feature or show-related promotional boost.', 
    'news', 
    5000, 
    '{music,story,announcement}'
)
ON CONFLICT (slug) DO UPDATE SET
    price_cents = EXCLUDED.price_cents,
    description = EXCLUDED.description;
