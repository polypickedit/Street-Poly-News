-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
ON public.products
FOR SELECT
TO public
USING (true);

-- Create policy to allow admin write access (optional, but good practice)
-- Assuming you have an 'admin' role or check
-- For now, we'll just allow authenticated users to read, but public needs read too.
-- The above policy covers everyone.

-- If you need admin write access:
-- CREATE POLICY "Allow admin write access"
-- ON public.products
-- FOR ALL
-- TO authenticated
-- USING (auth.jwt() ->> 'role' = 'service_role' OR (SELECT is_admin(auth.uid()))); 
