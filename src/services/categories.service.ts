import { db, GetData, GetAllData, insertRecord } from "../plugins/db"
export class CategoriesService {
    static async GetCategories() {
        try {
            const { result, status, error } = await GetAllData(db, "SELECT * FROM categories", []);
            if (error) {
                throw new Error(`Database error: ${error}`);
            }
            return result;
        } catch (error) {
            throw error
        }
    };
    static async CreateCategories(name: string) {
        try{
            const {result, status, error} = await insertRecord(db, 'INSERT INTO categories (name) VALUES (?)', [name])
            if (error){
                throw new Error(`Database errro: ${error}`);
            }
            return true
        } catch (error){
            throw error
        }
    };
    static async GetCategoriesByName(name: string) {
        try {
            const { result, status, error } = await GetData(db, "SELECT * FROM categories WHERE name = ?", [name]);
            if (error) {
                throw new Error(`Database error: ${error}`);
            }
            return result;
        } catch (error) {
            throw error
        }
    };
}