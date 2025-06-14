import { FastifyInstance, RouteGenericInterface, FastifyRequest, preHandlerHookHandler } from "fastify";
import { TRouteFunction } from "../utils/fastify-route";
import { adminController } from "../controllers/admin.controller";
import { checkPermission } from "../middleware/permission.middleware";
import { ICategoryRequest } from "../interface/category.interface";
import { AuthenticatedUser } from "../interface/request.interface";
import { subscriptionController } from "../controllers/subscription.controller";
import { IAdminSubscriptionRequest, IUserSubscriptionRequest } from "../interface/subscription.interface";
import { UserService } from "../services/user.service";
import { userController } from "../controllers/user.controller";
import { mongoClient } from "../app";
import { ObjectId } from "mongodb";

interface CategoryParams {
  id: string;
}

interface PermissionParams {
  userId: string;
}

interface ModParams {
  id: string;
}

// Расширяем типы для запросов с аутентификацией
interface AuthenticatedRouteGeneric extends RouteGenericInterface {
  Request: FastifyRequest & { user: AuthenticatedUser };
}

export const AdminRoutes: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
  // // Аутентификация
  // fastify.post('/admin/login', adminController.loginAdmin);
  // fastify.post('/admin/verify', adminController.verifyAdminLogin);

  // // Категории
  // fastify.post<AuthenticatedRouteGeneric & { Body: ICategoryRequest }>('/categories', {
  //   preHandler: []
  // }, adminController.createCategory);
  
  // fastify.get('/category/:id', adminController.getCategoryById as any);

  fastify.get('/admin/users', async (req,reply) => {
    const res = await mongoClient.FindDocFieldsByFilter('users', {});
    return reply.status(200).send(res);
  });

  // fastify.put<AuthenticatedRouteGeneric & { 
  //   Params: CategoryParams;
  //   Body: Partial<ICategoryRequest>;
  // }>('/categories/:id', {
  //   preHandler: [
  //     fastify.verifyJWT as preHandlerHookHandler,
  //     checkPermission('canManageCategories') as preHandlerHookHandler
  //   ]
  // }, adminController.updateCategory as any);

  // fastify.delete<AuthenticatedRouteGeneric & {
  //   Params: CategoryParams;
  // }>('/categories/:id', {
  //   preHandler: [
  //     fastify.verifyJWT as preHandlerHookHandler,
  //     checkPermission('canManageCategories') as preHandlerHookHandler
  //   ]
  // }, adminController.deleteCategory as any);

  // // Управление правами
  // fastify.post<AuthenticatedRouteGeneric & {
  //   Body: IUserPermissionRequest
  // }>('/permissions', {
  //   preHandler: [
  //     fastify.verifyJWT as preHandlerHookHandler,
  //     checkPermission('canManageUsers') as preHandlerHookHandler
  //   ]
  // }, adminController.createPermission as any);

  // fastify.put<AuthenticatedRouteGeneric & {
  //   Params: PermissionParams;
  //   Body: Partial<IUserPermissionRequest>;
  // }>('/permissions/:userId', {
  //   preHandler: [
  //     fastify.verifyJWT as preHandlerHookHandler,
  //     checkPermission('canManageUsers') as preHandlerHookHandler
  //   ]
  // }, adminController.updatePermissions as any);

  // // Модерация модов
  // fastify.get<AuthenticatedRouteGeneric>('/mods/pending', {
  //   preHandler: [
  //     fastify.verifyJWT as preHandlerHookHandler,
  //     checkPermission('canModerateMods') as preHandlerHookHandler
  //   ]
  // }, adminController.getPendingMods as any);

  fastify.patch<AuthenticatedRouteGeneric & {
    Params: {id: string};
  }>('/admin/mods/:id/approve', {
    preHandler: [
      fastify.verifyJWT as preHandlerHookHandler,
    ]
  }, adminController.approveMod as any);

  // fastify.post<AuthenticatedRouteGeneric & {
  //   Params: ModParams;
  // }>('/mods/:id/reject', {
  //   preHandler: [
  //     fastify.verifyJWT as preHandlerHookHandler,
  //     checkPermission('canModerateMods') as preHandlerHookHandler
  //   ]
  // }, adminController.rejectMod as any);

  // // Получение информации о конкретном моде
  // fastify.get<AuthenticatedRouteGeneric & {
  //   Params: ModParams;
  // }>('/mods/:id', {
  //   preHandler: [
  //     fastify.verifyJWT as preHandlerHookHandler,
  //     checkPermission('canModerateMods') as preHandlerHookHandler
  //   ]
  // }, adminController.getModById as any);

  // // Управление пользователями
  // fastify.put<AuthenticatedRouteGeneric & {
  //   Params: { userId: string };
  //   Body: { role: string };
  // }>('/admin/users/:userId/role', {
  //   preHandler: [
  //     fastify.verifyJWT as preHandlerHookHandler,
  //     checkPermission('canManageUsers') as preHandlerHookHandler
  //   ]
  // }, adminController.updateUserRole as any);

  // Subscription routes
  fastify.post<AuthenticatedRouteGeneric & { Body: IAdminSubscriptionRequest }>('/subscriptions', {
    preHandler: [
      fastify.verifyJWT as preHandlerHookHandler,
      
    ]
  }, subscriptionController.createSubscription as any);

  fastify.get<AuthenticatedRouteGeneric>('/subscriptions', {
    preHandler: [
      // fastify.verifyJWT as preHandlerHookHandler,
     
    ]
  }, subscriptionController.getAllSubscriptions as any);

  fastify.get<AuthenticatedRouteGeneric & { Params: { id: string } }>('/subscriptions/:id', {
    preHandler: [
      fastify.verifyJWT as preHandlerHookHandler,
     
    ]
  }, subscriptionController.getSubscriptionById as any);

  fastify.put<AuthenticatedRouteGeneric & { 
    Params: { id: string };
    Body: Partial<IAdminSubscriptionRequest>;
  }>('/subscriptions/:id', {
    preHandler: [
      fastify.verifyJWT as preHandlerHookHandler,
    ]
  }, async (req, reply) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Обновляем подписку в базе данных
      const result = await mongoClient.FindOneAndUpdate(
        'subscriptions',
        { _id: new ObjectId(id) },
        { 
          
            ...updateData,
            updatedAt: new Date()
          
        }
      );

      if (result.modifiedCount === 0) {
        return reply.status(404).send({ error: 'Подписка не найдена' });
      }  

      // Получаем обновленную подписку
      const updatedSubscription = await mongoClient.FindDocFieldsByFilter('subscriptions', { _id: new ObjectId(id) });
      return reply.send({ data: updatedSubscription });
    } catch (error) {
      console.error('Error updating subscription:', error);
      return reply.status(500).send({ error: 'Ошибка при обновлении подписки' });
    }
  });

  fastify.delete<AuthenticatedRouteGeneric & { Params: { id: string } }>('/subscriptions/:id', {
    preHandler: [
      fastify.verifyJWT as preHandlerHookHandler,
     
    ]
  }, subscriptionController.deleteSubscription as any);

  // Публичный маршрут для получения активных подписок
  fastify.get('/public/subscriptions', subscriptionController.getActiveSubscriptions as any);

  fastify.post<AuthenticatedRouteGeneric & {Body: {
          userId: string;
          badge: string;
          badgeType?: string;
          cssClass?: string;
        } 
      }>('/admin/badge', {preHandler:[ fastify.verifyJWT as preHandlerHookHandler], handler: adminController.giveBadge as any})

  // Маршруты для управления подписками пользователей
  fastify.post<AuthenticatedRouteGeneric & { Body: IUserSubscriptionRequest }>('/user-subscriptions', {
    preHandler: [
      fastify.verifyJWT as preHandlerHookHandler
    ]
  }, subscriptionController.createUserSubscription as any);

  fastify.get<AuthenticatedRouteGeneric & { Params: { userId: string } }>('/user-subscriptions/:userId/active', {
    preHandler: [
      fastify.verifyJWT as preHandlerHookHandler
    ]
  }, subscriptionController.getUserActiveSubscription as any);

  fastify.get<AuthenticatedRouteGeneric & { Params: { userId: string } }>('/user-subscriptions/:userId', {
    preHandler: [
      fastify.verifyJWT as preHandlerHookHandler
    ]
  }, subscriptionController.getUserSubscriptions as any);

  fastify.post<AuthenticatedRouteGeneric & {
    Params: { userId: string; subscriptionId: string };
    Body: { durationDays: number };
  }>('/user-subscriptions/:userId/:subscriptionId/extend', {
    preHandler: [
      fastify.verifyJWT as preHandlerHookHandler
    ]
  }, subscriptionController.extendUserSubscription as any);

  fastify.post<AuthenticatedRouteGeneric & {
    Params: { userId: string; subscriptionId: string };
  }>('/user-subscriptions/:userId/:subscriptionId/cancel', {
    preHandler: [
      fastify.verifyJWT as preHandlerHookHandler
    ]
  }, subscriptionController.cancelUserSubscription as any);

  done();
};