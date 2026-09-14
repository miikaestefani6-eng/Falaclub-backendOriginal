import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import type { AuthenticatedRequest } from './auth.middleware.js';

type WindowEntry = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const windows = new Map<string, WindowEntry>();

function pruneExpired(now: number) {
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) windows.delete(key);
  }
}

export const chatRateLimit: RequestHandler = (request, response, next) => {
  const authenticatedRequest = request as AuthenticatedRequest;
  const now = Date.now();
  pruneExpired(now);

  const key = authenticatedRequest.user.id;
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    response.setHeader('RateLimit-Limit', env.CHAT_RATE_LIMIT_PER_MINUTE.toString());
    response.setHeader('RateLimit-Remaining', Math.max(0, env.CHAT_RATE_LIMIT_PER_MINUTE - 1).toString());
    next();
    return;
  }

  if (current.count >= env.CHAT_RATE_LIMIT_PER_MINUTE) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    response.setHeader('Retry-After', retryAfterSeconds.toString());
    response.setHeader('RateLimit-Limit', env.CHAT_RATE_LIMIT_PER_MINUTE.toString());
    response.setHeader('RateLimit-Remaining', '0');
    response.status(429).json({ error: 'Too many requests. Try again shortly.' });
    return;
  }

  current.count += 1;
  windows.set(key, current);
  response.setHeader('RateLimit-Limit', env.CHAT_RATE_LIMIT_PER_MINUTE.toString());
  response.setHeader('RateLimit-Remaining', Math.max(0, env.CHAT_RATE_LIMIT_PER_MINUTE - current.count).toString());
  next();
};
