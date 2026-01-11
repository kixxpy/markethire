import type { NextApiResponse } from "next";
import { IncomingMessage } from "http";
import formidable from "formidable";
import path from "path";
import { AuthenticatedRequest, withAuth } from "../../../../src/middleware";
import { updateUserProfile, getUserAvatarUrl } from "../../../../src/services/user.service";
import {
  validateAvatarFile,
  saveFile,
  cleanupTempFile,
  getFileExtension,
  generateAvatarFilename,
  ensureDirectoryExists,
  deleteFile,
  MAX_FILE_SIZE,
} from "../../../../src/services/file.service";

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
        multiples: false,
        allowEmptyFiles: false,
        maxFields: 1,
        maxFieldsSize: 1024, // 1KB для полей формы
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

/**
 * Удаление старого аватара пользователя
 */
async function deleteOldAvatar(userId: string): Promise<void> {
  try {
    const oldAvatarUrl = await getUserAvatarUrl(userId);
    if (oldAvatarUrl && oldAvatarUrl.startsWith("/uploads/avatars/")) {
      const oldAvatarPath = path.join(process.cwd(), "public", oldAvatarUrl);
      deleteFile(oldAvatarPath);
    }
  } catch (error) {
    // Не критично, если не удалось удалить старый аватар
    console.error("Ошибка удаления старого аватара:", error);
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Устанавливаем Content-Type для JSON ответов
  res.setHeader("Content-Type", "application/json");

  try {
    if (req.method === "DELETE") {
      // Удаление аватара
      if (!req.user?.userId) {
        return res.status(401).json({ error: "Необходима авторизация" });
      }

      const userId = req.user.userId;
      
      // Получаем текущий аватар
      const oldAvatarUrl = await getUserAvatarUrl(userId);
      
      // Удаляем файл
      if (oldAvatarUrl) {
        await deleteOldAvatar(userId);
      }
      
      // Обновляем профиль, устанавливая avatarUrl в null
      const updatedProfile = await updateUserProfile(userId, { avatarUrl: null });

      return res.status(200).json({
        message: "Аватар успешно удален",
        user: updatedProfile,
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Метод не разрешен" });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const userId = req.user.userId;

    // Парсинг формы
    const { files } = await parseForm(req);
    const file = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;

    if (!file) {
      return res.status(400).json({ error: "Файл не загружен" });
    }

    // Валидация файла
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      cleanupTempFile(file);
      return res.status(400).json({ error: validation.error });
    }

    // Проверка наличия файла
    if (!file.filepath) {
      cleanupTempFile(file);
      return res.status(500).json({ error: "Ошибка при загрузке файла" });
    }

    // Подготовка путей
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    const extension = getFileExtension(file);
    const filename = generateAvatarFilename(userId, extension);

    // Сохранение файла
    let savedFilePath: string;
    try {
      savedFilePath = saveFile({
        file,
        uploadDir,
        filename,
      });
    } catch (saveError: any) {
      cleanupTempFile(file);
      return res.status(500).json({ error: saveError.message || "Ошибка при сохранении файла" });
    }

    // Формирование URL
    const avatarUrl = `/uploads/avatars/${filename}`;

    // Обновление профиля пользователя
    try {
      // Удаляем старый аватар перед обновлением
      await deleteOldAvatar(userId);

      const updatedProfile = await updateUserProfile(userId, { avatarUrl });

      return res.status(200).json({
        message: "Аватар успешно загружен",
        avatarUrl,
        user: updatedProfile,
      });
    } catch (updateError: any) {
      // Удаляем загруженный файл при ошибке обновления профиля
      deleteFile(savedFilePath);

      if (updateError.message === "Пользователь с таким никнеймом уже существует") {
        return res.status(400).json({ error: updateError.message });
      }

      console.error("Ошибка обновления профиля:", updateError);
      return res.status(500).json({ error: "Ошибка при обновлении профиля" });
    }
  } catch (error: any) {
    console.error("Ошибка загрузки аватара:", error);

    // Проверяем, не был ли уже отправлен ответ
    if (res.headersSent) {
      return;
    }

    // Обработка специфических ошибок formidable
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
