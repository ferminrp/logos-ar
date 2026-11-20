import {
  maybeServeHostedLogo,
  type HostedLogoWorkerEnv,
} from '../../lib/worker-logos-r2.ts'

export default {
  async fetch(request: Request, env: HostedLogoWorkerEnv): Promise<Response> {
    const served = await maybeServeHostedLogo(request, env)
    return served ?? new Response('not-handled', { status: 418 })
  },
}