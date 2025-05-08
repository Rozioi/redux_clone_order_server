import { ObjectId } from "mongodb"

export enum AuthProvider {
  TELEGRAM = "tegleram",
  DISCORD = "discrod",
  LOCAL = "local"
};

export interface AuthMethod {
  _id: ObjectId,
  user_id: ObjectId,
  provider: AuthProvider,
  provider_id: string,
  meta?:{
    avatar?: string,
    username?: string
  }
}

export interface CreateAuthMethodTo {
  user_id: ObjectId,
  provider: AuthProvider,
  provider_id: string,
  meta?: object
}