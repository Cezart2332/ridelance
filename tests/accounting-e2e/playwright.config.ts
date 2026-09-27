import { defineConfig, devices } from '@playwright/test'

/**
 * Testele e2e ale contabilității (spec B9) pe API-ul real. Se rulează prin `run.mjs`
 * (`npm run test:accounting:e2e`), care pregătește baza, backend-ul și seed-ul; scenariile
 * depind unul de altul (luna procesată, apoi declarațiile), deci rulează în serie.
 */
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir: '../../test-results/accounting-e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --mode e2e --port 5175 --strictPort',
    cwd: '../..',
    url: 'http://localhost:5175',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } }],
})
