import type { NextApiRequest, NextApiResponse } from "next";
import { getMyTasks } from "../../../src/services/task.service";
import { taskFiltersSchema } from "../../../src/lib/validation";
import { withAuth, AuthenticatedRequest } from "../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const filters = taskFiltersSchema.parse(req.query);
    const createdInMode = req.query.createdInMode as 'SELLER' | 'PERFORMER' | undefined;
    const result = await getMyTasks(req.user.userId, {
      ...filters,
      createdInMode,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Ошибка валидации",
        details: error.errors,
      });
    }

    console.error("Ошибка получения моих задач:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler);
