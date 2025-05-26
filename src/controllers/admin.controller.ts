import { FastifyReply, FastifyRequest } from "fastify";
import { CategoryService } from "../services/category.service";
import { PermissionService } from "../services/permission.service";
import { ModService } from "../services/mod.service";
import { ICategoryRequest } from "../interface/category.interface";
import { ObjectId } from "mongodb";
import { UserService } from "../services/user.service";
import { sendMail } from "../utils/mailer";
import { generateVerificationCode } from "../utils/verification";
import { generateToken } from "../plugins/jwt";
import { AdminService } from "../services/admin.service";
import { AuthenticatedUser } from "../interface/request.interface";
import bcrypt from "bcrypt";
import { IAdmin } from "../interface/admin.interface";

interface CategoryParams {
  id: string;
}

interface ModParams {
  id: string;
}

// Хранилище кодов подтверждения (в реальном приложении лучше использовать Redis или другую БД)
const verificationCodes = new Map<string, { code: string; expires: number }>();


export const permissions = {
  highAdmin: ['manageUsers', 'manageCategories', 'approveMods', 'viewAll'],
  lowAdmin: ['manageCategories', 'approveMods', 'viewAll'],
  moderator: ['approveMods'],
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions][number];

function hasPermission(user: IAdmin, permission: Permission): boolean {
  const rolePermissions: readonly string[] = permissions[user.role];
  return rolePermissions.includes(permission);
}


interface CategoryParams {
  id: string;
}

