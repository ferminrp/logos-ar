import { AppLink } from '@/components/app-link'
import {
  isSponsorSlotEnabled,
  resolveSponsorSlotContent,
} from '@/lib/sponsor-slot'

export interface SponsorSlotProps {
  slug: string
  categoryId: string
}

/**
 * Opción A: reserved-height sponsor slot below intro copy, above entity card.
 * SSR min-height: 148px mobile (≤640px), 88px desktop — see `lg-slot` in globals.css.
 */
export function SponsorSlot({ slug, categoryId }: SponsorSlotProps) {
  const enabled = isSponsorSlotEnabled()
  const resolved = enabled
    ? resolveSponsorSlotContent({ slug, categoryId })
    : null

  const shell = 'lg-slot min-h-[148px] sm:min-h-[88px]'

  if (!enabled) {
    return (
      <aside className={`${shell} lg-slot--empty`} aria-hidden="true" />
    )
  }

  if (resolved?.kind === 'lemon') {
    const { campaign } = resolved
    return (
      <aside className={shell} aria-label="Contenido patrocinado">
        <div className="lg-slot__mark" aria-hidden="true">
          {campaign.advertiserInitials}
        </div>
        <div className="lg-slot__body">
          <p className="lg-slot__tag">Patrocinado · Enlace de afiliado</p>
          <p className="lg-slot__title">{campaign.headline}</p>
          <p className="lg-slot__subline">{campaign.subline}</p>
        </div>
        <a
          className="lg-slot__cta"
          href={campaign.href}
          rel="sponsored noopener"
          target="_blank"
        >
          Ver promo ↗
        </a>
      </aside>
    )
  }

  if (resolved?.kind === 'house') {
    return (
      <aside className={shell} aria-label="Contenido patrocinado">
        <div className="lg-slot__mark" aria-hidden="true">
          API
        </div>
        <div className="lg-slot__body lg-slot__body--house">
          <p className="lg-slot__tag">Loguitos</p>
          <p className="lg-slot__title">
            ¿Querés los logos por API en tu producto?
          </p>
          <p className="lg-slot__subline">
            Consultá la documentación del catálogo JSON y los ejemplos de uso.
          </p>
        </div>
        <AppLink className="lg-slot__cta" href="/docs">
          Ver API ↗
        </AppLink>
      </aside>
    )
  }

  return (
    <aside className={`${shell} lg-slot--empty`} aria-hidden="true" />
  )
}
