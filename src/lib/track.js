import { api } from './api';
import { getDeviceId } from './deviceId';

const IS_STATIC = import.meta.env.VITE_STATIC === '1';

export function trackProductView(productId) {
  if (IS_STATIC || !productId) return;
  api.post('/menu/product-view', { id: getDeviceId(), product: productId }).catch(() => {});
}
