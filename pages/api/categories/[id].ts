import type { NextApiRequest, NextApiResponse } from "next";
import { getCategoryById } from "../../../src/services/category.service";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { id } = req.query;

      if (typeof id !== "string") {
        return res.status(400).json({ error: "Неверный ID категории" });
      }

      // Получение деталей категории с тегами
      const category = await getCategoryById(id);

      if (!category) {
        return res.status(404).json({ error: "Категория не найдена" });
      }

      return res.status(200).json(category);
    }

    return res.status(405).json({ error: "Метод не разрешен" });
  } catch (error: any) {
    console.error("Ошибка получения категории:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default handler;
