import type { NextApiRequest, NextApiResponse } from "next";
import { getTaskById, updateTask, deleteTask } from "../../../src/services/task.service";
import { updateTaskSchema } from "../../../src/lib/validation";
import { withAuth, AuthenticatedRequest } from "../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Неверный ID задачи" });
    }

    if (req.method === "GET") {
      // Получение деталей задачи
      const task = await getTaskById(id);

      if (!task) {
        return res.status(404).json({ error: "Задача не найдена" });
      }

      return res.status(200).json(task);
    }

    if (req.method === "PATCH") {
      // Обновление задачи (только владелец)
      if (!req.user) {
        return res.status(401).json({ error: "Необходима авторизация" });
      }

      const validatedData = updateTaskSchema.parse(req.body);
      const task = await updateTask(id, req.user.userId, validatedData);

      return res.status(200).json({
        message: "Задача успешно обновлена",
        task,
      });
    }

    if (req.method === "DELETE") {
      // Удаление задачи (только владелец)
      if (!req.user) {
        return res.status(401).json({ error: "Необходима авторизация" });
      }

      await deleteTask(id, req.user.userId);

      return res.status(200).json({
        message: "Задача успешно удалена",
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
      error.message === "Задача не найдена" ||
      error.message === "Категория не найдена" ||
      error.message === "Один или несколько тегов не найдены или не принадлежат категории"
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (
      error.message === "Недостаточно прав для обновления задачи" ||
      error.message === "Недостаточно прав для удаления задачи"
    ) {
      return res.status(403).json({ error: error.message });
    }

    console.error("Ошибка работы с задачей:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler, { optional: true });
