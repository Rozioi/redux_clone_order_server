import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/user.service";
import { ObjectId } from "mongodb";
import jwt, { generateToken } from "../plugins/jwt";
import { compareHash } from "../utils/hash";
import { generateVerificationCode } from "../utils/verification";
import { sendMail } from "../utils/mailer";
import { mongoClient } from "../app";
import { IUser } from "../interface/user.interface";

const verificationCodes = new Map<string, { code: string, expires: number }>;

export interface UserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface UserResponse extends Omit<IUser, '_id' | 'password_hash'> {
  _id: string;
}

export const userController = {
  async toggleAccountStatus(
    req: FastifyRequest<{ Params: { id: string }; Body: { isActive: boolean } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
            
      if (!ObjectId.isValid(id)) {
        return reply.status(400).send({ error: "Invalid user ID" });
      }

      const success = await UserService.toggleAccountStatus(id, isActive);
      if (!success) {
        return reply.status(404).send({ error: "User not found" });
      }

      return reply.send({
        message: `User account ${isActive ? "activated" : "deactivated"} successfully.`,
        isActive
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
      const currentUser = (req as any).user;
            
      if (!ObjectId.isValid(id)) {
        return reply.status(400).send({ error: "Invalid user ID" });
      }

      if (currentUser && currentUser.id === id) {
        return reply.status(403).send({ error: "You cannot delete your own account" });
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
        return reply.status(400).send({ error: "Email and password обязательны" });
      }

      const user = await UserService.getUserByEmail(email);
      if(!user) {
        return reply.status(404).send({ error: "Такого пользователя не существует" });
      }
          
      const isMatch = compareHash(password, user.password_hash);
      if (!isMatch) return reply.status(401).send({ error: "Неверные учётные данные " });
      
      if (user.role === 'admin') {
        const verificationCode = generateVerificationCode();
        const expiresIn = 5 * 60 * 1000;
        verificationCodes.set(email, { code: verificationCode, expires: Date.now() + expiresIn });
            
        await sendMail(email, 'Код подтверждения входа', `<p>Ваш код: <strong>${verificationCode}</strong></p><p>Действителен 5 минут.</p>`);
        return reply.status(200).send({
          status: 'verification_required',
          message: 'Код подтверждения отправлен',
          email,
          isAdmin: true
        });
      }
          
      await mongoClient.FindOneAndUpdate('users', { _id: user._id }, { last_login: new Date() });
      const token = generateToken({
        _id: user._id.toString(),
        email: user.email,
        role: user.role
      }, req);
      
      return reply.status(200).send({
        status: "success", 
        token, 
        user: {
          _id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          last_login: user.last_login,
          createdAt: user.createdAt
        }
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
      const userData = req.body;
            
      if (!userData.email || !userData.username || !userData.password) {
        return reply.status(400).send({ error: "Missing required fields" });
      }

      const existingUser = await UserService.getUserByEmail(userData.email);
      if (existingUser) {
        return reply.status(409).send({ error: "Email already exists" });
      }

      const userId = await UserService.createUser({
        username: userData.username,
        email: userData.email,
        password: userData.password
      });

      return reply.status(201).send({ 
        message: "User created successfully",
        id: userId
      });
    } catch (error: unknown) {
      const err = error as Error & { code?: number };
      if (err.code === 11000) {
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