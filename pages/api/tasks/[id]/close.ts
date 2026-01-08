import type { NextApiRequest, NextApiResponse } from "next";
import { closeTask } from "../../../../src/services/task.service";
import { withAuth, AuthenticatedRequest } from "../../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "PATCH") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Неверный ID задачи" });
    }

    const task = await closeTask(id, req.user.userId);

    return res.status(200).json({
      message: "Задача успешно закрыта",
      task,
    });
  } catch (error: any) {
    if (
      error.message === "Задача не найдена" ||
      error.message === "Задача уже закрыта"
    ) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === "Недостаточно прав для закрытия задачи") {
      return res.status(403).json({ error: error.message });
    }

    console.error("Ошибка закрытия задачи:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler);
