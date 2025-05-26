import fp from "fastify-plugin"
import fjwt from "@fastify/jwt"
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config/env";
import { AuthenticatedUser } from "../interface/request.interface";

export function generateToken(payload: object, req: FastifyRequest): string {
    console.log("Generating token with payload:", payload);
    const token = req.server.jwt.sign(payload);
    console.log("Generated token:", token);
    return token;
}

export default fp(async function (fastify: FastifyInstance) {
    fastify.register(fjwt, {
        secret: config.JWT_SECRET,
        sign: {
            expiresIn: '24h',
        },
    });

    fastify.decorate("verifyJWT", async function (req: FastifyRequest, reply: FastifyReply) {
        try {
            console.log("Verifying token from request");
            const decoded = await req.jwtVerify();
            console.log("Decoded token:", decoded);
            req.user = decoded as AuthenticatedUser;
            console.log("User set in request:", req.user);
        } catch (err) {
            console.error("Token verification failed:", err);
            reply.status(401).send({ message: "Unauthorized" });
        }
    });
});

declare module "fastify" {
    interface FastifyInstance {
        verifyJWT(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    }
}