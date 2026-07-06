import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';

const COOKIE = 'token';
const JWT_ALG = 'HS256';

// sabit-zamanlı şifre karşılaştırması — uzunluk sızar ama içerik sızmaz
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function createAuth({ secret, password, maxAttempts = MAX_ATTEMPTS, lockoutMs = LOCKOUT_MS }) {
  // in-memory brute-force guard: failed login attempts per IP
  const attempts = new Map(); // ip -> { count, lockedUntil }

  function isLocked(ip) {
    const a = attempts.get(ip);
    if (!a) return false;
    if (a.lockedUntil && Date.now() < a.lockedUntil) return true;
    if (a.lockedUntil && Date.now() >= a.lockedUntil) attempts.delete(ip);
    return false;
  }

  function recordFailure(ip) {
    const a = attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
    a.count += 1;
    if (a.count >= maxAttempts) a.lockedUntil = Date.now() + lockoutMs;
    attempts.set(ip, a);
  }

  function requireAuth(req, res, next) {
    // panel cookie ile, mobil uygulama Authorization: Bearer ile gelir
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const token = req.cookies?.[COOKIE] || bearer;
    if (!token) return res.status(401).json({ error: 'Yetkisiz' });
    try {
      jwt.verify(token, secret, { algorithms: [JWT_ALG] });
      next();
    } catch {
      res.status(401).json({ error: 'Oturum geçersiz' });
    }
  }

  const router = Router();
  router.post('/login', (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    if (isLocked(ip)) {
      return res.status(429).json({ error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' });
    }
    if (!password || !safeEqual(req.body?.password ?? '', password)) {
      recordFailure(ip);
      return res.status(401).json({ error: 'Hatalı şifre' });
    }
    attempts.delete(ip);
    const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '7d', algorithm: JWT_ALG });
    res.cookie(COOKIE, token, cookieOpts);
    // token gövdede de döner: mobil uygulama cookie yerine bunu saklayıp
    // Authorization: Bearer başlığıyla gönderir
    res.json({ authenticated: true, token });
  });
  router.post('/logout', (req, res) => {
    res.clearCookie(COOKIE, cookieOpts);
    res.json({ authenticated: false });
  });
  router.get('/me', requireAuth, (req, res) => {
    res.json({ authenticated: true });
  });

  return { router, requireAuth };
}
