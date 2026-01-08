import type { NextApiResponse } from "next";
import { AuthenticatedRequest, withAuth } from "../../../../../src/middleware";
import { getTaskById } from "../../../../../src/services/task.service";
import { deleteTaskImages } from "../../../../../src/services/file.service";
import { prisma } from "../../../../../src/lib/prisma";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const { id, imageIndex } = req.query;
    
    if (typeof id !== "string" || typeof imageIndex !== "string") {
      return res.status(400).json({ error: "Неверные параметры" });
    }

    const index = parseInt(imageIndex, 10);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: "Неверный индекс изображения" });
    }

    // Проверка существования задачи и прав доступа
    const task = await getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: "Задача не найдена" });
    }

    if (task.userId !== req.user.userId) {
      return res.status(403).json({ error: "Недостаточно прав для удаления изображения" });
    }

    const images = task.images || [];
    if (index >= images.length) {
      return res.status(404).json({ error: "Изображение не найдено" });
    }

    // Удаление файла
    const imageUrl = images[index];
    deleteTaskImages([imageUrl]);

    // Обновление задачи
    const updatedImages = images.filter((_, i) => i !== index);
    
    await prisma.task.update({
      where: { id },
      data: { images: updatedImages },
    });

    return res.status(200).json({
      message: "Изображение успешно удалено",
      images: updatedImages,
    });
  } catch (error: any) {
    console.error("Ошибка удаления изображения:", error);

    if (res.headersSent) {
      return;
    }

    return res.status(500).json({
      error: "Внутренняя ошибка сервера",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

export default withAuth(handler);
