import { test, expect } from '@playwright/test';

async function adminLogin(page) {
  await page.goto('/menu/admin/login');
  await page.getByPlaceholder('Şifre').fill('e2e-pass');
  await page.getByRole('button', { name: 'Giriş' }).click();
  await expect(page.getByText('Yönetim Paneli')).toBeVisible();
}

// ProductRow renders a single flex row div whose direct children are the
// name/price block and the "Aktif"/"Pasif" + "Düzenle" buttons. We locate the
// row by finding the product name text, then walking up to the row container
// (the element whose direct child contains both the name and the buttons).
function rowFor(page, name) {
  return page
    .locator('div')
    .filter({ has: page.getByText(name, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Düzenle' }) })
    .last();
}

test('admin can change a price and customer sees it', async ({ page }) => {
  await adminLogin(page);

  // edit product "Fava"
  const row = rowFor(page, 'Fava');
  await row.getByRole('button', { name: 'Düzenle' }).click();

  const priceInput = page.getByPlaceholder('Fiyat (TL)');
  await priceInput.fill('1234');
  await page.getByRole('button', { name: 'Kaydet' }).click();

  // customer menu shows new price
  await page.goto('/menu/');
  await expect(page.getByText('1234 TL')).toBeVisible({ timeout: 7000 });
});

test('admin can deactivate a product and it disappears from menu', async ({ page }) => {
  await adminLogin(page);

  // toggle "Ahtapot Salatası" to passive via its row button
  const row = rowFor(page, 'Ahtapot Salatası');
  await row.getByRole('button', { name: 'Aktif' }).click();
  await expect(row.getByRole('button', { name: 'Pasif' })).toBeVisible();

  await page.goto('/menu/');
  await expect(page.getByText('Ahtapot Salatası')).toHaveCount(0);
});
