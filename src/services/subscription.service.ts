import { ObjectId } from "mongodb";
import { mongoClient } from "../app";
import { IAdminSubscription, IAdminSubscriptionRequest, IPublicSubscription, IUserSubscriptionRequest, IUserSubscription } from "../interface/subscription.interface";

export class SubscriptionService {
  private static readonly SUBSCRIPTIONS_COLLECTION = 'subscriptions';
  private static readonly USER_SUBSCRIPTIONS_COLLECTION = 'user_subscriptions';

  static async createSubscription(data: IAdminSubscriptionRequest): Promise<string> {
    try {
      const subscriptionDoc = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await mongoClient.InsertDocumentWithIndex(this.SUBSCRIPTIONS_COLLECTION, subscriptionDoc);

      if (!result.insertedId) {
        throw new Error('Failed to create subscription');
      }

      return result.insertedId.toString();
    } catch (error) {
      console.error('Subscription creation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Subscription creation failed');
    }
  }

  /**
   * Получение всех подписок (админ)
   */
  static async getAllSubscriptions(): Promise<IAdminSubscription[]> {
    try {
      const subscriptions = await mongoClient.FindDocFieldsByFilter(
        this.SUBSCRIPTIONS_COLLECTION, 
        {}
      );

      return subscriptions.map((sub: any) => ({
        ...sub,
        id: sub._id.toString()
      })) as IAdminSubscription[];
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      throw new Error('Failed to get subscriptions');
    }
  }

  /**
   * Получение подписки по ID (админ)
   */
  static async getSubscriptionById(id: string): Promise<IAdminSubscription | null> {
    try {
      const subscriptions = await mongoClient.FindDocFieldsByFilter(
        this.SUBSCRIPTIONS_COLLECTION, 
        { _id: new ObjectId(id) }
      );
      const subscription = subscriptions[0];
      if (!subscription) return null;

      return {
        ...subscription,
        id: subscription._id.toString()
      } as IAdminSubscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw new Error('Failed to get subscription');
    }
  }

