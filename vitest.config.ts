import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [tsconfigPaths()] as any,
        test: {
          exclude: ['**/*.unit.test.ts', 'node_modules/**'],
          browser: {
            enabled: true,
            provider: 'playwright',
            // https://vitest.dev/guide/browser/playwright
            instances: [{ browser: 'chromium', headless: true }],
          },
        },
      },
      {
        plugins: [tsconfigPaths()] as any,
        test: {
          include: ['**/*.unit.test.ts'],
          exclude: ['*.test.ts', 'node_modules/**'],
        },
      },
    ],
  },
})
