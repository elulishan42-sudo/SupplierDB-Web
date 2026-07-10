-- One-time backfill (run once; safe to re-run).
-- Some suppliers had their product list stored only in the free-text
-- `products_services` column. This creates a real `products` row for each
-- item so the structured Products section on the supplier detail page works.
-- Skips any supplier that already has rows in `products`.

do $$
declare
  sup record;
  items text[];
  item text;
begin
  for sup in select id, products_services from public.suppliers
             where products_services is not null and trim(products_services) <> '' loop
    -- skip if products already exist for this supplier
    if exists (select 1 from public.products where supplier_id = sup.id) then
      continue;
    end if;

    items := string_to_array(regexp_replace(sup.products_services, '\s+', '', 'g'), ',');
    foreach item in array items loop
      item := trim(item);
      if item <> '' then
        insert into public.products (supplier_id, name) values (sup.id, item);
      end if;
    end loop;
  end loop;
end $$;
