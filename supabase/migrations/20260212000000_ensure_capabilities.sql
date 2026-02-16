-- Migration: Ensure Capabilities Functions
-- Description: Re-deploys has_capability and consume_capability to ensure they exist for the atomic submission RPC.

-- 1. Function to check if a user has a specific capability
DROP FUNCTION IF EXISTS public.has_capability(UUID, TEXT);
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

-- 2. Function to consume a capability (deletes the oldest one)
DROP FUNCTION IF EXISTS public.consume_capability(UUID, TEXT);
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

-- Grant execute permissions to public (since it's SECURITY DEFINER, it runs as owner but needs to be callable)
GRANT EXECUTE ON FUNCTION public.has_capability(UUID, TEXT) TO public;
GRANT EXECUTE ON FUNCTION public.consume_capability(UUID, TEXT) TO public;
GRANT EXECUTE ON FUNCTION public.has_capability(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_capability(UUID, TEXT) TO anon, authenticated, service_role;
