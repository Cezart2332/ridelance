import { defineConfig, devices } from '@playwright/test'

/**
 * Testele aplicației mobile: build-ul `--mode native` servit de Vite, pe un telefon emulat.
 * Rulează separat de `tests/responsive`, care testează site-ul.
 */

export default defineConfig({
  testDir: '.',
  outputDir: '../../test-results/native',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { baseURL: 'http://127.0.0.1:5180', trace: 'retain-on-failure' },
  webServer: {
    command: 'npx vite --mode native --host 127.0.0.1 --port 5180 --strictPort',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: false,
    cwd: '../..',
    timeout: 120_000,
    env: { VITE_API_BASE_URL: 'http://localhost:5000' },
  },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
})
