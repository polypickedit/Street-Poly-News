create table public.contact_submissions (
  id uuid not null default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamp with time zone not null default now(),
  status text not null default 'new',
  constraint contact_submissions_pkey primary key (id)
);

alter table public.contact_submissions enable row level security;

create policy "Enable insert for everyone" on public.contact_submissions
  for insert with check (true);

create policy "Enable read access for authenticated users only" on public.contact_submissions
  for select using (auth.role() = 'authenticated');
