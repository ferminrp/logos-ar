import { cloudflareTest } from '@cloudflare/vitest-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: './test/wrangler.vitest.jsonc',
      },
    }),
  ],
  test: {
    include: ['test/**/*.workerd.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    maxWorkers: 1,
  },
})
