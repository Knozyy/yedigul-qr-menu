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

test('admin can rename a category and customer sees the new name', async ({ page }) => {
  await adminLogin(page);

  // open the category manager
  await page.getByRole('button', { name: 'Kategoriler' }).click();

  // start inline-editing the "Salatalar" category row
  const catRow = page.locator('li').filter({ hasText: 'Salatalar' });
  await catRow.getByRole('button', { name: 'Düzenle' }).click();

  // the editing row is the only one with a "Kaydet" button
  const editRow = page.locator('li').filter({ has: page.getByRole('button', { name: 'Kaydet' }) });
  await editRow.getByPlaceholder('Ad (TR)').fill('Yeşillikler TEST');
  await editRow.getByRole('button', { name: 'Kaydet' }).click();

  // customer menu shows the renamed category label (category-bar button).
  // exact: true — bölüm başlığı da bir buton ve adı "… N çeşit" içeriyor.
  await page.goto('/menu/');
  await expect(page.getByRole('button', { name: 'Yeşillikler TEST', exact: true })).toBeVisible({ timeout: 7000 });
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
