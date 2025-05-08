import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { userController } from "../controllers/user.controller";
import { TRouteFunction } from "../utils/fastify-route";
import { mongoClient } from "../app";
import { ObjectId } from "mongodb";

export const UserRoutes: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
    fastify.get('/users/:id', { 
        preHandler: fastify.verifyJWT 
    }, userController.getUserById as any);

    
    fastify.get('/users', {
            preHandler: fastify.verifyJWT,
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        page: { type: 'string', pattern: '^\\d+$', default: '1' },
                        limit: { type: 'string', pattern: '^\\d+$', default: '10' }
                    }
                }
            }
        }, async (req, reply) => {
            try {
                const page = parseInt((req.query as any).page) || 1;
                const limit = parseInt((req.query as any).limit) || 10;
                const result = await userController.getUsersPaginated(page, limit);
                return reply.send(result);
            } catch (error) {
                return reply.status(500).send({ error: 'Internal Server Error' });
            }
        });
    


    fastify.post('/users', userController.createNewUser);

    fastify.put('/users/:id/status', { 
        preHandler: fastify.verifyJWT 
    }, userController.toggleAccountStatus as any);

    fastify.delete('/users/:id', { 
        preHandler: fastify.verifyJWT 
    }, userController.deleteAccount as any);

    fastify.post('/users/login', userController.loginUser);

    fastify.get('/users/verify', { 
        preHandler: fastify.verifyJWT 
    }, userController.verifyToken);

    done();
};