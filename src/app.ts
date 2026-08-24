import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { chatRouter } from './routes/chat.routes.js';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRouter);
app.use('/api/chat', chatRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' });
});
