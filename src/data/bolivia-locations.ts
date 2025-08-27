export interface Department {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  provinces: Province[];
}

export interface Province {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
}

export const boliviaDepartments: Department[] = [
  {
    id: "la-paz",
    name: "La Paz",
    coordinates: [-68.1193, -16.5000],
    provinces: [
      { id: "murillo", name: "Pedro Domingo Murillo", coordinates: [-68.1193, -16.5000] },
      { id: "omasuyos", name: "Omasuyos", coordinates: [-68.8833, -16.0000] },
      { id: "pacajes", name: "Pacajes", coordinates: [-69.1167, -17.3000] },
      { id: "camacho", name: "Eliodoro Camacho", coordinates: [-69.0833, -15.7500] },
      { id: "muñecas", name: "Franz Tamayo", coordinates: [-69.1833, -14.9167] },
      { id: "larecaja", name: "Larecaja", coordinates: [-68.6167, -15.7833] },
      { id: "bautista-saavedra", name: "Bautista Saavedra", coordinates: [-69.1000, -15.0000] },
      { id: "nor-yungas", name: "Nor Yungas", coordinates: [-67.5833, -16.1000] },
      { id: "sud-yungas", name: "Sud Yungas", coordinates: [-67.4833, -16.5500] },
      { id: "inquisivi", name: "Inquisivi", coordinates: [-67.1333, -16.9333] },
      { id: "loayza", name: "Loayza", coordinates: [-67.3500, -17.1167] },
      { id: "aroma", name: "Aroma", coordinates: [-68.2000, -17.9667] },
      { id: "ingavi", name: "Ingavi", coordinates: [-68.9167, -16.8000] },
      { id: "los-andes", name: "Los Andes", coordinates: [-68.7000, -16.2833] },
      { id: "gualberto-villarroel", name: "Gualberto Villarroel", coordinates: [-68.4500, -17.4167] },
      { id: "jose-ramon-loayza", name: "José Ramón Loayza", coordinates: [-67.2833, -17.2500] },
      { id: "abel-iturralde", name: "Abel Iturralde", coordinates: [-67.8333, -14.0500] },
      { id: "general-jose-ballivian", name: "General José Ballivián", coordinates: [-67.5500, -14.5833] },
      { id: "sud-carangas", name: "Sud Carangas", coordinates: [-68.6000, -18.0833] },
      { id: "carangas", name: "Carangas", coordinates: [-68.7167, -18.7000] }
    ]
  },
  {
    id: "cochabamba",
    name: "Cochabamba",
    coordinates: [-66.1568, -17.3895],
    provinces: [
      { id: "cercado", name: "Cercado", coordinates: [-66.1568, -17.3895] },
      { id: "ayopaya", name: "Ayopaya", coordinates: [-66.9167, -16.9167] },
      { id: "arque", name: "Arque", coordinates: [-66.7833, -17.7333] },
      { id: "capinota", name: "Capinota", coordinates: [-66.2833, -17.7167] },
      { id: "quillacollo", name: "Quillacollo", coordinates: [-66.2833, -17.3833] },
      { id: "tapacari", name: "Tapacarí", coordinates: [-66.5500, -17.5500] },
      { id: "jordan", name: "Jordán", coordinates: [-65.9167, -17.3333] },
      { id: "punata", name: "Punata", coordinates: [-65.8333, -17.5333] },
      { id: "tiraque", name: "Tiraque", coordinates: [-65.7167, -17.4167] },
      { id: "carrasco", name: "Carrasco", coordinates: [-64.7167, -17.1833] },
      { id: "chapare", name: "Chapare", coordinates: [-65.4000, -16.8333] },
      { id: "mizque", name: "Mizque", coordinates: [-65.3500, -17.9333] },
      { id: "arani", name: "Arani", coordinates: [-65.7667, -17.5667] },
      { id: "bolivar", name: "Bolívar", coordinates: [-65.0500, -18.1000] },
      { id: "campero", name: "Campero", coordinates: [-64.8167, -18.1833] },
      { id: "esteban-arce", name: "Esteban Arce", coordinates: [-66.0833, -17.4667] }
    ]
  },
  {
    id: "santa-cruz",
    name: "Santa Cruz",
    coordinates: [-63.1821, -17.8146],
    provinces: [
      { id: "andres-ibanez", name: "Andrés Ibáñez", coordinates: [-63.1821, -17.8146] },
      { id: "warnes", name: "Warnes", coordinates: [-63.1667, -17.5333] },
      { id: "velasco", name: "Velasco", coordinates: [-61.1167, -15.3333] },
      { id: "ichilo", name: "Ichilo", coordinates: [-63.5167, -17.4500] },
      { id: "chiquitos", name: "Chiquitos", coordinates: [-59.7333, -17.9167] },
      { id: "sara", name: "Sara", coordinates: [-63.1667, -17.1000] },
      { id: "cordillera", name: "Cordillera", coordinates: [-62.0833, -19.6333] },
      { id: "vallegrande", name: "Vallegrande", coordinates: [-64.1167, -18.5000] },
      { id: "florida", name: "Florida", coordinates: [-63.3167, -18.1167] },
      { id: "caballero", name: "Caballero", coordinates: [-64.7833, -18.0167] },
      { id: "sandoval", name: "Sandoval", coordinates: [-62.0333, -16.5000] },
      { id: "german-busch", name: "Germán Busch", coordinates: [-58.3833, -18.9667] },
      { id: "guarayos", name: "Guarayos", coordinates: [-62.8500, -15.5000] },
      { id: "angel-sandoval", name: "Ángel Sandoval", coordinates: [-58.9500, -16.5000] },
      { id: "nuflo-de-chavez", name: "Ñuflo de Chávez", coordinates: [-61.9167, -16.5000] }
    ]
  },
  {
    id: "oruro",
    name: "Oruro",
    coordinates: [-67.1091, -17.9667],
    provinces: [
      { id: "cercado-oruro", name: "Cercado", coordinates: [-67.1091, -17.9667] },
      { id: "avaroa", name: "Avaroa", coordinates: [-67.5833, -19.0333] },
      { id: "carangas-oruro", name: "Carangas", coordinates: [-68.7167, -18.7000] },
      { id: "litoral", name: "Litoral", coordinates: [-67.1000, -19.5833] },
      { id: "poopo", name: "Poopó", coordinates: [-67.0333, -18.3833] },
      { id: "pantaleón-dalence", name: "Pantaleón Dalence", coordinates: [-66.8833, -18.1167] },
      { id: "ladislao-cabrera", name: "Ladislao Cabrera", coordinates: [-67.5000, -19.6167] },
      { id: "tomas-barron", name: "Tomás Barrón", coordinates: [-68.4167, -19.2833] },
      { id: "sud-carangas-oruro", name: "Sud Carangas", coordinates: [-68.6000, -18.0833] },
      { id: "sajama", name: "Sajama", coordinates: [-68.9333, -18.1167] },
      { id: "saucarí", name: "Saucarí", coordinates: [-67.3167, -18.8333] },
      { id: "sebastian-pagador", name: "Sebastián Pagador", coordinates: [-68.1167, -19.8333] },
      { id: "mejillones", name: "Mejillones", coordinates: [-67.1833, -19.2167] },
      { id: "nor-carangas", name: "Nor Carangas", coordinates: [-68.8167, -18.5000] },
      { id: "eduardo-avaroa", name: "Eduardo Avaroa", coordinates: [-67.8667, -20.4833] },
      { id: "atahuallpa", name: "Atahuallpa", coordinates: [-67.6333, -18.9167] }
    ]
  },
  {
    id: "potosi",
    name: "Potosí",
    coordinates: [-65.7530, -19.5836],
    provinces: [
      { id: "tomas-frias", name: "Tomás Frías", coordinates: [-65.7530, -19.5836] },
      { id: "rafael-bustillo", name: "Rafael Bustillo", coordinates: [-66.0333, -18.7833] },
      { id: "cornelio-saavedra", name: "Cornelio Saavedra", coordinates: [-65.4167, -18.8833] },
      { id: "chayanta", name: "Chayanta", coordinates: [-65.9167, -18.4833] },
      { id: "charcas", name: "Charcas", coordinates: [-65.7167, -18.7000] },
      { id: "alonso-de-ibañez", name: "Alonso de Ibáñez", coordinates: [-65.3167, -18.1833] },
      { id: "jose-maria-linares", name: "José María Linares", coordinates: [-65.8833, -21.3833] },
      { id: "antonio-quijarro", name: "Antonio Quijarro", coordinates: [-66.8333, -20.4667] },
      { id: "nor-chichas", name: "Nor Chichas", coordinates: [-66.3833, -21.1667] },
      { id: "sur-chichas", name: "Sur Chichas", coordinates: [-66.0833, -21.6833] },
      { id: "bolivar-potosi", name: "Bolívar", coordinates: [-65.3500, -17.9333] },
      { id: "daniel-campos", name: "Daniel Campos", coordinates: [-67.3333, -20.8333] },
      { id: "modesto-omiste", name: "Modesto Omiste", coordinates: [-66.8167, -21.2333] },
      { id: "sur-lipez", name: "Sur Lípez", coordinates: [-67.8333, -22.0833] },
      { id: "nor-lipez", name: "Nor Lípez", coordinates: [-68.1667, -21.5000] },
      { id: "enrique-baldivieso", name: "Enrique Baldivieso", coordinates: [-66.1833, -20.4167] }
    ]
  },
  {
    id: "chuquisaca",
    name: "Chuquisaca",
    coordinates: [-65.2627, -19.0333],
    provinces: [
      { id: "oropeza", name: "Oropeza", coordinates: [-65.2627, -19.0333] },
      { id: "azurduy", name: "Azurduy", coordinates: [-64.8167, -19.8333] },
      { id: "zudañez", name: "Zudáñez", coordinates: [-64.9333, -19.1167] },
      { id: "tomina", name: "Tomina", coordinates: [-64.2833, -19.1833] },
      { id: "hernando-siles", name: "Hernando Siles", coordinates: [-64.1167, -19.5833] },
      { id: "yamparaez", name: "Yamparáez", coordinates: [-65.2167, -19.4167] },
      { id: "nor-cinti", name: "Nor Cinti", coordinates: [-64.8833, -20.8167] },
      { id: "sur-cinti", name: "Sur Cinti", coordinates: [-64.7167, -21.2333] },
      { id: "belisario-boeto", name: "Belisario Boeto", coordinates: [-63.9167, -20.4167] },
      { id: "luis-calvo", name: "Luis Calvo", coordinates: [-63.2833, -20.8833] }
    ]
  },
  {
    id: "tarija",
    name: "Tarija",
    coordinates: [-64.7347, -21.5355],
    provinces: [
      { id: "cercado-tarija", name: "Cercado", coordinates: [-64.7347, -21.5355] },
      { id: "arce", name: "Arce", coordinates: [-64.3833, -21.9833] },
      { id: "gran-chaco", name: "Gran Chaco", coordinates: [-63.6833, -21.2833] },
      { id: "aviles", name: "Avilés", coordinates: [-64.9333, -21.7500] },
      { id: "mendez", name: "Méndez", coordinates: [-64.6167, -21.2167] },
      { id: "o-connor", name: "O'Connor", coordinates: [-64.1833, -21.8833] }
    ]
  },
  {
    id: "beni",
    name: "Beni",
    coordinates: [-64.9012, -14.8333],
    provinces: [
      { id: "cercado-beni", name: "Cercado", coordinates: [-64.9012, -14.8333] },
      { id: "vaca-diez", name: "Vaca Díez", coordinates: [-65.4167, -11.4167] },
      { id: "jose-ballivian", name: "José Ballivián", coordinates: [-66.9000, -14.8333] },
      { id: "yacuma", name: "Yacuma", coordinates: [-66.0833, -15.1833] },
      { id: "moxos", name: "Moxos", coordinates: [-65.4000, -14.7167] },
      { id: "marbán", name: "Marbán", coordinates: [-64.9167, -15.2500] },
      { id: "mamoré", name: "Mamoré", coordinates: [-65.3500, -12.9167] },
      { id: "itenez", name: "Iténez", coordinates: [-64.0000, -13.2500] }
    ]
  },
  {
    id: "pando",
    name: "Pando",
    coordinates: [-67.5297, -11.0267],
    provinces: [
      { id: "nicolas-suarez", name: "Nicolás Suárez", coordinates: [-67.5297, -11.0267] },
      { id: "manuripi", name: "Manuripi", coordinates: [-68.7500, -12.2833] },
      { id: "madre-de-dios", name: "Madre de Dios", coordinates: [-68.7833, -12.6000] },
      { id: "abuná", name: "Abuná", coordinates: [-67.4167, -10.4167] },
      { id: "federico-román", name: "Federico Román", coordinates: [-68.3333, -11.8333] }
    ]
  }
];