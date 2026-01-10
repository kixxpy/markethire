import { NextApiRequest, NextApiResponse } from "next";
import { config } from "../lib/config";

/**
 * Middleware для обработки CORS
 */
export function corsMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const origin = req.headers.origin;

  // Разрешенные источники
  const allowedOrigins = config.corsOrigin
    ? [config.corsOrigin]
    : config.isDevelopment
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : [];

  // Проверка origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (config.isDevelopment && origin) {
    // В разработке разрешаем любые origin
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin && config.isDevelopment) {
    // Для запросов без origin в разработке
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 часа

  // Обработка preflight запросов
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
}
