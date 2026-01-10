import { NextApiRequest, NextApiResponse } from "next";
import { config } from "../lib/config";

interface RateLimitOptions {
  windowMs: number; // Время окна в миллисекундах
  max: number; // Максимальное количество запросов
  message?: string;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Простое in-memory хранилище для rate limiting
// В продакшене рекомендуется использовать Redis
const store: RateLimitStore = {};

// Очистка устаревших записей каждые 5 минут
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Получение ключа для rate limiting на основе IP адреса
 */
function getRateLimitKey(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0].trim())
    : req.socket.remoteAddress || "unknown";
  return ip;
}

/**
 * Middleware для rate limiting
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = "Слишком много запросов, попробуйте позже",
    skipSuccessfulRequests = false,
  } = options;

  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void
  ) => {
    const key = getRateLimitKey(req);
    const now = Date.now();

    // Инициализация или получение записи
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const record = store[key];

    // Проверка лимита
    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      res.setHeader("X-RateLimit-Limit", max.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", new Date(record.resetTime).toISOString());
      return res.status(429).json({
        error: message,
        retryAfter,
      });
    }

    // Увеличение счетчика
    record.count++;

    // Установка заголовков
    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count).toString());
    res.setHeader("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

    // Сохранение оригинального метода отправки ответа
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    let statusCode = 200;

    res.status = function (code: number) {
      statusCode = code;
      return originalStatus(code);
    };

    res.json = function (body: any) {
      // Если запрос успешный и нужно пропускать успешные запросы
      if (skipSuccessfulRequests && statusCode < 400) {
        record.count = Math.max(0, record.count - 1);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Предустановленные конфигурации rate limiting
 */
export const rateLimiters = {
  // Строгий лимит для аутентификации (5 запросов в 15 минут)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5,
    message: "Слишком много попыток входа. Попробуйте через 15 минут.",
  }),

  // Лимит для API (100 запросов в минуту)
  api: rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 100,
    message: "Слишком много запросов. Попробуйте через минуту.",
  }),

  // Лимит для создания задач (10 запросов в минуту)
  createTask: rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 10,
    message: "Слишком много попыток создания задач. Попробуйте через минуту.",
  }),

  // Лимит для регистрации (3 запроса в час)
  register: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 3,
    message: "Слишком много попыток регистрации. Попробуйте через час.",
  }),
};