export const adminController = {
  // async loginAdmin(
  //   req: FastifyRequest<{ Body: { email: string; password: string } }>,
  //   reply: FastifyReply
  // ) {
  //   try {
  //     const { email, password } = req.body;
      
  //     if (!email || !password) {
  //       return reply.status(400).send({ error: "Email и пароль обязательны" });
  //     }

  //     // Проверяем учетные данные без генерации токена
  //     const user = await UserService.getUserByEmail(email);
  //     if (!user) {
  //       return reply.status(401).send({ error: "Неверные учетные данные" });
  //     }

  //     const isMatch = await bcrypt.compare(password, user.password_hash);
  //     if (!isMatch) {
  //       return reply.status(401).send({ error: "Неверные учетные данные" });
  //     }

  //     // Проверяем, является ли пользователь администратором
  //     if (user.role !== 'admin') {
  //       return reply.status(403).send({ error: "Доступ запрещен. Требуются права администратора." });
  //     }

  //     // Генерируем код подтверждения
  //     const verificationCode = generateVerificationCode();
  //     const expiresIn = 5 * 60 * 1000; // 5 минут
  //     verificationCodes.set(email, {
  //       code: verificationCode,
  //       expires: Date.now() + expiresIn
  //     });

  //     // Отправляем код на почту
  //     await sendMail(
  //       email,
  //       'Код подтверждения входа в админ-панель',
  //       `<div>
  //         <h2>Код подтверждения входа</h2>
  //         <p>Ваш код подтверждения: <strong>${verificationCode}</strong></p>
  //         <p>Код действителен в течение 5 минут.</p>
  //       </div>`
  //     );

  //     // Возвращаем только информацию о необходимости верификации
  //     return reply.status(200).send({ 
  //       status: 'verification_required',
  //       message: "Код подтверждения отправлен на вашу почту",
  //       email: email
  //     });
  //   } catch (error) {
  //     console.error('Ошибка входа администратора:', error);
  //     return reply.status(401).send({ error: "Неверные учетные данные" });
  //   }
  // },

  // async verifyAdminLogin(
  //   req: FastifyRequest<{ Body: { email: string; code: string } }>,
  //   reply: FastifyReply
  // ) {
  //   try {
  //     const { email, code } = req.body;
      
  //     const storedData = verificationCodes.get(email);
  //     if (!storedData) {
  //       return reply.status(400).send({ 
  //         status: 'error',
  //         error: "Код подтверждения не найден. Пожалуйста, войдите снова." 
  //       });
  //     }

  //     if (Date.now() > storedData.expires) {
  //       verificationCodes.delete(email);
  //       return reply.status(400).send({ 
  //         status: 'error',
  //         error: "Код подтверждения истек. Пожалуйста, войдите снова." 
  //       });
  //     }

  //     if (storedData.code !== code) {
  //       return reply.status(400).send({ 
  //         status: 'error',
  //         error: "Неверный код подтверждения" 
  //       });
  //     }

  //     // Удаляем использованный код
  //     verificationCodes.delete(email);

  //     // Получаем данные пользователя
  //     const user = await UserService.getUserByEmail(email);
  //     if (!user) {
  //       return reply.status(401).send({ 
  //         status: 'error',
  //         error: "Пользователь не найден" 
  //       });
  //     }

  //     // Проверяем и создаем права доступа, если их нет
  //     const existingPermissions = await PermissionService.getUserPermissions(user._id.toString());
  //     if (!existingPermissions) {
  //       const userRole = (user.role || 'user') as UserRole;
  //       const permissionData = {
  //         userId: user._id,
  //         role: userRole,
  //         canManageUsers: userRole === 'admin',
  //         canManageCategories: userRole === 'admin',
  //         canModerateMods: userRole === 'admin' || userRole === 'moderator',
  //         canManageSubscriptions: userRole === 'admin'
  //       };
  //       await PermissionService.createPermission(permissionData);
  //     }

  //     // Генерируем токен
  //     const tokenPayload = {
  //       id: user._id.toString(),
  //       email: user.email,
  //       role: user.role
  //     };

  //     const token = generateToken(tokenPayload, req);
      
  //     return reply.status(200).send({ 
  //       status: 'success',
  //       token: token, 
  //       user: {
  //         _id: user._id,
  //         email: user.email,
  //         name: user.name,
  //         role: user.role
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Ошибка верификации:', error);
  //     return reply.status(401).send({ 
  //       status: 'error',
  //       error: "Ошибка верификации" 
  //     });
  //   }
  // },

  
  async createCategory(
    req: FastifyRequest<{ Body: ICategoryRequest }>,
    reply: FastifyReply
  ) {
    try {
      const categoryId = await CategoryService.createCategory(req.body);
      return reply.status(201).send({ categoryId });
    } catch (error) {
      return reply.status(500).send({ message: 'Failed to create category' });
    }
  },

  async getAllCategories(
    _req: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const categories = await CategoryService.getAllCategories();
      return reply.send(categories);
    } catch (error) {
      return reply.status(500).send({ message: 'Failed to get categories' });
    }
  },

  // async updateCategory(
  //   req: FastifyRequest<{ Params: CategoryParams; Body: Partial<ICategoryRequest> }>,
  //   reply: FastifyReply
  // ) {
  //   try {
  //     const success = await CategoryService.updateCategory(req.params.id, req.body);
  //     if (success) {
  //       return reply.send({ message: 'Category updated successfully' });
  //     }
  //     return reply.status(404).send({ message: 'Category not found' });
  //   } catch (error) {
  //     return reply.status(500).send({ message: 'Failed to update category' });
  //   }
  // },

  // async deleteCategory(
  //   req: FastifyRequest<{ Params: CategoryParams }>,
  //   reply: FastifyReply
  // ) {
  //   try {
  //     const success = await CategoryService.deleteCategory(req.params.id);
  //     if (success) {
  //       return reply.send({ message: 'Category deleted successfully' });
  //     }
  //     return reply.status(404).send({ message: 'Category not found' });
  //   } catch (error) {
  //     return reply.status(500).send({ message: 'Failed to delete category' });
  //   }
  // },

  // // Права доступа
  // async createPermission(
  //   req: FastifyRequest<{ Body: IUserPermissionRequest }>,
  //   reply: FastifyReply
  // ) {
  //   try {
  //     const permissionId = await AdminService.createPermission(req.body);
  //     reply.code(201).send({ id: permissionId });
  //   } catch (error) {
  //     reply.code(500).send({ error: 'Failed to create permission' });
  //   }
  // },

  // async updatePermissions(
  //   req: FastifyRequest<{ Params: PermissionParams; Body: Partial<IUserPermissionRequest> }>,
  //   reply: FastifyReply
  // ) {
  //   try {
  //     const success = await AdminService.updatePermissions(req.params.userId, req.body);
  //     if (!success) {
  //       reply.code(404).send({ error: 'User not found' });
  //       return;
  //     }
  //     reply.send({ success: true });
  //   } catch (error) {
  //     reply.code(500).send({ error: 'Failed to update permissions' });
  //   }
  // },

  // moderate mode
  
  async getPendingMods(
    _req: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const pendingMods = await ModService.getPendingMods();
      return reply.send(pendingMods);
    } catch (error) {
      return reply.status(500).send({ message: 'Failed to get pending mods' });
    }
  },

  // async approveMod(
  //   req: FastifyRequest<{ Params: ModParams }>,
  //   reply: FastifyReply
  // ) {
  //   try {
  //     const success = await ModService.approveMod(req.params.id);
  //     if (success) {
  //       return reply.send({ message: 'Mod approved successfully' });
  //     }
  //     return reply.status(404).send({ message: 'Mod not found' });
  //   } catch (error) {
  //     return reply.status(500).send({ message: 'Failed to approve mod' });
  //   }
  // },

  // async rejectMod(
  //   req: FastifyRequest<{ Params: ModParams }>,
  //   reply: FastifyReply
  // ) {
  //   try {
  //     const success = await ModService.rejectMod(req.params.id);
  //     if (success) {
  //       return reply.send({ message: 'Mod rejected successfully' });
  //     }
  //     return reply.status(404).send({ message: 'Mod not found' });
  //   } catch (error) {
  //     return reply.status(500).send({ message: 'Failed to reject mod' });
  //   }
  // },

  // async getModById(
  //   req: FastifyRequest<{ Params: ModParams }>,
  //   reply: FastifyReply
  // ) {
  //   try {
  //     const mod = await ModService.GetModById(req.params.id);
  //     if (!mod) {
  //       return reply.status(404).send({ message: 'Mod not found' });
  //     }
  //     return reply.send(mod);
  //   } catch (error) {
  //     console.error('Failed to get mod:', error);
  //     return reply.status(500).send({ message: 'Failed to get mod' });
  //   }
  // },

  // async updateUserRole(
  //   req: FastifyRequest<{ 
  //     Params: { userId: string }; 
  //     Body: { role: string } 
  //   }>,
  //   reply: FastifyReply
  // ) {
  //   try {
  //     const { userId } = req.params;
  //     const { role } = req.body;

  //     // Проверяем, что роль является допустимой
  //     if (!['user', 'moderator', 'admin'].includes(role)) {
  //       return reply.status(400).send({ 
  //         error: "Недопустимая роль пользователя" 
  //       });
  //     }

  //     // Обновляем роль пользователя
  //     const success = await UserService.updateUserRole(userId, role);
      
  //     if (success) {
  //       // Обновляем права доступа
  //       const permissionData = {
  //         role: role as UserRole,
  //         canManageUsers: role === 'admin',
  //         canManageCategories: role === 'admin',
  //         canModerateMods: role === 'admin' || role === 'moderator',
  //         canManageSubscriptions: role === 'admin'
  //       };

  //       await PermissionService.updateUserPermissions(userId, permissionData);
        
  //       return reply.status(200).send({ 
  //         message: "Роль пользователя успешно обновлена" 
  //       });
  //     }

  //     return reply.status(404).send({ 
  //       error: "Пользователь не найден" 
  //     });
  //   } catch (error) {
  //     console.error('Ошибка при обновлении роли пользователя:', error);
  //     return reply.status(500).send({ 
  //       error: "Ошибка при обновлении роли пользователя" 
  //     });
  //   }
  // }
};