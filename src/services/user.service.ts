import { FastifyRequest } from "fastify";
import { generateToken } from "../plugins/jwt";
import { User } from "../controllers/user.controller";
import { db, GetData, insertRecord } from "../plugins/db";
import { compareHash, hashPassword } from "../utils/hash";


export class UserService {

    static async deleteAccount(id: number) {
        try {
            const { result, status, error } = await insertRecord(db, 'DELETE FROM users WHERE id = ?', [id]);
            if (error) { throw new Error(`Database error: ${error}`); };
            if (status == 1) { return result; }
            return null;
        } catch (error) {
            throw new Error("Failed to delete account")
        }
    };
    static async toogleAccountStatus(id: number, newStatus: boolean) {
        try {
            const { result, status, error } = await insertRecord(db, 'UPDATE users SET is_active = ? WHERE id = ?', [newStatus ? 1 : 0, id]);
            if (error) { throw new Error(`Database error: ${error}`); };
            if (status == 1) { return result; }
            return null;
        } catch (error) {
            throw new Error("Failed to update status")
        }
    }

    static async getUserByID(id: number) {
        try {
            const { result, status, error } = await GetData(db, 'SELECT id,name,email,role,bio,is_active, rating, created_at FROM users Where id = ?', [id]);
            if (error) {
                throw new Error(`${error}`);
            }
            return result as User;
        }
        catch (error) {
            throw new Error("Failed to give account")
        }
    };
    static async createNewUser(user: User) {
        const { name, email, password_hash, role, bio } = user;
        const hashed_password = await hashPassword(password_hash);
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        try {
            const { result, status, error } = await insertRecord(db, 'INSERT INTO users (name,email,password_hash,role,bio,rating,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)', [name, email, hashed_password, role, bio, 1, now, now]);
        }
        catch (error) {
            throw error;
        }
    };
    static async loginUser(email: string, password: string, req: FastifyRequest) {
        try {
            const { result, status, error } = await GetData(db, 'SELECT * FROM users WHERE email = ?', [email])
            if (error) { throw error };
            if (status == 1) {
                const user = result as User;
                const isMatch = await compareHash(password, user.password_hash);
                if (!isMatch) {
                    throw new Error('Invalid credentials');
                }
                const tokenPayload = {
                    id: user.id,
                    email: user.email,
                    role: user.role
                };
                const token = generateToken(tokenPayload, req);
                return {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        bio: user.bio,
                        rating: user.rating,
                        is_active: user.is_active
                    }
                };
            }
            throw new Error('User not found');
        }
        catch (error) {
            throw error;
        }
    };
}