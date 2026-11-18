import type { APIContext } from 'astro'
import { env } from 'cloudflare:workers'
import { scheduleMcpToolCallEvent, type Ga4Env } from '@/lib/ga4-mp'
import {
  handleMcpGet,
  handleMcpOptions,
  handleMcpPost,
} from '@/lib/mcp/http'
import { resolveMcpPublicSiteUrl } from '@/lib/mcp/public-site-url'

function mcpSiteUrl(context: APIContext): string {
  return resolveMcpPublicSiteUrl(
    context.request,
    env as unknown as Record<string, unknown>,
  )
}

function ga4Env(): Ga4Env {
  return { GA4_API_SECRET: env.GA4_API_SECRET }
}

export async function mcpGet(context: APIContext): Promise<Response> {
  return handleMcpGet(context.request, mcpSiteUrl(context))
}

export async function mcpPost(context: APIContext): Promise<Response> {
  const siteUrl = mcpSiteUrl(context)
  const ctx = context.locals.cfContext

  return handleMcpPost(context.request, {
    siteUrl,
    onToolCall: (toolName) => {
      scheduleMcpToolCallEvent(context.request, ctx, ga4Env(), toolName)
    },
  })
}

export function mcpOptions(): Response {
  return handleMcpOptions()
}