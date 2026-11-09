-- H-061: tiempo hasta el cierre y motivo de descarte de cada contacto.
-- Solo agrega dos columnas opcionales; las políticas de seguridad de `leads` ya cubren las columnas nuevas
-- (los visitantes ya no insertan directo: solo miembros de la corredora, ver 20261104160000 y 20261105100000).
alter table public.leads
  add column closed_at timestamptz,
  add column discard_reason text
    check (discard_reason is null or discard_reason in
      ('no_respondio', 'compro_en_otro_lado', 'sin_presupuesto', 'ya_no_le_interesa', 'otro'));
