
-- Create placement_order_events table for PayPal Stabilizer Analytics
create table if not exists public.placement_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  event_type text not null, -- intake_created, redirected_to_paypal, returned_from_paypal, marked_paid
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.placement_order_events enable row level security;

-- Policies
-- Allow anyone to create events (public facing for tracking)
create policy "Anyone can insert placement order events"
  on public.placement_order_events
  for insert
  with check (true);

-- Allow admins to view all events
create policy "Admins can view all placement order events"
  on public.placement_order_events
  for select
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Index for faster analytics queries
create index if not exists idx_placement_order_events_order_id on public.placement_order_events(order_id);
create index if not exists idx_placement_order_events_event_type on public.placement_order_events(event_type);
