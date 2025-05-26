// Для публичного просмотра подписок
export interface IPublicSubscription {
  id: string;
  name: string;
  description: string;
  price: number;
  level: 'basic' | 'medium' | 'premium';
  logo: string;
  features: string[];
  durationDays: number; // Продолжительность подписки в днях
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
}

// Для админки (расширенный вариант)
export interface IAdminSubscription extends IPublicSubscription {
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  allowedCategories: string[]; // ID разрешенных категорий
}