-- Corredora de DEMOSTRACIÓN para mostrar la plataforma a corredoras interesadas.
-- Todo es ficticio: nombres, teléfonos, correos y propiedades. Las fotos son de Unsplash (las mismas de los datos de desarrollo).
-- No es una migración. Se ejecuta a mano en el SQL Editor de Supabase, una vez por base.
--
-- Antes de ejecutar: cambia el id de la línea marcada por el de la corredora que se convierte en demo.
--   Producción (cuenta A): la "Corredora de Prueba", que es la que muestra hoy el sitio público.
--
-- Qué hace:
--   * Renombra la corredora a "Propiedades Demo" y le carga marca y textos del sitio (sin testimonios ni cifras inventadas).
--   * Agrega 12 propiedades, 10 leads en distintas etapas y su historial de contacto.
--   * Los leads entran con el aviso ya marcado como enviado: no se manda ningún correo.
--   * Usa ids fijos (empiezan con d000..., d100..., d200...): repetirlo no duplica nada.
--   * No borra ni cambia propiedades o leads que la corredora ya tenga.
--
-- Para quitar la demo: borrar las filas cuyos ids empiezan con esos prefijos (ver el final del archivo).

do $$
declare
  v_tenant uuid := '00000000-0000-0000-0000-000000000000';   -- <- id de la corredora
  u text := 'https://images.unsplash.com/photo-';
  q text := '?auto=format&fit=crop&q=80&w=1200';
