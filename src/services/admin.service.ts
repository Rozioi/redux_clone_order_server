import { ObjectId } from "mongodb";
import { IUserPermissionRequest } from "../interface/permission.interface";
import { PermissionService } from "./permission.service";

export class AdminService {
  private static readonly MODS_COLLECTION = 'mods';
  private static readonly USERS_COLLECTION = 'users';
  private static readonly CATEGORY_COLLECTION = 'categories';
  private static readonly ADMIN_COLLECTION = 'admins0';

  static async createPermission(data: IUserPermissionRequest): Promise<string> {
    try {
      const permissionData = {
        ...data,
        userId: new ObjectId(data.userId),
        canManageUsers: data.canManageUsers || false,
        canManageCategories: data.canManageCategories || false,
        canModerateMods: data.canModerateMods || false,
        canManageSubscriptions: data.canManageSubscriptions || false,
        assignedCategories: data.assignedCategories?.map(id => new ObjectId(id))
      };

      return await PermissionService.createPermission(permissionData);
    } catch (error) {
      console.error('Failed to create permission:', error);
      throw new Error('Failed to create permission');
    }
  }

  static async updatePermissions(
    userId: string,
    data: Partial<IUserPermissionRequest>
  ): Promise<boolean> {
    try {
      const updateData = {
        ...data,
        assignedCategories: data.assignedCategories?.map(id => new ObjectId(id))
      };

      return await PermissionService.updateUserPermissions(userId, updateData);
    } catch (error) {
      console.error('Failed to update permissions:', error);
      throw new Error('Failed to update permissions');
    }
  }
}