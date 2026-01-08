import type { NextApiResponse } from "next";
import { AuthenticatedRequest, withAuth } from "../../../src/middleware";
import { markAllNotificationsAsRead } from "../../../src/services/notification.service";
import { UserRole } from "@prisma/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Пользователь не аутентифицирован" });
    }

    const role = req.body.role as UserRole | undefined;

    const result = await markAllNotificationsAsRead(req.user.userId, role);

    return res.status(200).json({
      message: "Все уведомления помечены как прочитанные",
      count: result.count,
    });
  } catch (error: any) {
    console.error("Ошибка обновления уведомлений:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler);
