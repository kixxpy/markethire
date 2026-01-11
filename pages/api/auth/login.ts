import type { NextApiRequest, NextApiResponse } from "next";
import { loginUser } from "../../../src/services/user.service";
import { loginSchema } from "../../../src/lib/validation";
import { corsMiddleware } from "../../../src/middleware/cors";
import { validateBodySize } from "../../../src/middleware/body-parser";
import { logger } from "../../../src/lib/logger";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    // Валидация данных
    const validatedData = loginSchema.parse(req.body);

    // Вход пользователя
    const result = await loginUser(validatedData);

    logger.info(
      {
        userId: result.user.id,
        email: result.user.email,
        ip: req.socket.remoteAddress,
      },
      "User logged in successfully"
    );

    return res.status(200).json({
      message: "Успешный вход",
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
        "Login validation error"
      );
      return res.status(400).json({
        error: "Ошибка валидации",
        details: error.errors,
      });
    }

    if (
      error.message === "Неверный email или пароль" ||
      error.message === "Пользователь не найден"
    ) {
      logger.warn(
        {
          email: req.body?.email,
          ip: req.socket.remoteAddress,
        },
        "Failed login attempt"
      );
      return res.status(401).json({ error: error.message });
    }

    logger.error(
      {
        error: error.message,
        stack: error.stack,
        ip: req.socket.remoteAddress,
      },
      "Login error"
    );
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
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
        handler(req, res).then(resolve).catch(resolve);
      });
    });
  });
}
