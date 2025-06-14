import { FastifyRequest } from 'fastify';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
} 