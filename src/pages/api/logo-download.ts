import type { APIRoute } from 'astro'
import { handleLogoDownloadGet } from '@/lib/logo-download-api'

export const prerender = false

export const GET: APIRoute = ({ request }) => handleLogoDownloadGet(request)
