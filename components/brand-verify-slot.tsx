import { buildBrandVerifyMailtoHref } from "@/lib/brand-verify-slot"

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
      className="flex min-h-[132px] w-full flex-col gap-3 rounded-2xl border border-dashed border-slot-border bg-transparent px-4 py-3 sm:min-h-[72px] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
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
          <a
            href={mailtoHref}
            className="brand-verify-slot__cta inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-[14px] border border-slot-border bg-background px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto sm:min-w-11"
          >
            Pedí tu logo verificado
          </a>
        </>
      ) : null}
    </aside>
  )
}
