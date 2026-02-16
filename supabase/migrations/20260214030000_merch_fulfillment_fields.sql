-- Add fulfillment fields to merch_orders
ALTER TABLE public.merch_orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Update RLS policies to ensure admins can manage these fields
-- (Existing policies in 20260214020000_merch_orders.sql already allow admins to update all columns)
