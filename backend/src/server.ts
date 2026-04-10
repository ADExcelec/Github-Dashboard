import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { prdRouter } from './api/routes/prd.js';

const app = express();

app.use(
  cors({
    origin: env.allowedOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/prd', prdRouter);
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`PRD orchestrator listening on port ${env.port}`);
});
