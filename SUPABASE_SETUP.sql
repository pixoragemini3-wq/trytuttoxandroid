-- Create the table for storing GPS simulations
create table public.gps_simulations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  grade text,
  post_type text,
  cdc text,
  fascia text,
  access_score numeric,
  cultural_score numeric,
  service_score numeric,
  total_score numeric,
  details jsonb
);

-- Enable Row Level Security (RLS)
alter table public.gps_simulations enable row level security;

-- Create a policy to allow anonymous inserts (since we are using the anon key from the client)
-- WARNING: This allows anyone with your anon key (which is public) to insert data.
-- For a production app, you might want more strict policies or authentication.
create policy "Enable insert for anon users" on public.gps_simulations
  for insert
  with check (true);

-- Create a policy to allow reading (optional, if you want to display stats later)
create policy "Enable read access for all users" on public.gps_simulations
  for select
  using (true);
