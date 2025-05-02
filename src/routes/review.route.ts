import { FastifyInstance } from "fastify";
import { TRouteFunction } from "../utils/fastify-route";
import { ReviewController } from "../controllers/review.controller";

export const ReviewRoute: TRouteFunction = (fastify: FastifyInstance, _opts, done) => {
    fastify.get('/reviews/user/:id', { preHandler: fastify.verifyJWT }, ReviewController.getReviewsByUserId as any);
    fastify.get('/reviews/author/:id', { preHandler: fastify.verifyJWT }, ReviewController.getReviewsByAuthorId as any);
    fastify.post('/review/create', { preHandler: fastify.verifyJWT }, ReviewController.createReview as any);
    fastify.put('/review/:id/:amount', { preHandler: fastify.verifyJWT }, ReviewController.increaseRating as any);
    fastify.delete('/review/:id/:user_id', ReviewController.deleteReview);
    done();
}