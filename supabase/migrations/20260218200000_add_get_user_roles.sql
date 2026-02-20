-- Migration: Add get_user_roles RPC
-- Description: Returns the roles for the current authenticated user.

DROP FUNCTION IF EXISTS public.get_user_roles();

CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  roles text[];
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN ARRAY[]::text[];
  END IF;

  SELECT ARRAY_AGG(r.name)
  INTO roles
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid();

  IF roles IS NULL THEN
    RETURN ARRAY[]::text[];
  END IF;

  RETURN roles;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_roles() TO authenticated;
-- Grant execute to anon users (though it returns empty for them)
GRANT EXECUTE ON FUNCTION public.get_user_roles() TO anon;
