
-- Validation Query for PayPal Funnel Analytics
-- Run this in Supabase SQL Editor to verify event tracking

-- 1. Check Event Stream (Most recent events)
SELECT 
  event_type, 
  order_id, 
  created_at, 
  metadata
FROM public.placement_order_events
ORDER BY created_at DESC
LIMIT 20;

-- 2. Verify Funnel Counts (Raw data for the card)
SELECT 
  event_type, 
  COUNT(*) as total_count
FROM public.placement_order_events
GROUP BY event_type;

-- 3. Check Conversion for Specific Order (Trace a single user journey)
-- Replace 'YOUR_ORDER_ID' with an actual order ID
/*
SELECT * 
FROM public.placement_order_events
WHERE order_id = 'YOUR_ORDER_ID'
ORDER BY created_at ASC;
*/
