import type { APIRoute } from 'astro'
import { handleLogosGet, handlePublicApiOptions } from '@/lib/logos-api'

export const prerender = false

export const GET: APIRoute = ({ request }) => handleLogosGet(request)

export const OPTIONS: APIRoute = () => handlePublicApiOptions()
