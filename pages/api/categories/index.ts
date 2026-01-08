import type { NextApiRequest, NextApiResponse } from "next";
import { getCategories } from "../../../src/services/category.service";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Получение списка всех категорий
      const categories = await getCategories();

      return res.status(200).json(categories);
    }

    return res.status(405).json({ error: "Метод не разрешен" });
  } catch (error: any) {
    console.error("Ошибка получения категорий:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default handler;
