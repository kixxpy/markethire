import type { NextApiRequest, NextApiResponse } from "next";
import { createReply, deleteReply } from "../../../../src/services/reply.service";
import { withAuth, AuthenticatedRequest } from "../../../../src/middleware";
import { z } from "zod";

const createReplySchema = z.object({
  message: z.string().min(1, "Сообщение не может быть пустым").max(1000, "Сообщение не может превышать 1000 символов"),
});

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Неверный ID отклика" });
    }

    if (req.method === "POST") {
      if (!req.user) {
        return res.status(401).json({ error: "Необходима авторизация" });
      }

      const validatedData = createReplySchema.parse(req.body);
      const reply = await createReply(id, req.user.userId, validatedData.message);

      return res.status(201).json({
        message: "Ответ успешно создан",
        reply,
      });
    }

    if (req.method === "DELETE") {
      if (!req.user) {
        return res.status(401).json({ error: "Необходима авторизация" });
      }

      const replyId = req.query.replyId as string;
      if (!replyId) {
        return res.status(400).json({ error: "Неверный ID ответа" });
      }

      await deleteReply(replyId, req.user.userId);

      return res.status(200).json({
        message: "Ответ успешно удален",
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
      error.message === "Отклик не найден" ||
      error.message === "Ответ не найден" ||
      error.message === "Сообщение не может быть пустым" ||
      error.message.includes("не может превышать")
    ) {
      return res.status(400).json({ error: error.message });
    }

    if (
      error.message === "Только владелец задачи может отвечать на отклики" ||
      error.message === "Недостаточно прав для удаления ответа" ||
      error.message === "Нельзя отвечать на отклики к закрытой задаче"
    ) {
      return res.status(403).json({ error: error.message });
    }

    console.error("Ошибка работы с ответами:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({ 
      error: "Внутренняя ошибка сервера",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export default withAuth(handler, { optional: true });
