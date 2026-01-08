import type { NextApiRequest, NextApiResponse } from "next";
import { getMyResponses } from "../../../src/services/response.service";
import { withAuth, AuthenticatedRequest } from "../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    // Получение параметров пагинации
    const page = req.query.page
      ? parseInt(req.query.page as string, 10)
      : 1;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Некорректные параметры пагинации",
      });
    }

    const result = await getMyResponses(req.user.userId, page, limit);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Ошибка получения откликов:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler);
