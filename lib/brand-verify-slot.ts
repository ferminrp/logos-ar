export const BRAND_VERIFY_MAIL = "marcas@loguitos.app"

export function isBrandVerifySlotEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SLOT_VERIFY !== "off"
}

export function buildBrandVerifyMailtoHref(brandName: string): string {
  const subject = encodeURIComponent(`Logo verificado - ${brandName}`)
  return `mailto:${BRAND_VERIFY_MAIL}?subject=${subject}`
}

/** Reserved shell height: 132px mobile (≤640px), 72px desktop — SSR min-height for CLS. */
export const brandVerifySlotShellClassName =
  "flex min-h-[132px] w-full flex-col gap-3 rounded-2xl border border-dashed border-slot-border bg-transparent px-4 py-3 sm:min-h-[72px] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
