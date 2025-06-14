import { FastifyRequest } from "fastify";
import { generateToken } from "../plugins/jwt";
import { UserRequest, UserResponse } from "../controllers/user.controller";
import { compareHash, hashPassword } from "../utils/hash";
import { ClientSession, ObjectId } from "mongodb";
import { mongoClient } from "../app";
import { IUser, IUserRequest, IUserResponse, IUserStats } from "../interface/user.interface";

import bcrypt from "bcrypt";
type UserRole = 'user' | 'admin';

export class UserService {
    private static readonly USERS_COLLECTION = 'users';
    private static readonly STATS_COLLECTION = 'user_stats';
    private static readonly COUNTERS_COLLECTION = 'counters';
    private static readonly SALT_ROUNDS = 12;

    static async deleteAccount(userId: string): Promise<boolean> {
        if (!ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID format");
        }

        try {
            const result = await mongoClient.DeleteDocument(
                this.USERS_COLLECTION,
                { _id: new ObjectId(userId) }
            );
            return result.deletedCount === 1;
        } catch (error) {
            console.error('Error deleting account:', error);
            throw new Error("Failed to delete account");
        }
    }

    static async toggleAccountStatus(userId: string, isActive: boolean): Promise<boolean> {
        if (!ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID format");
        }

        try {
            const result = await mongoClient.ModifyOneDocument(
                this.USERS_COLLECTION,
                { $set: { isActive, updated_at: new Date() } },
                { _id: new ObjectId(userId) }
            );
            return result.modifiedCount === 1;
        } catch (error) {
            console.error('Error toggling account status:', error);
            throw new Error("Failed to update status");
        }
    }

    static async getUserById(id: string): Promise<IUserResponse | null> {
        if (!ObjectId.isValid(id)) {
            throw new Error("Invalid user ID format");
        }

        try {
            const [result] = await mongoClient.FindDocFieldsByFilter(
                this.USERS_COLLECTION,
                { _id: new ObjectId(id) },
                { password_hash: 0 }
            );
            return result || null;
        } catch (error) {
            console.error('Failed to get user', error);
            throw new Error('Failed getting user');
        }
    }
    static async getUserByUsername(username: string): Promise<IUserResponse | null> {
        try {
            const [result] = await mongoClient.FindDocFieldsByFilter(
                this.USERS_COLLECTION,
                { username:username },
                { password_hash: 0 }
            );
            return result || null;
        } catch (error) {
            console.error('Failed to get user', error);
            throw new Error('Failed getting user');
        }
    }

    static async getUserByEmail(email: string): Promise<IUser | null> {
        try {
            const [user] = await mongoClient.FindDocFieldsByFilter(
                this.USERS_COLLECTION,
                { email: email },
                {},
                1
            );
            return user || null;
        } catch (error) {
            console.error('Error fetching user by email:', error);
            throw new Error("Failed to get user by email");
        }
    }

    static async getUserByField<K extends keyof IUser>(
        field: K, 
        value: IUser[K],
        limit: number = 1
    ): Promise<IUser | null> {
        try {
            const users = await mongoClient.FindDocFieldsByFilter(
                this.USERS_COLLECTION,
                { [field]: value }, 
                {},
                limit
            );
            return users[0] || null; 
        } catch (error) {
            console.error(`Error fetching user by ${field}:`, error);
            throw new Error(`Failed to get user by ${field}`);
        }
    }

    static async getUsersPaginated(page: number, limit: number): Promise<{ users: UserResponse[]; total: number }> {
        try {
            const skip = (page - 1) * limit;
            const users = await mongoClient.FindDocFieldsByFilter(
                this.USERS_COLLECTION,
                {},
                { password_hash: 0 },
                limit,
                skip
            );
            const total = await mongoClient.getDocumentCountQuery(this.USERS_COLLECTION, {});
            
            return {
                users: users.map((user: IUser) => ({
                    _id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    last_login: user.last_login,
                    createdAt: user.createdAt
                })),
                total
            };
        } catch (error) {
            console.error('Failed to get paginated users:', error);
            throw error;
        }
    }

    static async createUser(data: IUserRequest): Promise<string> {
        try {
                  const existingUserByUsername = await mongoClient.FindDocFieldsByFilter(
                      this.USERS_COLLECTION,
                      { username: data.username }
                  );
                  if (existingUserByUsername[0]) {
                      throw new Error('Пользователь с таким именем уже существует');
                  }
          
                  const existingUserByEmail = await mongoClient.FindDocFieldsByFilter(
                      this.USERS_COLLECTION,
                      { email: data.email }
                  );
                  if (existingUserByEmail[0]) {
                      throw new Error('Пользователь с такой почтой уже существует');
                  }
            const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);
    
            const userDocument: Omit<IUser, '_id'> = {
                username: data.username,
                password_hash: hashedPassword,
                email: data.email,
                isActive: true,
                role: data.role || 'user',
                last_login: null,
                createdAt: new Date()
            };
    
            const result = await mongoClient.InsertDocumentWithIndex(
                this.USERS_COLLECTION,
                userDocument
            );
    
            if (!result.insertedId) {
                throw new Error('Failed to create user');
            }
    
            const userStats: Omit<IUserStats, '_id'> = {
                userId: result.insertedId,
                ratingAverage: null,
                modCount: 0,
                totalMods: 0,
                approvedMods: 0,
                pendingMods: 0,
                rejectedMods: 0,
                rating: 0
            };
    
            await mongoClient.InsertDocumentWithIndex(
                this.STATS_COLLECTION,
                userStats
            );
    
            return result.insertedId.toString();
    
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }


    static async updateModStats(userId: string, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> {
        if (!ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID format");
        }
        try {
            const updateQuery: any = {
                $inc: {
                    'totalMods': 1
                }
            };

            switch (status) {
                case 'pending':
                    updateQuery.$inc['pendingMods'] = 1;
                    break;
                case 'approved':
                    updateQuery.$inc['approvedMods'] = 1;
                    updateQuery.$inc['pendingMods'] = -1;
                    break;
                case 'rejected':
                    updateQuery.$inc['rejectedMods'] = 1;
                    updateQuery.$inc['pendingMods'] = -1;
                    break;
            }

            const result = await mongoClient.ModifyOneDocument(
                this.STATS_COLLECTION,
                updateQuery,
                { userId: new ObjectId(userId) }
            );

            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Failed to update mod stats', error);
            throw new Error('Failed updating mod stats');
        }
    }

    static async getUserModStats(userId: string): Promise<IUserStats | null> {
        if (!ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID format");
        }
        try {
            const [result] = await mongoClient.FindDocFieldsByFilter(
                this.STATS_COLLECTION,
                { userId: new ObjectId(userId) }
            );
            return result || null;
        } catch (error) {
            console.error('Failed to get user mod stats', error);
            throw new Error('Failed getting user mod stats');
        }
    }

    static async updateUserRole(userId: string, role: UserRole): Promise<boolean> {
        try {
            const result = await mongoClient.ModifyOneDocument(
                this.USERS_COLLECTION,
                { 
                    $set: { 
                        role,
                        updated_at: new Date()
                    }
                },
                { _id: new ObjectId(userId) }
            );

            return result.modifiedCount === 1;
        } catch (error) {
            console.error('Ошибка при обновлении роли пользователя:', error);
            throw new Error('Не удалось обновить роль пользователя');
        }
    }
}

