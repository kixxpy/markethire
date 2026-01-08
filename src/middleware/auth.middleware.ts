import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken, extractTokenFromHeader } from "../lib/auth";
import { UserRole } from "@prisma/client";

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware для проверки аутентификации
 */
export function withAuth(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse
  ) => Promise<void> | void,
  options?: { optional?: boolean }
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        if (options?.optional) {
          // Если аутентификация опциональна, просто вызываем handler без user
          return handler(req, res);
        }
        return res.status(401).json({ error: "Токен не предоставлен" });
      }

      const payload = verifyToken(token);

      if (!payload) {
        if (options?.optional) {
          // Если аутентификация опциональна, просто вызываем handler без user
          return handler(req, res);
        }
        return res.status(401).json({ error: "Недействительный токен" });
      }

      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
      };

      try {
        const result = handler(req, res);
        // Если handler возвращает Promise, обрабатываем его
        if (result instanceof Promise) {
          return result.catch((handlerError) => {
            console.error("Ошибка в handler:", handlerError);
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'application/json');
              return res.status(500).json({ error: "Внутренняя ошибка сервера" });
            }
          });
        }
        return result;
      } catch (handlerError) {
        console.error("Синхронная ошибка в handler:", handlerError);
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(500).json({ error: "Внутренняя ошибка сервера" });
        }
      }
    } catch (error) {
      if (options?.optional) {
        // Если аутентификация опциональна, просто вызываем handler без user
        try {
          const result = handler(req, res);
          if (result instanceof Promise) {
            return result.catch((handlerError) => {
              console.error("Ошибка в handler:", handlerError);
              if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({ error: "Внутренняя ошибка сервера" });
              }
            });
          }
          return result;
        } catch (handlerError) {
          console.error("Синхронная ошибка в handler:", handlerError);
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({ error: "Внутренняя ошибка сервера" });
          }
        }
      }
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(401).json({ error: "Ошибка аутентификации" });
      }
    }
  };
}

/**
 * Middleware для проверки ролей
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse
  ) => Promise<void> | void
) {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (!req.user) {
      return res.status(401).json({ error: "Пользователь не аутентифицирован" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Недостаточно прав доступа",
      });
    }

    return handler(req, res);
  });
}

/**
 * Проверка, является ли пользователь селлером
 */
export function isSeller(role: UserRole): boolean {
  return role === "SELLER" || role === "BOTH";
}

/**
 * Проверка, является ли пользователь исполнителем
 */
export function isPerformer(role: UserRole): boolean {
  return role === "PERFORMER" || role === "BOTH";
}

/**
 * Проверка, является ли пользователь администратором
 */
export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

/**
 * Middleware для проверки прав администратора
 */
export function withAdmin(
  handler: (
    req: AuthenticatedRequest,
    res: NextApiResponse
  ) => Promise<void> | void
) {
  return withRole(["ADMIN"], handler);
}
