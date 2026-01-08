import type { NextApiRequest, NextApiResponse } from "next";
import { getUserProfileById } from "../../../src/services/user.service";
import { withAuth } from "../../../src/middleware";
import { AuthenticatedRequest } from "../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Неверный ID пользователя" });
    }

    const profile = await getUserProfileById(id);

    return res.status(200).json(profile);
  } catch (error: any) {
    if (error.message === "Пользователь не найден") {
      return res.status(404).json({ error: error.message });
    }

    console.error("Ошибка получения профиля пользователя:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler, { optional: true });
