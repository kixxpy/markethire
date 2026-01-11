import type { NextApiResponse } from "next";
import { IncomingMessage } from "http";
import formidable from "formidable";
import path from "path";
import { AuthenticatedRequest, withAuth } from "../../../../src/middleware";
import { getTaskById } from "../../../../src/services/task.service";
import {
  validateTaskImageFile,
  saveFile,
  cleanupTempFile,
  getFileExtension,
  generateTaskImageFilename,
  ensureDirectoryExists,
  MAX_FILE_SIZE,
} from "../../../../src/services/file.service";
import { prisma } from "../../../../src/lib/prisma";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

/**
 * Парсинг multipart/form-data формы
 */
function parseForm(req: IncomingMessage): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    try {
      const tempDir = path.join(process.cwd(), "tmp");
      ensureDirectoryExists(tempDir);

      const form = formidable({
        uploadDir: tempDir,
        maxFileSize: MAX_FILE_SIZE,
        keepExtensions: true,
        multiples: true, // Разрешаем множественные файлы
        allowEmptyFiles: false,
        maxFields: 10,
        maxFieldsSize: 1024,
      });

      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Ошибка парсинга формы:", err);
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    } catch (parseError: any) {
      console.error("Ошибка при создании формы:", parseError);
      reject(parseError);
    }
  });
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json");

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const { id } = req.query;
    if (typeof id !== "string") {
      return res.status(400).json({ error: "Неверный ID задачи" });
    }

    // Проверка существования задачи и прав доступа
    const task = await getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: "Задача не найдена" });
    }

    if (task.userId !== req.user.userId) {
      return res.status(403).json({ error: "Недостаточно прав для загрузки изображений" });
    }

    // Проверка количества существующих изображений
    const currentImages = task.images || [];
    if (currentImages.length >= 3) {
      return res.status(400).json({ error: "Максимум 3 изображения на задачу" });
    }

    // Парсинг формы
    const { files } = await parseForm(req);
    const imageFiles = Array.isArray(files.images) ? files.images : files.images ? [files.images] : [];

    if (imageFiles.length === 0) {
      return res.status(400).json({ error: "Файлы не загружены" });
    }

    // Проверка общего количества изображений
    if (currentImages.length + imageFiles.length > 3) {
      return res.status(400).json({ 
        error: `Можно загрузить максимум ${3 - currentImages.length} изображений` 
      });
    }

    // Подготовка путей
    const uploadDir = path.join(process.cwd(), "public", "uploads", "tasks");
    ensureDirectoryExists(uploadDir);

    const savedImages: string[] = [];
    const errors: string[] = [];

    // Обработка каждого файла
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      
      try {
        // Валидация файла
        const validation = validateTaskImageFile(file);
        if (!validation.valid) {
          cleanupTempFile(file);
          errors.push(`Файл ${i + 1}: ${validation.error}`);
          continue;
        }

        // Проверка наличия файла
        if (!file.filepath) {
          cleanupTempFile(file);
          errors.push(`Файл ${i + 1}: Ошибка при загрузке файла`);
          continue;
        }

        // Генерация имени файла
        const extension = getFileExtension(file);
        const filename = generateTaskImageFilename(id, currentImages.length + savedImages.length, extension);

        // Сохранение файла
        try {
          saveFile({
            file,
            uploadDir,
            filename,
          });

          const imageUrl = `/uploads/tasks/${filename}`;
          savedImages.push(imageUrl);
        } catch (saveError: any) {
          cleanupTempFile(file);
          errors.push(`Файл ${i + 1}: ${saveError.message || "Ошибка при сохранении файла"}`);
        }
      } catch (fileError: any) {
        cleanupTempFile(file);
        errors.push(`Файл ${i + 1}: ${fileError.message || "Неизвестная ошибка"}`);
      }
    }

    // Если хотя бы одно изображение загружено, обновляем задачу
    if (savedImages.length > 0) {
      // Объединяем существующие и новые изображения, исключая дубликаты
      const updatedImages = [...currentImages];
      for (const newImage of savedImages) {
        if (!updatedImages.includes(newImage)) {
          updatedImages.push(newImage);
        }
      }
      
      await prisma.task.update({
        where: { id },
        data: { images: updatedImages },
      });

      return res.status(200).json({
        message: `Успешно загружено ${savedImages.length} изображений`,
        images: updatedImages,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Если ни одно изображение не загружено
    return res.status(400).json({
      error: "Не удалось загрузить изображения",
      details: errors,
    });
  } catch (error: any) {
    console.error("Ошибка загрузки изображений задачи:", error);

    if (res.headersSent) {
      return;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Размер файла превышает 5MB" });
    }

    const errorMessage =
      typeof error.message === "string" ? error.message : "Внутренняя ошибка сервера";

    return res.status(500).json({
      error: "Внутренняя ошибка сервера",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

export default withAuth(handler);
