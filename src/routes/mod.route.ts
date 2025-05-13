import fastify, { FastifyInstance } from "fastify";
import { TRouteFunction } from "../utils/fastify-route";
import { ModController } from "../controllers/mod.controller";

export const ModRoutes:TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
  fastify.post('/mods', ModController.CreateMod as any);
  fastify.get('/mods', ModController.GetAllMOds as any);
  fastify.delete('/mods/delete/:userId/:modId', ModController.DeleteModById as any);
  done();
}