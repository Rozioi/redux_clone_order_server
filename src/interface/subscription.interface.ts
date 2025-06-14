export interface IPublicSubscription {
  id: string;
  name: string;
  description: string;
  price: number;
  level: 'basic' | 'medium' | 'premium';
  logo: string;
  features: string[];
  durationDays: number;
  allowedCategories: string[];
  isActive: boolean;
}

export interface IAdminSubscription extends IPublicSubscription {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAdminSubscriptionRequest {
  name: string;
  description: string;
  price: number;
  level: 'basic' | 'medium' | 'premium';
  logo: string;
  features: string[];
  durationDays: number;
  allowedCategories: string[];
  isActive: boolean;
}

export interface IUserSubscription {
  id: string;
  userId: string;
  subscriptionId: string;
  subscription: IPublicSubscription;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserSubscriptionRequest {
  userId: string;
  subscriptionId: string;
  durationDays?: number;
}