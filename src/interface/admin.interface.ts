import { ObjectId } from "mongodb";

export type Role = 'highAdmin' | 'lowAdmin' | 'moderator';

export interface IAdmin {
  _id?: ObjectId;
  name: string;
  role: Role;
  userId: ObjectId;
  allowedCategoryIds?: string[];
}