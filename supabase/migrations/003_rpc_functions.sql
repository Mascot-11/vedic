-- ============================================================
-- Atomic RPC Functions
-- All critical write operations run as SECURITY DEFINER
-- in a single transaction to prevent race conditions
-- ============================================================

-- ============================================================
-- get_available_products
-- Returns a unified product list for the Add Item sheet
-- ============================================================
create or replace function get_available_products()
returns table (
  id           uuid,
  name         text,
  product_type text,
  price        numeric,
  category     text
)
language sql
security definer
stable
as $$
  select id, name, 'drink'::text as product_type, price, category
    from drink_products where active = true
  union all
  select id,
         bean_type || ' (' || packaging_size || ')' as name,
         'retail_bean'::text,
         selling_price,
         'Retail Beans'::text
    from retail_stock where qty_available > 0
  union all
  select id, name, 'simple'::text, selling_price, category
    from simple_products where qty_available > 0
  order by category, name;
$$;

-- ============================================================
-- add_order_item
-- Atomically adds item, deducts stock, updates order totals
-- ============================================================
create or replace function add_order_item(
  p_order_id    uuid,
  p_product_id  uuid,
  p_product_type text,
  p_qty         integer,
  p_actor_id    uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_unit_price    numeric;
  v_subtotal      numeric;
  v_bean_type     text;
  v_grams_per_svc numeric;
  v_total_grams   numeric;
begin
  -- Determine price based on product type
  if p_product_type = 'drink' then
    select price, bean_type_used, grams_per_serving
      into v_unit_price, v_bean_type, v_grams_per_svc
      from drink_products where id = p_product_id and active = true;
    if not found then
      raise exception 'Drink product not found or inactive';
    end if;
    v_total_grams := v_grams_per_svc * p_qty;

    -- Lock and deduct brewing stock atomically
    update brewing_stock
      set qty_remaining_grams = qty_remaining_grams - v_total_grams
      where bean_type = v_bean_type
        and qty_remaining_grams >= v_total_grams;

    if not found then
      raise exception 'Insufficient brewing stock for % (need %.1fg)', v_bean_type, v_total_grams;
    end if;

    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id, note)
      values ('brewing', p_product_id, -v_total_grams, 'sale', p_actor_id,
              'Order item: ' || p_qty::text || ' x drink');

  elsif p_product_type = 'retail_bean' then
    select selling_price into v_unit_price
      from retail_stock where id = p_product_id;
    if not found then
      raise exception 'Retail stock not found';
    end if;

    update retail_stock
      set qty_available = qty_available - p_qty
      where id = p_product_id and qty_available >= p_qty;

    if not found then
      raise exception 'Insufficient retail bean stock';
    end if;

    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id)
      values ('retail', p_product_id, -p_qty, 'sale', p_actor_id);

  elsif p_product_type = 'simple' then
    select selling_price into v_unit_price
      from simple_products where id = p_product_id;
    if not found then
      raise exception 'Product not found';
    end if;

    update simple_products
      set qty_available = qty_available - p_qty
      where id = p_product_id and qty_available >= p_qty;

    if not found then
      raise exception 'Insufficient stock for this item';
    end if;

    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id)
      values ('simple', p_product_id, -p_qty, 'sale', p_actor_id);

  else
    raise exception 'Unknown product type: %', p_product_type;
  end if;

  v_subtotal := v_unit_price * p_qty;

  insert into order_items (order_id, product_id, product_type, qty, unit_price, subtotal, added_by)
    values (p_order_id, p_product_id, p_product_type, p_qty, v_unit_price, v_subtotal, p_actor_id);

  -- Update order totals
  update orders
    set subtotal_amount = subtotal_amount + v_subtotal,
        total_amount    = subtotal_amount + v_subtotal - discount_amount
    where id = p_order_id and status = 'open';

  if not found then
    raise exception 'Order not found or already closed';
  end if;
end;
$$;

