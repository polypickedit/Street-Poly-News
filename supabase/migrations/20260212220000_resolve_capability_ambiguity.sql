-- Migration: Final Cleanup of Capability Functions
-- Description: Drops all overloaded versions of capability functions and recreates canonical 2-arg versions to resolve ambiguity.

BEGIN;

-- 1. Drop all known versions to clear the path
DROP FUNCTION IF EXISTS public.consume_capability(UUID, TEXT) CASCADE; 
DROP FUNCTION IF EXISTS public.consume_capability(UUID, TEXT, BIGINT, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.consume_capability_v2(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.has_capability(UUID, TEXT) CASCADE; 

-- 2. Recreate canonical has_capability (2-arg)
CREATE OR REPLACE FUNCTION public.has_capability(p_user_id UUID, p_capability TEXT) 
RETURNS BOOLEAN AS $$ 
BEGIN 
  RETURN EXISTS ( 
    SELECT 1 FROM public.user_capabilities 
    WHERE user_id = p_user_id 
      AND capability = p_capability 
      AND (expires_at IS NULL OR expires_at > now()) 
  ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public; 

-- 3. Recreate canonical consume_capability (2-arg)
CREATE OR REPLACE FUNCTION public.consume_capability(p_user_id UUID, p_capability TEXT) 
RETURNS BOOLEAN AS $$ 
DECLARE 
  v_id UUID; 
BEGIN 
  SELECT id INTO v_id 
  FROM public.user_capabilities 
  WHERE user_id = p_user_id 
    AND capability = p_capability 
    AND (expires_at IS NULL OR expires_at > now()) 
  ORDER BY granted_at ASC 
  LIMIT 1; 

  IF v_id IS NOT NULL THEN 
    DELETE FROM public.user_capabilities WHERE id = v_id; 
    RETURN TRUE; 
  ELSE 
    RETURN FALSE; 
  END IF; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Re-grant permissions
GRANT EXECUTE ON FUNCTION public.has_capability(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_capability(UUID, TEXT) TO authenticated, service_role;

-- 5. Hardened safe wrapper
CREATE OR REPLACE FUNCTION public.safe_consume_capability(p_user_id uuid, p_capability text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_capability IS NULL THEN
    RETURN TRUE;
  END IF;

  BEGIN
    -- This now safely calls the 2-arg version without ambiguity
    RETURN public.consume_capability(p_user_id, p_capability);
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE WARNING 'Error in safe_consume_capability: % (%)', SQLERRM, SQLSTATE;
      RETURN FALSE;
  END;
END;
$function$;

COMMIT;
