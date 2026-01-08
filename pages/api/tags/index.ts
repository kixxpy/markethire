import type { NextApiRequest, NextApiResponse } from "next";
import { getTags } from "../../../src/services/tag.service";
import { z } from "zod";

const tagFiltersSchema = z.object({
  categoryId: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Валидация query параметров
      const filters = tagFiltersSchema.parse(req.query);

      // Получение списка тегов с фильтрацией по категории
      const tags = await getTags(filters);

      return res.status(200).json(tags);
    }

    return res.status(405).json({ error: "Метод не разрешен" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Ошибка валидации",
        details: error.errors,
      });
    }

    console.error("Ошибка получения тегов:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default handler;