-- ============================================================
-- remove_order_item
-- Reverses stock deduction when item removed from open order
-- ============================================================
create or replace function remove_order_item(
  p_item_id  uuid,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_item        order_items%rowtype;
  v_bean_type   text;
  v_grams       numeric;
begin
  select * into v_item from order_items where id = p_item_id;
  if not found then
    raise exception 'Item not found';
  end if;

  -- Verify order is still open
  if not exists (select 1 from orders where id = v_item.order_id and status = 'open') then
    raise exception 'Cannot remove items from a closed order';
  end if;

  -- Reverse stock
  if v_item.product_type = 'drink' then
    select bean_type_used, grams_per_serving into v_bean_type, v_grams
      from drink_products where id = v_item.product_id;
    v_grams := v_grams * v_item.qty;

    update brewing_stock
      set qty_remaining_grams = qty_remaining_grams + v_grams
      where bean_type = v_bean_type;

    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id, note)
      values ('brewing', v_item.product_id, v_grams, 'sale_reversal', p_actor_id, 'Item removed from order');

  elsif v_item.product_type = 'retail_bean' then
    update retail_stock set qty_available = qty_available + v_item.qty where id = v_item.product_id;
    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id)
      values ('retail', v_item.product_id, v_item.qty, 'sale_reversal', p_actor_id);

  elsif v_item.product_type = 'simple' then
    update simple_products set qty_available = qty_available + v_item.qty where id = v_item.product_id;
    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id)
      values ('simple', v_item.product_id, v_item.qty, 'sale_reversal', p_actor_id);
  end if;

  -- Remove item and recalculate order totals
  delete from order_items where id = p_item_id;

  update orders
    set subtotal_amount = subtotal_amount - v_item.subtotal,
        total_amount    = greatest(0, subtotal_amount - v_item.subtotal - discount_amount)
    where id = v_item.order_id;
end;
$$;

