import { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user.interface';

export interface ActiveSession {
  id: string;
  expiresAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  session?: ActiveSession;
  sessionToken?: string;
}
