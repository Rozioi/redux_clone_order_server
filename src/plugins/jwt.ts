import fp from "fastify-plugin"
import fjwt from "@fastify/jwt"
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config/env";
export function generateToken(payload: object, req: FastifyRequest): string {
    return req.server.jwt.sign(payload);

}
export default fp(async function (fastify: FastifyInstance) {
    fastify.register(fjwt, {
        secret: config.JWT_SECRET,
        sign: {
            expiresIn: '1h',
        },
    });
    fastify.decorate("verifyJWT", async function (req: FastifyRequest, reply: FastifyReply) {
        try {
            const decoded = await req.jwtVerify();

            req.user = decoded;
        } catch (err) {
            reply.status(401).send({ message: "Unauthorized" });
        }
    });


});

declare module "fastify" {
    interface FastifyInstance {
        verifyJWT(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    }
}