import type { APIRoute } from 'astro'
import { getDocsMarkdown } from '@/lib/site-markdown'

export const prerender = true

export const GET: APIRoute = () =>
  new Response(getDocsMarkdown(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
