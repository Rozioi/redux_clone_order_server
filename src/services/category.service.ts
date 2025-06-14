import { ObjectId } from "mongodb";
import { ICategory, ICategoryRequest } from "../interface/category.interface";
import { mongoClient } from "../app";

export class CategoryService {
  private static readonly COLLECTION = 'categories';

  static async createCategory(data: ICategoryRequest): Promise<string> {
    try {
      const categoryDocument: ICategory = {
        name: data.name,
        parentId: data.parentId ? new ObjectId(data.parentId) : null,
        order: data.order || 0,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await mongoClient.InsertDocumentWithIndex(
        this.COLLECTION,
        categoryDocument
      );

      if (!result.insertedId.toString()) {
        throw new Error('Failed to create category');
      }

      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to create category:', error);
      throw new Error('Failed to create category');
    }
  }
  static async getAllCategories(): Promise<ICategory[]> {
    try {
      
      return await mongoClient.FindDocFieldsByFilter(this.COLLECTION, {});
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw new Error('Failed to get categories');
    }
  }

  static async updateCategory(id: string, data: Partial<ICategoryRequest>): Promise<boolean> {
    try {
      const updateData: Partial<ICategory> = {
        updatedAt: new Date()
      };

      if (data.name) updateData.name = data.name;
      if (data.parentId) updateData.parentId = new ObjectId(data.parentId);
      if (data.order !== undefined) updateData.order = data.order;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const result = await mongoClient.ModifyOneDocument(
        this.COLLECTION,
        { $set: updateData },
        { _id: new ObjectId(id) }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw new Error('Failed to update category');
    }
  }

  static async deleteCategory(id: string): Promise<boolean> {
    try {
      const result = await mongoClient.DeleteDocument(
        this.COLLECTION,
        { _id: new ObjectId(id) }
      );
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw new Error('Failed to delete category');
    }
  }

  static async getCategoryById(id: string): Promise<ICategory | null> {
    try {
      const [result] = await mongoClient.FindDocFieldsByFilter(
        this.COLLECTION,
        { _id: new ObjectId(id) },
        {},
        1
      );
      return result || null;
    } catch (error) {
      console.error('Failed to get category:', error);
      throw new Error('Failed to get category');
    }
  }
} 