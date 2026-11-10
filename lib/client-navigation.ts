'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'

function subscribeNavigation(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  window.addEventListener('loguitos:navigation', onStoreChange)
  return () => {
    window.removeEventListener('popstate', onStoreChange)
    window.removeEventListener('loguitos:navigation', onStoreChange)
  }
}

function getPathnameSnapshot() {
  return window.location.pathname
}

function getSearchSnapshot() {
  return window.location.search
}

export function usePathname(): string {
  return useSyncExternalStore(
    subscribeNavigation,
    getPathnameSnapshot,
    () => '/',
  )
}

export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(
    subscribeNavigation,
    getSearchSnapshot,
    () => '',
  )
  return useMemo(() => new URLSearchParams(search), [search])
}

export function useRouter() {
  const navigate = useCallback((url: string, replace = false) => {
    const target = new URL(url, window.location.origin)
    const current = `${window.location.pathname}${window.location.search}`
    const next = `${target.pathname}${target.search}`

    if (next !== current) {
      if (replace) {
        window.location.replace(next)
      } else {
        window.location.assign(next)
      }
      return
    }

    window.dispatchEvent(new Event('loguitos:navigation'))
  }, [])

  return useMemo(
    () => ({
      push: (url: string) => navigate(url, false),
      replace: (url: string) => navigate(url, true),
    }),
    [navigate],
  )
}
