export interface Entity {
  id: number
  name: string
  domain: string
}

export interface Category {
  id: string
  name: string
  description: string
  entities: Entity[]
}

export const categories: Category[] = [
  {
    id: "bancos",
    name: "Bancos",
    description: "Bancos tradicionales y públicos de Argentina",
    entities: [
      { id: 1, name: "Banco de la Nación Argentina", domain: "bna.com.ar" },
      { id: 2, name: "Banco Santander Río", domain: "santander.com.ar" },
      { id: 3, name: "BBVA Argentina", domain: "bbva.com.ar" },
      { id: 4, name: "Banco Galicia", domain: "www.galicia.ar" },
      { id: 5, name: "Banco Macro", domain: "macro.com.ar" },
      { id: 6, name: "Banco Provincia (Bs. As.)", domain: "bancoprovincia.com.ar" },
      { id: 7, name: "Banco Ciudad", domain: "bancociudad.com.ar" },
      { id: 8, name: "Banco Patagonia", domain: "bancopatagonia.com.ar" },
      { id: 9, name: "Banco Hipotecario", domain: "hipotecario.com.ar" },
      { id: 10, name: "Banco Supervielle", domain: "www.supervielle.com.ar" },
      { id: 12, name: "Banco Credicoop", domain: "www.bancocredicoop.coop" },
      { id: 13, name: "Banco Comafi", domain: "www.comafi.com.ar" },
      { id: 16, name: "Banco Piano", domain: "www.bancopiano.com.ar" },
      { id: 17, name: "Banco de Corrientes (BANCOR)", domain: "bancor.com.ar" },
    ],
  },
  {
    id: "fintechs",
    name: "Fintechs",
    description: "Billeteras digitales, neobancos y apps financieras",
    entities: [
      { id: 21, name: "Ualá", domain: "uala.com.ar" },
      { id: 22, name: "Mercado Pago", domain: "mercadopago.com.ar" },
      { id: 23, name: "Naranja X", domain: "naranjax.com" },
      { id: 24, name: "Brubank", domain: "brubank.com" },
      { id: 25, name: "Belo", domain: "belo.app" },
      { id: 26, name: "Lemon Cash", domain: "lemon.me" },
      { id: 27, name: "Personal Pay", domain: "www.personal.com.ar" },
      { id: 28, name: "Prex", domain: "prex.com.ar" },
      { id: 29, name: "ARQ", domain: "www.arqfinance.com" },
      { id: 30, name: "Fiwind", domain: "fiwind.io" },
      { id: 31, name: "Ripio", domain: "ripio.com" },
      { id: 32, name: "Buenbit", domain: "buenbit.com" },
      { id: 33, name: "Uilo Bank (ex Wilobank)", domain: "uilo.com.ar" },
      { id: 34, name: "Carrefour Banco", domain: "www.bancodeserviciosfinancieros.com.ar" },
      { id: 35, name: "Openbank", domain: "openbank.com.ar" },
      { id: 37, name: "Cocos", domain: "cocos.capital" },
      { id: 38, name: "Claro Pay", domain: "claropay.com.ar" },
      { id: 39, name: "Astropay", domain: "astropay.com" },
      { id: 63, name: "MODO", domain: "www.modo.com.ar" },
      { id: 64, name: "Binance", domain: "binance.com" },
      { id: 66, name: "Nexo", domain: "nexo.com" },
      { id: 67, name: "OKX", domain: "okx.com" },
      { id: 68, name: "Kraken", domain: "kraken.com" },
      { id: 69, name: "Coinbase", domain: "coinbase.com" },
    ],
  },
  {
    id: "alycs",
    name: "ALyCs",
    description: "Agentes de Liquidación y Compensación (brokers)",
    entities: [
      { id: 41, name: "Invertir Online (IOL)", domain: "invertironline.com" },
      { id: 42, name: "Balanz", domain: "balanz.com" },
      { id: 43, name: "Allaria", domain: "allaria.com.ar" },
      { id: 44, name: "Bull Market Brokers", domain: "bullmarketbrokers.com" },
      { id: 46, name: "IEB (Invertir en Bolsa)", domain: "www.iebmas.com.ar" },
      { id: 47, name: "Cohen Aliados", domain: "cohen.com.ar" },
      { id: 49, name: "SBS Trading", domain: "www.gruposbs.com" },
    ],
  },
  {
    id: "entes-estatales",
    name: "Entes estatales",
    description: "Organismos públicos con servicios fiscales y tributarios",
    entities: [
      { id: 61, name: "ARCA (ex AFIP)", domain: "www.afip.gob.ar" },
      { id: 62, name: "AGIP", domain: "www.agip.gob.ar" },
    ],
  },
  {
    id: "retail",
    name: "Retail",
    description: "Comercios y cadenas de consumo masivo en Argentina",
    entities: [
      { id: 81, name: "Mercado Libre", domain: "mercadolibre.com.ar" },
      { id: 82, name: "Carrefour", domain: "carrefour.com.ar" },
      { id: 83, name: "Frávega", domain: "fravega.com" },
      { id: 84, name: "Coto", domain: "coto.com.ar" },
      { id: 85, name: "Jumbo", domain: "jumbo.com.ar" },
      { id: 86, name: "Disco", domain: "disco.com.ar" },
      { id: 87, name: "Vea", domain: "vea.com.ar" },
      { id: 88, name: "La Anónima", domain: "laanonima.com.ar" },
      { id: 89, name: "Supermercados DIA", domain: "supermercadosdia.com.ar" },
      { id: 90, name: "Hiper Libertad", domain: "hiperlibertad.com.ar" },
      { id: 91, name: "Makro", domain: "makro.com.ar" },
      { id: 92, name: "Farmacity", domain: "farmacity.com.ar" },
      { id: 93, name: "Easy", domain: "easy.com.ar" },
      { id: 94, name: "ChangoMas", domain: "changomas.com.ar" },
      { id: 95, name: "Garbarino", domain: "garbarino.com" },
    ],
  },
  {
    id: "medios",
    name: "Medios",
    description: "Medios periodísticos y portales de noticias de Argentina",
    entities: [
      { id: 101, name: "Infobae", domain: "infobae.com" },
      { id: 102, name: "La Nación", domain: "lanacion.com.ar" },
      { id: 103, name: "TN (Todo Noticias)", domain: "tn.com.ar" },
      { id: 104, name: "Clarín", domain: "clarin.com" },
      { id: 105, name: "El Cronista", domain: "cronista.com" },
      { id: 106, name: "Página/12", domain: "pagina12.com.ar" },
      { id: 107, name: "Perfil", domain: "perfil.com" },
      { id: 108, name: "Ámbito Financiero", domain: "ambito.com" },
      { id: 109, name: "El Destape", domain: "www.eldestapeweb.com" },
      { id: 110, name: "La Voz del Interior", domain: "lavoz.com.ar" },
      { id: 111, name: "La Gaceta (Tucumán)", domain: "lagaceta.com.ar" },
      { id: 112, name: "Diario UNO", domain: "diariouno.com.ar" },
      { id: 113, name: "Crónica", domain: "cronica.com.ar" },
      { id: 114, name: "Los Andes (Mendoza)", domain: "losandes.com.ar" },
      { id: 115, name: "La Capital", domain: "www.lacapital.com.ar" },
    ],
  },
  {
    id: "automotrices",
    name: "Automotrices",
    description: "Marcas automotrices con presencia en Argentina",
    entities: [
      { id: 121, name: "Toyota", domain: "toyota.com.ar" },
      { id: 122, name: "Volkswagen", domain: "volkswagen.com.ar" },
      { id: 123, name: "Fiat", domain: "fiat.com.ar" },
      { id: 124, name: "Renault", domain: "renault.com.ar" },
      { id: 125, name: "Peugeot", domain: "peugeot.com.ar" },
      { id: 126, name: "Ford", domain: "ford.com.ar" },
      { id: 127, name: "Chevrolet", domain: "chevrolet.com.ar" },
      { id: 128, name: "Citroën", domain: "citroen.com.ar" },
      { id: 129, name: "Jeep", domain: "jeep.com.ar" },
      { id: 130, name: "Nissan", domain: "nissan.com.ar" },
      { id: 131, name: "Hyundai", domain: "hyundai.com.ar" },
      { id: 132, name: "Honda", domain: "honda.com.ar" },
      { id: 133, name: "Kia", domain: "www.kia.com.ar" },
      { id: 134, name: "Chery", domain: "chery.com.ar" },
      { id: 135, name: "BYD", domain: "byd.com.ar" },
      { id: 136, name: "Suzuki", domain: "suzuki.com.ar" },
      { id: 137, name: "Mercedes-Benz", domain: "mercedes-benz.com.ar" },
      { id: 138, name: "BMW", domain: "bmw.com.ar" },
      { id: 139, name: "Audi", domain: "audi.com.ar" },
    ],
  },
  {
    id: "alimentos",
    name: "Alimentos",
    description: "Empresas de alimentos y bebidas en Argentina",
    entities: [
      { id: 141, name: "Arcor", domain: "arcor.com" },
      { id: 142, name: "Molinos Río de la Plata", domain: "molinos.com.ar" },
      { id: 143, name: "La Serenísima (Mastellone)", domain: "laserenisima.com.ar" },
      { id: 146, name: "Nestlé", domain: "nestle.com.ar" },
      { id: 147, name: "Unilever", domain: "unilever.com.ar" },
      { id: 148, name: "Mondelez", domain: "mondelezinternational.com" },
      { id: 149, name: "Grupo Bimbo", domain: "grupobimbo.com.ar" },
      { id: 152, name: "Cervecería Quilmes", domain: "quilmes.com.ar" },
      { id: 153, name: "Havanna", domain: "www.tienda.havanna.com.ar" },
      { id: 155, name: "Molino Cañuelas", domain: "molinocanuelas.com" },
      { id: 156, name: "Ledesma", domain: "ledesma.com.ar" },
    ],
  },
  {
    id: "combustibles",
    name: "Combustibles",
    description: "Empresas de combustibles y estaciones de servicio",
    entities: [
      { id: 161, name: "YPF", domain: "ypf.com" },
      { id: 162, name: "Shell", domain: "shell.com.ar" },
      { id: 163, name: "AXION energy", domain: "axionenergy.com" },
      { id: 164, name: "Esso", domain: "esso.com" },
      { id: 165, name: "Gulf", domain: "gulfcombustibles.com" },
      { id: 166, name: "Puma Energy", domain: "pumaenergyarg.com.ar" },
      { id: 167, name: "Oil Combustibles", domain: "oilcombustibles.com" },
    ],
  },
  {
    id: "seguros",
    name: "Seguros",
    description: "Compañías de seguros con operación en Argentina",
    entities: [
      { id: 171, name: "Federación Patronal Seguros", domain: "fedpat.com.ar" },
      { id: 172, name: "Sancor Seguros", domain: "sancorseguros.com.ar" },
      { id: 173, name: "La Segunda Seguros", domain: "lasegunda.com.ar" },
      { id: 174, name: "San Cristóbal Seguros", domain: "sancristobal.com.ar" },
      { id: 175, name: "La Caja Seguros", domain: "lacaja.com.ar" },
      { id: 176, name: "Mapfre", domain: "mapfre.com.ar" },
      { id: 177, name: "Allianz", domain: "allianz.com.ar" },
      { id: 178, name: "Provincia Seguros", domain: "provinciaseguros.com.ar" },
    ],
  },
  {
    id: "indumentaria",
    name: "Indumentaria",
    description: "Marcas y cadenas de indumentaria en Argentina",
    entities: [
      { id: 181, name: "Rapsodia", domain: "rapsodia.com.ar" },
      { id: 182, name: "Grimoldi", domain: "grimoldi.com" },
      { id: 183, name: "Cheeky", domain: "cheeky.com.ar" },
      { id: 184, name: "Mimo", domain: "mimo.com.ar" },
      { id: 186, name: "Markova", domain: "markova.com" },
      { id: 187, name: "Maria Cher", domain: "maria-cher.com.ar" },
    ],
  },
  {
    id: "delivery",
    name: "Delivery",
    description: "Apps y plataformas de delivery",
    entities: [
      { id: 191, name: "PedidosYa", domain: "pedidosya.com.ar" },
      { id: 192, name: "Rappi", domain: "rappi.com.ar" },
      { id: 193, name: "Uber Eats", domain: "ubereats.com" },
    ],
  },
  {
    id: "turismo",
    name: "Turismo",
    description: "Hotelería, viajes y paquetes turísticos",
    entities: [
      { id: 201, name: "Aerolíneas Argentinas", domain: "aerolineas.com.ar" },
      { id: 202, name: "Flybondi", domain: "flybondi.com" },
      { id: 203, name: "JetSMART", domain: "jetsmart.com" },
      { id: 204, name: "LATAM", domain: "latam.com" },
      { id: 205, name: "Despegar", domain: "despegar.com.ar" },
      { id: 206, name: "Almundo", domain: "almundo.com.ar" },
      { id: 207, name: "Booking.com", domain: "booking.com" },
      { id: 208, name: "Airbnb", domain: "airbnb.com.ar" },
      { id: 209, name: "Hilton", domain: "hilton.com" },
      { id: 210, name: "Accor (Ibis, Novotel, etc.)", domain: "all.accor.com" },
      { id: 211, name: "Wyndham / Howard Johnson", domain: "wyndhamhotels.com" },
      { id: 212, name: "Hertz", domain: "hertz.com.ar" },
      { id: 213, name: "Avis", domain: "avis.com.ar" },
      { id: 214, name: "Dollar Rent a Car", domain: "dollar.com" },
    ],
  },
  {
    id: "energia",
    name: "Energía",
    description: "Distribuidoras y empresas del sector energético",
    entities: [
      { id: 211, name: "Edenor", domain: "edenor.com" },
      { id: 213, name: "Camuzzi Gas", domain: "camuzzigas.com" },
      { id: 214, name: "Metrogas", domain: "metrogas.com.ar" },
      { id: 215, name: "Pampa Energía", domain: "pampaenergia.com" },
    ],
  },
]

export function getGoogleFaviconUrl(domain: string, size: number = 128): string {
  return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=${size}`
}

export function getDuckDuckGoFaviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

export function getGoogleCurl(domain: string, size: number = 128): string {
  return `curl "${getGoogleFaviconUrl(domain, size)}" -o ${domain.replace(/\./g, "_")}_favicon.png`
}

export function getDuckDuckGoCurl(domain: string): string {
  return `curl "${getDuckDuckGoFaviconUrl(domain)}" -o ${domain.replace(/\./g, "_")}_favicon.ico`
}
