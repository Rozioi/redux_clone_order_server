import { ObjectId } from "mongodb";

export interface ICategory {
  _id?: ObjectId;
  name: string;
  parentId: ObjectId | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  requiresSubscription?: boolean;
  subscriptionId?: string;
}

export interface ICategoryRequest {
  name: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
  requiresSubscription?: boolean;
  subscriptionId?: string;
}