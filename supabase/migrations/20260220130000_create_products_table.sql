-- Create products table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  source text not null check (source in ('stripe', 'ecwid', 'internal')),
  category text not null check (category in ('join', 'book', 'learn', 'shop')),
  entitlement_key text not null,
  price integer not null check (price >= 0),
  status text not null default 'draft' check (status in ('active', 'archived', 'draft')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.products enable row level security;

-- Policies
create policy "Public products are viewable by everyone"
  on public.products for select
  using (status = 'active');

create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role in ('admin', 'editor')
    )
  );

-- Indexes
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_entitlement_key on public.products(entitlement_key);
create index if not exists idx_products_status on public.products(status);
