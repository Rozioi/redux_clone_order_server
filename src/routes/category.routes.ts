import { FastifyInstance } from 'fastify';
import { CategoryController } from '../controllers/category.controller';
import { TRouteFunction } from '../utils/fastify-route';
import { adminController } from '../controllers/admin.controller';

export const CategoryRoutes: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
  fastify.get('/categories', CategoryController.getCategories);
  fastify.get('/category/:id', CategoryController.getCategoryById);
  fastify.post('/categories', CategoryController.createCategory);
  fastify.put('/categories/:id', CategoryController.updateCategory);
  fastify.delete('/categories/:id', CategoryController.deleteCategory);
  
  done();
}; 