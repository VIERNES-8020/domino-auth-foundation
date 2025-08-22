export interface Department {
  id: string;
  name: string;
  provinces: Province[];
}

export interface Province {
  id: string;
  name: string;
}

export const boliviaDepartments: Department[] = [
  {
    id: "la-paz",
    name: "La Paz",
    provinces: [
      { id: "murillo", name: "Pedro Domingo Murillo" },
      { id: "omasuyos", name: "Omasuyos" },
      { id: "pacajes", name: "Pacajes" },
      { id: "camacho", name: "Eliodoro Camacho" },
      { id: "muñecas", name: "Franz Tamayo" },
      { id: "larecaja", name: "Larecaja" },
      { id: "bautista-saavedra", name: "Bautista Saavedra" },
      { id: "nor-yungas", name: "Nor Yungas" },
      { id: "sud-yungas", name: "Sud Yungas" },
      { id: "inquisivi", name: "Inquisivi" },
      { id: "loayza", name: "Loayza" },
      { id: "aroma", name: "Aroma" },
      { id: "ingavi", name: "Ingavi" },
      { id: "los-andes", name: "Los Andes" },
      { id: "gualberto-villarroel", name: "Gualberto Villarroel" },
      { id: "jose-ramon-loayza", name: "José Ramón Loayza" },
      { id: "abel-iturralde", name: "Abel Iturralde" },
      { id: "general-jose-ballivian", name: "General José Ballivián" },
      { id: "sud-carangas", name: "Sud Carangas" },
      { id: "carangas", name: "Carangas" }
    ]
  },
  {
    id: "cochabamba",
    name: "Cochabamba",
    provinces: [
      { id: "cercado", name: "Cercado" },
      { id: "ayopaya", name: "Ayopaya" },
      { id: "arque", name: "Arque" },
      { id: "capinota", name: "Capinota" },
      { id: "quillacollo", name: "Quillacollo" },
      { id: "tapacari", name: "Tapacarí" },
      { id: "jordan", name: "Jordán" },
      { id: "punata", name: "Punata" },
      { id: "tiraque", name: "Tiraque" },
      { id: "carrasco", name: "Carrasco" },
      { id: "chapare", name: "Chapare" },
      { id: "mizque", name: "Mizque" },
      { id: "arani", name: "Arani" },
      { id: "bolivar", name: "Bolívar" },
      { id: "campero", name: "Campero" },
      { id: "esteban-arce", name: "Esteban Arce" }
    ]
  },
  {
    id: "santa-cruz",
    name: "Santa Cruz",
    provinces: [
      { id: "andres-ibanez", name: "Andrés Ibáñez" },
      { id: "warnes", name: "Warnes" },
      { id: "velasco", name: "Velasco" },
      { id: "ichilo", name: "Ichilo" },
      { id: "chiquitos", name: "Chiquitos" },
      { id: "sara", name: "Sara" },
      { id: "cordillera", name: "Cordillera" },
      { id: "vallegrande", name: "Vallegrande" },
      { id: "florida", name: "Florida" },
      { id: "caballero", name: "Caballero" },
      { id: "sandoval", name: "Sandoval" },
      { id: "german-busch", name: "Germán Busch" },
      { id: "guarayos", name: "Guarayos" },
      { id: "angel-sandoval", name: "Ángel Sandoval" },
      { id: "nuflo-de-chavez", name: "Ñuflo de Chávez" }
    ]
  },
  {
    id: "oruro",
    name: "Oruro",
    provinces: [
      { id: "cercado-oruro", name: "Cercado" },
      { id: "avaroa", name: "Avaroa" },
      { id: "carangas-oruro", name: "Carangas" },
      { id: "litoral", name: "Litoral" },
      { id: "poopo", name: "Poopó" },
      { id: "pantaleón-dalence", name: "Pantaleón Dalence" },
      { id: "ladislao-cabrera", name: "Ladislao Cabrera" },
      { id: "tomas-barron", name: "Tomás Barrón" },
      { id: "sud-carangas-oruro", name: "Sud Carangas" },
      { id: "sajama", name: "Sajama" },
      { id: "saucarí", name: "Saucarí" },
      { id: "sebastian-pagador", name: "Sebastián Pagador" },
      { id: "mejillones", name: "Mejillones" },
      { id: "nor-carangas", name: "Nor Carangas" },
      { id: "eduardo-avaroa", name: "Eduardo Avaroa" },
      { id: "atahuallpa", name: "Atahuallpa" }
    ]
  },
  {
    id: "potosi",
    name: "Potosí",
    provinces: [
      { id: "tomas-frias", name: "Tomás Frías" },
      { id: "rafael-bustillo", name: "Rafael Bustillo" },
      { id: "cornelio-saavedra", name: "Cornelio Saavedra" },
      { id: "chayanta", name: "Chayanta" },
      { id: "charcas", name: "Charcas" },
      { id: "alonso-de-ibañez", name: "Alonso de Ibáñez" },
      { id: "jose-maria-linares", name: "José María Linares" },
      { id: "antonio-quijarro", name: "Antonio Quijarro" },
      { id: "nor-chichas", name: "Nor Chichas" },
      { id: "sur-chichas", name: "Sur Chichas" },
      { id: "bolivar-potosi", name: "Bolívar" },
      { id: "daniel-campos", name: "Daniel Campos" },
      { id: "modesto-omiste", name: "Modesto Omiste" },
      { id: "sur-lipez", name: "Sur Lípez" },
      { id: "nor-lipez", name: "Nor Lípez" },
      { id: "enrique-baldivieso", name: "Enrique Baldivieso" }
    ]
  },
  {
    id: "chuquisaca",
    name: "Chuquisaca",
    provinces: [
      { id: "oropeza", name: "Oropeza" },
      { id: "azurduy", name: "Azurduy" },
      { id: "zudañez", name: "Zudáñez" },
      { id: "tomina", name: "Tomina" },
      { id: "hernando-siles", name: "Hernando Siles" },
      { id: "yamparaez", name: "Yamparáez" },
      { id: "nor-cinti", name: "Nor Cinti" },
      { id: "sur-cinti", name: "Sur Cinti" },
      { id: "belisario-boeto", name: "Belisario Boeto" },
      { id: "luis-calvo", name: "Luis Calvo" }
    ]
  },
  {
    id: "tarija",
    name: "Tarija",
    provinces: [
      { id: "cercado-tarija", name: "Cercado" },
      { id: "arce", name: "Arce" },
      { id: "gran-chaco", name: "Gran Chaco" },
      { id: "aviles", name: "Avilés" },
      { id: "mendez", name: "Méndez" },
      { id: "o-connor", name: "O'Connor" }
    ]
  },
  {
    id: "beni",
    name: "Beni",
    provinces: [
      { id: "cercado-beni", name: "Cercado" },
      { id: "vaca-diez", name: "Vaca Díez" },
      { id: "jose-ballivian", name: "José Ballivián" },
      { id: "yacuma", name: "Yacuma" },
      { id: "moxos", name: "Moxos" },
      { id: "marbán", name: "Marbán" },
      { id: "mamoré", name: "Mamoré" },
      { id: "itenez", name: "Iténez" }
    ]
  },
  {
    id: "pando",
    name: "Pando",
    provinces: [
      { id: "nicolas-suarez", name: "Nicolás Suárez" },
      { id: "manuripi", name: "Manuripi" },
      { id: "madre-de-dios", name: "Madre de Dios" },
      { id: "abuná", name: "Abuná" },
      { id: "federico-román", name: "Federico Román" }
    ]
  }
];