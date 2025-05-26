import { ObjectId } from "mongodb";
import { IUserPermission, IUserPermissionRequest, UserRole, PermissionType } from "../interface/permission.interface";
import { mongoClient } from "../app";

export class PermissionService {
  private static readonly PERMISSIONS_COLLECTION = 'permissions';

  static async createPermission(data: Omit<IUserPermission, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const permissionDocument = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await mongoClient.InsertDocumentWithIndex(
        this.PERMISSIONS_COLLECTION,
        permissionDocument
      );

      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to create permission', error);
      throw new Error('Failed creating permission');
    }
  }

  static async getUserPermissions(userId: string): Promise<IUserPermission | null> {
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }
    try {
      return await mongoClient.FindDocFieldsByFilter(
        this.PERMISSIONS_COLLECTION,
        { userId: new ObjectId(userId) }
      );
    } catch (error) {
      console.error('Failed to get user permissions', error);
      throw new Error('Failed getting user permissions');
    }
  }

  static async updateUserPermissions(
    userId: string,
    permissions: Partial<Omit<IUserPermission, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }
    try {
      const updateData = {
        ...permissions,
        updatedAt: new Date()
      };

      const result = await mongoClient.ModifyOneDocument(
        this.PERMISSIONS_COLLECTION,
        { $set: updateData },
        { userId: new ObjectId(userId) }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to update user permissions', error);
      throw new Error('Failed updating user permissions');
    }
  }

  static async checkPermission(userId: string, permission: PermissionType): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      if (!userPermissions) return false;

      return userPermissions[permission] === true;
    } catch (error) {
      console.error('Failed to check permission', error);
      return false;
    }
  }

  static async hasAccessToCategory(userId: string, categoryId: string): Promise<boolean> {
    try {
      const [userPermissions] = await mongoClient.FindDocFieldsByFilter(
        this.PERMISSIONS_COLLECTION,
        { userId: new ObjectId(userId) },
        {},
        1
      );

      if (!userPermissions) {
        return false;
      }

      // Админ имеет доступ ко всем категориям
      if (userPermissions.role === 'admin') {
        return true;
      }

      // Модератор имеет доступ только к назначенным категориям
      if (userPermissions.role === 'moderator') {
        return userPermissions.assignedCategories?.some(
          (id: ObjectId) => id.toString() === categoryId
        ) || false;
      }

      // Обычный пользователь имеет доступ только к публичным категориям
      return true;
    } catch (error) {
      console.error('Error checking category access:', error);
      return false;
    }
  }

  // Новые методы для работы с модераторами категорий
  static async assignModeratorToCategory(userId: string, categoryId: string): Promise<boolean> {
    try {
      const result = await mongoClient.ModifyOneDocument(
        this.PERMISSIONS_COLLECTION,
        {
          $addToSet: { assignedCategories: new ObjectId(categoryId) }
        },
        { userId: new ObjectId(userId) }
      );

      return result.modifiedCount === 1;
    } catch (error) {
      console.error('Failed to assign moderator to category:', error);
      throw new Error('Failed to assign moderator to category');
    }
  }

  static async removeModeratorFromCategory(userId: string, categoryId: string): Promise<boolean> {
    try {
      // Сначала получаем текущие права
      const [permissions] = await mongoClient.FindDocFieldsByFilter(
        this.PERMISSIONS_COLLECTION,
        { userId: new ObjectId(userId) },
        { assignedCategories: 1 }
      );

      if (!permissions || !permissions.assignedCategories) {
        return false;
      }

      // Фильтруем категории, исключая удаляемую
      const updatedCategories = permissions.assignedCategories.filter(
        (id: ObjectId) => id.toString() !== categoryId
      );

      // Обновляем документ
      const result = await mongoClient.ModifyOneDocument(
        this.PERMISSIONS_COLLECTION,
        {
          $set: { 
            assignedCategories: updatedCategories
          }
        },
        { userId: new ObjectId(userId) }
      );

      return result.modifiedCount === 1;
    } catch (error) {
      console.error('Failed to remove moderator from category:', error);
      throw new Error('Failed to remove moderator from category');
    }
  }
} 