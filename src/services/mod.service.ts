import { ObjectId } from "mongodb";
import { mongoClient } from "../app";
import { ICommentsRequest, IModRequest, IModResponse } from "../interface/mod.interface";
import { UserService } from "./user.service";
import { downloadFileFromCloud, downloadFileFromGoogleDrive } from "../utils/diskToServer";

export class ModService {
  private static readonly MODS_COLLECTION = 'mods';
  private static readonly COMMENTS_COLLECTION = 'comments';
  
  static async CreateMod(data: IModRequest):Promise<string> {
    try{
      const modDocument = {
        modName: data.modName,
        description: data.description,
        previewLink: data.previewLink || '',
        fileLink: data.fileLink,
        localPreviewPath: data.localPreviewPath || '',
        isLocalState: false,
        localFilePath: 'mods',
        youtubeLink: data.youtubeLink || '',
        categories: data.categoryIds || [],
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
        status: 'pending',
        is_moderated: false,
        userId: new ObjectId(data.userId)
      };
      
      const result = await mongoClient.InsertDocumentWithIndex(this.MODS_COLLECTION, modDocument)
      if (!result.insertedId.toString()){
        throw new Error('Failed create mod');
      }
      await UserService.updateModStats(data.userId.toString(),'pending');
      
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
  static async GetAllModsForUser(): Promise<string | IModResponse[]>{
    try{
      const result = await mongoClient.FindDocFieldsByFilter(this.MODS_COLLECTION, {status:'approved'});
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

  // Новые методы для модерации
  static async getPendingMods(): Promise<IModResponse[]> {
    try {
      const result = await mongoClient.FindDocFieldsByFilter(
        this.MODS_COLLECTION,
        { status: 'pending' }
      );
      return result;
    } catch (error) {
      console.error('Failed to get pending mods', error);
      throw new Error('Failed getting pending mods');
    }
  }
  static async updateStatsMod(id:string , param: string,operation: 'add' | 'remove' = 'add'): Promise<boolean>{
    if (!ObjectId.isValid(id)){
      throw new Error("Invalid mod id format");
    };
    try{
      const mod = await this.GetModById(id);
      if (!mod) throw new Error("Invalid mod ID format");
      const update = operation === 'add' 
          ? { $inc: { [param]: 1 } } 
          : { $inc: { [param]: -1 } };

      const result = await mongoClient.ModifyOneDocument(this.MODS_COLLECTION, update, { _id: new ObjectId(id) });
      if (result.modifiedCount > 0){
        return true;
      }
      return false;
    } catch(error){
      console.error('Failed to update stats ', error);
      throw new Error('Failed to update stats');
    }
  }
  static async approveMod(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid mod ID format");
    }
    try {
      const mod = await this.GetModById(id);
      if (!mod) throw new Error('Mod not found');

      // Скачиваем файл с облачного хранилища
      const result = await downloadFileFromCloud(mod.fileLink);

      if (!result.success) {
        throw new Error(result.error || 'Failed to download file');
      }

      const updateResult = await mongoClient.ModifyOneDocument(
        this.MODS_COLLECTION,
        { 
          $set: { 
            status: 'approved', 
            is_moderated: true,
            localFilePath: result.filePath,
            isLocalState: true
          } 
        },
        { _id: new ObjectId(id) }
      );

      if (updateResult.modifiedCount > 0) {
        await UserService.updateModStats(mod.userId.toString(), 'approved');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to approve mod', error);
      throw new Error('Failed approving mod');
    }
  }

  static async rejectMod(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid mod ID format");
    }
    try {
      const mod = await this.GetModById(id);
      if (!mod) throw new Error('Mod not found');

      const result = await mongoClient.ModifyOneDocument(
        this.MODS_COLLECTION,
        { $set: { status: 'rejected', is_moderated: true } },
        { _id: new ObjectId(id) }
      );

      if (result.modifiedCount > 0) {
        // Обновляем статистику пользователя
        await UserService.updateModStats(mod.userId.toString(), 'rejected');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to reject mod', error);
      throw new Error('Failed rejecting mod');
    }
  }

  static async GetModsByUserId(userId: string): Promise<IModResponse[]> {
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }
    try {
      const result = await mongoClient.FindDocFieldsByFilter(
        this.MODS_COLLECTION,
        { userId: new ObjectId(userId) }
      );
      return result;
    } catch (error) {
      console.error('Failed to get user mods', error);
      throw new Error('Failed getting user mods');
    }
  }
  
  static async GetCommentsByModId(modId: string){
    if (!ObjectId.isValid(modId)) {
      throw new Error("Invalid mod ID format");
    }
    try{
      const result = await mongoClient.FindDocFieldsByFilter(this.COMMENTS_COLLECTION, {modId: modId});
      console.log(result);
      return result
    } catch(error){
      console.error('Failed to crete mod', error);
      throw new Error('Failed to crete mod');
    }
  }
  
  static async CreateComments(data: ICommentsRequest){
    if (!ObjectId.isValid(data.modId) || !ObjectId.isValid(data.userId)) {
      throw new Error("Invalid user ID format");
    }
    try{
      const user = UserService.getUserById(data.userId);
      if (!user){
        throw new Error('Failure the user does not exist ');
      }
      const commentDocument = {
        modId: data.modId,
        userId: data.userId,
        content: data.content,
        createAt: new Date()
      }
      const result = await mongoClient.InsertDocumentWithIndex(this.COMMENTS_COLLECTION, commentDocument);
      console.log(result);
    } catch(error){
      console.error('Failed to crete mod', error);
      throw new Error('Failed to crete mod');
    }
  }
}