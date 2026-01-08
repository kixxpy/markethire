import type { NextApiRequest, NextApiResponse } from "next";
import { getUserTags } from "../../../../src/services/user.service";
import { withAuth } from "../../../../src/middleware";
import { AuthenticatedRequest } from "../../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Неверный ID пользователя" });
    }

    const tags = await getUserTags(id);

    return res.status(200).json(tags);
  } catch (error: any) {
    if (error.message === "Пользователь не найден") {
      return res.status(404).json({ error: error.message });
    }

    console.error("Ошибка получения тегов пользователя:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler, { optional: true });
