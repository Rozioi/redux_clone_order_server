import { ObjectId } from "mongodb";

export type Role = 'highAdmin' | 'lowAdmin' | 'moderator';

export type PermissionKey =
  | 'mods:approve'     
  | 'mods:edit'       
  | 'mods:delete'      
  | 'mods:hide'        

  | 'comments:delete' 
  | 'reviews:moderate' 
  | 'reports:view'  
  
  | 'users:ban'       
  | 'users:mute'       
  | 'users:assign_badge'
  | 'admin:manage'
  | 'users:manage'

  | 'categories:manage' 
  | 'advertisements:manage'
  | 'subscriptions:manage'
  | 'notifications:send'


export interface IAdmin {
  _id?: ObjectId;
  name: string;
  role: Role;
  userId: ObjectId | string;
  permissions: PermissionKey[];
  allowedCategoryIds?: string[];
}

