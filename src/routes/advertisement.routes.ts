import { FastifyInstance } from 'fastify';
import { AdvertisementController } from '../controllers/advertisement.controller';
import { TRouteFunction } from '../utils/fastify-route';

export const AdvertisementRoutes: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
  fastify.get('/advertisements', AdvertisementController.getAdvertisements);
  fastify.get('/admin/advertisements', AdvertisementController.getAdvertisementsForAdmin );
  fastify.post('/advertisements', AdvertisementController.createAdvertisement);
  fastify.put('/advertisements/:id', AdvertisementController.updateAdvertisement);
  fastify.delete('/advertisements/:id', AdvertisementController.deleteAdvertisement);
  fastify.post('/advertisements/:id/clicks', AdvertisementController.incrementClicks);
  
  done();
}; 