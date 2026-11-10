import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersProject({
  test: {
    include: ['test/**/*.workerd.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    poolOptions: {
      workers: {
        singleWorker: true,
        wrangler: {
          configPath: './test/wrangler.vitest.jsonc',
        },
      },
    },
  },
})
