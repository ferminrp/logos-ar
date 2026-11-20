import type { APIRoute } from 'astro'
import { getAllGuideSlugs } from '@/lib/guide-data'
import { getGuideMarkdown } from '@/lib/site-markdown'

export const prerender = true

export function getStaticPaths() {
  return getAllGuideSlugs().map((slug) => ({ params: { slug } }))
}

export const GET: APIRoute = ({ params }) => {
  const markdown = params.slug ? getGuideMarkdown(params.slug) : null
  if (!markdown) return new Response('Not Found', { status: 404 })
  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
