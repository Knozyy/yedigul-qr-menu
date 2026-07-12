// Kalıcı, anonim cihaz kimliği (localStorage). Menü görüntülenmesini cihaz
// başına saymak için kullanılır. Kişisel veri DEĞİL — rastgele bir token.
const KEY = 'device_id';

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // localStorage kapalıysa (gizli mod vb.) oturumluk kimlikle yetin
    return randomId();
  }
}
