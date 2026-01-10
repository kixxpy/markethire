import { NextApiRequest, NextApiResponse } from "next";
import { config } from "../lib/config";
import { logger } from "../lib/logger";

/**
 * Парсинг размера из строки (например, "1mb" -> 1048576)
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+)([a-z]+)$/);
  if (!match) {
    return 1024 * 1024; // По умолчанию 1MB
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  return value * (units[unit] || 1);
}

/**
 * Middleware для валидации размера тела запроса
 */
export function validateBodySize(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const contentLength = req.headers["content-length"];

  if (contentLength) {
    const maxSize = parseSize(config.maxRequestSize);
    const requestSize = parseInt(contentLength, 10);

    if (requestSize > maxSize) {
      logger.warn(
        {
          size: requestSize,
          maxSize,
          path: req.url,
          ip: req.socket.remoteAddress,
        },
        "Request body too large"
      );

      return res.status(413).json({
        error: `Размер тела запроса превышает максимально допустимый (${config.maxRequestSize})`,
      });
    }
  }

  next();
}
