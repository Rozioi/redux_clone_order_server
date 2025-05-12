import { ObjectId } from "mongodb";
export interface User extends UserRequest {
  _id: ObjectId;
}

export interface UserRequest{
  email: string;
  name: string;
  password_hash: string;
  role?: string;
  is_active?: boolean;
  bio?: string;
  rating?: number;
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserResponse extends Omit<User, 'password_hash'> {
    _id: ObjectId;
}