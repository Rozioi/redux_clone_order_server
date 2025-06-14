import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../../utils/fastify-route";
import { YouKassa,YouKassaApi } from "./api";
import { mongoClient } from "../../app";
import { FastifyRequest } from "fastify/types/request";
import { ObjectId } from "mongodb";
import { YooKassaPaymentInput } from "./models/Payment";

export const YouKassaRoutes: TRouteFunction = (fastify:FastifyInstance, _opts, done) => {
  fastify.post('/payment', YouKassaApi.CreatePaymnet);
  fastify.post('/payment/notifications', YouKassaApi.PaymentNotification);
  fastify.get('/payment/:paymentId', YouKassaApi.getInfoPayment);
  fastify.get('/p/:id', async (req: FastifyRequest<{Params: {id: string}}>,reply) => {
    const { id } = req.params;
    const result: YooKassaPaymentInput[] = await mongoClient.FindDocFieldsByFilter('payments', { _id: new ObjectId(id) });
    return reply.status(200).send(result);
  })
  fastify.get('/pd/:id', async (req: FastifyRequest<{Params: {id: string}}>,reply) => {
    const { id } = req.params;
    const result: YooKassaPaymentInput[] = await mongoClient.FindDocFieldsByFilter('payments', {userId: id});
    return reply.status(200).send(result);
  })
  fastify.get('/p', async (req: FastifyRequest,reply) => {
    const result = await mongoClient.DeleteManyDocument('mods', { });
    return reply.status(200).send(result);
  })
  fastify.get('/ps/:id', async (req: FastifyRequest<{Params: {id: string}}>,reply) => {
    const { id } = req.params;
    const result = await mongoClient.DeleteDocument('user_subscriptions', {_id: new ObjectId(id)});
    return reply.status(200).send(result);
  })
  fastify.post('/payment/check', async (req: FastifyRequest<{Body: {userId: string}}>, reply) => {
    try {
      const { userId } = req.body;
      const result: YooKassaPaymentInput[] = await mongoClient.FindDocFieldsByFilter('payments', { userId: userId });
      console.log(result[0].paymentId);
      const paymentId = result[0].paymentId;
      // Получаем информацию о платеже из ЮKassa
      const payment = await YouKassa.getPayment(paymentId);
      console.log(payment.status);
      if (payment.status !== 'succeeded') {
        return reply.status(404).send({ success: false, message: 'Платеж не завершен' });
      }


      // Находим платеж в нашей базе
      const payments = await mongoClient.FindDocFieldsByFilter('payments', {
        paymentId,
        userId: userId
      });

      if (!payments || payments.length === 0) {
        return reply.status(404).send({ success: false, message: 'Платеж не найден в базе' });
      }

      const localPayment = payments[0];

      // Если статус платежа в ЮKassa отличается от нашего, обновляем его
      if (payment.status !== localPayment.status) {
        await mongoClient.FindOneAndUpdate(
          'payments',
          { paymentId },
          {
            status: payment.status,
            raw: payment,
            capturedAt: payment.captured_at ? new Date(payment.captured_at) : undefined
          }
        );

        // Если платеж успешен, активируем подписку
        if (payment.status === 'succeeded') {
          await mongoClient.FindOneAndUpdate(
            'user_subscriptions',
            { userId: new ObjectId(userId) },
            {
              isActive: true,
              startDate: new Date()
            }
          );
        }
      }

      return reply.status(200).send({ 
        success: true, 
        payment: {
          status: payment.status,
          amount: payment.amount,
          captured_at: payment.captured_at
        }
      });
    } catch (error) {
      console.error('Payment check error:', error);
      return reply.status(500).send({ 
        success: false, 
        message: 'Ошибка при проверке платежа' 
      });
    }
  });
  done();
}