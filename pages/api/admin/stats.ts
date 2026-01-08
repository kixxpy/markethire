import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../src/lib/prisma";
import { withAdmin } from "../../../src/middleware";
import { AuthenticatedRequest } from "../../../src/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    const [
      totalUsers,
      totalTasks,
      pendingTasks,
      approvedTasks,
      rejectedTasks,
      totalResponses,
      totalCategories,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.count({ where: { moderationStatus: "PENDING" } }),
      prisma.task.count({ where: { moderationStatus: "APPROVED" } }),
      prisma.task.count({ where: { moderationStatus: "REJECTED" } }),
      prisma.response.count(),
      prisma.category.count(),
    ]);

    return res.status(200).json({
      users: {
        total: totalUsers,
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        approved: approvedTasks,
        rejected: rejectedTasks,
      },
      responses: {
        total: totalResponses,
      },
      categories: {
        total: totalCategories,
      },
    });
  } catch (error: any) {
    console.error("Ошибка получения статистики:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAdmin(handler);
