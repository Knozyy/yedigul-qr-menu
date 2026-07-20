import { test, expect } from '@playwright/test';

async function openMenu(page) {
  await page.goto('/menu/');
  await expect(page.getByRole('heading', { name: 'Yedigül', level: 1 })).toBeVisible();
}

test('TR/EN/AR/RU geçişi HTML dili ve RTL yönünü günceller', async ({ page }) => {
  await openMenu(page);
  const root = page.locator('html');
  await expect(root).toHaveAttribute('lang', 'tr');
  await expect(root).toHaveAttribute('dir', 'ltr');

  await page.getByRole('button', { name: 'Dil seçimi: English', exact: true }).click();
  await expect(root).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('textbox', { name: 'Search the menu…' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Categories' })).toBeVisible();

  await page.getByRole('button', { name: 'Language selection: العربية', exact: true }).click();
  await expect(root).toHaveAttribute('lang', 'ar');
  await expect(root).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('textbox', { name: 'ابحث في القائمة…' })).toBeVisible();
  // Seed verisinde AR boşsa müşteri boş metin görmez; EN → TR fallback çalışır.
  await expect(page.getByRole('button', { name: 'Fresh Fish', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'اختيار اللغة: Русский', exact: true }).click();
  await expect(root).toHaveAttribute('lang', 'ru');
  await expect(root).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('textbox', { name: 'Поиск по меню…' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Категории' })).toBeVisible();
});

test('arama seçili dilde büyük-küçük harf ve aksan farkını tolere eder', async ({ page }) => {
  await openMenu(page);
  const search = page.getByRole('textbox', { name: 'Menüde ara…' });
  await search.fill('CUPRA');
  await expect(page.getByRole('heading', { name: 'Çupra', level: 3 })).toBeVisible();
  await expect(page.locator('main h3')).toHaveCount(1);

  await page.getByRole('button', { name: 'Dil seçimi: English', exact: true }).click();
  const englishSearch = page.getByRole('textbox', { name: 'Search the menu…' });
  await englishSearch.fill('SEA BREAM');
  await expect(page.getByRole('heading', { name: 'Sea Bream', level: 3 })).toBeVisible();
  await expect(page.locator('main h3')).toHaveCount(1);
});

test('dile bağlı erişilebilir adlar ve favori durumu birlikte güncellenir', async ({ page }) => {
  await openMenu(page);
  const addButton = page.getByRole('button', { name: 'Favorilere ekle' }).first();
  await addButton.click();
  await expect(page.getByRole('button', { name: 'Favorilerden çıkar' }).first()).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Dil seçimi: English', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove from favourites' }).first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
});
