import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdById, updateAd, deleteAd } from '../../../src/services/ad.service';
import { withAdmin } from '../../../src/middleware';
import { AuthenticatedRequest } from '../../../src/middleware';
import { z } from 'zod';

const updateAdSchema = z.object({
  imageUrl: z.string().min(1, 'URL изображения обязателен').refine(
    (url) => {
      // Принимаем как полные URL, так и относительные пути
      try {
        new URL(url);
        return true;
      } catch {
        // Если не полный URL, проверяем, что это валидный относительный путь
        return url.startsWith('/') && url.length > 1;
      }
    },
    { message: 'Некорректный URL изображения' }
  ).optional(),
  link: z.preprocess(
    (val) => {
      // Преобразуем пустую строку, null или undefined в null
      if (val === '' || val === null || val === undefined) return null;
      return val;
    },
    z.union([
      z.string().url('Некорректный URL ссылки'),
      z.null(),
    ]).optional()
  ),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID рекламного блока не указан' });
    }

    if (req.method === 'GET') {
      const ad = await getAdById(id);
      if (!ad) {
        return res.status(404).json({ error: 'Рекламный блок не найден' });
      }
      return res.status(200).json({ ad });
    }

    if (req.method === 'PATCH') {
      if (!req.user) {
        return res.status(401).json({ error: 'Необходима авторизация' });
      }

      const validatedData = updateAdSchema.parse(req.body);
      const ad = await updateAd(id, validatedData);

      return res.status(200).json({
        message: 'Рекламный блок обновлен',
        ad,
      });
    }

    if (req.method === 'DELETE') {
      if (!req.user) {
        return res.status(401).json({ error: 'Необходима авторизация' });
      }

      await deleteAd(id);

      return res.status(200).json({
        message: 'Рекламный блок удален',
      });
    }

    return res.status(405).json({ error: 'Метод не разрешен' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: error.errors,
      });
    }

    if (error.message === 'Рекламный блок не найден') {
      return res.status(404).json({ error: error.message });
    }

    console.error('Ошибка обработки рекламного блока:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

export default withAdmin(handler);
