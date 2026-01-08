import type { NextApiResponse } from "next";
import { AuthenticatedRequest, withAuth } from "../../../../src/middleware";
import { markNotificationAsRead } from "../../../../src/services/notification.service";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "PATCH") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Пользователь не аутентифицирован" });
    }

    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Неверный ID уведомления" });
    }

    const notification = await markNotificationAsRead(id, req.user.userId);

    return res.status(200).json({
      message: "Уведомление помечено как прочитанное",
      notification,
    });
  } catch (error: any) {
    if (error.message === "Уведомление не найдено") {
      return res.status(404).json({ error: error.message });
    }

    console.error("Ошибка обновления уведомления:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler);
