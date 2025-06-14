import { FastifyRequest, FastifyReply } from 'fastify';
import { mongoClient } from '../app';
import { ObjectId } from 'mongodb';

interface IAdvertisement {
  _id: ObjectId;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  clicks: number;
  buttonText: string;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
interface IAdvertisementReq {
  
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  buttonText: string;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export const AdvertisementController = {
  async getAdvertisements(req: FastifyRequest, reply: FastifyReply) {
    try {
      const advertisements = await mongoClient.FindDocFieldsByFilter('advertisements', {
        isActive: true
      });
      
      return reply.status(200).send({
        success: true,
        data: advertisements.sort((a: IAdvertisement, b: IAdvertisement) => a.position - b.position)
      });
    } catch (error) {
      console.error('Error getting advertisements:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  async getAdvertisementsForAdmin(req: FastifyRequest, reply: FastifyReply) {
    try {
      const advertisements = await mongoClient.FindDocFieldsByFilter('advertisements', {
      });
      
      return reply.status(200).send({
        success: true,
        data: advertisements.sort((a: IAdvertisement, b: IAdvertisement) => a.position - b.position)
      });
    } catch (error) {
      console.error('Error getting advertisements:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  async createAdvertisement(req: FastifyRequest<{ Body: Omit<IAdvertisement, '_id' | 'createdAt' | 'updatedAt'> }>, reply: FastifyReply) {
    try {
      const advertisement: Omit<IAdvertisement, '_id'> = {
        ...req.body,
        clicks: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await mongoClient.InsertDocumentWithIndex('advertisements', advertisement);
      
      return reply.status(201).send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error creating advertisement:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async updateAdvertisement(req: FastifyRequest<{ Params: { id: string }, Body: Partial<IAdvertisement> }>, reply: FastifyReply) {
    try {
      const { id } = req.params;
      const { _id, ...rest} = req.body;
      const updateData: Partial<IAdvertisement> = {
        ...rest,
        updatedAt: new Date()
      };
      
      const result = await mongoClient.FindOneAndUpdate(
        'advertisements',
        { _id: new ObjectId(id) },
        updateData
      );
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error updating advertisement:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async deleteAdvertisement(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = req.params;
      await mongoClient.DeleteDocument('advertisements', { _id: new ObjectId(id) });
      
      return reply.status(200).send({
        success: true,
        message: 'Advertisement deleted'
      });
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async incrementClicks(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = req.params;
      const result = await mongoClient.ModifyOneDocument(
        'advertisements',
        { $inc: { clicks: 1 } },
        { _id: new ObjectId(id) }
      );
      
      if (result.matchedCount === 0) {
        return reply.status(404).send({ error: 'Advertisement not found' });
      }
      
      return reply.send({ success: true });
    } catch (error) {
      console.error('Error incrementing clicks:', error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}; 