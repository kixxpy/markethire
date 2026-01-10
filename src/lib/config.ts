import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET должен быть минимум 32 символа для безопасности")
    .refine(
      (val) => val !== "your-secret-key" && val !== "your-secret-key-change-in-production",
      "JWT_SECRET не может быть дефолтным значением"
    ),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET должен быть минимум 32 символа для безопасности")
    .optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL должен быть валидным URL"),
  CORS_ORIGIN: z.string().url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
  MAX_REQUEST_SIZE: z.string().optional().default("1mb"),
});

function validateEnv() {
  try {
    return envSchema.parse({
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      LOG_LEVEL: process.env.LOG_LEVEL,
      MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(
        `Ошибка валидации переменных окружения:\n${errorMessages}\n\nПожалуйста, проверьте файл .env`
      );
    }
    throw error;
  }
}

const validatedEnv = validateEnv();

export const config = {
  jwtSecret: validatedEnv.JWT_SECRET,
  jwtRefreshSecret: validatedEnv.JWT_REFRESH_SECRET || validatedEnv.JWT_SECRET,
  nodeEnv: validatedEnv.NODE_ENV,
  databaseUrl: validatedEnv.DATABASE_URL,
  corsOrigin: validatedEnv.CORS_ORIGIN,
  logLevel: validatedEnv.LOG_LEVEL,
  maxRequestSize: validatedEnv.MAX_REQUEST_SIZE,
  isDevelopment: validatedEnv.NODE_ENV === "development",
  isProduction: validatedEnv.NODE_ENV === "production",
};
