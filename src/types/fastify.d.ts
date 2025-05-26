import { AuthenticatedUser } from '../interface/request.interface';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthenticatedUser
  }
} 