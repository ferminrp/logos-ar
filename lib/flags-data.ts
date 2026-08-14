import flagsDataset from "@/data/flags-dataset.json"

export interface Flag {
  code: string
  name: string
  svgUrl: string
  categoryId: string
  categoryName: string
}

export const FLAGS_CATEGORY = {
  id: "banderas",
  name: "Banderas",
  description: "Banderas de países y regiones en SVG (relación 3:2)",
  seoTopEntities: ["Argentina", "Estados Unidos", "Unión Europea"] as [
    string,
    string,
    string,
  ],
  seoIntro:
    "Banderas de países y regiones en SVG desde country-flag-icons. Argentina, Estados Unidos, Brasil, Unión Europea y más de 260 códigos ISO y regionales. Copiá la URL del SVG o un snippet listo para usar en tu web.",
}

export const flags: Flag[] = flagsDataset.items

export const flagsDatasetVersion = flagsDataset.version
export const flagsTotalCount = flagsDataset.totalItems
