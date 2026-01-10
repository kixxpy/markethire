import { NextApiResponse } from "next";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Определение статус кода на основе сообщения об ошибке
 */
function getStatusCodeFromError(error: Error | ApiError): number {
  if (error instanceof ApiError && error.statusCode) {
    return error.statusCode;
  }

  const message = error.message.toLowerCase();
  
  if (message.includes("не найд")) return 404;
  if (message.includes("недостаточно прав") || message.includes("не разрешен")) return 403;
  if (message.includes("авторизация") || message.includes("токен")) return 401;
  if (message.includes("уже существует") || message.includes("конфликт")) return 409;
  
  return 400;
}

/**
 * Централизованный обработчик ошибок для API endpoints
 */
export function handleApiError(
  error: unknown,
  res: NextApiResponse,
  context?: string
): void {
  // Обработка ZodError (ошибки валидации)
  if (error instanceof ZodError) {
    logger.warn(
      {
        context: context || "API",
        errors: error.errors,
      },
      "Validation error"
    );
    res.status(400).json({
      error: "Ошибка валидации",
      details: error.errors,
    });
    return;
  }

  // Обработка стандартных ошибок
  if (error instanceof Error) {
    const statusCode = getStatusCodeFromError(error);
    
    // Структурированное логирование ошибки
    if (statusCode >= 500) {
      logger.error(
        {
          context: context || "API",
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        "Server error"
      );
    } else {
      logger.warn(
        {
          context: context || "API",
          message: error.message,
          statusCode,
        },
        "Client error"
      );
    }

    res.status(statusCode).json({
      error: error.message,
      ...(process.env.NODE_ENV === "development" && {
        details: {
          name: error.name,
          stack: error.stack,
        },
      }),
    });
    return;
  }

  // Обработка неизвестных ошибок
  logger.error(
    {
      context: context || "API",
      error,
    },
    "Unknown error"
  );
  res.status(500).json({
    error: "Внутренняя ошибка сервера",
  });
}

/**
 * Обертка для API handlers с автоматической обработкой ошибок
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Предполагаем, что последний аргумент - это NextApiResponse
      const res = args[args.length - 1] as NextApiResponse;
      if (res && typeof res.status === "function") {
        handleApiError(error, res, context);
      } else {
        throw error;
      }
    }
  }) as T;
}
