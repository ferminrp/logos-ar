import {
  brandVerifyCtaClassName,
  brandVerifySlotShellClassName,
  buildBrandVerifyMailtoHref,
} from "@/lib/brand-verify-slot"

export interface BrandVerifySlotProps {
  brandName: string
  /** House ad copy; omit body content but keep reserved height when false. */
  showHouseAd?: boolean
}

export function BrandVerifySlot({
  brandName,
  showHouseAd = true,
}: BrandVerifySlotProps) {
  const mailtoHref = buildBrandVerifyMailtoHref(brandName)

  return (
    <aside
      className={brandVerifySlotShellClassName}
      aria-label="Para equipos de marca"
    >
      {showHouseAd ? (
        <>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold leading-5 text-foreground">
              ¿Trabajás en {brandName}?
            </p>
            <p className="text-sm leading-5 text-slot-muted">
              Mandanos tu logo oficial en SVG y lo marcamos como{" "}
              <strong className="font-semibold text-foreground">
                Verificado por la marca
              </strong>
              , con link a tu brand kit.
            </p>
          </div>
          <a href={mailtoHref} className={brandVerifyCtaClassName}>
            Pedí tu logo verificado
          </a>
        </>
      ) : null}
    </aside>
  )
}
