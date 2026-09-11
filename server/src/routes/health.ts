import { Router } from 'express';
import { checkDatabaseConnection } from '../db/pool.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ ok: true });
});

healthRouter.get('/db', async (_req, res) => {
  const database = await checkDatabaseConnection();

  res.status(database.connected ? 200 : 503).json({
    ok: database.connected,
    database
  });
});
