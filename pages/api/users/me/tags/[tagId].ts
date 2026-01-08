import type { NextApiRequest, NextApiResponse } from "next";
import { AuthenticatedRequest, withAuth } from "../../../../../src/middleware";
import { removeTagFromUser } from "../../../../../src/services/user.service";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const { tagId } = req.query;

    if (typeof tagId !== "string") {
      return res.status(400).json({ error: "Неверный ID тега" });
    }

    const result = await removeTagFromUser(req.user.userId, tagId);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "Тег не найден в профиле пользователя") {
      return res.status(404).json({ error: error.message });
    }

    console.error("Ошибка удаления тега:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler);
