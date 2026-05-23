import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login form when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Đăng nhập quản trị')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu')).toBeVisible();
  });

  test('invalid login does not enter the app', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Mật khẩu').fill('wrong-password-123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText('Hệ thống quản lý tiệm bánh Vân Ngọc')).not.toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Đăng nhập quản trị')).toBeVisible();
  });
});
