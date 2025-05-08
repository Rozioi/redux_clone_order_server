import { mongoClient } from "../app";
import { AuthMethod, CreateAuthMethodTo } from "../interface/auth.interface";

export class AuthMethodService {
  private static readonly COLLECTIONS = "auth_method";
  
 static async  CreateAuthMethod(data: CreateAuthMethodTo): Promise<AuthMethod> {
   const authMethod = {
     ...data,
     createdAt: new Date()
   }
   const result = await mongoClient.InsertDocumentWithIndex(this.COLLECTIONS, authMethod);
   
   return {...authMethod, _id: result.insertedID}
 } 
  
}