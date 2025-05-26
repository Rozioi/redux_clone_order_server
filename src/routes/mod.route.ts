import fastify, { FastifyInstance } from "fastify";
import { TRouteFunction } from "../utils/fastify-route";
import { ModController } from "../controllers/mod.controller";
import { sendMail } from "../utils/mailer";

export const ModRoutes:TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
  fastify.post('/mods', ModController.CreateMod as any);
  fastify.get('/mods', ModController.GetAllMOds as any);
  fastify.get('/mods/search', ModController.GetSearchModsCat as any);
  fastify.get('/mods/status/:status', ModController.GetModsByStatus as any);
  fastify.post('/mods/update_rating', ModController.updateStatsMod as any);
  fastify.get('/mod/:id', ModController.GetModsById as any);
  fastify.get('/email', async (req,reply) => {
    await sendMail('gtavvedeos@gmail.com', 'password', '<div>hello</div>')
  });
  fastify.delete('/mods/delete/:userId/:modId', ModController.DeleteModById as any);
  done();
}