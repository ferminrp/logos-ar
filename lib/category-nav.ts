import { FLAGS_CATEGORY } from "@/lib/flags-data"
import { categories } from "@/lib/logos-data"

export const categoryNavItems = [
  ...categories.map(({ id, name }) => ({ id, name })),
  { id: FLAGS_CATEGORY.id, name: FLAGS_CATEGORY.name },
]
