import express from 'express';
import cookieParser from 'cookie-parser';
import { createMenuRouter } from './routes/menu.js';
import { createAdminRouter } from './routes/admin.js';

export function createApp({ db, uploadsDir, auth }) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  if (uploadsDir) app.use('/uploads', express.static(uploadsDir));
  app.use('/api/menu', createMenuRouter(db));
  if (auth) {
    app.use('/api/auth', auth.router);
    app.use('/api/admin', createAdminRouter({ db, uploadsDir, requireAuth: auth.requireAuth }));
  }
  app.set('appDeps', { db, uploadsDir, auth });
  return app;
}
