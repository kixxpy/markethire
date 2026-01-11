import type { NextApiRequest, NextApiResponse } from "next";
import { getMyTasks } from "../../../../src/services/task.service";
import { withAuth } from "../../../../src/middleware";
import { AuthenticatedRequest } from "../../../../src/middleware";
import { taskFiltersSchema } from "../../../../src/lib/validation";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Неверный ID пользователя" });
    }

    // Парсим query параметры для фильтрации
    const parseResult = taskFiltersSchema.safeParse(req.query);
    const filters = parseResult.success ? parseResult.data : {
      page: 1,
      limit: 20,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    };
    
    const result = await getMyTasks(id, {
      ...filters,
      createdInMode: filters.createdInMode,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "Пользователь не найден") {
      return res.status(404).json({ error: error.message });
    }

    console.error("Ошибка получения задач пользователя:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler);
