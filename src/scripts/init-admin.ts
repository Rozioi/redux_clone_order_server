import { mongoClient } from "../app";
import { UserService } from "../services/user.service";
import { PermissionService } from "../services/permission.service";
import { config } from "../config/env";
import { ObjectId } from "mongodb";
import { IAdmin, Role } from "../interface/admin.interface";
import { hashPassword } from "../utils/hash";

async function initializeAdmin() {
    try {
        
        await mongoClient.connect(
            {
                url: config.DATABASE_URL || "mongodb://localhost:27017",
                dbName: "mods"
            },
            () => {
                console.log('Подключение к базе данных установлено');
            },
            (error) => {
                console.error('Ошибка подключения к базе данных:', error);
                process.exit(1);
            }
        );

        const adminEmail = config.ADMIN.EMAIL || '';
        const adminPassword = config.ADMIN.PASSWORD || '';
        
        const existingAdmin = await UserService.getUserByEmail(adminEmail);
        console.log('Проверка существующего админа:', existingAdmin);
        if (existingAdmin) {
            console.log('Администратор уже существует');
            await mongoClient.close();
            return;
        }

        const adminData = {
            email: adminEmail,
            username: 'Системный Администратор',
            password: adminPassword,
            role: 'admin' as const,
        };

        const adminId = await UserService.createUser(adminData);
        console.log('Администратор создан с ID:', adminId);

        const admin: IAdmin = {
           name: adminData.username,
           userId: new ObjectId(adminId),
           role: 'highAdmin',
           permissions: 
           [ 'categories:manage', 'comments:delete', 
             'mods:approve', 'mods:delete',
             'mods:edit', 'mods:hide', 'notifications:send', 
             'reports:view', 'reviews:moderate', 
             'subscriptions:manage', 'users:assign_badge',
             'users:ban', 'users:mute', 
             'users:manage', 'advertisements:manage'
           ]
          
        }
      const result = await mongoClient.InsertDocumentWithIndex('admins', admin);
      console.log('Admins created:', result)

        await mongoClient.close();
        console.log('Инициализация завершена успешно');
    } catch (error) {
        console.error('Ошибка при инициализации администратора:', error);
        await mongoClient.close();
        process.exit(1);
    }
}

// Запускаем инициализацию
initializeAdmin(); 