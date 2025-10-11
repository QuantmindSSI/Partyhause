-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Clean up existing tables if they exist
drop table if exists game_sessions;
drop table if exists games;
drop table if exists guests;
drop table if exists events;
drop table if exists users;

-- Create tables
create table users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    name text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table events (
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

create table guests (
    id uuid primary key default uuid_generate_v4(),
    event_id uuid references events(id) on delete cascade not null,
    name text not null,
    email text not null,
    is_checked_in boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table games (
    id uuid primary key default uuid_generate_v4(),
    event_id uuid references events(id) on delete cascade not null,
    type text not null,
    settings jsonb default '{}'::jsonb,
    content jsonb default '{}'::jsonb,
    order_index integer not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table game_sessions (
    id uuid primary key default uuid_generate_v4(),
    game_id uuid references games(id) on delete cascade not null,
    status text not null default 'pending',
    current_round integer default 0,
    scores jsonb default '{}'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add foreign key constraint for active_game_id after games table is created
alter table events 
add constraint fk_events_active_game 
foreign key (active_game_id) 
references games(id) 
on delete set null;

-- Create indexes
create index idx_events_host_id on events(host_id);
create index idx_guests_event_id on guests(event_id);
create index idx_games_event_id on games(event_id);
create index idx_game_sessions_game_id on game_sessions(game_id);

-- Create updated_at triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_users_updated_at
    before update on users
    for each row
    execute procedure update_updated_at_column();

create trigger update_events_updated_at
    before update on events
    for each row
    execute procedure update_updated_at_column();

create trigger update_guests_updated_at
    before update on guests
    for each row
    execute procedure update_updated_at_column();

create trigger update_games_updated_at
    before update on games
    for each row
    execute procedure update_updated_at_column();

create trigger update_game_sessions_updated_at
    before update on game_sessions
    for each row
    execute procedure update_updated_at_column();

-- Set up row level security policies
alter table users enable row level security;
alter table events enable row level security;
alter table guests enable row level security;
alter table games enable row level security;
alter table game_sessions enable row level security;

-- Users policies
create policy "Users can view their own profile"
    on users for select
    using (auth.uid() = id);

create policy "Users can create their own profile"
    on users for insert
    with check (auth.uid() = id);

create policy "Users can update their own profile"
    on users for update
    using (auth.uid() = id);

create policy "Users can delete their own profile"
    on users for delete
    using (auth.uid() = id);

-- Events policies
create policy "Users can view their own events"
    on events for select
    using (auth.uid() = host_id);

create policy "Users can create their own events"
    on events for insert
    with check (auth.uid() = host_id);

create policy "Users can update their own events"
    on events for update
    using (auth.uid() = host_id);

create policy "Users can delete their own events"
    on events for delete
    using (auth.uid() = host_id);

-- Guests policies
create policy "Users can view guests of their events"
    on guests for select
    using (exists (
        select 1 from events
        where events.id = guests.event_id
        and events.host_id = auth.uid()
    ));

create policy "Users can manage guests of their events"
    on guests for all
    using (exists (
        select 1 from events
        where events.id = guests.event_id
        and events.host_id = auth.uid()
    ));

-- Games policies
create policy "Users can view games of their events"
    on games for select
    using (exists (
        select 1 from events
        where events.id = games.event_id
        and events.host_id = auth.uid()
    ));

create policy "Users can manage games of their events"
    on games for all
    using (exists (
        select 1 from events
        where events.id = games.event_id
        and events.host_id = auth.uid()
    ));

-- Game sessions policies
create policy "Users can view game sessions of their events"
    on game_sessions for select
    using (exists (
        select 1 from games
        join events on events.id = games.event_id
        where games.id = game_sessions.game_id
        and events.host_id = auth.uid()
    ));

create policy "Users can manage game sessions of their events"
    on game_sessions for all
    using (exists (
        select 1 from games
        join events on events.id = games.event_id
        where games.id = game_sessions.game_id
        and events.host_id = auth.uid()
    ));
