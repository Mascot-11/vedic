-- ============================================================
-- Support non-coffee drinks (no bean stock deduction)
-- and cafe-use items in simple_products
-- ============================================================

-- Make bean_type_used and grams_per_serving nullable on drink_products
-- (null = non-coffee drink, no brewing stock touched)
alter table drink_products
  alter column bean_type_used drop not null,
  alter column grams_per_serving drop not null;

-- Add a usage_type to simple_products to distinguish sale items
-- from internal cafe-use items (cigs, syrups, etc.)
alter table simple_products
  add column if not exists usage_type text not null default 'sale'
    check (usage_type in ('sale', 'cafe_use'));

-- Replace add_order_item with null-safe version
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

    -- Only deduct brewing stock for coffee-based drinks
    if v_bean_type is not null and v_grams_per_svc is not null then
      v_total_grams := v_grams_per_svc * p_qty;

      update brewing_stock
        set qty_remaining_grams = qty_remaining_grams - v_total_grams
        where bean_type = v_bean_type
          and qty_remaining_grams >= v_total_grams;

      if not found then
        if not exists (select 1 from brewing_stock where bean_type = v_bean_type) then
          raise exception 'No brewing stock found for "%" — allocate a batch first in Inventory', v_bean_type;
        else
          raise exception 'Not enough brewing stock for "%" — need %g, only %g remaining',
            v_bean_type,
            round(v_total_grams, 1),
            round((select qty_remaining_grams from brewing_stock where bean_type = v_bean_type), 1);
        end if;
      end if;

      insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id, note)
        values ('brewing', p_product_id, -v_total_grams, 'sale', p_actor_id,
                'Order item: ' || p_qty::text || ' x drink');
    end if;
    -- Non-coffee drinks: no stock touched, just record the sale

  elsif p_product_type = 'retail_bean' then
    select selling_price into v_unit_price
      from retail_stock where id = p_product_id;

    if not found then raise exception 'Retail stock not found'; end if;

    update retail_stock
      set qty_available = qty_available - p_qty
      where id = p_product_id and qty_available >= p_qty;

    if not found then raise exception 'Not enough retail bean stock'; end if;

    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id)
      values ('retail', p_product_id, -p_qty, 'sale', p_actor_id);

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

-- Also fix remove_order_item for null-safe brewing reversal
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
    select bean_type_used, grams_per_serving
      into v_bean_type, v_grams
      from drink_products where id = v_item.product_id;

    -- Only reverse stock for coffee-based drinks
    if v_bean_type is not null and v_grams is not null then
      v_grams := v_grams * v_item.qty;
      update brewing_stock
        set qty_remaining_grams = qty_remaining_grams + v_grams
        where bean_type = v_bean_type;

      insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id, note)
        values ('brewing', v_item.product_id, v_grams, 'sale_reversal', p_actor_id, 'Item removed from order');
    end if;

  elsif v_item.product_type = 'retail_bean' then
    update retail_stock set qty_available = qty_available + v_item.qty where id = v_item.product_id;
    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id)
      values ('retail', v_item.product_id, v_item.qty, 'sale_reversal', p_actor_id);

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
