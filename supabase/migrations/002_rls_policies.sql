-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Helper: get calling user's role from users table
create or replace function get_user_role()
returns text
language sql
security definer
stable
as $$
  select role from users where auth_id = auth.uid() limit 1;
$$;

-- Helper: get calling user's id from users table
create or replace function get_user_id()
returns uuid
language sql
security definer
stable
as $$
  select id from users where auth_id = auth.uid() limit 1;
$$;

-- Enable RLS on all tables
alter table users enable row level security;
alter table shop_settings enable row level security;
alter table tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table customers enable row level security;
alter table payments enable row level security;
alter table payment_allocations enable row level security;
alter table drink_products enable row level security;
alter table retail_stock enable row level security;
alter table simple_products enable row level security;
alter table bean_batches enable row level security;
alter table stock_allocations enable row level security;
alter table brewing_stock enable row level security;
alter table stock_movements enable row level security;
alter table discount_logs enable row level security;

-- ============================================================
-- USERS table policies
-- ============================================================

-- All authenticated users can read users (needed for display)
create policy "users_select_all" on users
  for select using (auth.uid() is not null);

-- Only superadmin can insert/update/delete users
create policy "users_insert_superadmin" on users
  for insert with check (get_user_role() = 'superadmin');

create policy "users_update_owner_or_above" on users
  for update using (get_user_role() in ('superadmin', 'owner'));

-- ============================================================
-- SHOP SETTINGS
-- ============================================================

create policy "settings_select" on shop_settings
  for select using (auth.uid() is not null);

create policy "settings_write_superadmin" on shop_settings
  for all using (get_user_role() = 'superadmin');

-- ============================================================
-- TABLES
-- ============================================================

create policy "tables_select" on tables
  for select using (auth.uid() is not null);

create policy "tables_write_owner" on tables
  for all using (get_user_role() in ('superadmin', 'owner'));

-- ============================================================
-- ORDERS
-- ============================================================

create policy "orders_select" on orders
  for select using (auth.uid() is not null);

create policy "orders_insert" on orders
  for insert with check (auth.uid() is not null);

create policy "orders_update" on orders
  for update using (auth.uid() is not null);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

create policy "order_items_select" on order_items
  for select using (auth.uid() is not null);

create policy "order_items_insert" on order_items
  for insert with check (auth.uid() is not null);

create policy "order_items_delete" on order_items
  for delete using (auth.uid() is not null);

-- ============================================================
-- CUSTOMERS
-- ============================================================

create policy "customers_select" on customers
  for select using (auth.uid() is not null);

create policy "customers_insert" on customers
  for insert with check (auth.uid() is not null);

-- ============================================================
-- PAYMENTS
-- ============================================================

create policy "payments_select" on payments
  for select using (auth.uid() is not null);

create policy "payments_insert" on payments
  for insert with check (auth.uid() is not null);

-- Only owner/superadmin can edit or delete payment records
create policy "payments_update_owner" on payments
  for update using (get_user_role() in ('superadmin', 'owner'));

create policy "payments_delete_owner" on payments
  for delete using (get_user_role() in ('superadmin', 'owner'));

-- ============================================================
-- PAYMENT ALLOCATIONS
-- ============================================================

create policy "payment_alloc_select" on payment_allocations
  for select using (auth.uid() is not null);

create policy "payment_alloc_insert" on payment_allocations
  for insert with check (auth.uid() is not null);

-- ============================================================
-- PRODUCTS (owner/superadmin write, all read)
-- ============================================================

create policy "drink_products_select" on drink_products
  for select using (auth.uid() is not null);

create policy "drink_products_write" on drink_products
  for all using (get_user_role() in ('superadmin', 'owner'));

create policy "retail_stock_select" on retail_stock
  for select using (auth.uid() is not null);

create policy "retail_stock_write" on retail_stock
  for all using (get_user_role() in ('superadmin', 'owner'));

create policy "simple_products_select" on simple_products
  for select using (auth.uid() is not null);

create policy "simple_products_write" on simple_products
  for all using (get_user_role() in ('superadmin', 'owner'));

-- ============================================================
-- BEAN INVENTORY
-- ============================================================

-- Batches: all roles can insert, owner+ for modifications
create policy "bean_batches_select" on bean_batches
  for select using (auth.uid() is not null);

create policy "bean_batches_insert" on bean_batches
  for insert with check (auth.uid() is not null);

-- Allocations: only owner/superadmin
create policy "stock_alloc_select" on stock_allocations
  for select using (auth.uid() is not null);

create policy "stock_alloc_write" on stock_allocations
  for insert with check (get_user_role() in ('superadmin', 'owner'));

-- Brewing stock: readable by all, writable only via RPC (SECURITY DEFINER)
create policy "brewing_stock_select" on brewing_stock
  for select using (auth.uid() is not null);

-- ============================================================
-- AUDIT
-- ============================================================

create policy "stock_movements_select" on stock_movements
  for select using (get_user_role() in ('superadmin', 'owner'));

create policy "stock_movements_insert" on stock_movements
  for insert with check (auth.uid() is not null);

create policy "discount_logs_select" on discount_logs
  for select using (auth.uid() is not null);

create policy "discount_logs_insert" on discount_logs
  for insert with check (auth.uid() is not null);
