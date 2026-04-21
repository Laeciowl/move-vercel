-- Admin para Nicolas Carvalho (conta já existente em auth.users).
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(trim(email::text)) = lower(trim('nicolascdncarvalho@gmail.com'))
ON CONFLICT (user_id, role) DO NOTHING;
