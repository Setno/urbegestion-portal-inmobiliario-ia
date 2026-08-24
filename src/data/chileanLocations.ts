export interface CommuneGroup {
  groupName: string;
  communes: string[];
}

export const REGION_METROPOLITANA_ZONES: CommuneGroup[] = [
  {
    groupName: "Sector Oriente (Alta Plusvalía)",
    communes: [
      "La Reina",
      "Las Condes",
      "Lo Barnechea (La Dehesa / Los Trapenses)",
      "Ñuñoa",
      "Providencia",
      "Vitacura",
    ]
  },
  {
    groupName: "Chicureo & Sector Norte",
    communes: [
      "Colina (Chicureo / Chamisero)",
      "Conchalí",
      "Huechuraba",
      "Independencia",
      "Lampa",
      "Quilicura",
      "Recoleta",
      "Tiltil",
    ]
  },
  {
    groupName: "Zonas Agrícolas & Parcelas (Melipilla / Cordillera / Maipo)",
    communes: [
      "Alhué",
      "Buin",
      "Calera de Tango",
      "Curacaví",
      "El Monte",
      "Isla de Maipo",
      "María Pinto",
      "Melipilla",
      "Padre Hurtado",
      "Paine",
      "Peñaflor",
      "Pirque",
      "San José de Maipo",
      "San Pedro",
      "Talagante",
    ]
  },
  {
    groupName: "Sector Centro & Poniente",
    communes: [
      "Cerrillos",
      "Cerro Navia",
      "Estación Central",
      "Lo Prado",
      "Maipú",
      "Pudahuel",
      "Quinta Normal",
      "Renca",
      "Santiago Centro",
    ]
  },
  {
    groupName: "Sector Sur & Precordillera",
    communes: [
      "El Bosque",
      "La Cisterna",
      "La Florida",
      "La Granja",
      "La Pintana",
      "Lo Espejo",
      "Macul",
      "Pedro Aguirre Cerda",
      "Peñalolén",
      "Puente Alto",
      "San Bernardo",
      "San Joaquín",
      "San Miguel",
      "San Ramón",
    ]
  }
];

// Flat array of all unique comunas for quick lookups and filters
export const ALL_RM_COMMUNES = [
  "Todas las comunas",
  ...REGION_METROPOLITANA_ZONES.flatMap(z => z.communes)
];
