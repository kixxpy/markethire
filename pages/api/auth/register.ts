import type { NextApiRequest, NextApiResponse } from "next";
import { registerUser } from "../../../src/services/user.service";
import { registerSchema } from "../../../src/lib/validation";
import { rateLimiters } from "../../../src/middleware/rate-limit";
import { corsMiddleware } from "../../../src/middleware/cors";
import { validateBodySize } from "../../../src/middleware/body-parser";
import { logger } from "../../../src/lib/logger";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    // Валидация данных
    const validatedData = registerSchema.parse(req.body);

    // Регистрация пользователя
    const result = await registerUser(validatedData);

    logger.info(
      {
        userId: result.user.id,
        email: result.user.email,
        ip: req.socket.remoteAddress,
      },
      "User registered successfully"
    );

    return res.status(201).json({
      message: "Пользователь успешно зарегистрирован",
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      logger.warn(
        {
          errors: error.errors,
          ip: req.socket.remoteAddress,
        },
        "Registration validation error"
      );
      return res.status(400).json({
        error: "Ошибка валидации",
        details: error.errors,
      });
    }

    if (error.message === "Пользователь с таким email уже существует") {
      logger.warn(
        {
          email: req.body?.email,
          ip: req.socket.remoteAddress,
        },
        "Registration attempt with existing email"
      );
      return res.status(409).json({ error: error.message });
    }

    if (error.message === "Пользователь с таким никнеймом уже существует") {
      logger.warn(
        {
          username: req.body?.username,
          ip: req.socket.remoteAddress,
        },
        "Registration attempt with existing username"
      );
      return res.status(409).json({ error: error.message });
    }

    logger.error(
      {
        error: error.message,
        stack: error.stack,
        ip: req.socket.remoteAddress,
      },
      "Registration error"
    );
    return res.status(500).json({ 
      error: "Внутренняя ошибка сервера",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Применяем middleware
export default async function wrappedHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return new Promise<void>((resolve) => {
    corsMiddleware(req, res, () => {
      validateBodySize(req, res, () => {
        rateLimiters.register(req, res, () => {
          handler(req, res).then(resolve).catch(resolve);
        });
      });
    });
  });
}