-- ============================================================
-- close_order_paid
-- ============================================================
create or replace function close_order_paid(
  p_order_id       uuid,
  p_discount_amount numeric,
  p_discount_reason text,
  p_actor_id        uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_subtotal numeric;
  v_total    numeric;
begin
  select subtotal_amount into v_subtotal from orders where id = p_order_id and status = 'open';
  if not found then
    raise exception 'Order not found or already closed';
  end if;

  if p_discount_amount > v_subtotal then
    raise exception 'Discount cannot exceed order subtotal';
  end if;

  v_total := v_subtotal - p_discount_amount;

  update orders set
    status          = 'closed',
    closed_by       = p_actor_id,
    closed_at       = now(),
    discount_amount = p_discount_amount,
    discount_reason = p_discount_reason,
    total_amount    = v_total,
    amount_paid     = v_total,
    balance_due     = 0,
    payment_status  = 'paid'
  where id = p_order_id;

  if p_discount_amount > 0 then
    insert into discount_logs (order_id, amount, reason, applied_by)
      values (p_order_id, p_discount_amount, p_discount_reason, p_actor_id);
  end if;
end;
$$;

-- ============================================================
-- close_order_credit
-- ============================================================
create or replace function close_order_credit(
  p_order_id        uuid,
  p_customer_id     uuid,
  p_amount_paid     numeric,
  p_discount_amount numeric,
  p_discount_reason text,
  p_actor_id        uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_subtotal    numeric;
  v_total       numeric;
  v_balance_due numeric;
  v_status      text;
begin
  select subtotal_amount into v_subtotal from orders where id = p_order_id and status = 'open';
  if not found then
    raise exception 'Order not found or already closed';
  end if;

  if p_discount_amount > v_subtotal then
    raise exception 'Discount cannot exceed order subtotal';
  end if;
  if p_amount_paid < 0 then
    raise exception 'Amount paid cannot be negative';
  end if;

  v_total       := v_subtotal - p_discount_amount;
  v_balance_due := greatest(0, v_total - p_amount_paid);

  if v_balance_due = 0 then
    v_status := 'paid';
  elsif p_amount_paid = 0 then
    v_status := 'credit';
  else
    v_status := 'partially_paid';
  end if;

  update orders set
    status          = 'closed',
    closed_by       = p_actor_id,
    closed_at       = now(),
    discount_amount = p_discount_amount,
    discount_reason = p_discount_reason,
    total_amount    = v_total,
    amount_paid     = p_amount_paid,
    balance_due     = v_balance_due,
    payment_status  = v_status,
    customer_id     = case when v_balance_due > 0 then p_customer_id else customer_id end
  where id = p_order_id;

  if p_discount_amount > 0 then
    insert into discount_logs (order_id, amount, reason, applied_by)
      values (p_order_id, p_discount_amount, p_discount_reason, p_actor_id);
  end if;
end;
$$;

-- ============================================================
-- allocate_bean_batch
-- Adds grams to brewing or retail pool and logs it
-- ============================================================
create or replace function allocate_bean_batch(
  p_batch_id  uuid,
  p_pool      text,
  p_qty_grams numeric,
  p_actor_id  uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_bean_type text;
begin
  select bean_type into v_bean_type from bean_batches where id = p_batch_id;
  if not found then
    raise exception 'Batch not found';
  end if;

  insert into stock_allocations (from_batch_id, to_pool, qty_grams, allocated_by)
    values (p_batch_id, p_pool, p_qty_grams, p_actor_id);

  if p_pool = 'brewing' then
    insert into brewing_stock (bean_type, qty_remaining_grams, low_stock_threshold_grams)
      values (v_bean_type, p_qty_grams, 500)
      on conflict (bean_type)
      do update set qty_remaining_grams = brewing_stock.qty_remaining_grams + excluded.qty_remaining_grams;

    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id, note)
      values ('brewing', p_batch_id, p_qty_grams, 'allocation', p_actor_id,
              'Allocated from batch ' || p_batch_id::text);
  end if;
  -- retail pool: retail_stock table is managed per product variant, not here
end;
$$;

-- ============================================================
-- manual_stock_adjustment
-- Owner/superadmin only — enforced by RLS on caller
-- ============================================================
create or replace function manual_stock_adjustment(
  p_bean_type  text,
  p_pool       text,
  p_change_qty numeric,
  p_note       text,
  p_actor_id   uuid
)
returns void
language plpgsql
security definer
as $$
begin
  if p_pool = 'brewing' then
    update brewing_stock
      set qty_remaining_grams = greatest(0, qty_remaining_grams + p_change_qty)
      where bean_type = p_bean_type;
    if not found then
      raise exception 'No brewing stock found for bean type: %', p_bean_type;
    end if;
    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id, note)
      values ('brewing', gen_random_uuid(), p_change_qty, 'adjustment', p_actor_id, p_note);
  else
    raise exception 'Only brewing pool manual adjustments supported via this function';
  end if;
end;
$$;

-- ============================================================
-- record_customer_payment
-- FIFO-respecting payment allocation (can be overridden by caller)
-- ============================================================
create or replace function record_customer_payment(
  p_customer_id    uuid,
  p_amount         numeric,
  p_payment_method text,
  p_note           text,
  p_allocations    jsonb,
  p_actor_id       uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_payment_id uuid;
  v_alloc      jsonb;
  v_order_id   uuid;
  v_amount_app numeric;
begin
  insert into payments (customer_id, amount, payment_method, received_by, note)
    values (p_customer_id, p_amount, p_payment_method, p_actor_id, p_note)
    returning id into v_payment_id;

  -- Apply each allocation
  for v_alloc in select * from jsonb_array_elements(p_allocations)
  loop
    v_order_id   := (v_alloc->>'order_id')::uuid;
    v_amount_app := (v_alloc->>'amount_applied')::numeric;

    insert into payment_allocations (payment_id, order_id, amount_applied)
      values (v_payment_id, v_order_id, v_amount_app);

    -- Update the order's paid amount and balance
    update orders
      set amount_paid = amount_paid + v_amount_app,
          balance_due = greatest(0, balance_due - v_amount_app),
          payment_status = case
            when greatest(0, balance_due - v_amount_app) = 0 then 'paid'
            else 'partially_paid'
          end
      where id = v_order_id;
  end loop;
end;
$$;

-- ============================================================
-- get_top_products
-- For reports dashboard
-- ============================================================
create or replace function get_top_products(p_limit integer default 10)
returns table (
  name          text,
  total_qty     bigint,
  total_revenue numeric
)
language sql
security definer
stable
as $$
  select
    coalesce(
      dp.name,
      rs.bean_type || ' (' || rs.packaging_size || ')',
      sp.name
    ) as name,
    sum(oi.qty)::bigint as total_qty,
    sum(oi.subtotal) as total_revenue
  from order_items oi
  join orders o on o.id = oi.order_id
    and o.status = 'closed'
    and o.closed_at >= date_trunc('month', now())
  left join drink_products dp on dp.id = oi.product_id and oi.product_type = 'drink'
  left join retail_stock rs on rs.id = oi.product_id and oi.product_type = 'retail_bean'
  left join simple_products sp on sp.id = oi.product_id and oi.product_type = 'simple'
  group by 1
  order by total_qty desc
  limit p_limit;
$$;
