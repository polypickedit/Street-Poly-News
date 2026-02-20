
-- Validation Query for PayPal Orders
-- Run this in Supabase SQL Editor to verify consistency

-- 1. Check for recent PayPal orders
SELECT 
  id, 
  order_id, 
  status, 
  payment_method, 
  email, 
  artist_name, 
  created_at, 
  paid_at 
FROM public.placement_orders 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check for potential duplicates (should be empty if constraints work)
SELECT order_id, COUNT(*) 
FROM public.placement_orders 
GROUP BY order_id 
HAVING COUNT(*) > 1;

-- 3. Verify no orphaned orders (if we had foreign keys to users, but we don't for guest checkout)
-- For now, just ensure critical fields are present
SELECT id, order_id, email 
FROM public.placement_orders 
WHERE email IS NULL OR order_id IS NULL OR artist_name IS NULL;

-- 4. Reconcile with Entitlements (Manual check since no direct link yet)
-- This query helps find users who paid but might not have entitlements if we link them later
SELECT po.email, po.status, po.paid_at
FROM public.placement_orders po
WHERE po.status = 'paid'
AND po.paid_at IS NOT NULL
ORDER BY po.paid_at DESC;
