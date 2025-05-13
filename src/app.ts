import Fastify, { fastify } from "fastify";
import { FastifyRoute } from "./utils/fastify-route";
import fastifyCors from "@fastify/cors";
import jwtPlugin from "./plugins/jwt";
import { UserRoutes } from "./routes/user.route";
import { MongoDbClient } from "./plugins/db";
import { ModRoutes } from "./routes/mod.route";

export const app = Fastify({
	logger: true,
});
export const mongoClient = new MongoDbClient();
const mongoConfig = {
	url: "mongodb://localhost:27017",
	dbName: "redux",
};
app.register(jwtPlugin);
app.register(fastifyCors, { origin: "*" });
app.addHook("onReady", async () => {
	await mongoClient.connect(
		mongoConfig,
		() => console.log("Connected to MongoDB successfully"),
		error => console.error("MongoDB connection failed: ", error)
	);
});
app.addHook("onClose", async () => {
	await mongoClient.close();
});
FastifyRoute(
	{
		fastify: app,
	},
	[UserRoutes, ModRoutes],
	{ prefix: "/api/v1/" }
);
