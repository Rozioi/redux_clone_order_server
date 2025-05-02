import * as dotenv from "dotenv";
import path from "path";
import { z } from "zod";
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

const envSchema = z.object({
    PORT: z.string().min(1).default('8000'),
    SALT_ROUNDS: z.string().min(1).default('10'),
    JWT_SECRET: z.string().min(1).default('supersecret')
})

const env = envSchema.safeParse(process.env);

if (!env.success) {
    console.error(env.error);
    process.exit(1);
}

type TConfig = {
    PORT: number,
    SALT_ROUNDS: number,
    JWT_SECRET: string
}

if (Number.isNaN(Number(env.data.PORT))) {
    console.error("PORT must be a number");
    process.exit(1);
}

if (Number.isNaN(Number(env.data.SALT_ROUNDS))) {
    console.error("SALT_ROUNDS must be a number");
    process.exit(1);
}
export const config: TConfig = {
    PORT: parseInt(env.data.PORT, 10),
    SALT_ROUNDS: parseInt(env.data.SALT_ROUNDS, 10),
    JWT_SECRET: env.data.JWT_SECRET,
}