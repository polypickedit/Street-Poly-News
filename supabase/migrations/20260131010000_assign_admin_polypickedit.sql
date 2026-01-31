-- Assign the admin role to polypickedit@gmail.com
-- Step 1: Find the admin role ID
-- Step 2: Insert into user_roles linking the user to that role ID

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
CROSS JOIN public.roles r
WHERE u.email = 'polypickedit@gmail.com'
  AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;
