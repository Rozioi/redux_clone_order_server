import { ObjectId } from "mongodb";

export interface IMod {
  _id?: string | ObjectId;
  modName: string;
  description: string;
  previewLink: string;
  fileLink: string;
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
  userId: string | ObjectId; 
}

export interface IModRequest {
  modName: string;
  description: string;
  previewLink: string;
  fileLink: string;
  localPreviewPath?: string;
  localFilePath?: string;
  youtubeLink?: string;
  categories?: string[]; 
  size: string;
  isVisibleDiscord: boolean;
  discord: string;
  archivePassword?: string;
}

export interface IModResponse extends IMod {
  _id: string;
  createdAt: string;
} 