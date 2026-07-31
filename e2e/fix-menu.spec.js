import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001';
const SET = {
  id: 'e2e-fix',
  name_tr: 'E2E Balık Menüsü', name_en: 'E2E Fish Menu',
  name_ar: 'قائمة الاختبار', name_ru: 'Тестовое меню',
  desc_tr: 'Test için kurulan paket menü.',
  price: 1450,
};

/** Yönetim oturumu açar; token döner. */
async function token(request) {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { password: 'e2e-test-parolasi' },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token;
}

test('fix menü kendi kategorisi olarak görünür ve çip şeridine girer', async ({ page, request }) => {
  const tok = await token(request);
  const auth = { Authorization: `Bearer ${tok}` };

  // Menüden iki gerçek ürün al ve fix menü kur
  const menu = await (await request.get(`${API}/api/admin/menu`, { headers: auth })).json();
  const [a, b] = menu.products.slice(0, 2);
  const create = await request.post(`${API}/api/admin/sets`, {
    headers: auth,
    data: { ...SET, items: [{ product_id: a.id, qty: 2 }, { product_id: b.id, qty: 1 }] },
  });
  expect(create.status()).toBe(201);

  try {
    await page.goto('/menu/');
    await expect(page.getByRole('heading', { name: 'Yedigül', level: 1 })).toBeVisible();

    // Kendi bölüm başlığı var
    await expect(page.getByRole('heading', { name: 'Fix Menüler', level: 2 })).toBeVisible();

    // Kategori çip şeridinde yerini aldı
    const catbar = page.getByRole('navigation', { name: 'Kategoriler' });
    await expect(catbar.getByRole('button', { name: 'Fix Menüler', exact: true })).toBeVisible();

    // Kart: ad, içerik satırları ve fiyat
    await expect(page.getByRole('heading', { name: SET.name_tr, level: 3 })).toBeVisible();
    await expect(page.getByText(SET.desc_tr)).toBeVisible();
    await expect(page.getByText('2×', { exact: true })).toBeVisible();
    await expect(page.getByText(a.name_tr, { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Kişi Başı')).toBeVisible();

    // Editoryal girişte de h2 var; konumu yalnızca kategori başlıkları arasında ölçeriz.
    const yeri = async () => {
      const hepsi = await page.locator('.yg-menu-sections h2').allInnerTexts();
      return hepsi.findIndex((t) => t.includes('Fix Menüler'));
    };
    expect(await yeri()).toBeGreaterThan(0); // varsayılan: ilk sırada değil

    // Kategori sırası değişince menüdeki yeri de değişir
    const menuAdmin = await (await request.get(`${API}/api/admin/menu`, { headers: auth })).json();
    const ids = menuAdmin.categories.map((c) => c.id);
    const basa = ['fix-menus', ...ids.filter((id) => id !== 'fix-menus')];
    const sirala = await request.put(`${API}/api/admin/categories/order`, {
      headers: auth, data: { ids: basa },
    });
    expect(sirala.ok()).toBeTruthy();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Fix Menüler', level: 2 })).toBeVisible();
    expect(await yeri()).toBe(0); // başa taşındı

    // Eski sıraya dön
    await request.put(`${API}/api/admin/categories/order`, { headers: auth, data: { ids } });

    // Dil değişince set de çevrilir
    await page.getByRole('button', { name: 'Dil seçimi: English', exact: true }).click();
    await expect(page.getByRole('heading', { name: SET.name_en, level: 3 })).toBeVisible();
    await expect(page.getByText('Per Person')).toBeVisible();
    await page.getByRole('button', { name: 'Language selection: Türkçe', exact: true }).click();

    // Diyet süzgeci ürün niteliğidir; açıkken fix menü bölümü düşer
    await page.getByRole('button', { name: 'Glutensiz', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Fix Menüler', level: 2 })).toHaveCount(0);
    await page.getByRole('button', { name: 'Glutensiz', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Fix Menüler', level: 2 })).toBeVisible();
  } finally {
    // Testler kendi durumunu geri alır (playwright.config.js'teki kural)
    await request.delete(`${API}/api/admin/sets/${SET.id}`, { headers: auth });
  }
});

test('fix menü yoksa bölüm hiç çıkmaz', async ({ page }) => {
  await page.goto('/menu/');
  await expect(page.getByRole('heading', { name: 'Yedigül', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fix Menüler', level: 2 })).toHaveCount(0);
});
