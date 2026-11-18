import type { APIRoute } from 'astro'
import { mcpGet, mcpOptions, mcpPost } from '@/lib/mcp/route'

export const prerender = false

export const GET: APIRoute = (context) => mcpGet(context)

export const POST: APIRoute = (context) => mcpPost(context)

export const OPTIONS: APIRoute = () => mcpOptions()