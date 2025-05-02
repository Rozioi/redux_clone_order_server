import { FastifyReply, FastifyRequest } from "fastify";
import { ReviewService } from "../services/review.service";
import { UserService } from "../services/user.service";
import { User } from "./user.controller";
export interface Review {
    id: number;
    user_id: number;
    author_id: number;
    rating: number;
    review: string;
    created_at: Date;
}

export const ReviewController = {
    async getReviewsByUserId(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const id = parseInt(req.params.id);
        try {
            if (isNaN(id)) {
                return reply.status(400).send({ error: 'Invalid parameters' });
            }
            const reviews = await ReviewService.getReviewsByUserId(id);
            if (!reviews) {
                return reply.status(404).send({ error: "Not found this user" })
            }
            return reply.send({ reviews: reviews });

        } catch (error) {
            return reply.status(500).send({ error });
        }
    },
    async createReview(req: FastifyRequest<{ Body: { review: string, rating: number, user_id: number, author_id: number } }>, reply: FastifyReply) {
        try {
            const { review, rating, user_id, author_id } = req.body;
            if (!review || !rating || !user_id || !author_id) {
                return reply.status(400).send({ error: 'Invalid parameters' });
            }
            if (isNaN(rating) || isNaN(user_id) || isNaN(author_id)) {
                return reply.status(400).send({ error: 'Invalid parameters' });
            }
            if (rating < 1 || rating > 5) {
                return reply.status(400).send({ error: 'Rating must be between 1 and 5' });
            }
            if (user_id === author_id) {
                return reply.status(400).send({ error: 'You cannot review yourself' });
            }
            const user = await UserService.getUserByID(user_id);
            const author = await UserService.getUserByID(author_id);

            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }

            if (!author) {
                return reply.status(404).send({ error: 'Author not found' });
            }


            const result = await ReviewService.createReview(review, rating, user_id, author_id);
            if (result) {
                await ReviewService.increaseRating(author_id, rating, author.rating ? author.rating : 0);
            }
            return reply.send(result);
        } catch (error) {
            return reply.status(500).send(error);
        }
    },
    async getReviewsByAuthorId(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const id = parseInt(req.params.id);
        try {
            if (isNaN(id)) {
                return reply.status(400).send({ error: 'Invalid parameters' });
            };
            const result = await ReviewService.getReviewsByAuthorId(id);
            if (!result) {
                return reply.status(404).send({ error: 'Not found this author' });
            }
            return reply.send(result);
        } catch (error) {
            return reply.status(500).send(error);
        }

    },
    async increaseRating(req: FastifyRequest<{ Params: { id: string, amount: string } }>, reply: FastifyReply) {
        const id = parseInt(req.params.id);
        const rating = parseFloat(req.params.amount);
        if (isNaN(id) || isNaN(rating)) {
            return reply.status(400).send({ error: "Invalid parameters" });
        }
        const user: User = await UserService.getUserByID(id);
        if (!user) {
            return reply.status(404).send({ error: "User not found" });
        }
        const updatedUser = await ReviewService.increaseRating(id, rating, user.rating ? user.rating : 0);
        if (!updatedUser) {
            return reply.status(500).send({ error: "Failed to update user rating" });
        }
        return reply.send({ message: "Rating increased", user: updatedUser });
    },
    async deleteReview(req: FastifyRequest<{ Params: { id: string, user_id: string } }>, reply: FastifyReply) {
        try {
            const id = parseInt(req.params.id);
            const user_id = parseInt(req.params.user_id);

            if (isNaN(id) || isNaN(user_id)) {
                return reply.code(400).send({ error: 'Invalid parameters' });
            }

            const review: Review = await ReviewService.getReviewsById(id);
            if (!review) {
                return reply.code(404).send({ error: "Review not found" });
            }
            if (review.author_id !== user_id) {
                return reply.code(403).send({ error: 'You are not the author of this review' });
            }

            const result = await ReviewService.deleteReview(id, user_id);
            if (!result) {
                return reply.code(500).send({ error: 'Failed to delete review' });
            }

            return reply.code(200).send({ message: "Review successfully deleted" });
        } catch (error) {
            req.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

}