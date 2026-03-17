
-- Insert profile for admin user
INSERT INTO public.profiles (user_id, first_name, last_name, country, profession, membership_status)
VALUES ('e609bd1c-7048-468d-9cd8-2d4aac9f71cb', 'Admin', 'EDAN', 'México', 'Administrador de Plataforma', 'active')
ON CONFLICT (user_id) DO UPDATE SET membership_status = 'active';

-- Insert admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('e609bd1c-7048-468d-9cd8-2d4aac9f71cb', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
