import { test, expect } from '@playwright/test';

/**
 * Deep-link routes redirect unauthenticated users to login (SPA + auth guard).
 */
const publicPaths = ['/dashboard', '/orders', '/customers', '/products', '/billing'];

for (const path of publicPaths) {
  test(`unauthenticated visit to ${path} shows login`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.getByText('Đăng nhập quản trị')).toBeVisible({ timeout: 30_000 });
  });
}
