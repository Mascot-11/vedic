-- ============================================================
-- Vedic Coffee Shop Management System
-- Initial Schema Migration
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- IDENTITY & CONFIG
-- ============================================================

create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null check (role in ('superadmin', 'owner', 'staff')),
  auth_id    uuid unique references auth.users(id) on delete cascade,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists shop_settings (
  id                          uuid primary key default gen_random_uuid(),
  business_name               text not null default 'Vedic Coffee',
  currency                    text not null default 'Rs.',
  tax_percent                 numeric(5,2) not null default 0,
  max_staff_discount_amount   numeric(10,2) not null default 100,
  low_stock_default_threshold numeric(10,2) not null default 500
);

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists tables (
  id     uuid primary key default gen_random_uuid(),
  label  text not null,
  active boolean not null default true
);

-- ============================================================
-- CUSTOMERS (defined before orders to satisfy FK)
-- ============================================================

create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  constraint customers_name_unique unique (name)
);

-- ============================================================
-- ORDERS
-- ============================================================

create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  table_id        uuid not null references tables(id),
  status          text not null default 'open' check (status in ('open', 'closed')),
  opened_by       uuid not null references users(id),
  opened_at       timestamptz not null default now(),
  closed_by       uuid references users(id),
  closed_at       timestamptz,
  subtotal_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  discount_reason text,
  total_amount    numeric(10,2) not null default 0,
  payment_status  text check (payment_status in ('paid', 'credit', 'partially_paid')),
  customer_id     uuid references customers(id),
  amount_paid     numeric(10,2) not null default 0,
  balance_due     numeric(10,2) not null default 0
);

-- Enforce one open order per table at a time
create unique index if not exists orders_table_open_unique
  on orders (table_id) where status = 'open';

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid not null,
  product_type text not null check (product_type in ('drink', 'retail_bean', 'simple')),
  qty          integer not null check (qty > 0),
  unit_price   numeric(10,2) not null,
  subtotal     numeric(10,2) not null,
  added_by     uuid not null references users(id),
  added_at     timestamptz not null default now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================

create table if not exists payments (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references customers(id),
  amount         numeric(10,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  received_by    uuid not null references users(id),
  timestamp      timestamptz not null default now(),
  note           text
);

create table if not exists payment_allocations (
  id             uuid primary key default gen_random_uuid(),
  payment_id     uuid not null references payments(id) on delete cascade,
  order_id       uuid not null references orders(id),
  amount_applied numeric(10,2) not null check (amount_applied > 0)
);

-- ============================================================
-- PRODUCTS
-- ============================================================

create table if not exists drink_products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  category          text not null default 'Drinks',
  bean_type_used    text not null,
  grams_per_serving numeric(8,2) not null check (grams_per_serving > 0),
  price             numeric(10,2) not null check (price >= 0),
  active            boolean not null default true
);

create table if not exists retail_stock (
  id             uuid primary key default gen_random_uuid(),
  bean_type      text not null,
  packaging_size text not null,
  qty_available  integer not null default 0,
  selling_price  numeric(10,2) not null check (selling_price >= 0)
);

create table if not exists simple_products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  category            text not null default 'Snacks',
  qty_available       integer not null default 0,
  cost_price          numeric(10,2) not null default 0,
  selling_price       numeric(10,2) not null check (selling_price >= 0),
  low_stock_threshold integer not null default 5
);

-- ============================================================
-- BEAN INVENTORY
-- ============================================================

create table if not exists bean_batches (
  id                 uuid primary key default gen_random_uuid(),
  bean_type          text not null,
  roast_date         date not null,
  supplier           text not null,
  cost_per_kg        numeric(10,2) not null default 0,
  qty_received_grams numeric(10,2) not null check (qty_received_grams > 0),
  added_by           uuid references users(id),
  created_at         timestamptz not null default now()
);

create table if not exists stock_allocations (
  id            uuid primary key default gen_random_uuid(),
  from_batch_id uuid not null references bean_batches(id),
  to_pool       text not null check (to_pool in ('retail', 'brewing')),
  qty_grams     numeric(10,2) not null check (qty_grams > 0),
  allocated_by  uuid references users(id),
  timestamp     timestamptz not null default now()
);

create table if not exists brewing_stock (
  id                        uuid primary key default gen_random_uuid(),
  bean_type                 text not null unique,
  qty_remaining_grams       numeric(10,2) not null default 0,
  low_stock_threshold_grams numeric(10,2) not null default 500
);

-- ============================================================
-- AUDIT TRAIL
-- ============================================================

create table if not exists stock_movements (
  id         uuid primary key default gen_random_uuid(),
  pool_type  text not null check (pool_type in ('brewing', 'retail', 'simple')),
  ref_id     uuid,
  change_qty numeric(10,2) not null,
  reason     text not null check (reason in ('sale','sale_reversal','restock','allocation','adjustment','waste')),
  actor_id   uuid references users(id),
  timestamp  timestamptz not null default now(),
  note       text
);

create table if not exists discount_logs (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id),
  amount     numeric(10,2) not null,
  reason     text,
  applied_by uuid references users(id),
  timestamp  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_orders_customer_open on orders (customer_id) where balance_due > 0;
create index if not exists idx_orders_status on orders (status);
create index if not exists idx_orders_closed_at on orders (closed_at);
create index if not exists idx_brewing_stock_bean_type on brewing_stock (bean_type);
create index if not exists idx_order_items_order_id on order_items (order_id);
create index if not exists idx_payment_alloc_order on payment_allocations (order_id);

-- ============================================================
-- SEED: Default tables and settings
-- ============================================================

insert into shop_settings (business_name, currency, tax_percent, max_staff_discount_amount, low_stock_default_threshold)
  values ('Vedic Coffee', 'Rs.', 0, 100, 500)
  on conflict do nothing;

insert into tables (label) values
  ('Table 1'), ('Table 2'), ('Table 3'), ('Table 4'),
  ('Table 5'), ('Table 6'), ('Takeaway')
  on conflict do nothing;
