import { test, expect } from '@playwright/test';
import { RATING_COOLDOWN_MS } from '../shared/rating-policy.js';

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

test('yıldız düğmesi hemen görünür, panel açar/kapatır, kapatınca düğme tekrar açılabilir', async ({ page, request }) => {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, REVIEW_URL);

  await page.goto('/menu/');

  const fab = page.locator('.yg-rating-fab');
  await expect(fab).toBeVisible();
  await expect(page.locator('.yg-rating-strip')).toHaveCount(0);

  // Kaydırarak "başa dön" düğmesini görünür kıl; aksi halde aşağıdaki
  // tabindex/aria-hidden kontrolleri düğme zaten görünmediği için de geçer
  // ve panel-açıkken-gizleme davranışını gerçekten sınamamış olur.
  await page.evaluate(() => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, height * 0.8);
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(600);

  const scrollBtn = page.locator('.yg-scroll-top');
  await expect(scrollBtn).toHaveAttribute('tabindex', '0');

  await fab.click();
  await expect(page.locator('.yg-rating-strip')).toBeVisible();
  await expect(fab).toHaveCount(0);

  await expect(scrollBtn).toHaveAttribute('tabindex', '-1');
  await expect(scrollBtn).toHaveAttribute('aria-hidden', 'true');

  await page.locator('.yg-rating-strip__close').click();
  await expect(page.locator('.yg-rating-strip')).toHaveCount(0);
  await expect(fab).toBeVisible();

  await fab.click();
  await expect(page.locator('.yg-rating-strip')).toBeVisible();
});

async function prepareClock(page, request) {
  const auth = { Authorization: `Bearer ${await token(request)}` };
  await setReviewUrl(request, auth, REVIEW_URL);
  const now = new Date();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
}

test('eski rating_done=true kaydı misafiri süresiz kilitlemez', async ({ page, request }) => {
  await prepareClock(page, request);
  await page.addInitScript(() => localStorage.setItem('yedigul:rating_done', 'true'));
  await page.goto('/menu/');
  await expect(page.locator('.yg-rating-fab')).toBeVisible();
  await expect(page.locator('.yg-rating').first().getByRole('button', { name: '5 yıldız' })).toHaveCount(1);
});

test('değerlendirme beş saatte sayfa yenilenmeden açılır ve eski form temizlenir', async ({ page, request }) => {
  await prepareClock(page, request);
  // Tarayıcı saati sunucuyu değiştirmez; gerçek API sınırı server/test/feedback.test.js içinde sınanır.
  const messages = [];
  await page.route('**/api/menu/feedback', async route => {
    messages.push(route.request().postDataJSON().message);
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto('/menu/');
  const block = page.locator('.yg-rating').first();
  await block.scrollIntoViewIfNeeded();
  await block.getByRole('button', { name: '2 yıldız' }).click();
  await block.getByRole('textbox').fill('ilk değerlendirme');
  await block.getByRole('button', { name: 'Gönder', exact: true }).click();
  await expect(block).toContainText('Teşekkür ederiz!');
  await page.clock.fastForward(RATING_COOLDOWN_MS - 1);
  await expect(block.getByRole('button', { name: '2 yıldız' })).toHaveCount(0);
  await page.clock.fastForward(1);
  await expect(block.getByRole('button', { name: '2 yıldız' })).toHaveCount(1);
  await expect(page.locator('.yg-rating-fab')).toBeVisible();
  await expect(block.getByRole('textbox')).toHaveCount(0);
  await block.getByRole('button', { name: '2 yıldız' }).click();
  await expect(block.getByRole('textbox')).toHaveValue('');
  await block.getByRole('textbox').fill('ikinci değerlendirme');
  await block.getByRole('button', { name: 'Gönder', exact: true }).click();
  await expect(block).toContainText('Teşekkür ederiz!');
  expect(messages).toEqual(['ilk değerlendirme', 'ikinci değerlendirme']);
});

test('kayıtlı beş saatlik süre yenilemede korunur ve bitince tekrar açılır', async ({ page, request }) => {
  await prepareClock(page, request);
  await page.goto('/menu/');
  const deadline = await page.evaluate(() => {
    const until = Date.now() + 60_000;
    localStorage.setItem('yedigul:rating_until', JSON.stringify(until));
    return until;
  });
  await page.reload();
  await expect(page.locator('.yg-rating-fab')).toHaveCount(0);
  await page.clock.fastForward(60_000);
  await expect(page.locator('.yg-rating-fab')).toBeVisible();
  await page.reload();
  await expect(page.locator('.yg-rating-fab')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('yedigul:rating_until')))).toBe(deadline);
});

test('429 yanıtı yeni beş saat başlatmak yerine sunucudaki kalan süreyi kullanır', async ({ page, request }) => {
  await prepareClock(page, request);
  await page.route('**/api/menu/feedback', route => route.fulfill({ status: 429, json: { ok: false, error: 'limit', retryAfterMs: 60_000 } }));
  await page.goto('/menu/');
  const block = page.locator('.yg-rating').first();
  await block.scrollIntoViewIfNeeded();
  await block.getByRole('button', { name: '2 yıldız' }).click();
  await block.getByRole('textbox').fill('tekrar deneyelim');
  await block.getByRole('button', { name: 'Gönder', exact: true }).click();
  await expect(block).toContainText('Görüşünüzü zaten aldık');
  await page.clock.fastForward(59_999);
  await expect(block.getByRole('button', { name: '2 yıldız' })).toHaveCount(0);
  await page.clock.fastForward(1);
  await expect(block.getByRole('button', { name: '2 yıldız' })).toHaveCount(1);
});

test('başka sekmede yapılan değerlendirme açık menüyle eşzamanlanır', async ({ page, context, request }) => {
  await prepareClock(page, request);
  await page.goto('/menu/');
  await expect(page.locator('.yg-rating-fab')).toBeVisible();
  const other = await context.newPage();
  try {
    await other.goto('/menu/');
    await other.evaluate(() => localStorage.setItem('yedigul:rating_until', JSON.stringify(Date.now() + 60_000)));
    await expect(page.locator('.yg-rating-fab')).toHaveCount(0);
    await other.evaluate(() => localStorage.setItem('yedigul:rating_until', JSON.stringify(Date.now() - 1)));
    await expect(page.locator('.yg-rating-fab')).toHaveCount(1);
  } finally {
    await other.close();
  }
});
