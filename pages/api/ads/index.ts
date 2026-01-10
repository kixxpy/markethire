import type { NextApiRequest, NextApiResponse } from 'next';
import { getActiveAds, getAllAds, createAd } from '../../../src/services/ad.service';
import { withAuth, withAdmin, isAdmin } from '../../../src/middleware';
import { AuthenticatedRequest } from '../../../src/middleware';
import { z } from 'zod';

const createAdSchema = z.object({
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
  ),
  link: z.string().url('Некорректный URL ссылки').min(1, 'Ссылка обязательна'),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Публичный endpoint для получения активных рекламных блоков
async function publicHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  try {
    const ads = await getActiveAds();
    return res.status(200).json({ ads });
  } catch (error: any) {
    console.error('Ошибка получения рекламы:', error);
    
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

// Админский endpoint для получения всех рекламных блоков и создания новых
async function adminHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const ads = await getAllAds();
      return res.status(200).json({ ads });
    }

    if (req.method === 'POST') {
      if (!req.user) {
        return res.status(401).json({ error: 'Необходима авторизация' });
      }

      const validatedData = createAdSchema.parse(req.body);
      const ad = await createAd(validatedData);

      return res.status(201).json({
        message: 'Рекламный блок создан',
        ad,
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

    console.error('Ошибка обработки рекламы:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

// Handler для GET запросов с проверкой прав админа
async function getAdsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Если пользователь авторизован и является админом - возвращаем все рекламы
  if (req.user && isAdmin(req.user.role)) {
    try {
      const ads = await getAllAds();
      return res.status(200).json({ ads });
    } catch (error: any) {
      console.error('Ошибка получения всех реклам:', error);
      // В случае ошибки возвращаем активные рекламы
      const ads = await getActiveAds();
      return res.status(200).json({ ads });
    }
  }
  
  // Иначе возвращаем только активные рекламы
  return await publicHandler(req, res);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Для GET запросов используем withAuth с опциональной проверкой
    // Это позволяет проверить, является ли пользователь админом, без ошибок для неавторизованных
    if (req.method === 'GET') {
      return await withAuth(getAdsHandler, { optional: true })(req as AuthenticatedRequest, res);
    }
    
    // Для POST и других методов требуется авторизация администратора
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Необходима авторизация' });
    }
    
    // Используем админский handler для POST и других методов
    return await withAdmin(adminHandler)(req as AuthenticatedRequest, res);
  } catch (error: any) {
    console.error('Ошибка в главном handler /api/ads:', error);
    
    // Если это GET запрос и произошла ошибка, пытаемся вернуть публичный ответ
    if (req.method === 'GET') {
      try {
        return await publicHandler(req, res);
      } catch (fallbackError: any) {
        console.error('Ошибка в fallback publicHandler:', fallbackError);
        const errorMessage = process.env.NODE_ENV === 'development' 
          ? fallbackError.message || 'Внутренняя ошибка сервера'
          : 'Внутренняя ошибка сервера';
        return res.status(500).json({ error: errorMessage });
      }
    }
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Внутренняя ошибка сервера'
      : 'Внутренняя ошибка сервера';
    return res.status(500).json({ error: errorMessage });
  }
}
