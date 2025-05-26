import { ObjectId } from "mongodb";

export interface IUser {
  _id: ObjectId;
  username: string;
  password_hash: string;
  email: string;
  isActive: boolean;
  role: 'user' | 'admin';
  last_login: Date | null;
  createdAt: Date;
}

export interface IUserStats {
  _id: ObjectId;
  userId: ObjectId;
  modCount: number;
  ratingAverage: number | null;
  totalMods: number;
  approvedMods: number;
  pendingMods: number;
  rejectedMods: number;
  rating: number;
}

export interface IUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export type IUserResponse = Omit<IUser, 'password_hash' | '_id'> & {
  _id: string;
};