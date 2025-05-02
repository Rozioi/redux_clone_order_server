import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest, HTTPMethods, RegisterOptions } from "fastify";

type FastifyNext = (err?: Error) => void;

interface IFastifyRouteDepends {
    fastify: FastifyInstance;
}

export type TRouteFunction = (fastify: FastifyInstance, _opts: FastifyPluginOptions, _next: FastifyNext) => void | Promise<void>;

export function FastifyRoute(depends: IFastifyRouteDepends, handlers: TRouteFunction[], options: RegisterOptions) {
    const { fastify } = depends;
    handlers.forEach((handler) => {
        fastify.register(handler, options)
    })
    // in my test, the lower code is slower than the upper one.
    // fastify.register(async (instance) => {
    //     for (const handler of handlers){
    //         await handler(instance, {}, async () => {});
    //     };
    // }, options)
}