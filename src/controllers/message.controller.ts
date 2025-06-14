import { FastifyRequest, FastifyReply } from 'fastify';
import { mongoClient } from '../app';
import { ObjectId } from 'mongodb';

export const MessageController = {
  async getMessages(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    try {
      const { userId } = req.params;
      const messages = await mongoClient.FindDocFieldsByFilter('messages', {
        userId: new ObjectId(userId)
      });
      
      return reply.status(200).send({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async markAsRead(req: FastifyRequest<{ Params: { messageId: string } }>, reply: FastifyReply) {
    try {
      const { messageId } = req.params;
      await mongoClient.FindOneAndUpdate(
        'messages',
        { _id: new ObjectId(messageId) },
        { isRead: true }
      );
      
      return reply.status(200).send({
        success: true,
        message: 'Message marked as read'
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async createMessage(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const message = {
        ...req.body,
        createdAt: new Date(),
        isRead: false
      };
      
      const result = await mongoClient.InsertDocument('messages', message);
      
      return reply.status(201).send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error creating message:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}; 