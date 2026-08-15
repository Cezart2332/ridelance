import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/responsive',
  outputDir: './test-results/responsive',
  timeout: 30_000,
  // Aserțiunile au propriul termen, separat de cel al testului. Cu patru browsere pe același
  // server de dezvoltare, 5s implicit nu ajung pentru montarea unei pagini plus animația
  // cifrelor — testele picau în paralel și treceau serial, ceea ce nu spune nimic despre cod.
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