begin
  if not exists (select 1 from public.tenants where id = v_tenant) then
    raise exception 'No existe la corredora %', v_tenant;
  end if;

  update public.tenants set name = 'Propiedades Demo' where id = v_tenant;

  insert into public.site_content (tenant_id, template_id, brand, content)
  values (v_tenant, 'clasica',
    jsonb_build_object(
      'brandName', 'Propiedades Demo',
      'brokerName', 'Propiedades Demo',
      'brokerRole', 'Corredora de propiedades',
      'tagline', 'Venta y arriendo en Santiago',
      'cityRegion', 'Santiago, Región Metropolitana',
      'contact', jsonb_build_object(
        'address', 'Santiago, Región Metropolitana',
        'schedule', 'Lunes a viernes de 9:00 a 19:00 · Sábado de 10:00 a 14:00')),
    jsonb_build_object(
      'hero', jsonb_build_object(
        'badge', 'Sitio de demostración',
        'headline', 'Encuentra tu próxima propiedad en',
        'headlineHighlight', 'Santiago',
        'services', 'Departamentos, casas y oficinas en las principales comunas.'),
      'about', jsonb_build_object(
        'eyebrow', 'Quiénes somos',
        'title', 'Una corredora cercana, con respuesta el mismo día.',
        'paragraphs', jsonb_build_array(
          'Este es un sitio de demostración: muestra cómo se ve el sitio propio de una corredora en la plataforma. Las propiedades y los datos son ficticios.',
          'Cada consulta y cada solicitud de visita que se envía desde aquí llega al instante al CRM de la corredora.'),
        'highlights', jsonb_build_array(
          jsonb_build_object('title', 'Respuesta rápida', 'text', 'Cada interesado recibe respuesta el mismo día.'),
          jsonb_build_object('title', 'Visitas coordinadas', 'text', 'Agenda tu visita desde la ficha de cada propiedad.'))),
      'footer', jsonb_build_object(
        'description', 'Sitio de demostración. Propiedades y datos ficticios.',
        'coverageAreas', jsonb_build_array('Ñuñoa', 'Providencia', 'Las Condes', 'La Florida', 'Maipú', 'Santiago Centro'))))
  on conflict (tenant_id) do update set brand = excluded.brand, content = excluded.content;

  -- Propiedades
  insert into public.properties (id, tenant_id, title, operation, property_type, price_amount, price_currency, commune, address,
    bedrooms, bathrooms, built_area_m2, total_area_m2, parking_spots, storage_units, featured, status, images, description, features,
    expenses_monthly_clp, map_query, created_at)
  values
  ('d0000000-0000-4000-8000-000000000001', v_tenant, 'Departamento 2D2B a pasos de Plaza Ñuñoa', 'venta', 'departamento', 5200, 'UF', 'Ñuñoa', 'Av. Irarrázaval / Suecia',
    2, 2, 62, 68, 1, 1, true, 'disponible',
    array[u||'1502672260266-1c1ef2d93688'||q, u||'1560448204-e02f11c3d0e2'||q, u||'1484154218962-a197022b5858'||q],
    'Departamento luminoso con orientación nororiente, cocina americana y terraza. Edificio con piscina y quincho, a pasos de Plaza Ñuñoa y del metro.',
    array['Terraza', 'Piscina y quincho', 'Estacionamiento y bodega', 'A 5 minutos del metro'], 95000, 'Irarrazaval con Suecia, Ñuñoa, Chile', '2026-09-20'),
  ('d0000000-0000-4000-8000-000000000002', v_tenant, 'Departamento familiar 3D2B junto a ciclovía Pocuro', 'arriendo', 'departamento', 890000, 'CLP', 'Providencia', 'Pocuro / Tobalaba',
    3, 2, 88, 95, 1, 1, true, 'disponible',
    array[u||'1522708323590-d24dbb6b0267'||q, u||'1502005229762-ee1b2b81e465'||q],
    'Amplio departamento en sector residencial, cerca de colegios, cafés y parques. Cocina cerrada con logia.',
    array['Cocina cerrada con logia', 'Edificio de 7 pisos', 'Admite mascotas'], 135000, 'Pocuro con Tobalaba, Providencia, Chile', '2026-09-25'),
  ('d0000000-0000-4000-8000-000000000003', v_tenant, 'Casa 4D3B con patio en barrio consolidado', 'venta', 'casa', 7900, 'UF', 'La Florida', 'Walker Martínez / Av. La Florida',
    4, 3, 140, 280, 2, 0, true, 'disponible',
    array[u||'1580587771525-78b9dba3b914'||q, u||'1513694203232-719a280e022f'||q],
    'Casa de dos pisos con patio, quincho y espacio para dos autos. Cerca de colegios, comercio y metro Bellavista de La Florida.',
    array['Patio con quincho', 'Dormitorio principal en suite', 'Calle tranquila'], 0, 'Walker Martinez, La Florida, Chile', '2026-09-28'),
  ('d0000000-0000-4000-8000-000000000004', v_tenant, 'Departamento 1D1B a una cuadra del metro Santa Lucía', 'arriendo', 'departamento', 420000, 'CLP', 'Santiago Centro', 'Merced / Santa Lucía',
    1, 1, 38, 40, 0, 0, false, 'disponible',
    array[u||'1560448204-e02f11c3d0e2'||q, u||'1484154218962-a197022b5858'||q],
    'Ideal para estudiantes o profesionales. Edificio con conserjería 24 horas, lavandería y cowork.',
    array['Conserjería 24 horas', 'Cowork y lavandería', 'A una cuadra del metro'], 65000, 'Merced con Santa Lucia, Santiago, Chile', '2026-10-02'),
  ('d0000000-0000-4000-8000-000000000005', v_tenant, 'Casa 3D2B en pasaje cerrado', 'venta', 'casa', 4350, 'UF', 'Maipú', 'Av. Pajaritos / Los Pajaritos',
    3, 2, 98, 190, 2, 0, false, 'disponible',
    array[u||'1518780664697-55e3ad937233'||q, u||'1600585152220-90363fe7e115'||q],
    'Casa ampliada y bien mantenida en pasaje con portón. Cerca de la autopista y del metro Plaza de Maipú.',
    array['Pasaje cerrado con portón', 'Ampliación regularizada', 'Antejardín'], 0, 'Pajaritos, Maipu, Chile', '2026-10-05'),
  ('d0000000-0000-4000-8000-000000000006', v_tenant, 'Departamento 3D2B con vista a la cordillera', 'venta', 'departamento', 9800, 'UF', 'Las Condes', 'Av. Cristóbal Colón / Tomás Moro',
    3, 2, 105, 118, 2, 1, true, 'disponible',
    array[u||'1560448204-e02f11c3d0e2'||q, u||'1502005229762-ee1b2b81e465'||q, u||'1484154218962-a197022b5858'||q],
    'Piso alto con vista despejada, termopanel y calefacción central. Edificio con gimnasio, piscina y sala multiuso.',
    array['Vista a la cordillera', 'Termopanel', 'Gimnasio y piscina', '2 estacionamientos'], 180000, 'Cristobal Colon con Tomas Moro, Las Condes, Chile', '2026-10-08'),
  ('d0000000-0000-4000-8000-000000000007', v_tenant, 'Oficina habilitada de 70 m² cerca de metro Los Leones', 'arriendo', 'oficina_comercial', 1250000, 'CLP', 'Providencia', 'Av. Providencia / Los Leones',
    0, 2, 70, 70, 1, 0, false, 'disponible',
    array[u||'1497366216548-37526070297c'||q, u||'1497215728101-856f4ea42174'||q],
    'Oficina con dos privados, sala de reuniones y kitchenette. Lista para usar.',
    array['Dos privados y sala de reuniones', 'Aire acondicionado', 'A pasos del metro'], 210000, 'Providencia con Los Leones, Providencia, Chile', '2026-10-12'),
  ('d0000000-0000-4000-8000-000000000008', v_tenant, 'Departamento 2D1B ideal para inversión', 'venta', 'departamento', 3650, 'UF', 'San Miguel', 'Gran Avenida / Departamental',
    2, 1, 55, 58, 0, 1, false, 'disponible',
    array[u||'1502005229762-ee1b2b81e465'||q, u||'1522708323590-d24dbb6b0267'||q],
    'Departamento arrendado con buen historial de pago, a pasos de la línea 2. Buena opción de renta.',
    array['Hoy arrendado', 'A pasos del metro', 'Bodega'], 70000, 'Gran Avenida con Departamental, San Miguel, Chile', '2026-10-15'),
  ('d0000000-0000-4000-8000-000000000009', v_tenant, 'Casa 5D4B con piscina en condominio', 'venta', 'casa', 13500, 'UF', 'Peñalolén', 'Av. Consistorial / Las Perdices',
    5, 4, 210, 450, 3, 1, false, 'reservada',
    array[u||'1600585154526-990dced4db0d'||q, u||'1600566753190-17f0baa2a6c3'||q, u||'1512917774080-9991f1c4c750'||q],
    'Casa en condominio con seguridad, piscina, quincho y jardín. Cerca de colegios y de la autopista.',
    array['Piscina', 'Condominio con seguridad', 'Jardín con riego automático'], 120000, 'Consistorial, Peñalolen, Chile', '2026-09-18'),
  ('d0000000-0000-4000-8000-000000000010', v_tenant, 'Terreno de 5.000 m² con factibilidad de agua y luz', 'venta', 'terreno', 3900, 'UF', 'Colina (Chicureo / Chamisero)', 'Camino Chicureo',
    0, 0, 0, 5000, 0, 0, false, 'disponible',
    array[u||'1500382017468-9049fed747ef'||q, u||'1542601906990-b4d3fb778b09'||q],
    'Terreno plano con rol propio, factibilidad de agua y luz, a 10 minutos de la Radial Nororiente.',
    array['Rol propio', 'Factibilidad de agua y luz', 'Terreno plano'], 0, 'Camino Chicureo, Colina, Chile', '2026-10-20'),
  ('d0000000-0000-4000-8000-000000000011', v_tenant, 'Departamento 2D2B frente a Parque Juan XXIII', 'arriendo', 'departamento', 650000, 'CLP', 'Ñuñoa', 'Av. Ricardo Lyon / Juan XXIII',
    2, 2, 64, 70, 1, 1, false, 'arrendada',
    array[u||'1502672260266-1c1ef2d93688'||q, u||'1484154218962-a197022b5858'||q],
    'Departamento con vista al parque, cocina equipada y estacionamiento.',
    array['Vista al parque', 'Cocina equipada', 'Estacionamiento'], 90000, 'Ricardo Lyon, Ñuñoa, Chile', '2026-09-15'),
  ('d0000000-0000-4000-8000-000000000012', v_tenant, 'Casa 3D2B remodelada cerca de Plaza de Puente Alto', 'venta', 'casa', 3200, 'UF', 'Puente Alto', 'Av. Concha y Toro',
    3, 2, 85, 160, 1, 0, false, 'vendida',
    array[u||'1513694203232-719a280e022f'||q, u||'1580587771525-78b9dba3b914'||q],
    'Casa remodelada con cocina nueva y patio. Cerca de comercio y del metro.',
    array['Cocina remodelada', 'Patio', 'Cerca del metro'], 0, 'Concha y Toro, Puente Alto, Chile', '2026-09-10')
  on conflict (id) do nothing;

  -- Leads (con el aviso ya marcado: no se manda correo)
  insert into public.leads (id, tenant_id, full_name, email, phone, property_id, property_title, operation_interest, budget_amount, budget_currency,
    mortgage_status, target_move_date, status, appointment_date, appointment_time, notes, source, attribution, next_action_text, next_action_due,
    created_at, alert_sent_at)
  values
  ('d1000000-0000-4000-8000-000000000001', v_tenant, 'Camila Rojas', 'camila.rojas@ejemplo.test', '+56 9 1111 0001',
    'd0000000-0000-4000-8000-000000000001', 'Departamento 2D2B a pasos de Plaza Ñuñoa', 'compra', 5300, 'UF', 'pre_aprobado', '1_a_3_meses',
    'nuevo', null, null, array['Pregunta si el estacionamiento es techado'], 'ficha_propiedad',
    '{"fuente": "portalinmobiliario", "medio": "referido"}', 'Llamar para coordinar visita', '2026-11-11', '2026-11-10 18:42-03', '2026-11-10 18:42-03'),
  ('d1000000-0000-4000-8000-000000000002', v_tenant, 'Diego Muñoz', 'diego.munoz@ejemplo.test', '+56 9 1111 0002',
    'd0000000-0000-4000-8000-000000000002', 'Departamento familiar 3D2B junto a ciclovía Pocuro', 'arriendo', 900000, 'CLP', 'sin_evaluar', 'inmediato',
    'nuevo', null, null, array['Tiene un perro mediano'], 'asistente_ia',
    '{"fuente": "instagram", "medio": "social"}', null, null, '2026-11-11 09:15-03', '2026-11-11 09:15-03'),
  ('d1000000-0000-4000-8000-000000000003', v_tenant, 'Valentina Soto', 'valentina.soto@ejemplo.test', '+56 9 1111 0003',
    'd0000000-0000-4000-8000-000000000003', 'Casa 4D3B con patio en barrio consolidado', 'compra', 8000, 'UF', 'en_tramite', '1_a_3_meses',
    'contactado', null, null, array['Crédito en trámite con BancoEstado'], 'formulario_contacto',
    '{"fuente": "google", "medio": "organico"}', 'Enviar fotos del segundo piso por WhatsApp', '2026-11-09', '2026-11-03 11:20-03', '2026-11-03 11:20-03'),
  ('d1000000-0000-4000-8000-000000000004', v_tenant, 'Felipe Contreras', 'felipe.contreras@ejemplo.test', '+56 9 1111 0004',
    'd0000000-0000-4000-8000-000000000006', 'Departamento 3D2B con vista a la cordillera', 'compra', 10000, 'UF', 'pre_aprobado', 'inmediato',
    'visita_agendada', '2026-11-13', '11:00', array['Viene con su pareja'], 'ficha_propiedad',
    '{"fuente": "portalinmobiliario", "medio": "referido"}', 'Confirmar visita el día antes', '2026-11-12', '2026-10-29 20:05-03', '2026-10-29 20:05-03'),
  ('d1000000-0000-4000-8000-000000000005', v_tenant, 'Javiera Pérez', 'javiera.perez@ejemplo.test', '+56 9 1111 0005',
    'd0000000-0000-4000-8000-000000000004', 'Departamento 1D1B a una cuadra del metro Santa Lucía', 'arriendo', 450000, 'CLP', 'sin_evaluar', 'inmediato',
    'visita_agendada', '2026-11-14', '17:30', array['Estudiante de magíster; aval es su padre'], 'asistente_ia',
    '{"fuente": "sitio", "medio": "directo"}', null, null, '2026-11-06 13:40-03', '2026-11-06 13:40-03'),
  ('d1000000-0000-4000-8000-000000000006', v_tenant, 'Sebastián Torres', 'sebastian.torres@ejemplo.test', '+56 9 1111 0006',
    'd0000000-0000-4000-8000-000000000009', 'Casa 5D4B con piscina en condominio', 'compra', 13500, 'UF', 'al_contado', 'inmediato',
    'en_negociacion', null, null, array['Ofreció UF 13.000; el propietario pide UF 13.300', 'Reserva firmada el 2026-10-30'], 'ficha_propiedad',
    '{"fuente": "yapo", "medio": "referido"}', 'Enviar borrador de promesa al abogado', '2026-11-12', '2026-10-14 10:00-03', '2026-10-14 10:00-03'),
  ('d1000000-0000-4000-8000-000000000007', v_tenant, 'Francisca Díaz', 'francisca.diaz@ejemplo.test', '+56 9 1111 0007',
    'd0000000-0000-4000-8000-000000000012', 'Casa 3D2B remodelada cerca de Plaza de Puente Alto', 'compra', 3200, 'UF', 'pre_aprobado', 'inmediato',
    'cerrado', null, null, array['Escritura firmada el 2026-11-04'], 'ficha_propiedad',
    '{"fuente": "portalinmobiliario", "medio": "referido"}', null, null, '2026-09-30 16:25-03', '2026-09-30 16:25-03'),
  ('d1000000-0000-4000-8000-000000000008', v_tenant, 'Matías González', 'matias.gonzalez@ejemplo.test', '+56 9 1111 0008',
    'd0000000-0000-4000-8000-000000000011', 'Departamento 2D2B frente a Parque Juan XXIII', 'arriendo', 650000, 'CLP', 'sin_evaluar', 'inmediato',
    'cerrado', null, null, array['Contrato firmado; entrega de llaves el 2026-10-25'], 'asistente_ia',
    '{"fuente": "sitio", "medio": "directo"}', null, null, '2026-10-06 12:10-03', '2026-10-06 12:10-03'),
  ('d1000000-0000-4000-8000-000000000009', v_tenant, 'Catalina Fuentes', 'catalina.fuentes@ejemplo.test', '+56 9 1111 0009',
    'd0000000-0000-4000-8000-000000000005', 'Casa 3D2B en pasaje cerrado', 'compra', 3800, 'UF', 'sin_evaluar', 'mas_de_3_meses',
    'descartado', null, null, array['Presupuesto bajo para la zona; buscará más adelante'], 'formulario_contacto',
    '{"fuente": "facebook", "medio": "social"}', null, null, '2026-10-20 19:55-03', '2026-10-20 19:55-03'),
  ('d1000000-0000-4000-8000-000000000010', v_tenant, 'Rodrigo Vargas', 'rodrigo.vargas@ejemplo.test', '+56 9 1111 0010',
    null, null, 'venta_propietario', 6500, 'UF', null, '1_a_3_meses',
    'contactado', null, null, array['Quiere vender su departamento en Macul para comprar casa'], 'captacion_propietarios',
    '{"fuente": "sitio", "medio": "directo"}', 'Agendar tasación', '2026-11-13', '2026-11-08 10:30-03', '2026-11-08 10:30-03')
  on conflict (id) do nothing;

  -- Historial de contacto
  insert into public.lead_events (id, tenant_id, lead_id, kind, text, occurred_at)
  values
  ('d2000000-0000-4000-8000-000000000001', v_tenant, 'd1000000-0000-4000-8000-000000000003', 'whatsapp', 'Primer contacto. Pidió fotos del segundo piso.', '2026-11-03 12:05-03'),
  ('d2000000-0000-4000-8000-000000000002', v_tenant, 'd1000000-0000-4000-8000-000000000003', 'llamada', 'Confirma crédito en trámite; quiere visitar después de la aprobación.', '2026-11-05 17:30-03'),
  ('d2000000-0000-4000-8000-000000000003', v_tenant, 'd1000000-0000-4000-8000-000000000004', 'llamada', 'Interesado en piso alto. Se agenda visita para el jueves 13 a las 11:00.', '2026-10-30 10:15-03'),
  ('d2000000-0000-4000-8000-000000000004', v_tenant, 'd1000000-0000-4000-8000-000000000005', 'whatsapp', 'Coordinada visita el viernes 14 a las 17:30.', '2026-11-06 15:00-03'),
  ('d2000000-0000-4000-8000-000000000005', v_tenant, 'd1000000-0000-4000-8000-000000000006', 'visita', 'Visitó la casa con su familia. Muy interesado.', '2026-10-20 11:00-03'),
  ('d2000000-0000-4000-8000-000000000006', v_tenant, 'd1000000-0000-4000-8000-000000000006', 'correo', 'Envía oferta por UF 13.000.', '2026-10-24 09:40-03'),
  ('d2000000-0000-4000-8000-000000000007', v_tenant, 'd1000000-0000-4000-8000-000000000006', 'nota', 'Reserva firmada. Propietario pide UF 13.300.', '2026-10-30 18:00-03'),
  ('d2000000-0000-4000-8000-000000000008', v_tenant, 'd1000000-0000-4000-8000-000000000007', 'visita', 'Visita con tasador del banco.', '2026-10-08 10:00-03'),
  ('d2000000-0000-4000-8000-000000000009', v_tenant, 'd1000000-0000-4000-8000-000000000007', 'nota', 'Escritura firmada en notaría.', '2026-11-04 12:30-03'),
  ('d2000000-0000-4000-8000-000000000010', v_tenant, 'd1000000-0000-4000-8000-000000000008', 'visita', 'Visitó el departamento; decide arrendar.', '2026-10-09 18:00-03'),
  ('d2000000-0000-4000-8000-000000000011', v_tenant, 'd1000000-0000-4000-8000-000000000009', 'llamada', 'Presupuesto no alcanza para la zona; se descarta por ahora.', '2026-10-22 13:00-03'),
  ('d2000000-0000-4000-8000-000000000012', v_tenant, 'd1000000-0000-4000-8000-000000000010', 'llamada', 'Propietario quiere vender en 2 a 3 meses. Pide tasación.', '2026-11-08 16:45-03')
  on conflict (id) do nothing;
end $$;

-- Revisión rápida después de ejecutar:
-- select status, count(*) from public.leads where id::text like 'd1000000%' group by status;
-- select status, count(*) from public.properties where id::text like 'd0000000%' group by status;

-- Para quitar la demo (no toca nada más):
-- delete from public.lead_events where id::text like 'd2000000-0000-4000-8000-%';
-- delete from public.leads       where id::text like 'd1000000-0000-4000-8000-%';
-- delete from public.properties  where id::text like 'd0000000-0000-4000-8000-%';
