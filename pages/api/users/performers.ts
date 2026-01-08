import type { NextApiRequest, NextApiResponse } from "next";
import { getPerformers } from "../../../src/services/user.service";
import { performerFiltersSchema } from "../../../src/lib/validation";
import { withAuth } from "../../../src/middleware";
import { AuthenticatedRequest } from "../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    const filters = performerFiltersSchema.parse(req.query);
    const result = await getPerformers(filters);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Ошибка валидации",
        details: error.errors,
      });
    }

    console.error("Ошибка поиска исполнителей:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAuth(handler, { optional: true });
