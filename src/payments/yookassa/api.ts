import {
  YooCheckout,
  IYooCheckoutOptions,
  ICreatePayment
} from "@a2seven/yoo-checkout";
import { config } from "../../config/env";
import { FastifyReply, FastifyRequest } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { PaymentSchema, transformYooKassaResponse } from "./models/Payment";
import { mongoClient } from "../../app";
import { ObjectId } from "mongodb";
import { SubscriptionService } from "../../services/subscription.service";
import crypto from 'crypto';

if (!config.YOUKASSA.SECRET_KEY || !config.YOUKASSA.SHOP_ID) {
  throw new Error("YooKassa SHOP_ID or SECRET_KEY is not set in .env");
}

const checkoutOptions: IYooCheckoutOptions = {
  shopId: config.YOUKASSA.SHOP_ID,
  secretKey: config.YOUKASSA.SECRET_KEY,
};

export const YouKassa = new YooCheckout(checkoutOptions);

interface NotificationPayload {
  type: string;
  object: {
    id: string;
    status: string;
    captured_at?: string;
    [key: string]: any;
  };
}

function verifyNotificationSignature(signature: string, body: string): boolean {
  try {
    const [version, timestamp, signatureValue] = signature.split(' ');
    if (version !== 'v1') return false;

    if (!config.YOUKASSA.SECRET_KEY) {
      throw new Error('YooKassa secret key is not set');
    }

    const hmac = crypto.createHmac('sha256', config.YOUKASSA.SECRET_KEY);
    hmac.update(body);
    const calculatedSignature = hmac.digest('hex');

    return calculatedSignature === signatureValue;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

async function activateSubscription(userId: string, subscriptionId: string) {
  try {
    // Получаем информацию о подписке
    const subscription = await SubscriptionService.getSubscriptionById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Создаем или обновляем подписку пользователя
    const subscriptionData = {
      userId: new ObjectId(userId),
      subscriptionId: subscriptionId,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + subscription.durationDays * 24 * 60 * 60 * 1000), // добавляем дни к текущей дате
      durationDays: subscription.durationDays,
      subscriptionType: subscription.level,
      subscriptionName: subscription.name
    };

    await mongoClient.FindOneAndUpdate(
      'user_subscriptions',
      { userId: new ObjectId(userId) },
      subscriptionData,
      { upsert: true } // создаст документ, если он не существует
    );

    console.log('Subscription activated successfully:', subscriptionData);
    return true;
  } catch (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }
}

export const YouKassaApi = {
  async CreatePaymnet(req: FastifyRequest<{Body: {value: string,userId: string ,subscriptionId: string}}>, reply: FastifyReply) {
    const createPayload: ICreatePayment = {
      amount: {
        value: req.body.value,
        currency: "RUB",
      },
      payment_method_data: {
        type: "bank_card",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: config.PAYMENT.SUCCESS_REDIRECT_URL,
      },
      metadata: {
        subscriiptionId: req.body.subscriptionId
      }
    };

    try {
      const idempotenceKey = uuidv4();
      await mongoClient.DeleteManyDocument("payments", {userId: req.body.userId})
      const payment = await YouKassa.createPayment(
        createPayload,
        idempotenceKey,
      );
      const transformed = transformYooKassaResponse(payment, req.body.userId, req.body.subscriptionId);
      const paymentDoc = await PaymentSchema.parseAsync(transformed);
      const result = await mongoClient.InsertDocumentWithIndex('payments', paymentDoc)
      const subscription = await SubscriptionService.getSubscriptionById(req.body.subscriptionId);
      const res = await SubscriptionService.createUserSubscription({ userId: req.body.userId, subscriptionId: req.body.subscriptionId, durationDays: subscription?.durationDays})
      const index = result.insertedId;
      return reply.status(200).send({payment: payment, index: index});
    } catch (error) {
      console.error("Payment error:", error);
      return reply.status(500).send({
        error: "Payment failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  async getInfoPayment(req: FastifyRequest<{Params: {paymentId: string}}>, reply: FastifyReply) {
    try {
      const { paymentId } = req.params;

      // Получаем информацию о платеже из ЮKassa
      const payment = await YouKassa.getPayment(paymentId);
      
      if (!payment) {
        return reply.status(404).send({
          success: false,
          message: "Платеж не найден в ЮKassa"
        });
      }

      // Получаем информацию о платеже из нашей базы
      const localPayments = await mongoClient.FindDocFieldsByFilter('payments', { paymentId });
      
      if (!localPayments || localPayments.length === 0) {
        return reply.status(404).send({
          success: false,
          message: "Платеж не найден в базе данных"
        });
      }

      const localPayment = localPayments[0];

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
          await activateSubscription(localPayment.userId, localPayment.subscriptionId);
        }
      }

      return reply.status(200).send({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          captured_at: payment.captured_at,
          created_at: payment.created_at,
          payment_method: payment.payment_method,
          metadata: payment.metadata
        }
      });
    } catch (error) {
      console.error('Error getting payment info:', error);
      return reply.status(500).send({
        success: false,
        message: "Ошибка при получении информации о платеже",
        error: error instanceof Error ? error.message : "Неизвестная ошибка"
      });
    }
  },
  async PaymentNotification(req: FastifyRequest<{Body: NotificationPayload}>, reply: FastifyReply) {
    try {
      // Проверяем, что запрос пришел методом POST
      if (req.method !== 'POST') {
        return reply.status(405).send({ 
          error: 'Method Not Allowed',
          message: 'Only POST requests are allowed for payment notifications'
        });
      }

      const signature = req.headers['signature'] as string;
      const rawBody = JSON.stringify(req.body);

      if (!signature || !verifyNotificationSignature(signature, rawBody)) {
        console.error('Invalid signature:', { signature, body: rawBody });
        return reply.status(401).send({ error: 'Invalid signature' });
      }

      const notificationData = req.body;
      
      if (notificationData.type !== 'notification' || !notificationData.object) {
        console.error('Invalid notification payload:', notificationData);
        return reply.status(400).send({ error: 'Invalid payload' });
      }
    
      const paymentData = notificationData.object;
      const paymentId = paymentData.id;
      const newStatus = paymentData.status;

      console.log('Processing payment notification:', { paymentId, newStatus });

      // Используем Promise.all для параллельного выполнения операций
      const [payments] = await Promise.all([
        mongoClient.FindDocFieldsByFilter('payments', { paymentId })
      ]);
    
      if (!payments || payments.length === 0) {
        console.error('Payment not found in database:', paymentId);
        return reply.status(404).send({ error: 'Payment not found' });
      }
    
      const localPayment = payments[0];
      console.log('Found local payment:', localPayment);

      // Обновляем платеж и подписку параллельно
      await Promise.all([
        mongoClient.FindOneAndUpdate(
          'payments',
          { paymentId: paymentId },
          {
            status: newStatus,
            raw: paymentData,
            capturedAt: paymentData.captured_at
              ? new Date(paymentData.captured_at)
              : undefined,
          }
        ),
        newStatus === 'succeeded' ? 
          activateSubscription(localPayment.userId, localPayment.subscriptionId) : 
          Promise.resolve()
      ]);
    
      console.log('Payment notification processed successfully');
      return reply.status(200).send({ status: 'OK' });
    } catch (err) {
      console.error('Payment notification error:', err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
};
