import { FastifyRequest, FastifyReply } from 'fastify';
import { mongoClient } from '../app';
import { ObjectId } from 'mongodb';
import { CategoryService } from '../services/category.service';

interface CategoryBody {
  name: string;
  parentId: ObjectId | null;
  order: number;
  isActive: boolean;
  requiresSubscription?: boolean;
  subscriptionId?: string;
}

export const CategoryController = {
  async getCategories(req: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await mongoClient.FindDocFieldsByFilter('categories', {});
      return reply.status(200).send({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async createCategory(req: FastifyRequest<{ Body: CategoryBody }>, reply: FastifyReply) {
    try {
      const category = {
        ...req.body,
        isPremium: false,
        allowedForFree: false
      };
      
      const result = await mongoClient.InsertDocumentWithIndex('categories', category);
      
      return reply.status(201).send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error creating category:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  },
  async getCategoryById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return reply.status(400).send({ error: "Invalid user ID" });
    }
    try {
      const categories = await CategoryService.getCategoryById(id);
      return reply.send(categories);
    } catch (error) {
      return reply.status(500).send({ message: 'Failed to get categories' });
    }
  },

  async updateCategory(req: FastifyRequest<{ Params: { id: string }, Body: CategoryBody }>, reply: FastifyReply) {
    try {
      const { id } = req.params;
      const result = await mongoClient.FindOneAndUpdate(
        'categories',
        { _id: new ObjectId(id) },
        req.body
      );
      
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error updating category:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async deleteCategory(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = req.params;
      await mongoClient.DeleteDocument('categories', { _id: new ObjectId(id) });
      
      return reply.status(200).send({
        success: true,
        message: 'Category deleted'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}; 