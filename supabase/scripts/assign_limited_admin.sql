DO $$
DECLARE
  v_user_id UUID;
  v_editor_role_id UUID;
  v_admin_role_id UUID;
BEGIN
  -- 1. Get User ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'editingpale@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User editingpale@gmail.com not found. Please ask the user to sign up first.';
    RETURN;
  END IF;

  -- 2. Ensure 'editor' role exists
  INSERT INTO public.roles (name)
  VALUES ('editor')
  ON CONFLICT (name) DO NOTHING;

  -- 3. Get Role IDs
  SELECT id INTO v_editor_role_id FROM public.roles WHERE name = 'editor';
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin';

  -- 4. Remove 'admin' role if exists (to enforce limited privileges)
  IF v_admin_role_id IS NOT NULL THEN
    DELETE FROM public.user_roles 
    WHERE user_id = v_user_id AND role_id = v_admin_role_id;
    RAISE NOTICE 'Removed full admin role from editingpale@gmail.com (if existed).';
  END IF;

  -- 5. Assign 'editor' role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (v_user_id, v_editor_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE 'User editingpale@gmail.com assigned limited editor role.';
END $$;
