import { test } from 'node:test';
import assert from 'node:assert/strict';
import { METRIC_REGISTRY, isKnownMetric, isValidEntity } from '../snapshot-metrics.js';

test('kayıtlı ölçütler tanınır, uydurma olan tanınmaz', () => {
  assert.ok(isKnownMetric('ig.followers'));
  assert.ok(isKnownMetric('menu.price'));
  assert.ok(isKnownMetric('menu.setPrice'), 'ürün seti işi için yeri ayrılmalı');
  assert.equal(isKnownMetric('uydurma.olcut'), false);
  assert.equal(isKnownMetric(''), false);
});

test('entity yok kuralı: boş olmalı', () => {
  assert.ok(isValidEntity('ig.followers', ''));
  assert.equal(isValidEntity('ig.followers', '42'), false, 'global ölçüte entity verilemez');
});

test('entity zorunlu kuralı: dolu ve biçime uygun olmalı', () => {
  assert.ok(isValidEntity('menu.price', 'levrek'));
  assert.ok(isValidEntity('menu.price', 'levrek-0'), 'varyant biçimi');
  assert.equal(isValidEntity('menu.price', ''), false, 'boş entity reddedilmeli');
});

test('entity biçim kısıtı uygulanır', () => {
  assert.equal(isValidEntity('menu.price', 'a'.repeat(81)), false, '80 karakteri aşamaz');
  assert.ok(isValidEntity('menu.price', 'a'.repeat(80)));
  // Ürün id'si sunucuda 64 karakterle sınırlı; varyant eki ile birlikte sığar.
  assert.ok(isValidEntity('menu.price', `${'u'.repeat(64)}-7`));
  assert.equal(isValidEntity('menu.price', 'boşluk var'), false);
  assert.equal(isValidEntity('menu.price', 'yol/gibi'), false);
});

test('bilinmeyen ölçüt için entity doğrulaması her zaman false', () => {
  assert.equal(isValidEntity('uydurma.olcut', ''), false);
});

test('kayıt beklenen ölçütleri içerir', () => {
  assert.deepEqual(Object.keys(METRIC_REGISTRY).sort(), [
    'ig.followers', 'ig.reach', 'menu.price', 'menu.setPrice',
    'reviews.count', 'reviews.rating',
  ]);
});
