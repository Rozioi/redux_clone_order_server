import { mongoClient } from "../app";
import { UserService } from "../services/user.service";
import { PermissionService } from "../services/permission.service";
import { config } from "../config/env";
import { UserRole } from "../interface/permission.interface";
import { ObjectId } from "mongodb";
import { hashPassword } from "../utils/hash";

async function initializeAdmin() {
    try {
        // Инициализируем подключение к базе данных
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
            name: 'System Administrator',
            password_hash: adminPassword,
            role: 'admin',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };

        const adminId = await UserService.createNewUser(adminData);
        console.log('Администратор создан с ID:', adminId);

        // Устанавливаем права администратора
        const permissionData = {
            userId: new ObjectId(adminId),
            role: UserRole.ADMIN,
            canManageUsers: true,
            canManageCategories: true,
            canModerateMods: true,
            allowedCategories: []
        };

        await PermissionService.createPermission(permissionData);
        console.log('Права администратора установлены');

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