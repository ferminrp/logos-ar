import type { APIRoute } from 'astro'
import { handleLogosGet } from '@/lib/logos-api'

export const prerender = false

export const GET: APIRoute = ({ request }) => handleLogosGet(request)
