-- Store product name on order_items so it's immutable after the order is placed
alter table order_items add column if not exists product_name text;

-- Backfill existing rows
update order_items oi
set product_name = dp.name
from drink_products dp
where oi.product_id = dp.id and oi.product_type = 'drink';

update order_items oi
set product_name = sp.name
from simple_products sp
where oi.product_id = sp.id and oi.product_type = 'simple';

-- Update add_order_item to capture the name at insertion time
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
  v_product_name  text;
  v_subtotal      numeric;
  v_bean_type     text;
  v_grams_per_svc numeric;
  v_total_grams   numeric;
begin
  if p_product_type = 'drink' then
    select price, name, bean_type_used, grams_per_serving
      into v_unit_price, v_product_name, v_bean_type, v_grams_per_svc
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
                p_qty::text || 'x ' || v_product_name);
    end if;

  elsif p_product_type = 'simple' then
    select selling_price, name into v_unit_price, v_product_name
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

  insert into order_items
    (order_id, product_id, product_type, product_name, qty, unit_price, subtotal, added_by)
    values
    (p_order_id, p_product_id, p_product_type, v_product_name, p_qty, v_unit_price, v_subtotal, p_actor_id);

  update orders
    set subtotal_amount = subtotal_amount + v_subtotal,
        total_amount    = subtotal_amount + v_subtotal - discount_amount
    where id = p_order_id and status = 'open';

  if not found then
    raise exception 'Order not found or already closed';
  end if;
end;
$$;
