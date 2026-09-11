import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';

const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.use('/api/health', healthRouter);

app.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
});
