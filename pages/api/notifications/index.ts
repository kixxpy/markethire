import type { NextApiResponse } from "next";
import { AuthenticatedRequest, withAuth } from "../../../src/middleware";
import { getUserNotifications, getUnreadNotificationCount } from "../../../src/services/notification.service";
import { UserRole } from "@prisma/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Пользователь не аутентифицирован" });
    }

    // Валидация и нормализация параметра role
    const roleParam = req.query.role as string | undefined;
    const role = roleParam && roleParam.trim() && Object.values(UserRole).includes(roleParam as UserRole)
      ? (roleParam as UserRole)
      : undefined;
    const unreadOnly = req.query.unreadOnly === "true";

    const notifications = await getUserNotifications(
      req.user.userId,
      role,
      unreadOnly
    );

    const unreadCount = await getUnreadNotificationCount(
      req.user.userId,
      role
    );

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Ошибка получения уведомлений:", error);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? error.message || "Внутренняя ошибка сервера"
      : "Внутренняя ошибка сервера";
    return res.status(500).json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack })
    });
  }
}

export default withAuth(handler);
