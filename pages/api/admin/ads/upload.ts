import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMessage } from 'http';
import formidable from 'formidable';
import path from 'path';
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
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
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
    const { files } = await parseForm(req);
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Валидация файла
    const validation = validateTaskImageFile(imageFile);
    if (!validation.valid) {
      cleanupTempFile(imageFile);
      return res.status(400).json({ error: validation.error });
    }

    // Проверка наличия файла
    if (!imageFile.filepath) {
      cleanupTempFile(imageFile);
      return res.status(400).json({ error: 'Ошибка при загрузке файла' });
    }

    // Подготовка путей
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ads');
    ensureDirectoryExists(uploadDir);

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
      return res.status(500).json({ error: saveError.message || 'Ошибка при сохранении файла' });
    }
  } catch (error: any) {
    console.error('Ошибка загрузки изображения рекламы:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export default withAdmin(handler);
