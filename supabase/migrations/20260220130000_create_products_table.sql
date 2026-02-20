-- Create products table with canonical category order and robust constraints

-- 1. Create Enum for Category Order (Enforces Join -> Book -> Learn -> Shop sequence)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
        CREATE TYPE public.product_category AS ENUM ('join', 'book', 'learn', 'shop');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_source') THEN
        CREATE TYPE public.product_source AS ENUM ('stripe', 'ecwid', 'internal');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        CREATE TYPE public.product_status AS ENUM ('active', 'archived', 'draft');
    END IF;
END $$;

-- 2. Create Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source public.product_source NOT NULL,
  category public.product_category NOT NULL,
  entitlement_key TEXT NOT NULL, -- References slots.slug or internal keys
  price INTEGER NOT NULL CHECK (price >= 0),
  status public.product_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Idempotent)
DO $$
BEGIN
    -- Public View Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Public products are viewable by everyone'
    ) THEN
        CREATE POLICY "Public products are viewable by everyone"
        ON public.products FOR SELECT
        USING (status = 'active');
    END IF;

    -- Admin Manage Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Admins can manage products'
    ) THEN
        CREATE POLICY "Admins can manage products"
        ON public.products FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid()
                AND r.name IN ('admin', 'editor')
            )
        );
    END IF;
END $$;

-- 5. Create Indexes (Idempotent)
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_entitlement_key ON public.products(entitlement_key);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_products_updated_at();
