import { cloudflareTest } from '@cloudflare/vitest-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: './test/wrangler.logos-vitest.jsonc',
      },
    }),
  ],
  test: {
    include: ['test/**/*.r2-vitest.test.ts'],
    testTimeout: 60_000,
    maxWorkers: 1,
  },
})
