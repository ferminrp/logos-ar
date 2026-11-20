import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersProject({
  test: {
    include: ['test/**/*.r2-vitest.test.ts'],
    testTimeout: 60_000,
    poolOptions: {
      workers: {
        singleWorker: true,
        wrangler: {
          configPath: './test/wrangler.logos-vitest.jsonc',
        },
      },
    },
  },
})