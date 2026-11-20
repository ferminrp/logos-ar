import type { APIRoute } from 'astro'
import { categories } from '@/lib/logos-data'
import { getCategoryMarkdown } from '@/lib/site-markdown'

export const prerender = true

export function getStaticPaths() {
  return categories.map((category) => ({ params: { slug: category.id } }))
}

export const GET: APIRoute = ({ params }) => {
  const markdown = params.slug ? getCategoryMarkdown(params.slug) : null
  if (!markdown) return new Response('Not Found', { status: 404 })
  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
