import type { NextFunction, Request, Response } from 'express';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabase.js';

export interface AuthenticatedRequest extends Request {
  user: User;
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

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    response.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  (request as AuthenticatedRequest).user = data.user;
  next();
}
