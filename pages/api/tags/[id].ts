import type { NextApiRequest, NextApiResponse } from "next";
import { getTagById } from "../../../src/services/tag.service";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { id } = req.query;

      if (typeof id !== "string") {
        return res.status(400).json({ error: "Неверный ID тега" });
      }

      // Получение деталей тега
      const tag = await getTagById(id);

      if (!tag) {
        return res.status(404).json({ error: "Тег не найден" });
      }

      return res.status(200).json(tag);
    }

    return res.status(405).json({ error: "Метод не разрешен" });
  } catch (error: any) {
    console.error("Ошибка получения тега:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default handler;
