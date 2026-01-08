import fs from "fs";
import path from "path";
import { File } from "formidable";

/**
 * Константы для валидации файлов
 */
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Результат валидации файла
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Параметры для сохранения файла
 */
export interface SaveFileOptions {
  file: File;
  uploadDir: string;
  filename: string;
  tempDir?: string;
}

/**
 * Валидация файла аватара
 */
export function validateAvatarFile(file: File): FileValidationResult {
  // Проверка типа файла
  if (!file.mimetype) {
    return {
      valid: false,
      error: "Недопустимый тип файла. Разрешены только: jpg, jpeg, png, webp",
    };
  }

  const allowedTypes = ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Недопустимый тип файла. Разрешены только: jpg, jpeg, png, webp",
    };
  }

  // Проверка размера файла
  if (file.size && file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "Размер файла превышает 5MB",
    };
  }

  return { valid: true };
}

/**
 * Создание директории, если её нет
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Удаление файла с обработкой ошибок
 */
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Ошибка удаления файла ${filePath}:`, error);
    // Не пробрасываем ошибку, так как это не критично
  }
}

/**
 * Сохранение файла из временной директории в целевую
 */
export function saveFile(options: SaveFileOptions): string {
  const { file, uploadDir, filename, tempDir } = options;

  // Проверка существования исходного файла
  if (!file.filepath || !fs.existsSync(file.filepath)) {
    throw new Error("Временный файл не найден");
  }

  // Создание целевой директории
  ensureDirectoryExists(uploadDir);

  // Формирование полного пути к целевому файлу
  const targetPath = path.join(uploadDir, filename);

  try {
    // Перемещение файла из временной директории в целевую
    fs.renameSync(file.filepath, targetPath);
    return targetPath;
  } catch (error: any) {
    // В случае ошибки пытаемся удалить временный файл
    if (file.filepath && fs.existsSync(file.filepath)) {
      deleteFile(file.filepath);
    }
    throw new Error(`Ошибка при сохранении файла: ${error.message}`);
  }
}

/**
 * Очистка временного файла
 */
export function cleanupTempFile(file: File): void {
  if (file.filepath && fs.existsSync(file.filepath)) {
    deleteFile(file.filepath);
  }
}

/**
 * Получение расширения файла из оригинального имени или mimetype
 */
export function getFileExtension(file: File): string {
  if (file.originalFilename) {
    const ext = path.extname(file.originalFilename);
    if (ext) {
      return ext;
    }
  }

  // Определение расширения по mimetype
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

  return mimeToExt[file.mimetype || ""] || ".jpg";
}

/**
 * Генерация уникального имени файла
 */
export function generateAvatarFilename(userId: string, extension: string): string {
  const timestamp = Date.now();
  return `${userId}-${timestamp}${extension}`;
}

/**
 * Валидация файла изображения задачи
 */
export function validateTaskImageFile(file: File): FileValidationResult {
  // Проверка типа файла
  if (!file.mimetype) {
    return {
      valid: false,
      error: "Недопустимый тип файла. Разрешены только: jpg, jpeg, png, webp",
    };
  }

  const allowedTypes = ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Недопустимый тип файла. Разрешены только: jpg, jpeg, png, webp",
    };
  }

  // Проверка размера файла
  if (file.size && file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "Размер файла превышает 5MB",
    };
  }

  return { valid: true };
}

/**
 * Генерация уникального имени файла для изображения задачи
 */
export function generateTaskImageFilename(taskId: string, index: number, extension: string): string {
  const timestamp = Date.now();
  return `${taskId}-${index}-${timestamp}${extension}`;
}

/**
 * Удаление изображений задачи
 */
export function deleteTaskImages(imageUrls: string[]): void {
  imageUrls.forEach((url) => {
    if (url.startsWith("/uploads/tasks/")) {
      const imagePath = path.join(process.cwd(), "public", url);
      deleteFile(imagePath);
    }
  });
}
