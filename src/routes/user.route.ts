
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { userController } from "../controllers/user.controller"
import { TRouteFunction } from "../utils/fastify-route";

export const UserRoutes: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
  fastify.get('/users/:id', { preHandler: fastify.verifyJWT }, userController.getUserById as any);
  fastify.put('/users/:id/active', { preHandler: fastify.verifyJWT }, userController.toogleAccountStatus as any);
  fastify.delete('/users/:id', { preHandler: fastify.verifyJWT }, userController.deleteAccount as any);
  fastify.post('/login', userController.loginUser);
  fastify.post('/create', userController.createNewUser);
  done();
}
