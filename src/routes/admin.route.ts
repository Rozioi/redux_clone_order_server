import { FastifyInstance, RouteGenericInterface, FastifyRequest, preHandlerHookHandler } from "fastify";
import { TRouteFunction } from "../utils/fastify-route";
import { adminController } from "../controllers/admin.controller";
import { checkPermission } from "../middleware/permission.middleware";
import { ICategoryRequest } from "../interface/category.interface";
import { AuthenticatedUser } from "../interface/request.interface";
import { subscriptionController } from "../controllers/subscription.controller";

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
  fastify.post<AuthenticatedRouteGeneric & { Body: ICategoryRequest }>('/categories', {
    preHandler: [
    ]
  }, adminController.createCategory);

  fastify.get('/categories', adminController.getAllCategories as any);
  fastify.get('/category/:id', adminController.getCategoryById  as any)

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

  // fastify.post<AuthenticatedRouteGeneric & {
  //   Params: ModParams;
  // }>('/mods/:id/approve', {
  //   preHandler: [
  //     fastify.verifyJWT as preHandlerHookHandler,
  //     checkPermission('canModerateMods') as preHandlerHookHandler
  //   ]
  // }, adminController.approveMod as any);

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

  // // Subscription routes
  // fastify.post('/subscriptions', {
  //   preHandler: [
  //     fastify.verifyJWT as preHandlerHookHandler,
  //     checkPermission('canManageSubscriptions') as preHandlerHookHandler
  //   ]
  // },
  // subscriptionController.createSubscription as any
  // );

  // // fastify.get<AuthenticatedRouteGeneric>('/subscriptions', {
  // //   preHandler: [
  // //     fastify.verifyJWT as preHandlerHookHandler,
  // //     checkPermission('canManageSubscriptions') as preHandlerHookHandler
  // //   ],
  // //   handler: SubscriptionController.GetAllSubscriptions as any
  // // });

  // // fastify.get<AuthenticatedRouteGeneric & { Params: { id: string } }>('/subscriptions/:id', {
  // //   preHandler: [
  // //     fastify.verifyJWT as preHandlerHookHandler,
  // //     checkPermission('canManageSubscriptions') as preHandlerHookHandler
  // //   ],
  // //   handler: SubscriptionController.GetSubscriptionById as any
  // // });

  // // fastify.put<AuthenticatedRouteGeneric & { Params: { id: string } }>('/subscriptions/:id', {
  // //   preHandler: [
  // //     fastify.verifyJWT as preHandlerHookHandler,
  // //     checkPermission('canManageSubscriptions') as preHandlerHookHandler
  // //   ],
  // //   handler: SubscriptionController.UpdateSubscription as any
  // // });

  // // fastify.delete<AuthenticatedRouteGeneric & { Params: { id: string } }>('/subscriptions/:id', {
  // //   preHandler: [
  // //     fastify.verifyJWT as preHandlerHookHandler,
  // //     checkPermission('canManageSubscriptions') as preHandlerHookHandler
  // //   ],
  // //   handler: SubscriptionController.DeleteSubscription as any
  // // });

  done();
};