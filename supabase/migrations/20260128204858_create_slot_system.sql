-- Create Slot Type Enum
CREATE TYPE slot_type AS ENUM ('content', 'event', 'service', 'hybrid');
CREATE TYPE visibility_type AS ENUM ('public', 'account', 'paid');
CREATE TYPE monetization_model AS ENUM ('free', 'subscription', 'one_time', 'per_item', 'invite_only');

-- Create Slots Table
CREATE TABLE IF NOT EXISTS slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    slot_type slot_type NOT NULL DEFAULT 'content',
    visibility visibility_type NOT NULL DEFAULT 'public',
    monetization_model monetization_model NOT NULL DEFAULT 'free',
    price DECIMAL(10, 2),
    billing_interval TEXT, -- 'month', 'year', or null for one-time
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Entitlements Table
CREATE TABLE IF NOT EXISTS slot_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('subscription', 'purchase', 'manual', 'promo')),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(user_id, slot_id)
);

-- Enable RLS
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_entitlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Slots
CREATE POLICY "Public slots are viewable by everyone" 
ON slots FOR SELECT 
USING (visibility = 'public' AND is_active = true);

CREATE POLICY "Active slots are viewable by authenticated users" 
ON slots FOR SELECT 
TO authenticated
USING (is_active = true);

-- RLS Policies for Entitlements
CREATE POLICY "Users can view their own entitlements" 
ON slot_entitlements FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_slots_updated_at
    BEFORE UPDATE ON slots
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();
