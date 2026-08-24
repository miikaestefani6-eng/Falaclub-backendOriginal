import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authorization.substring(7).trim();

  if (!token) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub;

  if (error || !userId) {
    response.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  (request as AuthenticatedRequest).user = { id: userId };
  next();
}
