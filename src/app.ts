import Fastify from "fastify";
import { FastifyRoute } from "./utils/fastify-route";
import fastifyCors from "@fastify/cors";
import jwtPlugin from "./plugins/jwt";
import { UserRoutes } from "./routes/user.route";
import { MongoDbClient } from "./plugins/db";
import { ModRoutes } from "./routes/mod.route";
import { AdminRoutes } from "./routes/admin.route";

export const app = Fastify({
	logger: true,
});

app.register(fastifyCors, {
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

app.register(jwtPlugin);

export const mongoClient = new MongoDbClient();

mongoClient.connect(
	{
		url: "mongodb://localhost:27017",
		dbName: "mods",
	},
	() => {
		console.log("Connected to MongoDB");
	},
	(error) => {
		console.error("MongoDB connection error:", error);
	}
);

FastifyRoute(
	{
		fastify: app,
	},
	[UserRoutes, ModRoutes, AdminRoutes],
	{ prefix: "/api/v1/" }
);
