import { getEntitySlugRedirects } from "./entity-index.ts"

export type PermanentRedirect = {
  source: string
  destination: string
  permanent: true
}

const CATEGORY_REDIRECTS: PermanentRedirect[] = [
  {
    source: "/categoria/delivery",
    destination: "/categoria/gastronomia",
    permanent: true,
  },
]

export function getPermanentRedirects(): PermanentRedirect[] {
  return [...getEntitySlugRedirects(), ...CATEGORY_REDIRECTS]
}
