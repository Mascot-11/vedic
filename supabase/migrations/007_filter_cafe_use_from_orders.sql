-- Cafe-use items should not appear in the Add Item sheet (not sold to customers)
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
    from simple_products
    where qty_available > 0
      and usage_type = 'sale'   -- exclude internal cafe-use items
  order by category, name;
$$;
