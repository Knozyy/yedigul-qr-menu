import { Router } from 'express';
import jwt from 'jsonwebtoken';

const COOKIE = 'token';
const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function createAuth({ secret, password }) {
  function requireAuth(req, res, next) {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'Yetkisiz' });
    try {
      jwt.verify(token, secret);
      next();
    } catch {
      res.status(401).json({ error: 'Oturum geçersiz' });
    }
  }

  const router = Router();
  router.post('/login', (req, res) => {
    if (!password || req.body?.password !== password) {
      return res.status(401).json({ error: 'Hatalı şifre' });
    }
    const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '7d' });
    res.cookie(COOKIE, token, cookieOpts);
    res.json({ authenticated: true });
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
