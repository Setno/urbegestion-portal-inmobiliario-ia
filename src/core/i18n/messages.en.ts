import type { MessageKey } from './messages.es';

// English texts. Typed against the Spanish keys: a missing or extra key is a compile error.
export const en: Record<MessageKey, string> = {
  // Market (generic base; each country's market pack overrides it)
  'market.area': 'area',
  'market.areas': 'areas',
  'market.locality': 'locality',
  'market.localities': 'localities',
  'market.selectLocality': 'Select the locality',

  // Catalog search bar
  'search.op.all': 'All',
  'search.op.sale': 'For Sale',
  'search.op.rent': 'For Rent',
  'search.count.one': '{count} property',
  'search.count.other': '{count} properties',
  'search.clear': 'Clear',
  'search.keyword.label': 'Search / Keywords',
  'search.keyword.placeholder': 'E.g. Water rights, Barbecue area, Slab...',
  'search.locality.label': '{Locality} / Area',
  'search.locality.all': '📍 All {localities} in {scope}',
  'search.type.label': 'Property type',
  'search.type.all': 'All types',
  'search.type.apartment': 'Apartments',
  'search.type.house': 'Houses',
  'search.type.farm': 'Farm plots',
  'search.type.office': 'Offices / Commercial',
  'search.filters.show': 'Filters',
  'search.filters.hide': 'Hide',
  'search.price.min': 'Minimum price ({currency})',
  'search.price.max': 'Maximum price ({currency})',
  'search.price.example': 'E.g. {example}',
  'search.bedrooms.label': 'Minimum bedrooms',
  'search.bedrooms.any': 'Any number',
  'search.bedrooms.n': '{count}+ Bedrooms',

  // Catalog grid
  'grid.badge': 'Exclusive Catalog',
  'grid.title': 'Properties in {scope}',
  'grid.sort.label': 'Sort:',
  'grid.sort.featured': 'Featured first',
  'grid.sort.priceAsc': 'Price: low to high',
  'grid.sort.priceDesc': 'Price: high to low',
  'grid.sort.areaDesc': 'Largest area (m²)',
  'grid.loading': 'Loading properties…',
  'grid.empty.title': 'No properties match these filters',
  'grid.empty.text':
    'Try widening the price range, changing the {locality} or resetting all filters to see the full portfolio.',
  'grid.empty.reset': 'Reset all filters',

  // Panel: the brokerage's working areas
  'areas.title': 'Where your brokerage works',
  'areas.help':
    'Tick the {areas} where you list properties. The site search, the property form and the valuation request will offer only the {localities} of those {areas}.',
  'areas.none': 'With no {area} ticked, all of {market} is offered.',
  'areas.save': 'Save areas',
  'areas.saved': 'Areas saved. The site and the panel now use these {areas}.',
  'areas.error': 'The areas could not be saved. Please try again.',
};
