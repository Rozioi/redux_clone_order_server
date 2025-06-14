import { ObjectId } from "mongodb";

import { mongoClient } from "../app";
import { IAdmin, PermissionKey } from "../interface/admin.interface";


export class PermissionService {
  private static readonly ADMIN_COLLECTION = 'admins';

  /**
   * Проверяет право администратора
   * @param userId ID пользователя (админа)
   * @param permissionKey Проверяемое право
   */
  static async hasPermission(userId: ObjectId | string, permissionKey: PermissionKey): Promise<boolean> {
    try {
      const admins = await mongoClient.FindDocFieldsByFilter(
        this.ADMIN_COLLECTION,
        { userId: new ObjectId(userId) }
      ) ;
      const admin = admins[0];
      if (!admin) return false;
      return admin.permissions.includes(permissionKey);
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Проверка прав с учетом категорий (если нужно)
   * @param userId ID админа
   * @param permissionKey Право
   * @param categoryId Опциональная проверка категории
   */
  static async hasCategoryPermission(
    userId: ObjectId | string,
    permissionKey: PermissionKey,
    categoryId?: string
  ): Promise<boolean> {
    try {
      const admin = await mongoClient.FindDocFieldsByFilter(
        this.ADMIN_COLLECTION,
        { userId: new ObjectId(userId) }
      ) as IAdmin | null;

      if (!admin) return false;

      const hasPerm = admin.permissions.includes(permissionKey);
      if (!hasPerm) return false;

      // Если право не требует проверки категории
      if (!categoryId || !admin.allowedCategoryIds) return true;

      // Проверка доступа к категории
      return admin.allowedCategoryIds.includes(categoryId);
    } catch (error) {
      console.error('Category permission check error:', error);
      return false;
    }
  }
}
