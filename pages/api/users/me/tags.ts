import type { NextApiResponse } from "next";
import { AuthenticatedRequest, withAuth } from "../../../../src/middleware";
import { addTagsToUser, getUserTags } from "../../../../src/services/user.service";
import { addTagsSchema } from "../../../../src/lib/validation";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    if (req.method === "GET") {
      // Получение тегов текущего пользователя
      const tags = await getUserTags(req.user.userId);
      return res.status(200).json(tags);
    }

    if (req.method === "POST") {
      // Добавление тегов к профилю
      const validatedData = addTagsSchema.parse(req.body);
      const tags = await addTagsToUser(req.user.userId, validatedData.tagIds);

      return res.status(200).json({
        message: "Теги успешно добавлены к профилю",
        tags,
      });
    }

    return res.status(405).json({ error: "Метод не разрешен" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Ошибка валидации",
        details: error.errors,
      });
    }

    if (
      error.message === "Пользователь не найден" ||
      error.message === "Один или несколько тегов не найдены"
    ) {
      return res.status(404).json({ error: error.message });
    }

    console.error("Ошибка работы с тегами:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler);
