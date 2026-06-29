import express from 'express';
import cookieParser from 'cookie-parser';
import { createMenuRouter } from './routes/menu.js';

export function createApp({ db, uploadsDir, auth }) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/menu', createMenuRouter(db));
  // auth ve admin route'ları sonraki task'larda eklenir
  app.set('appDeps', { db, uploadsDir, auth });
  return app;
}
