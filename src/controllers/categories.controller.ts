import { FastifyReply, FastifyRequest } from "fastify";
import { CategoriesService } from "../services/categories.service";

export const CategoriesContoller = {
    async GetCategories(req: FastifyRequest, reply: FastifyReply) {
        try {
            const Categories = await CategoriesService.GetCategories();
            if (!Categories) {
                return reply.status(400).send({ error: 'Not found this categories' })
            }
            return reply.status(200).send({ Categories: Categories })
        } catch (error) {
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    },
    async CreateCategories(req:FastifyRequest<{Body: {name: string}}>, reply: FastifyReply){
        try{
            const name = req.body.name;
            const categories = await CategoriesService.GetCategoriesByName(name);
            if (categories != null){
                return reply.status(400).send({error: "Categories already exists"});
            }
            const isSuccess = await CategoriesService.CreateCategories(name);
            if (!isSuccess){
                return reply.status(500).send({error: "Failed create categories"});
            }
            return reply.status(200).send('Categories created');
        } catch(error){
            return reply.code(500).send({error: 'Internal Server Error'})
        }
    },
    async GetCategoriesByName(req: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) {
        const name = req.params.name;
        try {
            if (!name) {
                return reply.status(400).send({ error: 'Invalid parameters' })
            }
            const Categories = await CategoriesService.GetCategoriesByName(name);
            if (!Categories) {
                return reply.status(404).send({ error: "Not found this categories" })
            }
            return reply.status(200).send({ Categories: Categories })
        } catch (error) {
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }
}