import type { AnchorHTMLAttributes, ReactNode } from 'react'

type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children?: ReactNode
}

export function AppLink({ href, children, ...rest }: AppLinkProps) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}
