-- Remove retail bean pool entirely.
-- Beans are in-house only: all grams go to brewing stock.
-- bean_batches gets name + remarks fields.

alter table bean_batches
  add column if not exists name    text,
  add column if not exists remarks text;

-- Drop retail_stock (no longer needed)
drop table if exists retail_stock cascade;

-- Simplified batch creation: all grams → brewing stock, no retail split
create or replace function create_batch_with_allocation(
  p_bean_type   text,
  p_name        text,
  p_remarks     text,
  p_total_grams numeric,
  p_actor_id    uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_batch_id uuid;
begin
  if p_total_grams <= 0 then
    raise exception 'Quantity must be greater than 0';
  end if;

  insert into bean_batches (bean_type, name, remarks, qty_received_grams, added_by)
    values (p_bean_type, p_name, p_remarks, p_total_grams, p_actor_id)
    returning id into v_batch_id;

  -- All grams go to brewing stock
  insert into brewing_stock (bean_type, qty_remaining_grams, low_stock_threshold_grams)
    values (p_bean_type, p_total_grams, 500)
    on conflict (bean_type)
    do update set qty_remaining_grams = brewing_stock.qty_remaining_grams + excluded.qty_remaining_grams;

  insert into stock_allocations (from_batch_id, to_pool, qty_grams, allocated_by)
    values (v_batch_id, 'brewing', p_total_grams, p_actor_id);

  insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id, note)
    values ('brewing', v_batch_id, p_total_grams, 'allocation', p_actor_id,
            coalesce(p_name, p_bean_type) || ' — batch added');

  return v_batch_id;
end;
$$;

-- Remove retail_bean from add_order_item (only drink and simple remain)
create or replace function add_order_item(
  p_order_id     uuid,
  p_product_id   uuid,
  p_product_type text,
  p_qty          integer,
  p_actor_id     uuid
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
  if p_product_type = 'drink' then
    select price, bean_type_used, grams_per_serving
      into v_unit_price, v_bean_type, v_grams_per_svc
      from drink_products where id = p_product_id and active = true;

    if not found then
      raise exception 'Drink product not found or inactive';
    end if;

    if v_bean_type is not null and v_grams_per_svc is not null then
      v_total_grams := v_grams_per_svc * p_qty;

      update brewing_stock
        set qty_remaining_grams = qty_remaining_grams - v_total_grams
        where bean_type = v_bean_type
          and qty_remaining_grams >= v_total_grams;

      if not found then
        if not exists (select 1 from brewing_stock where bean_type = v_bean_type) then
          raise exception 'No stock found for "%" — add a batch first', v_bean_type;
        else
          raise exception 'Not enough stock for "%" — need %g, only %g remaining',
            v_bean_type,
            round(v_total_grams, 1),
            round((select qty_remaining_grams from brewing_stock where bean_type = v_bean_type), 1);
        end if;
      end if;

      insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id, note)
        values ('brewing', p_product_id, -v_total_grams, 'sale', p_actor_id,
                p_qty::text || 'x drink');
    end if;

  elsif p_product_type = 'simple' then
    select selling_price into v_unit_price
      from simple_products where id = p_product_id;

    if not found then raise exception 'Product not found'; end if;

    update simple_products
      set qty_available = qty_available - p_qty
      where id = p_product_id and qty_available >= p_qty;

    if not found then raise exception 'Not enough stock for this item'; end if;

    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id)
      values ('simple', p_product_id, -p_qty, 'sale', p_actor_id);

  else
    raise exception 'Unknown product type: %', p_product_type;
  end if;

  v_subtotal := v_unit_price * p_qty;

  insert into order_items (order_id, product_id, product_type, qty, unit_price, subtotal, added_by)
    values (p_order_id, p_product_id, p_product_type, p_qty, v_unit_price, v_subtotal, p_actor_id);

  update orders
    set subtotal_amount = subtotal_amount + v_subtotal,
        total_amount    = subtotal_amount + v_subtotal - discount_amount
    where id = p_order_id and status = 'open';

  if not found then
    raise exception 'Order not found or already closed';
  end if;
end;
$$;

-- remove_order_item without retail_bean case
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
  if not found then raise exception 'Item not found'; end if;

  if not exists (select 1 from orders where id = v_item.order_id and status = 'open') then
    raise exception 'Cannot remove items from a closed order';
  end if;

  if v_item.product_type = 'drink' then
    select bean_type_used, grams_per_serving into v_bean_type, v_grams
      from drink_products where id = v_item.product_id;

    if v_bean_type is not null and v_grams is not null then
      v_grams := v_grams * v_item.qty;
      update brewing_stock
        set qty_remaining_grams = qty_remaining_grams + v_grams
        where bean_type = v_bean_type;
      insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id, note)
        values ('brewing', v_item.product_id, v_grams, 'sale_reversal', p_actor_id, 'Item removed');
    end if;

  elsif v_item.product_type = 'simple' then
    update simple_products set qty_available = qty_available + v_item.qty where id = v_item.product_id;
    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id)
      values ('simple', v_item.product_id, v_item.qty, 'sale_reversal', p_actor_id);
  end if;

  delete from order_items where id = p_item_id;

  update orders
    set subtotal_amount = subtotal_amount - v_item.subtotal,
        total_amount    = greatest(0, subtotal_amount - v_item.subtotal - discount_amount)
    where id = v_item.order_id;
end;
$$;

-- get_available_products without retail_bean
create or replace function get_available_products()
returns table (id uuid, name text, product_type text, price numeric, category text)
language sql security definer stable
as $$
  select id, name, 'drink'::text, price, category
    from drink_products where active = true
  union all
  select id, name, 'simple'::text, selling_price, category
    from simple_products where qty_available > 0 and usage_type = 'sale'
  order by category, name;
$$;
