
-- COMMERCE SPINE INTEGRITY VALIDATION QUERIES
-- Run these queries to audit the health of the commerce system.

-- 1. Check for Orphaned Merch Orders (No User or No Items)
SELECT 
    mo.id, 
    mo.created_at, 
    mo.status,
    mo.user_id
FROM merch_orders mo
LEFT JOIN auth.users u ON mo.user_id = u.id
LEFT JOIN merch_order_items moi ON mo.id = moi.order_id
WHERE u.id IS NULL 
   OR moi.id IS NULL;

-- 2. Validate Merch Order Items Link to Products
SELECT 
    moi.id as item_id,
    moi.order_id,
    moi.product_id,
    p.title as product_title
FROM merch_order_items moi
LEFT JOIN products p ON moi.product_id = p.id
WHERE moi.product_id IS NOT NULL 
  AND p.id IS NULL; -- Should be empty

-- 3. Verify Entitlement Granting Consistency
-- Find paid orders where the user does NOT have the corresponding entitlement
SELECT 
    mo.id as order_id,
    mo.user_id,
    mo.status,
    p.entitlement_key,
    ue.id as entitlement_id
FROM merch_orders mo
JOIN merch_order_items moi ON mo.id = moi.order_id
JOIN products p ON moi.product_id = p.id
LEFT JOIN user_entitlements ue ON mo.user_id = ue.user_id 
    AND p.id = ue.product_id 
    AND ue.is_active = true
WHERE mo.status = 'paid'
  AND p.entitlement_key IS NOT NULL
  AND ue.id IS NULL; -- Should be empty if webhook worked correctly

-- 4. Check for Duplicate Active Entitlements
SELECT 
    user_id, 
    product_id, 
    entitlement_key, 
    COUNT(*) as count
FROM user_entitlements
WHERE is_active = true
GROUP BY user_id, product_id, entitlement_key
HAVING COUNT(*) > 1;

-- 5. Audit Commerce Events vs Stripe Sessions
-- Find completed commerce events that don't match order status
SELECT 
    ce.id as event_id,
    ce.stripe_session_id,
    ce.status as event_status,
    mo.status as order_status
FROM commerce_events ce
JOIN merch_orders mo ON ce.stripe_session_id = mo.stripe_session_id
WHERE ce.status = 'completed' 
  AND mo.status != 'paid';

-- 6. Check for Price Mismatches (Order Amount vs Sum of Items)
SELECT 
    mo.id,
    mo.total_amount_cents,
    SUM(moi.price_cents * moi.quantity) as calculated_total
FROM merch_orders mo
JOIN merch_order_items moi ON mo.id = moi.order_id
GROUP BY mo.id, mo.total_amount_cents
HAVING mo.total_amount_cents != SUM(moi.price_cents * moi.quantity);
