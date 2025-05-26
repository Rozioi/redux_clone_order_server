import { FastifyInstance, RouteGenericInterface } from "fastify";
import { TRouteFunction } from "../utils/fastify-route";
import { UserService } from '../services/user.service';
import { ModService } from '../services/mod.service';
import { AuthenticatedRequest } from "../interface/request.interface";
import { IMod } from "../interface/mod.interface";

interface UserStats {
  totalMods: number;
  approvedMods: number;
  pendingMods: number;
  rejectedMods: number;
  rating: number;
}

interface ErrorResponse {
  message: string;
}

interface UserModsResponse {
  mods: Array<{
    _id: string;
    name: string;
    status: IMod['status'];
    createdAt: string;
  }>;
  total: number;
}

interface StatsRoute extends RouteGenericInterface {
  Request: AuthenticatedRequest;
  Reply: UserStats | ErrorResponse;
}

interface ModsRoute extends RouteGenericInterface {
  Request: AuthenticatedRequest;
  Reply: UserModsResponse | ErrorResponse;
}

export const ProfileRoutes: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
  // Получение статистики пользователя
  fastify.get<StatsRoute>('/profile/stats', {
    preHandler: [fastify.verifyJWT],
  }, async (request, reply) => {
    try {
      const userId = request.user._id;
      const rawStats = await UserService.getUserModStats(userId);
      
      if (!rawStats) {
        return reply.status(404).send({ message: 'User stats not found' });
      }

      // Преобразуем статистику в нужный формат
      const userStats: UserStats = {
        totalMods: rawStats.totalMods || 0,
        approvedMods: rawStats.approvedMods || 0,
        pendingMods: rawStats.pendingMods || 0,
        rejectedMods: rawStats.rejectedMods || 0,
        rating: rawStats.rating || 0
      };

      return reply.send(userStats);
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // Получение списка модов пользователя
  fastify.get<ModsRoute>('/profile/mods', {
    preHandler: [fastify.verifyJWT],
  }, async (request, reply) => {
    try {
      const userId = request.user._id;
      const userMods = await ModService.GetModsByUserId(userId);

      const response: UserModsResponse = {
        mods: userMods.map(mod => ({
          _id: mod._id.toString(),
          name: mod.modName,
          status: mod.status,
          createdAt: new Date(mod.createdAt).toISOString()
        })),
        total: userMods.length
      };

      return reply.send(response);
    } catch (error) {
      console.error('Failed to get user mods:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  done();
}; 