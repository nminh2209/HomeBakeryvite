import { test, expect } from '@playwright/test';

const routes: { path: string; heading: RegExp }[] = [
  { path: '/dashboard', heading: /Bảng điều khiển/i },
  { path: '/orders', heading: /Quản lý đơn hàng/i },
  { path: '/customers', heading: /Quản lý khách hàng/i },
  { path: '/products', heading: /Quản lý sản phẩm/i },
  { path: '/billing', heading: /Hóa đơn/i },
];

test.describe('Authenticated navigation', () => {
  test.skip(!process.env.E2E_ADMIN_EMAIL, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD for authenticated tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Email').fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel('Mật khẩu').fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText('Hệ thống quản lý tiệm bánh Vân Ngọc')).toBeVisible({ timeout: 30000 });
  });

  for (const { path, heading } of routes) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 20000 });
    });
  }

  test('sidebar navigates to customers', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('Quản lý khách hàng').click();
    await expect(page).toHaveURL(/\/customers/);
    await expect(page.getByRole('heading', { name: /Quản lý khách hàng/i })).toBeVisible();
  });
});
