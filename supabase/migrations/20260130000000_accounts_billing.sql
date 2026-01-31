-- Foundation for public profiles, accounts, billing plans, and invoices

-- Phase 1: Extend public profiles for shareable identities
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_public_read
ON public.profiles
FOR SELECT
USING (is_public = TRUE);

CREATE POLICY profiles_owner_write
ON public.profiles
FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Phase 2: Accounts and Members
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('individual','artist','brand','label','agency')),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.account_members (
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner','manager','viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, user_id)
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_member_read
ON public.accounts
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = accounts.id
          AND m.user_id = auth.uid()
    )
);

CREATE POLICY account_owner_write
ON public.accounts
FOR UPDATE
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY account_members_member_read
ON public.account_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY account_members_owner_all
ON public.account_members
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = account_members.account_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = account_members.account_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
    )
);

-- Phase 3: Stripe customers per account
CREATE TABLE IF NOT EXISTS public.stripe_customers (
    account_id UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY stripe_customers_account_all
ON public.stripe_customers
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = stripe_customers.account_id
          AND m.user_id = auth.uid()
    )
);

CREATE POLICY stripe_customers_insert_default
ON public.stripe_customers
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = stripe_customers.account_id
          AND m.user_id = auth.uid()
    )
);

-- Phase 4: Internal billing plans and account billing state
CREATE TABLE IF NOT EXISTS public.billing_plans (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    interval TEXT NOT NULL CHECK (interval IN ('weekly','monthly','quarterly')),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_plans_public_read
ON public.billing_plans
FOR SELECT
USING (active = TRUE);

CREATE POLICY billing_plans_admin_write
ON public.billing_plans
FOR ALL
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

CREATE TABLE IF NOT EXISTS public.account_billing (
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    billing_plan_code TEXT REFERENCES public.billing_plans(code),
    next_charge_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active','paused','canceled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, billing_plan_code)
);

ALTER TABLE public.account_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_billing_member_all
ON public.account_billing
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = account_billing.account_id
          AND m.user_id = auth.uid()
    )
);

CREATE POLICY account_billing_owner_all
ON public.account_billing
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = account_billing.account_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = account_billing.account_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
    )
);

-- Phase 5: Invoice ownership without Stripe invoicing
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft','sent','paid','void')),
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_member_read
ON public.invoices
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = invoices.account_id
          AND m.user_id = auth.uid()
    )
);

CREATE POLICY invoices_owner_all
ON public.invoices
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = invoices.account_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.account_members m
        WHERE m.account_id = invoices.account_id
          AND m.user_id = auth.uid()
          AND m.role = 'owner'
    )
);
