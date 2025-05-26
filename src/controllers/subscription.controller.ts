import { FastifyReply, FastifyRequest } from "fastify";
import { SubscriptionService } from "../services/subscription.service";
import { IAdminSubscriptionRequest } from "../interface/subscription.interface";

export class SubscriptionController {
  async createSubscription(req: FastifyRequest<{Body: IAdminSubscriptionRequest}>, reply: FastifyReply) {
    try {
      const result = await SubscriptionService.createSubscription(req.body);
      return result;
    } catch(err) {
      return reply.status(500).send(err);
    }
  }
}

export const subscriptionController = new SubscriptionController(); 