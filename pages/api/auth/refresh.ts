import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRefreshToken, generateTokenPair } from "../../../src/lib/auth";
import { rateLimiters } from "../../../src/middleware/rate-limit";
import { corsMiddleware } from "../../../src/middleware/cors";
import { validateBodySize } from "../../../src/middleware/body-parser";
import { logger } from "../../../src/lib/logger";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh токен не предоставлен" });
    }

    // Верификация refresh токена
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      logger.warn(
        {
          ip: req.socket.remoteAddress,
        },
        "Invalid refresh token attempt"
      );
      return res.status(401).json({ error: "Недействительный refresh токен" });
    }

    // Генерация новой пары токенов
    const tokenPair = generateTokenPair({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    logger.info(
      {
        userId: payload.userId,
        ip: req.socket.remoteAddress,
      },
      "Token refreshed successfully"
    );

    return res.status(200).json({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    });
  } catch (error: any) {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        ip: req.socket.remoteAddress,
      },
      "Token refresh error"
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
        rateLimiters.api(req, res, () => {
          handler(req, res).then(resolve).catch(resolve);
        });
      });
    });
  });
}
