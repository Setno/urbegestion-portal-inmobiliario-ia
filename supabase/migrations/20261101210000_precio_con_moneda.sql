-- H-041 (ADR-008): el precio de una propiedad se guarda con su moneda.
--
-- Antes: price_uf (siempre UF) y price_clp (sin uso). Ahora: price_amount + price_currency ('UF', 'CLP', 'USD'…),
-- de modo que un mercado nuevo no necesita columnas nuevas.
--  * Los precios que ya existen pasan tal cual como monto en UF.
--  * Si algún monto no se copia idéntico, la migración se aborta antes de borrar las columnas viejas.
--  * La moneda del presupuesto de un lead deja de limitarse a UF y CLP: acepta cualquier código de 2 a 5 letras.

alter table public.properties
  add column price_amount   numeric(16, 2),
  add column price_currency text not null default 'UF'
    check (price_currency ~ '^[A-Z]{2,5}$');

update public.properties set price_amount = price_uf, price_currency = 'UF' where price_amount is null;

do $$
begin
  if exists (select 1 from public.properties where price_amount is null or price_amount is distinct from price_uf) then
    raise exception 'Migración abortada: algún precio no se copió idéntico a price_amount';
  end if;
end $$;

alter table public.properties
  alter column price_amount set not null,
  add constraint properties_price_amount_check check (price_amount >= 0);

alter table public.properties
  drop column price_uf,
  drop column price_clp;

alter table public.leads
  drop constraint leads_budget_currency_check,
  add constraint leads_budget_currency_check check (budget_currency is null or budget_currency ~ '^[A-Z]{2,5}$');
