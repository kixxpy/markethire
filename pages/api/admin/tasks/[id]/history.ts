import type { NextApiRequest, NextApiResponse } from "next";
import { withAdmin } from "../../../../../src/middleware";
import { AuthenticatedRequest } from "../../../../../src/middleware";
import { prisma } from "../../../../../src/lib/prisma";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Неверный ID задачи" });
    }

    const history = await prisma.taskModerationHistory.findMany({
      where: { taskId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: {
            title: true,
          },
        },
      },
    });

    // Вычисляем изменения для удобного отображения
    const formattedHistory = history.map(item => {
      const previousData = item.previousData as any;
      const newData = item.newData as any;
      const changes: Record<string, { old: any; new: any }> = {};
      
      item.changedFields.forEach(field => {
        if (previousData[field] !== undefined && newData[field] !== undefined) {
          changes[field] = {
            old: previousData[field],
            new: newData[field],
          };
        }
      });

      return {
        id: item.id,
        taskId: item.taskId,
        changedFields: item.changedFields,
        changes,
        changedBy: item.changedBy,
        reason: item.reason,
        createdAt: item.createdAt,
      };
    });

    return res.status(200).json(formattedHistory);
  } catch (error: any) {
    console.error("Ошибка получения истории:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}

export default withAdmin(handler);
