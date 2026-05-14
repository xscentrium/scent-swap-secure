-- Lock down all SECURITY DEFINER functions in public schema
-- by revoking blanket EXECUTE rights, then re-granting only where needed.

-- 1) Revoke blanket EXECUTE from PUBLIC/anon/authenticated on every
--    SECURITY DEFINER function in the public schema.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name,
           p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC',
                   r.schema_name, r.func_name, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon',
                   r.schema_name, r.func_name, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM authenticated',
                   r.schema_name, r.func_name, r.args);
  END LOOP;
END $$;

-- 2) Re-grant EXECUTE for the small set of functions that MUST be
--    callable from the client / used inside RLS expressions.

-- Public catalog search RPCs (used by Browse/Discover for everyone)
GRANT EXECUTE ON FUNCTION public.search_fragrances(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_fragrances_by_note(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_fragrances_by_accord(text, integer) TO anon, authenticated;

-- Role check helper (called inside many RLS policies + occasionally from client)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

-- Client-callable evidence failure logger (signed-in users only)
GRANT EXECUTE ON FUNCTION public.log_dispute_evidence_failure(uuid, text, text) TO authenticated;
