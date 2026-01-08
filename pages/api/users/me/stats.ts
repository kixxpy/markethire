import type { NextApiResponse } from "next";
import { AuthenticatedRequest, withAuth } from "../../../../src/middleware";
import { getUserStats } from "../../../../src/services/user.service";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Пользователь не аутентифицирован" });
    }

    const stats = await getUserStats(req.user.userId);
    return res.status(200).json(stats);
  } catch (error: any) {
    if (error.message === "Пользователь не найден") {
      return res.status(404).json({ error: error.message });
    }

    console.error("Ошибка получения статистики:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler);
