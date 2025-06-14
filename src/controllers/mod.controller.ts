import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";
import { ICommentsRequest, IModRequest } from "../interface/mod.interface";
import { ModService } from "../services/mod.service";
import { mongoClient } from "../app";
import { ObjectId } from "mongodb";
import { UserService } from "../services/user.service";


interface IQuery {
  category?: string;
  subcategory?: string;
}

export const ModController = {
  async ApproveMod(req: FastifyRequest<{ Params: { id: string }}>, reply: FastifyReply) {
    try {
      const { id } = req.params;
      const success = await ModService.approveMod(id);
      
      if (!success) {
        return reply.status(404).send({ message: "Мод не найден" });
      }
      
      return reply.status(200).send({ 
        message: "Мод успешно одобрен",
        success: true 
      });
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({ error: err.message });
    }
  },
  async updateStatsMod(req: FastifyRequest<{Body: {modId: string, param: string,operation: 'add'| 'remove' }}>, reply:FastifyReply) {
    const { modId, param, operation } = req.body;  
    try{
      if (!modId || !param ) return reply.status(401).send({});
      
      const result = await ModService.updateStatsMod(modId, param, operation);
      if (!result) return reply.status(400).send('dsad');
      const mod = await ModService.GetModById(modId);
      console.log(mod?.rating);
      return reply.status(200).send(true);
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({ error: err });
    }
  },
  async CreateMod(req: FastifyRequest<{ Body: IModRequest }>, reply: FastifyReply) {
    try {
      const data = req.body;
      if (!data) reply.status(400).send('Mod are required');
      
      const result = await ModService.CreateMod(data);
      if (!result) reply.status(500).send('Server invalid');
      
      return reply.status(201).send({
        message: "Mod created successfully",
        id: result
      });
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({ error: err });
    }
  },
  async GetAllMOds(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await ModService.GetAllMOds();
      if (!result) return reply.status(404).send('There are no mods yet');
      return reply.status(200).send(result);
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({ error: err });
    }
  },
  async GetAllModsForUser(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await ModService.GetAllModsForUser();
      if (!result) return reply.status(404).send('There are no mods yet');
      return reply.status(200).send(result);
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({ error: err });
    }
  },
  async GetSearchModsCat(req: FastifyRequest<{ Querystring: IQuery }>, reply: FastifyReply) {
    const { category, subcategory } = req.query;
    try {
      const hasSubCategory = !!subcategory;
          
      const query = hasSubCategory ?
        { categories: [category, subcategory] } :
        { $in: [category] };
          
      const result = await mongoClient.FindDocFieldsByFilter('mods', query);
      if (!result) return reply.status(404).send('Noting was found');
      console.log(result);
          
      return reply.status(200).send(result);
                  
    } catch (error) {
      console.error("Search error:", error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  },
  async GetModsByStatus(req: FastifyRequest<{ Params: { status: string }}>, reply: FastifyReply){
    const { status } = req.params;
    try{
      if (!status) return reply.status(400).send('Invalid mods status');
      const result = await mongoClient.FindDocFieldsByFilter('mods', { status: status });
      if (!result) return reply.status(404).send('Mods not found');
      
      return reply.status(200).send(result);
    } catch(error){
      const err = error as Error;
      return reply.status(500).send({ error: err });
    }
  },
  async GetModByUserId(req:FastifyRequest<{Params: {id:string}}>, reply: FastifyReply){
    const { id } = req.params;
    try{
      if (!id) return reply.status(400).send('Invalid user id');
      const result = await mongoClient.FindDocFieldsByFilter('mods', { userId: new ObjectId(id) });
      if (!result) return reply.status(404).send('Mods not found');
      
      return reply.status(200).send(result);
    } catch(error){
      const err = error as Error;
      return reply.status(500).send({ error: err });
    }
  },
  async GetModsById(req: FastifyRequest<{ Params: { id: string }}>, reply: FastifyReply){
    const { id } = req.params;
    try{
      if (!id) return reply.status(400).send('Invalid mod id');
      const result = await mongoClient.FindDocFieldsByFilter('mods', { _id: new ObjectId(id) });
      if (!result) return reply.status(404).send('Mods not found');
      
      return reply.status(200).send(result);
    } catch(error){
      const err = error as Error;
      return reply.status(500).send({ error: err });
    }
  },
  async DeleteModById(req:FastifyRequest<{Params: {userId:string,modId: string}}>, reply:FastifyReply){
    const { userId, modId } = req.params;
    try{
      if (!userId) return reply.status(400).send('Invalid mod ID');
      const result = await ModService.DeleteModById(modId, userId);
      if (!result) return reply.status(404).send('Invalid to delete mod')
      
    } catch(error){
      
      const err = error as Error;
      return reply.status(500).send({ error: err });
    }
  },
  async GetCommentsByModId(req:FastifyRequest<{Params: {modId:string}}>, reply: FastifyReply){
    const { modId } = req.params;
    try{
      if (!modId) return reply.status(400).send('Invalid mod ID');
      const result = await ModService.GetCommentsByModId(modId);
      return reply.status(200).send(result);
    }catch(error){
      const err = error as Error;
      return reply.status(500).send({ error: err });
    }
  },
  async CreateComment(req:FastifyRequest<{Body: ICommentsRequest}>, reply:FastifyReply){
    try{
      const result = await ModService.CreateComments(req.body);
      return reply.status(200).send(result);
    } catch(error){
      const err = error as Error;
      return reply.status(500).send({ error: err });
    }
  }
}