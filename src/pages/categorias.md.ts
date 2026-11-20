import type { APIRoute } from 'astro'
import { getCategoriasMarkdown } from '@/lib/site-markdown'

export const prerender = true

export const GET: APIRoute = () =>
  new Response(getCategoriasMarkdown(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
