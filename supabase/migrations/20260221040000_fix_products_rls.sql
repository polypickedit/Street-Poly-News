-- Fix overly permissive public read access on products introduced in 20260221020000
-- The previous policy "Allow public read access" used USING (true), which exposed draft/archived products.

DROP POLICY IF EXISTS "Allow public read access" ON public.products;

-- Ensure the correct policy exists (idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Public products are viewable by everyone'
    ) THEN
        CREATE POLICY "Public products are viewable by everyone"
        ON public.products FOR SELECT
        USING (status = 'active');
    END IF;
END $$;
