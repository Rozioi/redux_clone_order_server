import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/user.service";
import { ObjectId } from "mongodb";

export interface User extends UserRequest {
  _id: ObjectId;
}

export interface UserRequest{
  email: string;
  name: string;
  password_hash: string;
  role?: string;
  is_active?: boolean;
  bio?: string;
  rating?: number;
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserResponse extends Omit<User, 'password_hash'> {
    _id: ObjectId;
}

export const userController = {
    async toggleAccountStatus(
        req: FastifyRequest<{ Params: { id: string }; Body: { is_active: boolean } }>, 
        reply: FastifyReply
    ) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            
            if (!ObjectId.isValid(id)) {
                return reply.status(400).send({ error: "Invalid user ID" });
            }

            const success = await UserService.toggleAccountStatus(id, is_active);
            if (!success) {
                return reply.status(404).send({ error: "User not found" });
            }

            return reply.send({
                message: `User account ${is_active ? "activated" : "deactivated"} successfully.`,
                is_active
            });
        } catch (error: unknown) {
            const err = error as Error;
            return reply.status(500).send({ error: err.message });
        }
    },

    async deleteAccount(
        req: FastifyRequest<{ Params: { id: string } }>, 
        reply: FastifyReply
    ) {
        try {
            const { id } = req.params;
            
            if (!ObjectId.isValid(id)) {
                return reply.status(400).send({ error: "Invalid user ID" });
            }

            const success = await UserService.deleteAccount(id);
            if (!success) {
                return reply.status(404).send({ error: "User not found" });
            }

            return reply.send({ message: "User deleted successfully" });
        } catch (error: unknown) {
            const err = error as Error;
            return reply.status(500).send({ error: err.message });
        }
    },

    async getUserById(
        req: FastifyRequest<{ Params: { id: string } }>, 
        reply: FastifyReply
    ) {
        try {
            const { id } = req.params;
            
            if (!ObjectId.isValid(id)) {
                return reply.status(400).send({ error: "Invalid user ID" });
            }

            const user = await UserService.getUserById(id);
            if (!user) {
                return reply.status(404).send({ error: "User not found" });
            }

            return reply.send(user);
        } catch (error: unknown) {
            const err = error as Error;
            return reply.status(500).send({ error: err.message });
        }
    },

    async loginUser(
        req: FastifyRequest<{ Body: { email: string; password: string } }>, 
        reply: FastifyReply
    ) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return reply.status(400).send({ error: "Email and password are required" });
            }

            const result = await UserService.loginUser(email, password, req);
            return reply.send({ 
                token: result.token, 
                user: result.user 
            });
        } catch (error: unknown) {
            const err = error as Error;
            return reply.status(401).send({ error: err.message });
        }
    },
    async getUsersPaginated(
        page: number,
        limit: number
    ): Promise<{ users: UserResponse[]; total: number }> {
        try {
            const result = await UserService.getUsersPaginated(page, limit);
            return result;
        } catch (error: unknown) {
            const err = error as Error;
            throw err;
        }
    },
    async createNewUser(
        req: FastifyRequest<{ Body: UserRequest }>, 
        reply: FastifyReply
    ) {
        try {
            const user = req.body;
            
            if (!user.email || !user.name || !user.password_hash) {
                return reply.status(400).send({ error: "Missing required fields" });
            }

            const userId = await UserService.createNewUser(user);
            return reply.status(201).send({ 
                message: "User created successfully",
                id: userId
            });
        } catch (error: unknown) {
            const err = error as Error & { code?: number };
            if (err.code === 11000) { // MongoDB duplicate key error
                return reply.status(409).send({ error: "Email already exists" });
            }
            return reply.status(500).send({ error: err.message });
        }
    },

    async verifyToken(
        req: FastifyRequest, 
        reply: FastifyReply
    ) {
        try {
            return reply.send({ user: (req as any).user });
        } catch (error: unknown) {
            const err = error as Error;
            return reply.status(401).send({ error: "Invalid token" });
        }
    }
};