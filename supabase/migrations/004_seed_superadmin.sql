-- Seed superadmin user
-- Auth user already created via Admin API (email pre-verified)
-- auth_id: 1e29f62e-3bf4-4f00-b038-a6558ee8cb69

insert into users (name, role, auth_id, active)
values ('Shreeyush', 'superadmin', '1e29f62e-3bf4-4f00-b038-a6558ee8cb69', true)
on conflict (auth_id) do nothing;
