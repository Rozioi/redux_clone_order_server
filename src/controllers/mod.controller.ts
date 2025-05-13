import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";
import { IModRequest } from "../interface/mod.interface";
import { ModService } from "../services/mod.service";

export const ModController = {
  async CreateMod(req:FastifyRequest<{Body: IModRequest}>, reply:FastifyReply){
    try{
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
  async GetAllMOds(req:FastifyRequest, reply:FastifyReply){
    try{
      const result = await ModService.GetAllMOds();
      if (!result) return reply.status(404).send('There are no mods yet');
      return reply.status(200).send(result);
    } catch (error: unknown){
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
  }
}