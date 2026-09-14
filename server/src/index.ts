import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { initializeBattleSocketServer } from './battle/socketServer.js';
import { uploadConfig } from './config/upload.js';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { rankingsRouter } from './routes/rankings.js';
import { resultsRouter } from './routes/results.js';
import { themesRouter } from './routes/themes.js';
import { usersRouter } from './routes/users.js';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());
app.use(uploadConfig.publicPath, express.static(uploadConfig.uploadRoot));

app.use('/api/health', healthRouter);
app.use('/api/results', resultsRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api/themes', themesRouter);
app.use('/api/users', usersRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({
    error: 'Internal server error.'
  });
});

initializeBattleSocketServer(httpServer);

httpServer.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
  console.log(`Battle socket listening on http://localhost:${env.port}/battle`);
});
