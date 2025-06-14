import { ObjectId } from "mongodb";
import { PermissionService } from "./permission.service";
import { IUserBadgeResponse } from "../interface/user.interface";
import { isValid } from "zod";
import { mongoClient } from "../app";

export class AdminService {
  private static readonly MODS_COLLECTION = 'mods';
  private static readonly USERS_COLLECTION = 'users';
  private static readonly CATEGORY_COLLECTION = 'categories';
  private static readonly ADMIN_COLLECTION = 'admins';
  private static readonly BADGE_COLLECTION = 'badges';
  
  static async giveBadge(data: IUserBadgeResponse, adminUserId: ObjectId | string): Promise<{success: boolean; message: string}> {
    if (!(await PermissionService.hasPermission(adminUserId, 'users:assign_badge'))) {
      return { success: false, message: 'Недостаточно прав для выдачи бейджа' };
    }

    if (!ObjectId.isValid(data.userID)) {
      return { success: false, message: 'Некорректный ID пользователя' };
    }

    try {
      const userExists = await mongoClient.FindDocFieldsByFilter(
        'users', 
        { _id: new ObjectId(data.userID) }
      );
      
      if (!userExists) {
        return { success: false, message: 'Пользователь не найден' };
      }
    } catch (err) {
      console.error('Ошибка проверки пользователя:', err);
      return { success: false, message: 'Ошибка сервера при проверке пользователя' };
    }

    const badgeDoc = {
      userID: new ObjectId(data.userID),
      badge: data.badge,
      badgeType: data.badgeType,
      cssClass: data.cssClass || '',
      isActive: true,
      assignedAt: new Date(),
    };

    try {
      const existingBadge = await mongoClient.FindDocFieldsByFilter(this.BADGE_COLLECTION, {
        userID: badgeDoc.userID,
        badge: badgeDoc.badge
      });
      if (existingBadge && existingBadge.length > 0) {
        return { success: false, message: 'У пользователя уже есть такой бейдж' };
      }

      const result = await mongoClient.InsertDocumentWithIndex(this.BADGE_COLLECTION, badgeDoc);
      
      if (result.insertedId) {
        return { success: true, message: 'Бейдж успешно выдан' };
      } else {
        return { success: false, message: 'Не удалось выдать бейдж' };
      }
    } catch (err) {
      console.error('Ошибка выдачи бейджа:', err);
      return { success: false, message: 'Ошибка сервера при выдаче бейджа' };
    }
  }

  static async updateUserRole(userId: string, role: string): Promise<boolean> {
    try {
      const result = await mongoClient.FindOneAndUpdate(
        this.USERS_COLLECTION,
        { _id: new ObjectId(userId) },
        { $set: { role } }
      );
      return result.modifiedCount > 0;
    } catch (err) {
      console.error('Ошибка обновления роли пользователя:', err);
      return false;
    }
  }

  static async updateUserStatus(userId: string, isActive: boolean): Promise<boolean> {
    try {
      const result = await mongoClient.FindOneAndUpdate(
        this.USERS_COLLECTION,
        { _id: new ObjectId(userId) },
        { $set: { isActive } }
      );
      return result.modifiedCount > 0;
    } catch (err) {
      console.error('Ошибка обновления статуса пользователя:', err);
      return false;
    }
  }

  static async getUsers(): Promise<any[]> {
    try {
      return await mongoClient.FindDocFieldsByFilter(this.USERS_COLLECTION,{});
    } catch (err) {
      console.error('Ошибка получения пользователей:', err);
      return [];
    }
  }

  static async getPendingMods(): Promise<any[]> {
    try {
      return await mongoClient.FindDocFieldsByFilter(
        this.MODS_COLLECTION,
        { status: 'pending' }
      );
    } catch (err) {
      console.error('Ошибка получения ожидающих модов:', err);
      return [];
    }
  }

  static async approveMod(modId: string): Promise<boolean> {
    try {
      const result = await mongoClient.FindOneAndUpdate(
        this.MODS_COLLECTION,
        { _id: new ObjectId(modId) },
        { $set: { status: 'approved' } }
      );
      return result.modifiedCount > 0;
    } catch (err) {
      console.error('Ошибка одобрения мода:', err);
      return false;
    }
  }

  static async rejectMod(modId: string): Promise<boolean> {
    try {
      const result = await mongoClient.FindOneAndUpdate(
        this.MODS_COLLECTION,
        { _id: new ObjectId(modId) },
        { $set: { status: 'rejected' } }
      );
      return result.modifiedCount > 0;
    } catch (err) {
      console.error('Ошибка отклонения мода:', err);
      return false;
    }
  }

  static async getModById(modId: string): Promise<any> {
    try {
      const mod = await mongoClient.FindDocFieldsByFilter(
        this.MODS_COLLECTION,
        { _id: new ObjectId(modId) }
      );
      return mod[0] || null;
    } catch (err) {
      console.error('Ошибка получения мода:', err);
      return null;
    }
  }
}