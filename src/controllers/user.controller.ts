import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/user.service";
import { ObjectId } from "mongodb";
import jwt, { generateToken } from "../plugins/jwt";
import { compareHash } from "../utils/hash";
import { generateVerificationCode } from "../utils/verification";
import { sendMail } from "../utils/mailer";
import { app, mongoClient } from "../app";
import { IUser } from "../interface/user.interface";
import { config } from "../config/env";
import { IAdmin } from "../interface/admin.interface";

const verificationCodes = new Map<string, { code: string, expires: number }>;

export interface UserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}
const loginSuccessfulTemplate = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Успешный вход в учётную запись</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .content {
            padding: 20px 0;
        }
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Вход выполнен успешно</h2>
    </div>
    <div class="content">
        <p>Здравствуйте!</p>
        <p>Мы зафиксировали успешный вход в ваш аккаунт.</p>
        
        <p><strong>Дата и время входа:</strong> ${new Date().toLocaleString('ru-RU')}</p>
        
        <p>Если это были не вы, пожалуйста, немедленно:</p>
        <p class="button">
             Сменить парол
        </p>
        <p>Или свяжитесь с нашей поддержкой.</p>
    </div>
    <div class="footer">
        <p>Это письмо отправлено автоматически. Пожалуйста, не отвечайте на него.</p>
        <p>&copy; ${new Date().getFullYear()} ${config.APP_NAME || 'Ваш сервис'}. Все права защищены.</p>
    </div>
</body>
</html>
`;
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
  async getUserStatsById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = req.params;
            
      if (!ObjectId.isValid(id)) {
        return reply.status(400).send({ error: "Invalid user ID" });
      }

      const stats = await UserService.getUserModStats(id);
      if (!stats) {
        return reply.status(404).send({ error: "User not found" });
      }

      return reply.send(stats);
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
  async getUserByIdOrUsername(
    req: FastifyRequest<{ Params: { identifier: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { identifier } = req.params;
      let user;
  
      if (ObjectId.isValid(identifier)) {
        user = await UserService.getUserById(identifier); 
      } else {
        user = await UserService.getUserByUsername(identifier); 
      }
  
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }
  
      return reply.send(user);
    } catch (error) {
      const err = error as Error;
      return reply.status(500).send({ error: err.message });
    }
  },
  async getUserByUsername(
    req: FastifyRequest<{ Params: { username: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { username } = req.params;

      const user = await UserService.getUserByUsername(username);
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
  },
  async verifyAdminLogin(
    req: FastifyRequest<{ Body: { email: string; code: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { email, code } = req.body;
      
      const storedData = verificationCodes.get(email);
      if (!storedData) {
        return reply.status(400).send({ 
          status: 'error',
          error: "Код подтверждения не найден. Пожалуйста, войдите снова." 
        });
      }

      if (Date.now() > storedData.expires) {
        verificationCodes.delete(email);
        return reply.status(400).send({ 
          status: 'error',
          error: "Код подтверждения истек. Пожалуйста, войдите снова." 
        });
      }

      if (storedData.code !== code) {
        return reply.status(400).send({ 
          status: 'error',
          error: "Неверный код подтверждения" 
        });
      }

      // Удаляем использованный код
      verificationCodes.delete(email);

      // Получаем данные пользователя
      const user = await UserService.getUserByEmail(email);
      if (!user) {
        return reply.status(401).send({ 
          status: 'error',
          error: "Пользователь не найден" 
        });
      }
      
    
      const tokenPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      };
      const admin: IAdmin[] = await mongoClient.FindDocFieldsByFilter('admins', { userId: new ObjectId(user._id) });
      const token = generateToken(tokenPayload, req);
      await sendMail(email, 'Вход в учётную запись]', loginSuccessfulTemplate);
      return reply.status(200).send({ 
        status: 'success',
        token: token, 
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        admin: admin[0]
      });
    } catch (error) {
      console.error('Ошибка верификации:', error);
      return reply.status(401).send({ 
        status: 'error',
        error: "Ошибка верификации" 
      });
    }
  },
};