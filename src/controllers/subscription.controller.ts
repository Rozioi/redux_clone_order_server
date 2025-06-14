import { FastifyReply, FastifyRequest } from "fastify";
import { SubscriptionService } from "../services/subscription.service";
import { IAdminSubscriptionRequest, IUserSubscriptionRequest } from "../interface/subscription.interface";

export class SubscriptionController {
  async createSubscription(req: FastifyRequest<{Body: IAdminSubscriptionRequest}>, reply: FastifyReply) {
    try {
      const result = await SubscriptionService.createSubscription(req.body);
      return reply.status(201).send({ id: result });
    } catch(err) {
      return reply.status(500).send(err);
    }
  }

  async getAllSubscriptions(req: FastifyRequest, reply: FastifyReply) {
    try {
      const subscriptions = await SubscriptionService.getAllSubscriptions();
      return reply.send(subscriptions);
    } catch(err) {
      return reply.status(500).send(err);
    }
  }

  async getSubscriptionById(req: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
    try {
      const subscription = await SubscriptionService.getSubscriptionById(req.params.id);
      if (!subscription) {
        return reply.status(404).send({ message: 'Subscription not found' });
      }
      return reply.send(subscription);
    } catch(err) {
      return reply.status(500).send(err);
    }
  }

  async updateSubscription(
    req: FastifyRequest<{
      Params: {id: string};
      Body: Partial<IAdminSubscriptionRequest>;
    }>,
    reply: FastifyReply
  ) {
    try {
      const success = await SubscriptionService.updateSubscription(req.params.id, req.body);
      if (!success) {
        return reply.status(404).send({ message: 'Subscription not found' });
      }
      return reply.send({ message: 'Subscription updated successfully' });
    } catch(err) {
      return reply.status(500).send(err);
    }
  }

  async deleteSubscription(req: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
    try {
      const success = await SubscriptionService.deleteSubscription(req.params.id);
      if (!success) {
        return reply.status(404).send({ message: 'Subscription not found' });
      }
      return reply.send({ message: 'Subscription deleted successfully' });
    } catch(err) {
      return reply.status(500).send(err);
    }
  }

  async getActiveSubscriptions(req: FastifyRequest, reply: FastifyReply) {
    try {
      const subscriptions = await SubscriptionService.getActiveSubscriptions();
      return reply.send(subscriptions);
    } catch(err) {
      return reply.status(500).send(err);
    }
  }

  // Методы для работы с подписками пользователей
  async createUserSubscription(
    req: FastifyRequest<{Body: IUserSubscriptionRequest}>,
    reply: FastifyReply
  ) {
    try {
      const result = await SubscriptionService.createUserSubscription(req.body);
      return reply.status(201).send({ id: result });
    } catch(err) {
      return reply.status(500).send(err);
    }
  }

  async getUserActiveSubscription(
    req: FastifyRequest<{Params: {userId: string}}>,
    reply: FastifyReply
  ) {
    try {
      const subscription = await SubscriptionService.getUserActiveSubscription(req.params.userId);
      if (!subscription) {
        return reply.status(404).send({ message: 'No active subscription found' });
      }
      return reply.send(subscription);
    } catch(err) {
      return reply.status(500).send(err);
    }
  }

  async getUserSubscriptions(
    req: FastifyRequest<{Params: {userId: string}}>,
    reply: FastifyReply
  ) {
    try {
      const subscriptions = await SubscriptionService.getUserSubscriptions(req.params.userId);
      return reply.send(subscriptions);
    } catch(err) {
      return reply.status(500).send(err);
    }
  }

  async extendUserSubscription(
    req: FastifyRequest<{
      Params: {userId: string; subscriptionId: string};
      Body: {durationDays: number};
    }>,
    reply: FastifyReply
  ) {
    try {
      const success = await SubscriptionService.extendUserSubscription(
        req.params.userId,
        req.params.subscriptionId,
        req.body.durationDays
      );
      if (!success) {
        return reply.status(404).send({ message: 'Subscription not found' });
      }
      return reply.send({ message: 'Subscription extended successfully' });
    } catch(err) {
      return reply.status(500).send(err);
    }
  }

  async cancelUserSubscription(
    req: FastifyRequest<{
      Params: {userId: string; subscriptionId: string};
    }>,
    reply: FastifyReply
  ) {
    try {
      const success = await SubscriptionService.cancelUserSubscription(
        req.params.userId,
        req.params.subscriptionId
      );
      if (!success) {
        return reply.status(404).send({ success: false, message: 'Subscription not found' });
      }
      return reply.send({success: true, message: 'Subscription cancelled successfully' });
    } catch(err) {
      return reply.status(500).send(err);
    }
  }
}

export const subscriptionController = new SubscriptionController(); 