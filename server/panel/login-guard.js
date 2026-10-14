// IP başına hatalı giriş sınırı. Sunucudaki admin API'sinin de kendi kilidi
// var, ama panel sunucuda barındırıldığında API bütün istekleri bu süreçten
// (127.0.0.1) gelmiş görür; tek bir kötü niyetli ziyaretçi paneli herkese
// kilitleyebilir. Asıl sınır bu yüzden gerçek istemci IP'sini bilen burada.
export class LoginGuard {
  constructor({ maxAttempts = 5, lockoutMs = 15 * 60 * 1000 } = {}) {
    this.maxAttempts = maxAttempts;
    this.lockoutMs = lockoutMs;
    this.attempts = new Map();
  }

  isLocked(ip) {
    const entry = this.attempts.get(ip);
    if (!entry?.lockedUntil) return false;
    if (Date.now() < entry.lockedUntil) return true;
    this.attempts.delete(ip);
    return false;
  }

  recordFailure(ip) {
    const entry = this.attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
    entry.count += 1;
    if (entry.count >= this.maxAttempts) entry.lockedUntil = Date.now() + this.lockoutMs;
    this.attempts.set(ip, entry);
  }

  reset(ip) {
    this.attempts.delete(ip);
  }

  prune() {
    const now = Date.now();
    for (const [ip, entry] of this.attempts) {
      if (entry.lockedUntil && entry.lockedUntil <= now) this.attempts.delete(ip);
    }
  }
}
