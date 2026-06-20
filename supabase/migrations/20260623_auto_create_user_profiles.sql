-- Auto-create user_profiles when a new auth user is created
-- Also backfill existing users who don't have a user_profiles row

-- Function to handle new user registration -> create user_profiles row
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate a username from email or name
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  -- Sanitize: keep only alphanumeric and underscore
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  -- Ensure minimum length
  IF char_length(base_username) < 3 THEN
    base_username := 'user_' || substring(NEW.id::text, 1, 8);
  END IF;

  final_username := base_username;

  -- Ensure username uniqueness
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE username = final_username);
    counter := counter + 1;
    final_username := base_username || '_' || counter::text;
  END LOOP;

  INSERT INTO public.user_profiles (id, username, display_name, created_at, updated_at, last_active_at)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill: create user_profiles for existing auth users who don't have one
INSERT INTO public.user_profiles (id, username, display_name, created_at, updated_at, last_active_at)
SELECT
  au.id,
  COALESCE(
    regexp_replace(au.raw_user_meta_data->>'username', '[^a-zA-Z0-9_]', '', 'g'),
    regexp_replace(split_part(au.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'),
    'user_' || substring(au.id::text, 1, 8)
  ),
  COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  au.created_at,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
AND au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;
