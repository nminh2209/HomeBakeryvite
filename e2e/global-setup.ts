import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Optional: set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run authenticated E2E.
 * Writes playwright/.auth/admin.json for storageState.
 */
async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    return;
  }

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://127.0.0.1:5173';
  const authDir = path.join(config.rootDir, 'playwright', '.auth');
  fs.mkdirSync(authDir, { recursive: true });
  const storagePath = path.join(authDir, 'admin.json');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL);
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.getByText('Hệ thống quản lý tiệm bánh').waitFor({ timeout: 30000 });
  await page.context().storageState({ path: storagePath });
  await browser.close();

  process.env.E2E_STORAGE_STATE = storagePath;
}

export default globalSetup;
