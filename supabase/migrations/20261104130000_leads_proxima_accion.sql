-- H-056: próxima acción de cada contacto (qué hay que hacer y para cuándo).
-- Solo agrega dos columnas opcionales; las políticas de seguridad de `leads` ya cubren las columnas nuevas.
alter table public.leads
  add column next_action_text text check (next_action_text is null or char_length(next_action_text) <= 300),
  add column next_action_due date;

-- Quien crea un lead desde el sitio (visitante anónimo) no puede sembrar una próxima acción:
-- esa columna es solo del equipo de la corredora. Se repite la política vigente (20261031140000) con la condición nueva.
drop policy "leads: el sitio puede crear un lead nuevo" on public.leads;

create policy "leads: el sitio puede crear un lead nuevo"
  on public.leads for insert
  to anon, authenticated
  with check (
    status in ('nuevo', 'visita_agendada')
    and cardinality(notes) <= 20
    and next_action_text is null
    and next_action_due is null
    and (
      property_id is null
      or exists (select 1 from public.properties p
                 where p.id = leads.property_id and p.tenant_id = leads.tenant_id)
    )
  );
