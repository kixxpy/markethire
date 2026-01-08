import type { NextApiRequest, NextApiResponse } from "next";
import { moderateTask } from "../../../../src/services/task.service";
import { withAdmin } from "../../../../src/middleware";
import { AuthenticatedRequest } from "../../../../src/middleware";
import { z } from "zod";

const moderateSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().optional(),
});

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    const { taskId } = req.query;
    
    if (!taskId || typeof taskId !== "string") {
      return res.status(400).json({ error: "ID задачи не указан" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const validatedData = moderateSchema.parse(req.body);
    const task = await moderateTask(
      taskId,
      req.user.userId,
      validatedData.action,
      validatedData.comment
    );

    return res.status(200).json({
      message: validatedData.action === "APPROVE" 
        ? "Задача одобрена" 
        : "Задача отклонена",
      task,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Ошибка валидации",
        details: error.errors,
      });
    }

    if (
      error.message === "Задача не найдена" ||
      error.message === "Задача уже была промодерирована"
    ) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Ошибка модерации задачи:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAdmin(handler);
