import { ObjectId } from "mongodb";
import { mongoClient } from "../app";
import { IModRequest, IModResponse } from "../interface/mod.interface";
import { UserService } from "./user.service";

export class ModService {
  private static readonly MODS_COLLECTION = 'mods';
  
  static async CreateMod(data: IModRequest):Promise<string> {
    try{
      const modDocument = {
        modName: data.modName,
        description: data.description,
        previewLink: data.previewLink || '',
        fileLink: data.fileLink,
        localPreviewPath: data.localPreviewPath || '',
        localFilePath: 'mods',
        youtubeLink: data.youtubeLink || '',
        categories: data.categories || [],
        rating: {
          like: 0,
          dislike: 0,
          downloads: 0,
        },
        size: data.size || '',
        isVisibleDiscord: data.isVisibleDiscord || '',
        discord: data.discord || '',
        archivePassword: data.archivePassword || '',
        createdAt: new Date(),
        userId: data.userId
      };
      
      const result = await mongoClient.InsertDocumentWithIndex(this.MODS_COLLECTION, modDocument)
      if (!result.insertedId.toString()){
        throw new Error('Failed create mod');
      }
      return result.insertedId.toString();
    } catch (error){
      console.error('Failed create mod', error);
      throw new Error('Failed to create mod')
    }
  };
  static async GetAllMOds(): Promise<string | IModResponse[]>{
    try{
      const result = await mongoClient.FindDocFieldsByFilter(this.MODS_COLLECTION, {});
      if (!result) return 'There are no mods yet';
      return result;
    } catch (error){
      console.error('Failed to get mods',error);
      throw new Error('Failed geting mods')
    }
  };
  static async GetModById(id: string):Promise<IModResponse | null>{
    if (!ObjectId.isValid(id)) {
        throw new Error("Invalid mod ID format");
    }
    try{
      const [result] = await mongoClient.FindDocFieldsByFilter(this.MODS_COLLECTION, {_id: new ObjectId(id)})
      if (!result) return null;
      return result;
    }catch (error){
      console.error('Failed to get mod',error);
      throw new Error('Failed geting mod')
    }
  };
  static async DeleteModById(moId:string, uId: string): Promise<string>{
    if (!ObjectId.isValid(moId) || !ObjectId.isValid(uId)) {
        throw new Error("Invalid user ID or mod ID format");
    }
    try{
      const mod = await this.GetModById(moId);
      if (!mod) throw new Error('Failed getting mod');
      const user = await UserService.getUserById(uId);
      if (!user) throw new Error('This user don`t really');
      if (mod.userId.toString() !== uId) throw new Error('THis user don`t have permissions what delete this mod');
      const result = await mongoClient.DeleteDocument(this.MODS_COLLECTION, {_id: new ObjectId(moId)})
      if (!result) throw new Error('Failed to delete mod');
      return 'Successfull'
    } catch(error){
      console.error('Failed to delete mod', error);
      throw new Error('Failed to delete mod by id');
    }
  }
}