import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../utils/fastify-route";
import { CategoriesContoller } from "../controllers/categories.controller";

export const CategoriesRoute: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
    fastify.get('/categories', CategoriesContoller.GetCategories as any);
    fastify.get('/categories/:name', CategoriesContoller.GetCategoriesByName as any);
    fastify.post('/categories', CategoriesContoller.CreateCategories as any);
    done();
}