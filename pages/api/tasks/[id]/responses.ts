import type { NextApiRequest, NextApiResponse } from "next";
import { createResponse } from "../../../../src/services/response.service";
import { getTaskResponses } from "../../../../src/services/task.service";
import { createResponseSchema } from "../../../../src/lib/validation";
import { withAuth, AuthenticatedRequest } from "../../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Неверный ID задачи" });
    }

    if (req.method === "GET") {
      // Получение откликов на задачу (только для владельца задачи)
      const userId = req.user?.userId;
      const responses = await getTaskResponses(id, userId);

      return res.status(200).json(responses);
    }

    if (req.method === "POST") {
      // Создание отклика на задачу
      if (!req.user) {
        return res.status(401).json({ error: "Необходима авторизация" });
      }

      const validatedData = createResponseSchema.parse(req.body);
      const response = await createResponse(id, req.user.userId, validatedData);

      return res.status(201).json({
        message: "Отклик успешно создан",
        response,
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
      error.message === "Нельзя откликаться на свою задачу" ||
      error.message === "Нельзя откликаться на закрытую задачу" ||
      error.message === "Вы уже откликнулись на эту задачу" ||
      error.message === "Цена должна быть положительным числом" ||
      error.message === "Дедлайн должен быть в будущем"
    ) {
      return res.status(400).json({ error: error.message });
    }

    if (
      error.message === "Необходима авторизация для просмотра откликов" ||
      error.message === "Недостаточно прав для просмотра откликов"
    ) {
      return res.status(error.message.includes("авторизация") ? 401 : 403).json({
        error: error.message,
      });
    }

    console.error("Ошибка работы с откликами:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler, { optional: true });
