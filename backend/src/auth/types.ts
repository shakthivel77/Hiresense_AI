import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  token?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
