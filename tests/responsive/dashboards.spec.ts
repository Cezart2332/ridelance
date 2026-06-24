import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const pages = [
  { name: 'client-demo-acasa', path: '/demo' },
  { name: 'client-acasa', path: '/app/dashboard' },
  { name: 'admin-acasa', path: '/admin' },
  { name: 'contabil-acasa', path: '/contabil' },
  { name: 'poster-masini', path: '/poster' },
];

test.describe('responsive dashboards', () => {
  for (const pageInfo of pages) {
    test(`${pageInfo.name} has no viewport overflow`, async ({ page }, testInfo) => {
      await page.goto(pageInfo.path, { waitUntil: 'networkidle' });
      await page.setViewportSize(testInfo.project.name === 'mobile'
        ? { width: 393, height: 852 }
        : { width: 1440, height: 1000 });

      const screenshotDir = `test-results/responsive/screenshots/${testInfo.project.name}`;
      mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({ path: `${screenshotDir}/${pageInfo.name}.png`, fullPage: true });

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(2);
    });
  }
});