  /**
   * Обновление подписки (админ)
   */
  static async updateSubscription(id: string, data: Partial<IAdminSubscriptionRequest>): Promise<boolean> {
    try {
      const result = await mongoClient.FindOneAndUpdate(
        this.SUBSCRIPTIONS_COLLECTION,
        { _id: new ObjectId(id) },
        {
          $set: {
            ...data,
            updatedAt: new Date()
          }
        }
      );

      return result && result.lastErrorObject && result.lastErrorObject.updatedExisting;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Удаление подписки (админ)
   */
  static async deleteSubscription(id: string): Promise<boolean> {
    try {
      const result = await mongoClient.DeleteDocument(
        this.SUBSCRIPTIONS_COLLECTION,
        { _id: new ObjectId(id) }
      );

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw new Error('Failed to delete subscription');
    }
  }

  /**
   * Получение активных подписок (публичный)
   */
  static async getActiveSubscriptions(): Promise<IPublicSubscription[]> {
    try {
      const subscriptions = await mongoClient.FindDocFieldsByFilter(
        this.SUBSCRIPTIONS_COLLECTION,
        { isActive: true }
      );

      return subscriptions.map((sub: any) => ({
        ...sub,
        id: sub._id.toString()
      })) as IPublicSubscription[];
    } catch (error) {
      console.error('Error getting active subscriptions:', error);
      throw new Error('Failed to get active subscriptions');
    }
  }

  /**
   * Создание подписки для пользователя
   */
  static async createUserSubscription(data: IUserSubscriptionRequest): Promise<string> {
    try {
      const subscription = await this.getSubscriptionById(data.subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const startDate = new Date();
      const durationDays = data.durationDays || subscription.durationDays;
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const userSubscriptionDoc = {
        userId: new ObjectId(data.userId),
        subscriptionId: new ObjectId(data.subscriptionId),
        startDate,
        endDate,
        isActive: false,
        createdAt: new Date(),
  
        updatedAt: new Date()
      };

      const result = await mongoClient.InsertDocumentWithIndex(
        this.USER_SUBSCRIPTIONS_COLLECTION,
        userSubscriptionDoc
      );

      if (!result.insertedId) {
        throw new Error('Failed to create user subscription');
      }

      return result.insertedId.toString();
    } catch (error) {
      console.error('User subscription creation error:', error);
      throw new Error(error instanceof Error ? error.message : 'User subscription creation failed');
    }
  }

  /**
   * Получение активной подписки пользователя
   */
  static async getUserActiveSubscription(userId: string): Promise<IUserSubscription | null> {
    try {
      const subscriptions = await mongoClient.FindDocFieldsByFilter(
        this.USER_SUBSCRIPTIONS_COLLECTION,
        {
          userId: new ObjectId(userId),
          isActive: true,
          endDate: { $gt: new Date() }
        }
      );

      if (!subscriptions.length) return null;

      const subscription = subscriptions[0];
      const subscriptionDetails = await this.getSubscriptionById(subscription.subscriptionId.toString());

      return {
        ...subscription,
        id: subscription._id.toString(),
        userId: subscription.userId.toString(),
        subscriptionId: subscription.subscriptionId.toString(),
        subscription: subscriptionDetails as IPublicSubscription
      } as IUserSubscription;
    } catch (error) {
      console.error('Error getting user active subscription:', error);
      throw new Error('Failed to get user active subscription');
    }
  }

  /**
   * Получение всех подписок пользователя
   */
  static async getUserSubscriptions(userId: string): Promise<IUserSubscription[]> {
    try {
      const subscriptions = await mongoClient.FindDocFieldsByFilter(
        this.USER_SUBSCRIPTIONS_COLLECTION,
        { userId: new ObjectId(userId) }
      );

      const subscriptionsWithDetails = await Promise.all(
        subscriptions.map(async (sub: any) => {
          const subscriptionDetails = await this.getSubscriptionById(sub.subscriptionId.toString());
          return {
            ...sub,
            id: sub._id.toString(),
            userId: sub.userId.toString(),
            subscriptionId: sub.subscriptionId.toString(),
            subscription: subscriptionDetails as IPublicSubscription
          };
        })
      );

      return subscriptionsWithDetails as IUserSubscription[];
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      throw new Error('Failed to get user subscriptions');
    }
  }

  /**
   * Продление подписки пользователя
   */
  static async extendUserSubscription(
    userId: string,
    subscriptionId: string,
    durationDays: number
  ): Promise<boolean> {
    try {
      const subscriptions = await mongoClient.FindDocFieldsByFilter(
        this.USER_SUBSCRIPTIONS_COLLECTION,
        {
          userId: new ObjectId(userId),
          subscriptionId: new ObjectId(subscriptionId)
        }
      );

      if (!subscriptions.length) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptions[0];
      const newEndDate = new Date(subscription.endDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const result = await mongoClient.FindOneAndUpdate(
        this.USER_SUBSCRIPTIONS_COLLECTION,
        {
          userId: new ObjectId(userId),
          subscriptionId: new ObjectId(subscriptionId)
        },
        {
          $set: {
            endDate: newEndDate,
            updatedAt: new Date()
          }
        }
      );

      return result && result.lastErrorObject && result.lastErrorObject.updatedExisting;
    } catch (error) {
      console.error('Error extending user subscription:', error);
      throw new Error('Failed to extend user subscription');
    }
  }

  /**
   * Отмена подписки пользователя
   */
  static async cancelUserSubscription(userId: string, subscriptionId: string): Promise<boolean> {
    try {
      
      const result = await mongoClient.DeleteDocument(
        this.USER_SUBSCRIPTIONS_COLLECTION,
        {
          userId: new ObjectId(userId),
          _id: new ObjectId(subscriptionId)
        }
        
      );
      console.log(result);

      return result.deletedCount > 0 ? true : false
    } catch (error) {
      console.error('Error canceling user subscription:', error);
      throw new Error('Failed to cancel user subscription');
    }
  }
}