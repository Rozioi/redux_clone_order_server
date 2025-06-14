import { ObjectId } from "mongodb";

export interface IMod {
  _id?: string | ObjectId;
  modName: string;
  description: string;
  previewLink: string;
  fileLink: string;
  isLocalState: boolean;
  localPreviewPath: string;
  localFilePath: string;
  youtubeLink?: string;
  categories?: Array<{
    _id: string;
    name: string;
  }>;
  rating: {
    like: number;
    dislike: number;
    downloads: number;
  };
  size: string;
  isVisibleDiscord: boolean;
  discord: string;
  archivePassword?: string;
  createdAt?: Date | string;
  is_moderated: boolean;
  userId: string | ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  updatedAt?: Date;
  requiresSubscription?: boolean;
  subscriptionId?: string;
}

export interface IModRequest {
  modName: string;
  description: string;
  previewLink: string;
  fileLink: string;
  localPreviewPath?: string;
  localFilePath?: string;
  youtubeLink?: string;
  categoryIds?: string[]; 
  size: string;
  isVisibleDiscord: boolean;
  discord: string;
  archivePassword?: string;
  userId: string | ObjectId; 
  requiresSubscription?: boolean;
  subscriptionId?: string;
}

export interface IModResponse extends IMod {
  _id: string;
  createdAt: string;
} 

export interface IComments {
  _id: string;
  modId: string;
  userId: string;
  content: string;
  createdAt: Date;
}
export interface ICommentsRequest {
  modId: string;
  userId: string;
  content: string;
}