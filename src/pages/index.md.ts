import type { APIRoute } from 'astro'
import { getHomeMarkdown } from '@/lib/site-markdown'

export const prerender = true

export const GET: APIRoute = () =>
  new Response(getHomeMarkdown(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
