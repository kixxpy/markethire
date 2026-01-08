import type { NextApiRequest, NextApiResponse } from "next";
import { getPendingTasks } from "../../../../src/services/task.service";
import { withAdmin } from "../../../../src/middleware";
import { AuthenticatedRequest } from "../../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getPendingTasks(page, limit);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Ошибка получения задач на модерации:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAdmin(handler);
