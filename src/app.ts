import Fastify  from "fastify";
import fastifyStatic from '@fastify/static';
import { FastifyRoute } from "./utils/fastify-route";
import fastifyCors from "@fastify/cors";
import jwtPlugin from "./plugins/jwt";
import { UserRoutes } from "./routes/user.route";
import { MongoDbClient } from "./plugins/db";
import { ModRoutes } from "./routes/mod.route";
import { AdminRoutes } from "./routes/admin.route";
import { YouKassaRoutes } from "./payments/yookassa/routes";
import path from "path";
import { AdvertisementRoutes } from "./routes/advertisement.routes";
import { CategoryRoutes } from "./routes/category.routes";

export const app = Fastify({
	logger: true,
	connectionTimeout: 25000, 
	keepAliveTimeout: 25000, 
	bodyLimit: 20 * 1024 * 1024, 
});

app.register(fastifyCors, {
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
});
app.register(fastifyStatic, {
  root: path.join(__dirname, '/utils/mods'), // путь до папки с файлами
  prefix: '/mods/download/',             // URL-префикс
});
app.register(jwtPlugin);

const mongoConfig = {
	url: "mongodb://localhost:27017",
	dbName: "mods",
};

export const mongoClient = new MongoDbClient(mongoConfig);

mongoClient.connect(
	() => {
		console.log("Connected to MongoDB");
	},
	(error: Error) => {
		console.error("MongoDB connection error:", error);
	}
);

async function initializeSubscriptionSettings() {
    try {
        const settings = await mongoClient.FindDocFieldsByFilter('subscription_settings', {});
        
        if (!settings || settings.length === 0) {
            // Создаем дефолтные настройки
            await mongoClient.InsertDocumentWithIndex('subscription_settings', {
                downloadQuota: {
                    free: 0.005,    // 0.5 МБ/с
                    basic: 1,     // 1 МБ/с
                    medium: 5,    // 5 МБ/с
                    premium: 10   // 10 МБ/с
                },
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('Default subscription settings initialized');
        }
    } catch (error) {
        console.error('Error initializing subscription settings:', error);
    }
}

FastifyRoute(
	{
		fastify: app,
	},
	[UserRoutes, ModRoutes, AdminRoutes,YouKassaRoutes, CategoryRoutes,AdvertisementRoutes],
	{ prefix: "/api/v1/" }
);