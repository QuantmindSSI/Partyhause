-- Fix user signup: Create trigger to automatically populate users table when auth.users is created

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', new.email),
    now(),
    now()
  );
  return new;
end;
$$;

-- Create trigger to call the function when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.users to anon, authenticated;

-- Also handle existing users who might not be in the users table
-- This is a one-time data migration
insert into public.users (id, email, name, created_at, updated_at)
select 
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', au.email),
  au.created_at,
  au.updated_at
from auth.users au
left join public.users pu on au.id = pu.id
where pu.id is null
and au.email is not null;