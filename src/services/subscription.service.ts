import { ObjectId } from "mongodb";
import { mongoClient } from "../app";
import { IAdminSubscription, IAdminSubscriptionRequest, IPublicSubscription } from "../interface/subscription.interface";
import { ISubscription } from "../interface/permission.interface";

export class SubscriptionService {
  private static readonly SUBSCRIPTIONS_COLLECTION = 'subscriptions';
  

  static async createSubscription(data: IAdminSubscriptionRequest): Promise<string> {
    try {
      const subscriptionDoc = {
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        allowedCategories: data.allowedCategories.map(id => new ObjectId(id))
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
        id: sub._id.toString(),
        allowedCategories: sub.allowedCategories.map((id: ObjectId) => id.toString())
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
      const subscriptions = await mongoClient.FindDocFieldsByFilter(this.SUBSCRIPTIONS_COLLECTION, {_id: new ObjectId(id)});
      const subscription = subscriptions[0];
      if (!subscription) return null;

      return {
        ...subscription,
        id: subscription._id.toString(),
        allowedCategories: subscription.allowedCategories.map((id: ObjectId) => id.toString())
      } as IAdminSubscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw new Error('Failed to get subscription');
    }
  }

  /**
   * Обновление подписки (админ)
   */
  static async updateSubscription(
    id: string,
    data: Partial<IAdminSubscriptionRequest>
  ): Promise<boolean> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: new Date()
      };

      if (data.allowedCategories) {
        updateData.allowedCategories = data.allowedCategories.map(id => new ObjectId(id));
      }

      const result = await mongoClient.FindOneAndUpdate(
        this.SUBSCRIPTIONS_COLLECTION, 
        {_id: new ObjectId(id)}, 
        {$set: updateData}
      );
      return result && result.lastErrorObject && result.lastErrorObject.updatedExisting;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Изменение статуса подписки (админ)
   */
  static async toggleSubscriptionStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
      const result = await mongoClient.ModifyOneDocument(
        this.SUBSCRIPTIONS_COLLECTION,
        { $set: { isActive, updatedAt: new Date() } },
        { _id: new ObjectId(id) }
      );
      return result.modifiedCount === 1;
    } catch (error) {
      console.error('Error toggling subscription status:', error);
      throw new Error('Failed to toggle subscription status');
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
      return result.deletedCount === 1;
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
      const subscriptions = await mongoClient.FindDocFieldsByFilter(this.SUBSCRIPTIONS_COLLECTION, {isActive: true});

      return subscriptions.map((sub: any) => ({
        id: sub._id.toString(),
        name: sub.name,
        description: sub.description,
        price: sub.price,
        level: sub.level,
        logo: sub.logo,
        features: sub.features,
        durationDays: sub.durationDays
      })) as IPublicSubscription[];
    } catch (error) {
      console.error('Error getting active subscriptions:', error);
      throw new Error('Failed to get active subscriptions');
    }
  }
}