-- COMMERCE LEDGER: Deterministic tracking for all financial events
CREATE TABLE IF NOT EXISTS public.commerce_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    stripe_session_id TEXT,
    stripe_event_id TEXT,
    type TEXT NOT NULL, -- 'checkout_created', 'webhook_received', 'entitlement_granted', 'error'
    status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
    amount_total INTEGER,
    currency TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance and traceability
CREATE INDEX IF NOT EXISTS idx_commerce_events_user_id ON public.commerce_events(user_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_stripe_session_id ON public.commerce_events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_stripe_event_id ON public.commerce_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_commerce_events_type ON public.commerce_events(type);

-- Ensure idempotency for retried events
ALTER TABLE public.commerce_events ADD CONSTRAINT commerce_events_event_id_type_key UNIQUE (stripe_event_id, type);

-- RLS
ALTER TABLE public.commerce_events ENABLE ROW LEVEL SECURITY;

-- Admins can view all commerce events
CREATE POLICY "Admins can view all commerce events"
    ON public.commerce_events
    FOR SELECT
    USING (public.is_admin_or_editor());

-- Users can view their own commerce events
CREATE POLICY "Users can view own commerce events"
    ON public.commerce_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Internal service role can do everything
-- (Already covered by default Supabase service role behavior, but good to keep in mind)
