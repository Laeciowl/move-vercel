-- Grant admin role to mentor Nicolas Oliveira (auth user matched via mentors.email = auth.users.email).
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::public.app_role
FROM auth.users au
INNER JOIN public.mentors m
  ON lower(trim(m.email)) = lower(trim(au.email::text))
WHERE regexp_replace(lower(trim(m.name)), '\s+', ' ', 'g') LIKE 'nicolas oliveira%'
ON CONFLICT (user_id, role) DO NOTHING;
