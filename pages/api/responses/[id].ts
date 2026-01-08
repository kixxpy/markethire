import type { NextApiRequest, NextApiResponse } from "next";
import {
  getResponseById,
  updateResponse,
  deleteResponse,
} from "../../../src/services/response.service";
import { updateResponseSchema } from "../../../src/lib/validation";
import { withAuth, AuthenticatedRequest } from "../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Неверный ID отклика" });
    }

    if (req.method === "GET") {
      // Получение деталей отклика
      const userId = req.user?.userId;
      const response = await getResponseById(id, userId);

      if (!response) {
        return res.status(404).json({ error: "Отклик не найден" });
      }

      return res.status(200).json(response);
    }

    if (req.method === "PATCH") {
      // Обновление отклика (только автор)
      if (!req.user) {
        return res.status(401).json({ error: "Необходима авторизация" });
      }

      const validatedData = updateResponseSchema.parse(req.body);
      const response = await updateResponse(id, req.user.userId, validatedData);

      return res.status(200).json({
        message: "Отклик успешно обновлен",
        response,
      });
    }

    if (req.method === "DELETE") {
      // Удаление отклика (только автор)
      if (!req.user) {
        return res.status(401).json({ error: "Необходима авторизация" });
      }

      await deleteResponse(id, req.user.userId);

      return res.status(200).json({
        message: "Отклик успешно удален",
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

    if (error.message === "Отклик не найден") {
      return res.status(404).json({ error: error.message });
    }

    if (
      error.message === "Недостаточно прав для просмотра отклика" ||
      error.message === "Недостаточно прав для обновления отклика" ||
      error.message === "Недостаточно прав для удаления отклика" ||
      error.message === "Нельзя обновлять отклик на закрытую задачу"
    ) {
      return res.status(403).json({ error: error.message });
    }

    if (
      error.message === "Цена должна быть положительным числом" ||
      error.message === "Дедлайн должен быть в будущем"
    ) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Ошибка работы с откликом:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler, { optional: true });
