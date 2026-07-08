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

  // adı geri al: paylaşılan DB'de sonraki proje/koşum yine "Salatalar" bulsun
  await page.goto('/menu/admin');
  await page.getByRole('button', { name: 'Kategoriler' }).click();
  const renamedRow = page.locator('li').filter({ hasText: 'Yeşillikler TEST' });
  await renamedRow.getByRole('button', { name: 'Düzenle' }).click();
  const restoreRow = page.locator('li').filter({ has: page.getByRole('button', { name: 'Kaydet' }) });
  await restoreRow.getByPlaceholder('Ad (TR)').fill('Salatalar');
  await restoreRow.getByRole('button', { name: 'Kaydet' }).click();
  // kategori yöneticisi satırında yine "Salatalar" (Düzenle düğmeli) görünmeli
  await expect(
    page.locator('li').filter({ hasText: 'Salatalar' }).getByRole('button', { name: 'Düzenle' })
  ).toBeVisible();
});

test('admin can add an Arabic name and the customer sees it in Arabic', async ({ page }) => {
  await adminLogin(page);

  // edit product "Fava" and open the optional AR/RU translations section
  const row = rowFor(page, 'Fava');
  await row.getByRole('button', { name: 'Düzenle' }).click();
  await page.getByText('Çeviriler (Arapça / Rusça)', { exact: false }).click();
  await page.getByPlaceholder('الاسم (AR)').fill('فافا تجريبي');
  await page.getByRole('button', { name: 'Kaydet' }).click();

  // customer menu, switched to Arabic, shows the Arabic name
  await page.goto('/menu/');
  await page.getByRole('button', { name: 'AR', exact: true }).click();
  // görselsiz üründe ad hem kartta hem görsel placeholder'ında görünebilir
  await expect(page.getByText('فافا تجريبي').first()).toBeVisible({ timeout: 7000 });
});

test('admin can add portion variants and the customer sees a price range', async ({ page }) => {
  await adminLogin(page);

  // "Pancar" (tekil 300 TL) ürününe iki porsiyon varyantı ekle
  await rowFor(page, 'Pancar').getByRole('button', { name: 'Düzenle' }).click();
  await page.getByRole('button', { name: '+ Varyant ekle' }).click();
  await page.getByRole('button', { name: '+ Varyant ekle' }).click();
  await page.getByPlaceholder('Boyut (TR)').nth(0).fill('Küçük');
  await page.getByPlaceholder('Size (EN)').nth(0).fill('Small');
  await page.getByPlaceholder('TL').nth(0).fill('90');
  await page.getByPlaceholder('Boyut (TR)').nth(1).fill('Büyük');
  await page.getByPlaceholder('Size (EN)').nth(1).fill('Large');
  await page.getByPlaceholder('TL').nth(1).fill('150');
  await page.getByRole('button', { name: 'Kaydet' }).click();

  // müşteri menüsünde tekil fiyat yerine aralık görünür
  await page.goto('/menu/');
  await expect(page.getByText('90–150 TL')).toBeVisible({ timeout: 7000 });

  // geri al: varyantları kaldır, tekil fiyatı 300 TL'ye döndür (paylaşılan DB)
  await page.goto('/menu/admin');
  await rowFor(page, 'Pancar').getByRole('button', { name: 'Düzenle' }).click();
  await page.getByRole('button', { name: 'Varyantı kaldır' }).first().click();
  await page.getByRole('button', { name: 'Varyantı kaldır' }).first().click();
  await page.getByPlaceholder('Fiyat (TL)').fill('300');
  await page.getByRole('button', { name: 'Kaydet' }).click();
  await page.goto('/menu/');
  await expect(page.getByText('90–150 TL')).toHaveCount(0);
});

test('admin can deactivate a product and it disappears from menu', async ({ page }) => {
  await adminLogin(page);

  // toggle "Ahtapot Salatası" to passive via its row button
  const row = rowFor(page, 'Ahtapot Salatası');
  await row.getByRole('button', { name: 'Aktif' }).click();
  await expect(row.getByRole('button', { name: 'Pasif' })).toBeVisible();

  await page.goto('/menu/');
  await expect(page.getByText('Ahtapot Salatası')).toHaveCount(0);

  // yeniden aktif et: paylaşılan DB'de sonraki proje/koşum yine "Aktif" bulsun
  await page.goto('/menu/admin');
  const restoreRow = rowFor(page, 'Ahtapot Salatası');
  await restoreRow.getByRole('button', { name: 'Pasif' }).click();
  await expect(restoreRow.getByRole('button', { name: 'Aktif' })).toBeVisible();
});
