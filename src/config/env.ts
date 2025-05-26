import * as dotenv from "dotenv";
import path from "path";
import { z } from "zod";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });


const envSchema = z.object({
  PORT: z.string().min(1).default('8000'),
  SALT_ROUNDS: z.string().min(1).default('10'),
  JWT_SECRET: z.string().min(32, "JWT_SECRET должен быть не менее 32 символов"),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().min(1),
  SMTP_USER: z.string().email(),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM_EMAIL: z.string().email(),
  
  // Дополнительные параметры (можно добавить другие)
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url().optional(),
  // Конфигурация администратора
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(1).optional()
});

// Валидация переменных окружения
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("Ошибка валидации переменных окружения:");
  console.error(env.error.format());
  process.exit(1);
}

// Преобразование типов
const config = {
  // Базовые настройки
  PORT: parseInt(env.data.PORT, 10),
  SALT_ROUNDS: parseInt(env.data.SALT_ROUNDS, 10),
  JWT_SECRET: env.data.JWT_SECRET,
  
  SMTP: {
    host: env.data.SMTP_HOST,
    port: parseInt(env.data.SMTP_PORT, 10),
    user: env.data.SMTP_USER,
    password: env.data.SMTP_PASSWORD,
    from: env.data.SMTP_FROM_EMAIL
  },
  NODE_ENV: env.data.NODE_ENV,
  DATABASE_URL: env.data.DATABASE_URL,
  // Конфигурация администратора
  ADMIN: {
    EMAIL: env.data.ADMIN_EMAIL,
    PASSWORD: env.data.ADMIN_PASSWORD
  }
};

if (Number.isNaN(config.PORT)) {
  console.error("PORT must be a valid number");
  process.exit(1);
}

if (Number.isNaN(config.SALT_ROUNDS)) {
  console.error("SALT_ROUNDS must be a valid number");
  process.exit(1);
}

if (Number.isNaN(config.SMTP.port)) {
  console.error("SMTP_PORT must be a valid number");
  process.exit(1);
}

export type TConfig = typeof config;
export { config };