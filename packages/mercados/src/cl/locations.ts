import type { LocationArea, LocationZone } from '../types';
import { REGION_METROPOLITANA_ZONES } from './chileanLocations';

const single = (id: string, name: string, localities: string[]): LocationArea => ({
  id,
  name,
  zones: [{ groupName: name, localities }],
});

// La Región Metropolitana conserva su agrupación por sectores, pensada para el mercado de Santiago.
const rmZones: LocationZone[] = REGION_METROPOLITANA_ZONES.map((z) => ({ groupName: z.groupName, localities: z.communes }));

// Las 16 regiones de Chile con sus 346 comunas (códigos ISO 3166-2:CL), de norte a sur.
export const CHILE_AREAS: LocationArea[] = [
  single('CL-AP', 'Arica y Parinacota', ['Arica', 'Camarones', 'Putre', 'General Lagos']),
  single('CL-TA', 'Tarapacá', ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica']),
  single('CL-AN', 'Antofagasta', [
    'Antofagasta', 'Mejillones', 'Sierra Gorda', 'Taltal', 'Calama', 'Ollagüe', 'San Pedro de Atacama', 'Tocopilla', 'María Elena',
  ]),
  single('CL-AT', 'Atacama', [
    'Copiapó', 'Caldera', 'Tierra Amarilla', 'Chañaral', 'Diego de Almagro', 'Vallenar', 'Alto del Carmen', 'Freirina', 'Huasco',
  ]),
  single('CL-CO', 'Coquimbo', [
    'La Serena', 'Coquimbo', 'Andacollo', 'La Higuera', 'Paiguano', 'Vicuña', 'Illapel', 'Canela', 'Los Vilos', 'Salamanca',
    'Ovalle', 'Combarbalá', 'Monte Patria', 'Punitaqui', 'Río Hurtado',
  ]),
  single('CL-VS', 'Valparaíso', [
    'Valparaíso', 'Viña del Mar', 'Concón', 'Casablanca', 'Juan Fernández', 'Puchuncaví', 'Quintero', 'Isla de Pascua',
    'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban', 'La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar',
    'Quillota', 'La Calera', 'Hijuelas', 'La Cruz', 'Nogales', 'San Antonio', 'Algarrobo', 'Cartagena', 'El Quisco',
    'El Tabo', 'Santo Domingo', 'San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María', 'Quilpué',
    'Limache', 'Olmué', 'Villa Alemana',
  ]),
  { id: 'CL-RM', name: 'Región Metropolitana de Santiago', zones: rmZones },
  single('CL-LI', "Libertador General Bernardo O'Higgins", [
    'Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros', 'Las Cabras', 'Machalí', 'Malloa', 'Mostazal',
    'Olivar', 'Peumo', 'Pichidegua', 'Quinta de Tilcoco', 'Rengo', 'Requínoa', 'San Vicente', 'Pichilemu', 'La Estrella',
    'Litueche', 'Marchihue', 'Navidad', 'Paredones', 'San Fernando', 'Chépica', 'Chimbarongo', 'Lolol', 'Nancagua',
    'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Santa Cruz',
  ]),
  single('CL-ML', 'Maule', [
    'Talca', 'Constitución', 'Curepto', 'Empedrado', 'Maule', 'Pelarco', 'Pencahue', 'Río Claro', 'San Clemente', 'San Rafael',
    'Cauquenes', 'Chanco', 'Pelluhue', 'Curicó', 'Hualañé', 'Licantén', 'Molina', 'Rauco', 'Romeral', 'Sagrada Familia',
    'Teno', 'Vichuquén', 'Linares', 'Colbún', 'Longaví', 'Parral', 'Retiro', 'San Javier', 'Villa Alegre', 'Yerbas Buenas',
  ]),
  single('CL-NB', 'Ñuble', [
    'Chillán', 'Bulnes', 'Chillán Viejo', 'El Carmen', 'Pemuco', 'Pinto', 'Quillón', 'San Ignacio', 'Yungay', 'Quirihue',
    'Cobquecura', 'Coelemu', 'Ninhue', 'Portezuelo', 'Ránquil', 'Treguaco', 'San Carlos', 'Coihueco', 'Ñiquén', 'San Fabián',
    'San Nicolás',
  ]),
  single('CL-BI', 'Biobío', [
    'Concepción', 'Coronel', 'Chiguayante', 'Florida', 'Hualqui', 'Lota', 'Penco', 'San Pedro de la Paz', 'Santa Juana',
    'Talcahuano', 'Tomé', 'Hualpén', 'Lebu', 'Arauco', 'Cañete', 'Contulmo', 'Curanilahue', 'Los Álamos', 'Tirúa',
    'Los Ángeles', 'Antuco', 'Cabrero', 'Laja', 'Mulchén', 'Nacimiento', 'Negrete', 'Quilaco', 'Quilleco', 'San Rosendo',
    'Santa Bárbara', 'Tucapel', 'Yumbel', 'Alto Biobío',
  ]),
  single('CL-AR', 'La Araucanía', [
    'Temuco', 'Carahue', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino', 'Gorbea', 'Lautaro', 'Loncoche', 'Melipeuco',
    'Nueva Imperial', 'Padre Las Casas', 'Perquenco', 'Pitrufquén', 'Pucón', 'Saavedra', 'Teodoro Schmidt', 'Toltén',
    'Vilcún', 'Villarrica', 'Cholchol', 'Angol', 'Collipulli', 'Curacautín', 'Ercilla', 'Lonquimay', 'Los Sauces', 'Lumaco',
    'Purén', 'Renaico', 'Traiguén', 'Victoria',
  ]),
  single('CL-LR', 'Los Ríos', [
    'Valdivia', 'Corral', 'Lanco', 'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco', 'Panguipulli', 'La Unión', 'Futrono',
    'Lago Ranco', 'Río Bueno',
  ]),
  single('CL-LL', 'Los Lagos', [
    'Puerto Montt', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar', 'Los Muermos', 'Llanquihue', 'Maullín', 'Puerto Varas',
    'Castro', 'Ancud', 'Chonchi', 'Curaco de Vélez', 'Dalcahue', 'Puqueldón', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao',
    'Osorno', 'Puerto Octay', 'Purranque', 'Puyehue', 'Río Negro', 'San Juan de la Costa', 'San Pablo', 'Chaitén',
    'Futaleufú', 'Hualaihué', 'Palena',
  ]),
  single('CL-AI', 'Aysén del General Carlos Ibáñez del Campo', [
    'Coyhaique', 'Lago Verde', 'Aysén', 'Cisnes', 'Guaitecas', 'Cochrane', "O'Higgins", 'Tortel', 'Chile Chico', 'Río Ibáñez',
  ]),
  single('CL-MA', 'Magallanes y de la Antártica Chilena', [
    'Punta Arenas', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Cabo de Hornos', 'Antártica', 'Porvenir', 'Primavera',
    'Timaukel', 'Natales', 'Torres del Paine',
  ]),
];
