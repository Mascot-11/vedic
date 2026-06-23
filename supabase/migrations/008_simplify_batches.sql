-- Simplify bean_batches: roast_date and supplier are not needed
-- Beans are in-house; batches just track quantity + split
alter table bean_batches
  alter column roast_date drop not null,
  alter column supplier   drop not null;

-- Combined RPC: create batch + allocate in one atomic transaction
-- Validates: brewing_grams + retail_grams <= total_grams
-- At least one pool must receive some grams
create or replace function create_batch_with_allocation(
  p_bean_type      text,
  p_total_grams    numeric,
  p_brewing_grams  numeric,
  p_retail_grams   numeric,
  p_actor_id       uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_batch_id uuid;
  v_allocated numeric;
begin
  -- Validations
  if p_total_grams <= 0 then
    raise exception 'Total quantity must be greater than 0';
  end if;

  v_allocated := coalesce(p_brewing_grams, 0) + coalesce(p_retail_grams, 0);

  if v_allocated = 0 then
    raise exception 'Allocate at least some grams to brewing or retail';
  end if;

  if v_allocated > p_total_grams then
    raise exception 'Allocated grams (%) exceed batch total (%g)',
      round(v_allocated, 1), round(p_total_grams, 1);
  end if;

  -- Create the batch
  insert into bean_batches (bean_type, qty_received_grams, added_by)
    values (p_bean_type, p_total_grams, p_actor_id)
    returning id into v_batch_id;

  -- Allocate brewing
  if coalesce(p_brewing_grams, 0) > 0 then
    insert into stock_allocations (from_batch_id, to_pool, qty_grams, allocated_by)
      values (v_batch_id, 'brewing', p_brewing_grams, p_actor_id);

    insert into brewing_stock (bean_type, qty_remaining_grams, low_stock_threshold_grams)
      values (p_bean_type, p_brewing_grams, 500)
      on conflict (bean_type)
      do update set qty_remaining_grams = brewing_stock.qty_remaining_grams + excluded.qty_remaining_grams;

    insert into stock_movements (pool_type, ref_id, change_qty, reason, actor_id, note)
      values ('brewing', v_batch_id, p_brewing_grams, 'allocation', p_actor_id,
              'Batch allocation — brewing');
  end if;

  -- Allocate retail (just records the split; retail_stock rows managed per product)
  if coalesce(p_retail_grams, 0) > 0 then
    insert into stock_allocations (from_batch_id, to_pool, qty_grams, allocated_by)
      values (v_batch_id, 'retail', p_retail_grams, p_actor_id);
  end if;

  return v_batch_id;
end;
$$;
