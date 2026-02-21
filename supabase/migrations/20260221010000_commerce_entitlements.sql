-- Migration: Commerce Entitlements & Product Linkage
-- Purpose: 
-- 1. Link merch order items to products table for data integrity
-- 2. Create user_entitlements to track digital ownership/capabilities granted by products

-- 1. Add product_id to merch_order_items
ALTER TABLE public.merch_order_items
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_merch_order_items_product_id ON public.merch_order_items(product_id);

-- 2. Create user_entitlements table
CREATE TABLE IF NOT EXISTS public.user_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    entitlement_key TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'purchase', 'gift', 'system'
    source_id TEXT, -- e.g. stripe_session_id or merch_order_id
    granted_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ, -- NULL means lifetime
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON public.user_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_product_id ON public.user_entitlements(product_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_key ON public.user_entitlements(entitlement_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entitlements_unique_active 
    ON public.user_entitlements(user_id, entitlement_key) 
    WHERE is_active = TRUE AND expires_at IS NULL;

-- 3. RLS Policies
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- Users can view their own entitlements
DROP POLICY IF EXISTS "Users can view own entitlements" ON public.user_entitlements;
CREATE POLICY "Users can view own entitlements" ON public.user_entitlements
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage entitlements
DROP POLICY IF EXISTS "Admins can manage entitlements" ON public.user_entitlements;
CREATE POLICY "Admins can manage entitlements" ON public.user_entitlements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'editor')
        )
    );

-- 4. Trigger to auto-expire entitlements (optional, but good for hygiene)
-- For now, we rely on application logic to check expires_at

