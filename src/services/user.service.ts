import { FastifyRequest } from "fastify";
import { generateToken } from "../plugins/jwt";
import { User, UserResponse } from "../controllers/user.controller";
import { compareHash, hashPassword } from "../utils/hash";
import { ObjectId } from "mongodb";
import { mongoClient } from "../app";

export class UserService {
    private static readonly USERS_COLLECTION = 'users';
    private static readonly COUNTERS_COLLECTION = 'counters';

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
                { $set: { is_active: isActive, updated_at: new Date() } },
                { _id: new ObjectId(userId) }
            );
            return result.modifiedCount === 1;
        } catch (error) {
            console.error('Error toggling account status:', error);
            throw new Error("Failed to update status");
        }
    }

    static async getUserById(id: string): Promise<UserResponse | null> {
        if (!ObjectId.isValid(id)) {
            throw new Error("Invalid user ID format");
        }

        try {
            const [user] = await mongoClient.FindDocFieldsByFilter(
                this.USERS_COLLECTION,
                { _id: new ObjectId(id) },
                { password_hash: 0 }, // Exclude password from results
                1
            );
            return user ? this.mapToUserResponse(user) : null;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw new Error("Failed to get user");
        }
    }

    static async getUserByEmail(email: string): Promise<User | null> {
        try {
            const [user] = await mongoClient.FindDocFieldsByFilter(
                this.USERS_COLLECTION,
                { email },
                {},
                1
            );
            return user || null;
        } catch (error) {
            console.error('Error fetching user by email:', error);
            throw new Error("Failed to get user by email");
        }
    }

    static async createNewUser(userData: Omit<User, '_id'>): Promise<string> {
        try {
            const existingUser = await this.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error("Email already in use");
            }

            const hashedPassword = await hashPassword(userData.password_hash);
            const now = new Date();

            const userDocument = {
                ...userData,
                password_hash: hashedPassword,
                is_active: true,
                last_login: now,
                role: 'user',
                created_at: now,
                updated_at: now
            };

            const result = await mongoClient.InsertDocumentWithIndex(
                this.USERS_COLLECTION,
                userDocument
            );

            return result.insertedId.toString();
        } catch (error) {
            console.error("Error creating new user:", error);
            throw error;
        }
    }

    static async loginUser(email: string, password: string, req: FastifyRequest): Promise<{ token: string; user: UserResponse }> {
        try {
            const user = await this.getUserByEmail(email);
            if (!user) {
                throw new Error("User not found");
            }

            const isMatch = await compareHash(password, user.password_hash);
            if (!isMatch) {
                throw new Error("Invalid credentials");
            }

            // Update last login
            await mongoClient.FindOneAndUpdate(
                this.USERS_COLLECTION,
                { _id: user._id },
                { last_login: new Date() }
            );

            const tokenPayload = {
                id: user._id.toString(),
                email: user.email,
                role: user.role || 'user'
            };

            return {
                token: generateToken(tokenPayload, req),
                user: this.mapToUserResponse(user)
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async getUsersPaginated(
        page: number = 1,
        limit: number = 10,
        filter: object = {}
    ): Promise<{ users: UserResponse[], total: number }> {
        try {
          const query = filter && typeof filter === 'object' ? filter : {};
          console.log(typeof query);
            const skip = (page - 1) * limit;
            const users = await mongoClient.FindDocFieldsByFilter(
                this.USERS_COLLECTION,
                query,
                { password_hash: 0 },
                limit
            );

            const total = await mongoClient.getDocumentCountQuery(
                this.USERS_COLLECTION,
                query
            );

            return {
                users: users.map(this.mapToUserResponse),
                total
            };
        } catch (error) {
            console.error('Error fetching paginated users:', error);
            throw new Error("Failed to get users");
        }
    }

    private static mapToUserResponse(user: any): UserResponse {
        return {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            is_active: user.is_active,
            last_login: user.last_login,
            created_at: user.created_at,
            updated_at: user.updated_at
        };
    }
}

