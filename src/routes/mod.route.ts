import fastify, { FastifyInstance } from "fastify";
import { TRouteFunction } from "../utils/fastify-route";
import { ModController } from "../controllers/mod.controller";
import { sendMail } from "../utils/mailer";
import { mongoClient } from "../app";
import { FastifyRequest } from "fastify/types/request";
import { ObjectId } from "mongodb";

export const ModRoutes:TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
  fastify.post('/mods', ModController.CreateMod as any);
  fastify.get('/mods/all', ModController.GetAllMOds as any);
  fastify.get('/mods', ModController.GetAllModsForUser as any);
  fastify.get('/mods/search', ModController.GetSearchModsCat as any);
  fastify.get('/mods/status/:status', ModController.GetModsByStatus as any);
  fastify.post('/comment', ModController.CreateComment as any);
  fastify.get('/comments/:modId', ModController.GetCommentsByModId as any);
  fastify.delete('/comment/:modId', async (req: FastifyRequest<{ Params: { modId: string } }>, res) => {
    const { modId } = req.params;
    const result = await mongoClient.DeleteDocument('comments', { _id: new ObjectId(modId) })
    console.log(result, modId);
  });
  fastify.delete('/mods', async(req, reply) => {
    const res = await mongoClient.DeleteManyDocument('mods', {});
    return res
  })
  fastify.post('/mods/update_rating', ModController.updateStatsMod as any);
  fastify.get('/mod/:id', ModController.GetModsById as any);
    fastify.get('/users/:id/mods', ModController.GetModByUserId as any)
  fastify.get('/email', async (req,reply) => {
    await sendMail('gtavvedeos@gmail.com', 'password', '<div>hello</div>')
  });
  fastify.delete('/mods/delete/:userId/:modId', ModController.DeleteModById as any);
  done();
}