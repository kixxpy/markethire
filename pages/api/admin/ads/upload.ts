import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMessage } from 'http';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs';
import {
  validateTaskImageFile,
  saveFile,
  getFileExtension,
  cleanupTempFile,
  ensureDirectoryExists,
} from '../../../../src/services/file.service';
import { withAdmin } from '../../../../src/middleware';
import { AuthenticatedRequest } from '../../../../src/middleware';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: IncomingMessage): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const form = formidable({
      maxFileSize: maxFileSize,
      maxTotalFileSize: maxFileSize, // Явно устанавливаем общий лимит
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        // Обрабатываем ошибку размера файла более понятно
        if (err.message && err.message.includes('maxTotalFileSize')) {
          const match = err.message.match(/received (\d+) bytes/);
          const receivedBytes = match ? parseInt(match[1]) : 0;
          const receivedMB = (receivedBytes / (1024 * 1024)).toFixed(2);
          const maxMB = (maxFileSize / (1024 * 1024)).toFixed(0);
          reject(new Error(`Размер файла (${receivedMB} MB) превышает максимально допустимый размер (${maxMB} MB)`));
          return;
        }
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Метод не разрешен' });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Необходима авторизация' });
    }

    // Парсинг формы
    let files: formidable.Files;
    try {
      const parsed = await parseForm(req);
      files = parsed.files;
    } catch (parseError: any) {
      // Обрабатываем ошибку размера файла отдельно
      if (parseError.message && (parseError.message.includes('maxTotalFileSize') || parseError.message.includes('превышает максимально допустимый размер'))) {
        return res.status(400).json({ 
          error: parseError.message || 'Размер файла превышает максимально допустимый размер (10 MB)'
        });
      }
      // Для других ошибок парсинга
      console.error('Ошибка парсинга формы:', parseError);
      return res.status(400).json({ 
        error: parseError.message || 'Ошибка при обработке загруженного файла'
      });
    }
    
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Валидация файла (для рекламы используем увеличенный лимит 10MB)
    const maxAdFileSize = 10 * 1024 * 1024; // 10MB для рекламы
    if (!imageFile.mimetype) {
      cleanupTempFile(imageFile);
      return res.status(400).json({ error: 'Недопустимый тип файла. Разрешены только: jpg, jpeg, png, webp' });
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype)) {
      cleanupTempFile(imageFile);
      return res.status(400).json({ error: 'Недопустимый тип файла. Разрешены только: jpg, jpeg, png, webp' });
    }
    
    if (imageFile.size && imageFile.size > maxAdFileSize) {
      cleanupTempFile(imageFile);
      const fileSizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
      return res.status(400).json({ error: `Размер файла (${fileSizeMB} MB) превышает максимально допустимый размер (10 MB)` });
    }

    // Проверка наличия файла
    if (!imageFile.filepath) {
      cleanupTempFile(imageFile);
      return res.status(400).json({ error: 'Ошибка при загрузке файла' });
    }

    // Подготовка путей
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ads');
    
    try {
      ensureDirectoryExists(uploadDir);
      
      // Проверяем, что директория действительно создана и доступна для записи
      if (!fs.existsSync(uploadDir)) {
        throw new Error(`Не удалось создать директорию: ${uploadDir}`);
      }
    } catch (dirError: any) {
      console.error('Ошибка создания директории:', dirError);
      return res.status(500).json({ 
        error: process.env.NODE_ENV === 'development' 
          ? `Ошибка создания директории: ${dirError.message}`
          : 'Ошибка создания директории для загрузки файлов'
      });
    }

    // Генерация имени файла
    const extension = getFileExtension(imageFile);
    const timestamp = Date.now();
    const filename = `ad-${timestamp}${extension}`;

    // Сохранение файла
    try {
      saveFile({
        file: imageFile,
        uploadDir,
        filename,
      });

      const imageUrl = `/uploads/ads/${filename}`;
      return res.status(200).json({ imageUrl });
    } catch (saveError: any) {
      cleanupTempFile(imageFile);
      console.error('Ошибка сохранения файла:', saveError);
      
      // В режиме разработки возвращаем детали ошибки
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? saveError.message || 'Ошибка при сохранении файла'
        : 'Ошибка при сохранении файла';
      
      const errorDetails = process.env.NODE_ENV === 'development' 
        ? { 
            message: saveError.message,
            stack: saveError.stack,
            name: saveError.name,
            uploadDir,
            filename
          }
        : undefined;
      
      return res.status(500).json({ 
        error: errorMessage,
        ...(errorDetails && { details: errorDetails })
      });
    }
  } catch (error: any) {
    console.error('Ошибка загрузки изображения рекламы:', error);
    
    // Обрабатываем ошибку размера файла отдельно (на случай, если она не была обработана ранее)
    if (error.message && (error.message.includes('maxTotalFileSize') || error.message.includes('превышает максимально допустимый размер'))) {
      return res.status(400).json({ 
        error: error.message || 'Размер файла превышает максимально допустимый размер (10 MB)'
      });
    }
    
    // В режиме разработки возвращаем детали ошибки
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Внутренняя ошибка сервера'
      : 'Внутренняя ошибка сервера';
    
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? { 
          message: error.message,
          stack: error.stack,
          name: error.name 
        }
      : undefined;
    
    return res.status(500).json({ 
      error: errorMessage,
      ...(errorDetails && { details: errorDetails })
    });
  }
}

export default withAdmin(handler);
