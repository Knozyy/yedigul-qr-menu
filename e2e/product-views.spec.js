import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001';

/** Yönetim oturumu açar; token döner. */
async function token(request) {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { password: 'e2e-test-parolasi' },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token;
}

const enCok = async (request, auth) =>
  (await request.get(`${API}/api/admin/stats/products`, { headers: auth })).json();

const bakilma = (liste, id) => liste.find((r) => r.id === id)?.views ?? 0;

/**
 * Sayımın kendisi sunucu testlerinde kanıtlanıyor; buradaki soru bağlantı:
 * karta tıklamak gerçekten sayıma dönüşüyor mu, ve tekrarsızlık penceresi
 * gerçek tarayıcının cihaz kimliğiyle çalışıyor mu.
 */
test('ürün detayını açmak bakılma olarak sayılır', async ({ page, request }) => {
  const tok = await token(request);
  const auth = { Authorization: `Bearer ${tok}` };

  const menu = await (await request.get(`${API}/api/admin/menu`, { headers: auth })).json();
  const urun = menu.products.find((p) => !p.is_hidden);

  const once = bakilma((await enCok(request, auth)).week, urun.id);

  await page.goto('/menu/');
  await expect(page.getByRole('heading', { name: 'Yedigül', level: 1 })).toBeVisible();

  await page.getByRole('heading', { name: urun.name_tr, exact: true, level: 3 }).first().click();

  // Alt sayfa açıldı: tıklama kaydın yanı sıra kendi işini de yapıyor
  await expect(page.getByRole('dialog')).toBeVisible();

  await expect
    .poll(async () => bakilma((await enCok(request, auth)).week, urun.id))
    .toBe(once + 1);

  // Aynı cihaz, aynı ürün, pencere içinde → ikinci kez sayılmaz
  await page.keyboard.press('Escape');
  await page.getByRole('heading', { name: urun.name_tr, exact: true, level: 3 }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.waitForTimeout(300);
  expect(bakilma((await enCok(request, auth)).week, urun.id)).toBe(once + 1);
});
