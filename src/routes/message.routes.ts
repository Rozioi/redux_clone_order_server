import { FastifyInstance } from 'fastify';
import { MessageController } from '../controllers/message.controller';
import { TRouteFunction } from '../utils/fastify-route';

export const MessageRoutes: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
  fastify.get('/messages/:userId', MessageController.getMessages);
  fastify.put('/messages/:messageId/read', MessageController.markAsRead);
  fastify.post('/messages', MessageController.createMessage);
  
  done();
}; 