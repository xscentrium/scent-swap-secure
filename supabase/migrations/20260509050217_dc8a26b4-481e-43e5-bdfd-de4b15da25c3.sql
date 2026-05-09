
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_base text;
  v_username text;
  v_attempt int := 0;
BEGIN
  v_base := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1), 'user'),
    '[^a-z0-9_]+', '', 'g'
  ));
  IF v_base IS NULL OR length(v_base) < 3 THEN
    v_base := 'user' || substr(md5(NEW.id::text), 1, 6);
  END IF;
  v_username := v_base;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_attempt := v_attempt + 1;
    v_username := v_base || substr(md5(NEW.id::text || v_attempt::text), 1, 4);
    EXIT WHEN v_attempt > 10;
  END LOOP;

  INSERT INTO public.profiles (user_id, username, display_name, referral_code)
  VALUES (
    NEW.id,
    v_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', v_username),
    UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8))
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- never block auth signup if profile insert hits an unexpected issue
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;
