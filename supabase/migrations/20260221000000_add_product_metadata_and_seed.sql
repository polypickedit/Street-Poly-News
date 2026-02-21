-- Add missing metadata columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add unique constraint on entitlement_key to support UPSERT operations
-- Using DO block to check for existence first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_entitlement_key_key'
    ) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_entitlement_key_key UNIQUE (entitlement_key);
    END IF;
END $$;

-- Insert seed data from Merch page
INSERT INTO public.products (title, category, source, entitlement_key, status, price, image_url, description)
VALUES
  ('Streetpoly Logo Tee', 'shop', 'internal', 'merch_tee_logo', 'active', 2999, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', 'Classic logo tee.'),
  ('Urban Voices Hoodie', 'shop', 'internal', 'merch_hoodie_urban', 'active', 5999, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop', 'Premium heavyweight hoodie.'),
  ('Movement Graphic Tee', 'shop', 'internal', 'merch_tee_movement', 'active', 3499, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop', 'Graphic tee with movement design.'),
  ('Street Culture Hoodie', 'shop', 'internal', 'merch_hoodie_culture', 'active', 6499, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop', 'Street culture inspired hoodie.'),
  ('Resist Classic Tee', 'shop', 'internal', 'merch_tee_resist', 'active', 2799, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop', 'Classic resist tee.'),
  ('Block Party Zip Hoodie', 'shop', 'internal', 'merch_hoodie_block', 'active', 6999, 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=400&h=400&fit=crop', 'Zip hoodie for block parties.')
ON CONFLICT (entitlement_key) DO UPDATE SET
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  updated_at = now();
