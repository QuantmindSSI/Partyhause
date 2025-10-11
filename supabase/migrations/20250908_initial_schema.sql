-- Initial schema setup
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    name text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Events table
create table if not exists public.events (
    id uuid primary key default uuid_generate_v4(),
    host_id uuid references auth.users(id) not null,
    name text not null,
    event_date timestamp with time zone not null,
    location text not null,
    spotify_playlist_url text,
    active_game_id uuid,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Guests table
create table if not exists public.guests (
    id uuid primary key default uuid_generate_v4(),
    event_id uuid references events(id) on delete cascade not null,
    name text not null,
    email text not null,
    is_checked_in boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Basic RLS policies
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;

-- Function to create policy if it doesn't exist
create or replace function create_policy_if_not_exists(
    policy_name text,
    table_name text,
    policy_sql text
) returns void as $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = table_name 
        and policyname = policy_name
    ) then
        execute policy_sql;
    end if;
end;
$$ language plpgsql;

-- Users policies
select create_policy_if_not_exists(
    'Users can view their own profile',
    'users',
    'create policy "Users can view their own profile" on public.users for select using (auth.uid() = id)'
);

select create_policy_if_not_exists(
    'Users can create their own profile',
    'users',
    'create policy "Users can create their own profile" on public.users for insert with check (auth.uid() = id)'
);

select create_policy_if_not_exists(
    'Users can update their own profile',
    'users',
    'create policy "Users can update their own profile" on public.users for update using (auth.uid() = id)'
);

select create_policy_if_not_exists(
    'Users can delete their own profile',
    'users',
    'create policy "Users can delete their own profile" on public.users for delete using (auth.uid() = id)'
);

-- Events policies
select create_policy_if_not_exists(
    'Users can view their own events',
    'events',
    'create policy "Users can view their own events" on public.events for select using (auth.uid() = host_id)'
);

select create_policy_if_not_exists(
    'Users can create their own events',
    'events',
    'create policy "Users can create their own events" on public.events for insert with check (auth.uid() = host_id)'
);

select create_policy_if_not_exists(
    'Users can update their own events',
    'events',
    'create policy "Users can update their own events" on public.events for update using (auth.uid() = host_id)'
);

select create_policy_if_not_exists(
    'Users can delete their own events',
    'events',
    'create policy "Users can delete their own events" on public.events for delete using (auth.uid() = host_id)'
);

-- Guests policies
select create_policy_if_not_exists(
    'Users can view guests of their events',
    'guests',
    'create policy "Users can view guests of their events" on public.guests for select using (exists (select 1 from events where events.id = guests.event_id and events.host_id = auth.uid()))'
);

select create_policy_if_not_exists(
    'Users can manage guests of their events',
    'guests',
    'create policy "Users can manage guests of their events" on public.guests for all using (exists (select 1 from events where events.id = guests.event_id and events.host_id = auth.uid()))'
);
