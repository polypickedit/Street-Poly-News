-- Migration: Merch Orders & Inventory Tracking
-- Purpose: Capture merch order metadata for logistics and expose an admin-grade inventory view.

-- 1. Merch inventory catalog (admin-managed stock)
CREATE TABLE IF NOT EXISTS public.merch_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    size TEXT,
    color TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    price_cents INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Merch orders ledger
CREATE TABLE IF NOT EXISTS public.merch_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    contact_email TEXT,
    contact_phone TEXT,
    shipping_address TEXT,
    preferred_contact_method TEXT,
    preferred_contact_value TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount_cents BIGINT,
    currency TEXT DEFAULT 'usd',
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.merch_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.merch_orders(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    size TEXT,
    color TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_cents INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.merch_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch_order_items ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Merch inventory admin only" ON public.merch_inventory;
CREATE POLICY "Merch inventory admin only" ON public.merch_inventory
    FOR ALL
    USING (public.is_owner_admin())
    WITH CHECK (public.is_owner_admin());

DROP POLICY IF EXISTS "Merch orders: owner can select" ON public.merch_orders;
CREATE POLICY "Merch orders: owner can select" ON public.merch_orders
    FOR SELECT USING (auth.uid() = user_id OR public.is_owner_admin());

DROP POLICY IF EXISTS "Merch orders: users can insert own" ON public.merch_orders;
CREATE POLICY "Merch orders: users can insert own" ON public.merch_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Merch orders: admins can update" ON public.merch_orders;
CREATE POLICY "Merch orders: admins can update" ON public.merch_orders
    FOR ALL USING (public.is_owner_admin()) WITH CHECK (public.is_owner_admin());

DROP POLICY IF EXISTS "Merch order items: owner view" ON public.merch_order_items;
CREATE POLICY "Merch order items: owner view" ON public.merch_order_items
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.merch_orders o
        WHERE o.id = public.merch_order_items.order_id
          AND (auth.uid() = o.user_id OR public.is_owner_admin())
    ));

DROP POLICY IF EXISTS "Merch order items: admins can manage" ON public.merch_order_items;
CREATE POLICY "Merch order items: admins can manage" ON public.merch_order_items
    FOR ALL USING (public.is_owner_admin()) WITH CHECK (public.is_owner_admin());

-- 5. Auditing indexes
CREATE INDEX IF NOT EXISTS idx_merch_orders_user_id ON public.merch_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON public.merch_orders(status);
CREATE INDEX IF NOT EXISTS idx_merch_order_items_order_id ON public.merch_order_items(order_id);

-- 6. Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.update_timestamp() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merch_inventory_updated ON public.merch_inventory;
CREATE TRIGGER merch_inventory_updated
    BEFORE UPDATE ON public.merch_inventory
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS merch_orders_updated ON public.merch_orders;
CREATE TRIGGER merch_orders_updated
    BEFORE UPDATE ON public.merch_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
