import type { NextApiRequest, NextApiResponse } from "next";
import { getTasks, createTask } from "../../../src/services/task.service";
import { createTaskSchema, taskFiltersSchema } from "../../../src/lib/validation";
import { withAuth, isSeller } from "../../../src/middleware";
import { AuthenticatedRequest } from "../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Получение списка задач с фильтрацией
      const filters = taskFiltersSchema.parse(req.query);
      const result = await getTasks(filters);

      return res.status(200).json(result);
    }

    if (req.method === "POST") {
      // Создание задачи (только для авторизованных)
      if (!req.user) {
        return res.status(401).json({ error: "Необходима авторизация" });
      }

      // Проверка, что пользователь может создавать задачи (селлер)
      if (!isSeller(req.user.role)) {
        return res.status(403).json({
          error: "Только селлеры могут создавать задачи",
        });
      }

      const validatedData = createTaskSchema.parse(req.body);
      const task = await createTask(req.user.userId, validatedData);

      return res.status(201).json({
        message: "Задача успешно создана",
        task,
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
      error.message === "Категория не найдена" ||
      error.message === "Один или несколько тегов не найдены или не принадлежат категории"
    ) {
      return res.status(404).json({ error: error.message });
    }

    console.error("Ошибка работы с задачами:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler, { optional: true });
