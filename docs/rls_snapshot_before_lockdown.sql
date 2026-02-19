-- RLS Policy Snapshot Query
-- Run this in Supabase SQL Editor to capture the state BEFORE applying the lockdown.
-- Save the output results here.

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename IN (
    'profiles',
    'accounts',
    'submissions',
    'payments',
    'artists',
    'merch_orders',
    'merch_order_items',
    'listening_sessions',
    'listening_session_tiers',
    'listening_session_purchases',
    'listening_submissions'
)
ORDER BY tablename, policyname;
