// Textos de la interfaz en español latinoamericano neutro (idioma base). Cada texto tiene su clave; los {parámetros}
// se reemplazan al mostrarlos y los textos con plural llevan las formas .one y .other.
// Los textos que dependen del país (cómo se llama una comuna) los afina cada paquete de mercado (ADR-008).
export const es = {
  // Mercado (base genérica; el paquete de cada país la reemplaza)
  'market.area': 'zona',
  'market.areas': 'zonas',
  'market.locality': 'localidad',
  'market.localities': 'localidades',
  'market.selectLocality': 'Selecciona la localidad',

  // Buscador del catálogo
  'search.op.all': 'Todas',
  'search.op.sale': 'En Venta',
  'search.op.rent': 'En Arriendo',
  'search.count.one': '{count} propiedad',
  'search.count.other': '{count} propiedades',
  'search.clear': 'Limpiar',
  'search.keyword.label': 'Búsqueda / Palabras clave',
  'search.keyword.placeholder': 'Ej: Derechos de agua, Quincho, Losa...',
  'search.locality.label': '{Locality} / Sector',
  'search.locality.all': '📍 Todas las {localities} de {scope}',
  'search.type.label': 'Tipo de Inmueble',
  'search.type.all': 'Todos los tipos',
  'search.type.apartment': 'Departamentos',
  'search.type.house': 'Casas',
  'search.type.farm': 'Parcelas Agrícolas',
  'search.type.office': 'Oficinas / Locales',
  'search.filters.show': 'Filtros',
  'search.filters.hide': 'Ocultar',
  'search.price.min': 'Precio Mínimo ({currency})',
  'search.price.max': 'Precio Máximo ({currency})',
  'search.price.example': 'Ej: {example}',
  'search.bedrooms.label': 'Dormitorios Mínimos',
  'search.bedrooms.any': 'Cualquier número',
  'search.bedrooms.n': '{count}+ Dormitorios',

  // Grilla del catálogo
  'grid.badge': 'Catálogo Exclusivo',
  'grid.title': 'Propiedades en {scope}',
  'grid.sort.label': 'Ordenar:',
  'grid.sort.featured': 'Destacadas primero',
  'grid.sort.priceAsc': 'Menor a mayor precio',
  'grid.sort.priceDesc': 'Mayor a menor precio',
  'grid.sort.areaDesc': 'Mayor superficie (m²)',
  'grid.loading': 'Cargando propiedades…',
  'grid.empty.title': 'No se encontraron propiedades con estos filtros',
  'grid.empty.text':
    'Intenta ampliar el rango de precio, cambiar de {locality} o restablecer todos los filtros para ver la cartera completa.',
  'grid.empty.reset': 'Restablecer todos los filtros',

  // Panel: zonas de trabajo de la corredora
  'areas.title': 'Dónde trabaja tu corredora',
  'areas.help':
    'Marca las {areas} donde publicas propiedades. El buscador del sitio, el formulario de propiedades y la tasación ofrecerán solo las {localities} de esas {areas}.',
  'areas.none': 'Sin ninguna {area} marcada se ofrece todo {market}.',
  'areas.save': 'Guardar zonas',
  'areas.saved': 'Zonas guardadas. El sitio y el panel ya usan estas {areas}.',
  'areas.error': 'No se pudieron guardar las zonas. Inténtalo de nuevo.',
} as const;

export type MessageKey = keyof typeof es;
