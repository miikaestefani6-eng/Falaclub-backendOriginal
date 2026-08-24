import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.status(200).json({
    ok: true,
    service: 'falaclub-backend',
    timestamp: new Date().toISOString(),
  });
});
