-- Create placement_orders table for PayPal Stabilizer
create table if not exists public.placement_orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  slot_type text not null,
  outlet_id text, -- Can be uuid or text as per prompt
  artist_name text not null,
  email text not null,
  release_link text,
  notes text,
  status text default 'pending_paypal',
  payment_method text default 'paypal',
  created_at timestamp with time zone default now(),
  paid_at timestamp with time zone,
  paypal_transaction_id text
);

-- Enable RLS
alter table public.placement_orders enable row level security;

-- Policies
-- Allow anyone to create an order (public facing)
create policy "Anyone can create placement orders"
  on public.placement_orders
  for insert
  with check (true);

-- Allow admins to view all orders
create policy "Admins can view all placement orders"
  on public.placement_orders
  for select
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on ur.role_id = r.id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
    )
  );

-- Allow admins to update orders (for reconciliation)
create policy "Admins can update placement orders"
  on public.placement_orders
  for update
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on ur.role_id = r.id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
    )
  );
