import { MongoDbClient } from "../plugins/db";
import { config } from "../config/env";
import { UserRole } from "../interface/permission.interface";

async function initAdminPermissions() {
    const mongoClient = new MongoDbClient();
    
    try {
        await mongoClient.connect(
            { url: config.DATABASE_URL || "mongodb://localhost:27017", dbName: "mods" },
            async () => {
                console.log("Connected to MongoDB");
                
                console.log("Looking for admin with email:", config.ADMIN.EMAIL);
                const [admin] = await mongoClient.FindDocFieldsByFilter(
                    'users',
                    { email: config.ADMIN.EMAIL },
                    {},
                    1
                );
                console.log("Found admin:", admin);

                if (!admin) {
                    console.error("Admin user not found");
                    process.exit(1);
                }

                // Создаем права для администратора
                const adminPermissions = {
                    userId: admin._id.toString(),
                    role: UserRole.ADMIN,
                    canManageUsers: true,
                    canManageCategories: true,
                    canModerateMods: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                console.log("Creating permissions:", adminPermissions);

                // Проверяем, существуют ли уже права для этого пользователя
                const [existingPermissions] = await mongoClient.FindDocFieldsByFilter(
                    'permissions',
                    { userId: admin._id.toString() },
                    {},
                    1
                );

                if (existingPermissions) {
                    console.log("Admin permissions already exist:", existingPermissions);
                } else {
                    // Создаем новые права
                    const result = await mongoClient.InsertDocumentWithIndex(
                        'permissions',
                        adminPermissions
                    );
                    console.log("Admin permissions created successfully:", result);
                }

                await mongoClient.close();
                process.exit(0);
            },
            (error) => {
                console.error("Failed to connect to MongoDB:", error);
                process.exit(1);
            }
        );
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

initAdminPermissions(); 