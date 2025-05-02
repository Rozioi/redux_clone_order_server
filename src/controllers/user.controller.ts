import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/user.service";

export interface User {
    id?: number;
    name: string;
    email: string;
    password_hash: string;
    role: string;
    bio?: string;
    is_active?: boolean;
    rating?: number;
    created_at?: Date;
    updated_at?: Date;
}



export const userController = {


    async toogleAccountStatus(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return reply.status(400).send({ error: "Invalid parameters" });
        }
        const user = await UserService.getUserByID(id);
        if (!user) {
            return reply.status(404).send({ error: "User not found" });
        }
        const newStatus = !user.is_active;
        await UserService.toogleAccountStatus(id, newStatus);
        return reply.send({
            message: `User account ${newStatus ? "activated" : "deactivated"} successfully.`,
            newStatus
        })
    },
    async deleteAccount(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return reply.status(400).send({ error: "Invalid parameters" });
        }
        const user = await UserService.getUserByID(id);
        if (!user) {
            return reply.status(404).send({ error: "User not found" });
        }
        await UserService.deleteAccount(id);
        return reply.send({ message: "User deleted successfully" });
    },
    async getUserById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return reply.status(400).send({ error: "Invalid parameters" });
        }
        const user = await UserService.getUserByID(id);
        if (!user) {
            reply.status(404).send('Not Found')
        }
        return reply.send(user);
    },
    async loginUser(req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) {
        const { email, password } = req.body;
        try {
            const result = await UserService.loginUser(email, password, req);
            return reply.status(200).send({ token: result?.token, user: result?.user });
        } catch (error) {
            return reply.status(500).send(error);
        }
    },
    async createNewUser(req: FastifyRequest<{ Body: User }>, reply: FastifyReply) {
        const user = req.body;
        try {
            await UserService.createNewUser(user);
            return reply.send('User Created');
        } catch (error) {
            return reply.status(500).send('Internal Server Error');
        }
    },
    async token(req: FastifyRequest, reply: FastifyReply) {
        return reply.send(req.server.jwt.sign({ id: 1 }));
    }

};
