-- Add paid_at column to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add comment for clarity
COMMENT ON COLUMN submissions.paid_at IS 'Timestamp when the submission was marked as paid via Stripe webhook';
