import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { rankingsRouter } from './routes/rankings.js';
import { resultsRouter } from './routes/results.js';
import { usersRouter } from './routes/users.js';

const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/results', resultsRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api/users', usersRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({
    error: 'Internal server error.'
  });
});

app.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
});
