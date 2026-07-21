import {
  Building2,
  Car,
  CandlestickChart,
  Code,
  Fuel,
  Landmark,
  Lightbulb,
  Newspaper,
  Plane,
  Shield,
  Shirt,
  Store,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Bike,
  type LucideIcon,
} from "lucide-react"

export const categoryIcons: Record<string, LucideIcon> = {
  bancos: Building2,
  fintechs: Wallet,
  alycs: TrendingUp,
  acciones: CandlestickChart,
  "entes-estatales": Landmark,
  retail: Store,
  medios: Newspaper,
  automotrices: Car,
  alimentos: UtensilsCrossed,
  combustibles: Fuel,
  seguros: Shield,
  indumentaria: Shirt,
  gastronomia: Bike,
  turismo: Plane,
  energia: Lightbulb,
  "indie-projects": Code,
}

export function getCategoryIcon(categoryId: string): LucideIcon | null {
  return categoryIcons[categoryId] ?? null
}
