import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001';
const REVIEW_URL = 'https://example.com/yedigul-review';

async function token(request) {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { password: 'e2e-test-parolasi' },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token;
}

const setReviewUrl = (request, auth, url) =>
  request.put(`${API}/api/admin/settings`, { headers: auth, data: { info_google_review_url: url } });

const panelListe = async (request, auth) =>
  (await request.get(`${API}/api/admin/feedback`, { headers: auth })).json();

// Testler paylaşılan in-memory veritabanına vurar (workers: 1).
// Her test değiştirdiği ayarı geri alır.
test.afterEach(async ({ request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, '');
});

test('bağlantı boşken yıldız bloğu hiç çizilmez', async ({ page, request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, '');

  await page.goto('/menu/');
  await expect(page.getByRole('heading', { name: 'Yedigül', level: 1 })).toBeVisible();
  await expect(page.locator('.yg-rating')).toHaveCount(0);
});

test('5 yıldız Google bağlantısını yeni sekmede açar ve sunucuya kayıt bırakmaz', async ({ page, request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, REVIEW_URL);
  const once = (await panelListe(request, auth)).items.length;

  await page.goto('/menu/');
  const blok = page.locator('.yg-rating').first();
  await blok.scrollIntoViewIfNeeded();

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    blok.getByRole('button', { name: '5 yıldız' }).click(),
  ]);
  expect(popup.url()).toContain('yedigul-review');
  await popup.close();

  await expect(blok).toContainText('Teşekkür ederiz!');
  await page.waitForTimeout(300);
  expect((await panelListe(request, auth)).items.length).toBe(once);
});

test('2 yıldız site içi form açar, gönderilen yorum panele düşer', async ({ page, request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, REVIEW_URL);
  const mesaj = `e2e yorumu ${Date.now()}`;

  await page.goto('/menu/');
  const blok = page.locator('.yg-rating').first();
  await blok.scrollIntoViewIfNeeded();
  await blok.getByRole('button', { name: '2 yıldız' }).click();

  const alan = blok.getByRole('textbox');
  await expect(alan).toBeVisible();
  await alan.fill(mesaj);
  await blok.getByRole('button', { name: 'Gönder' }).click();

  await expect(blok).toContainText('Teşekkür ederiz!');

  await expect
    .poll(async () => (await panelListe(request, auth)).items.some((r) => r.message === mesaj))
    .toBe(true);

  const kayit = (await panelListe(request, auth)).items.find((r) => r.message === mesaj);
  expect(kayit.rating).toBe(2);
});

test('puan verildikten sonra sayfa yenilenince tekrar sorulmaz', async ({ page, request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, REVIEW_URL);

  await page.goto('/menu/');
  const blok = page.locator('.yg-rating').first();
  await blok.scrollIntoViewIfNeeded();

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    blok.getByRole('button', { name: '4 yıldız' }).click(),
  ]);
  await popup.close();

  await page.reload();
  await expect(page.locator('.yg-rating').first()).toContainText('Teşekkür ederiz!');
  await expect(page.locator('.yg-rating').first().getByRole('button', { name: '4 yıldız' })).toHaveCount(0);
});

test('şerit 60 saniye + yeterli kaydırmadan sonra görünür, başa dön butonu gizlenir, kapatılabilir', async ({ page, request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, REVIEW_URL);

  await page.clock.install();

  await page.goto('/menu/');
  // Sayfa ve mock clock tam yüklensin diye bekle
  await page.waitForTimeout(200);
  await expect(page.locator('.yg-rating-strip')).toHaveCount(0);

  // Sayfanın %80'ine kaydır (sınır değer riskini ortadan kaldır — %40 sınırda yuvarlama riski vardı)
  await page.evaluate(() => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, height * 0.8);
  });

  // Kaydırmanın işlenmesi için sayfaya time ver
  await page.waitForTimeout(100);

  await page.clock.fastForward(61_000);

  await expect(page.locator('.yg-rating-strip')).toBeVisible();

  const scrollBtn = page.locator('.yg-scroll-top');
  await expect(scrollBtn).toHaveAttribute('tabindex', '-1');
  await expect(scrollBtn).toHaveAttribute('aria-hidden', 'true');

  await page.locator('.yg-rating-strip__close').click();
  await expect(page.locator('.yg-rating-strip')).toHaveCount(0);
});
