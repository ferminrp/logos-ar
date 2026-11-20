import type { APIRoute } from 'astro'
import { getAllEntitySlugs } from '@/lib/entity-index'
import { GONE_LOGO_SLUGS } from '@/lib/gone-logo-slugs'
import { getLogoMarkdown } from '@/lib/site-markdown'

export const prerender = true

export function getStaticPaths() {
  return getAllEntitySlugs()
    .filter((slug) => !GONE_LOGO_SLUGS.has(slug))
    .map((slug) => ({ params: { slug } }))
}

export const GET: APIRoute = ({ params }) => {
  const markdown = params.slug ? getLogoMarkdown(params.slug) : null
  if (!markdown) return new Response('Not Found', { status: 404 })
  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
