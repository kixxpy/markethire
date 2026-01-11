import { prisma } from '../lib/prisma';
import { deleteAdImage } from './file.service';

export interface CreateAdInput {
  imageUrl: string;
  link: string; // Теперь обязательное поле
  position?: number;
  isActive?: boolean;
}

export interface UpdateAdInput {
  imageUrl?: string;
  link?: string;
  position?: number;
  isActive?: boolean;
}

export interface Ad {
  id: string;
  imageUrl: string;
  link: string | null;
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Получить все активные рекламные блоки, отсортированные по позиции
 */
export async function getActiveAds(): Promise<Ad[]> {
  try {
    return await prisma.ad.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        position: 'asc',
      },
    });
  } catch (error: any) {
    console.error('Ошибка в getActiveAds:', error);
    throw error;
  }
}

/**
 * Получить все рекламные блоки (для админ-панели)
 */
export async function getAllAds(): Promise<Ad[]> {
  return prisma.ad.findMany({
    orderBy: [
      { isActive: 'desc' },
      { position: 'asc' },
    ],
  });
}

/**
 * Получить рекламный блок по ID
 */
export async function getAdById(id: string): Promise<Ad | null> {
  return prisma.ad.findUnique({
    where: { id },
  });
}

/**
 * Создать новый рекламный блок
 */
export async function createAd(data: CreateAdInput): Promise<Ad> {
  // Если позиция не указана, ставим в конец
  if (data.position === undefined) {
    const maxPosition = await prisma.ad.aggregate({
      _max: { position: true },
    });
    data.position = (maxPosition._max.position ?? -1) + 1;
  }

  return prisma.ad.create({
    data: {
      imageUrl: data.imageUrl,
      link: data.link,
      position: data.position,
      isActive: data.isActive ?? true,
    },
  });
}

/**
 * Обновить рекламный блок
 */
export async function updateAd(id: string, data: UpdateAdInput): Promise<Ad> {
  // Получаем текущий рекламный блок для удаления старого изображения
  const currentAd = await prisma.ad.findUnique({
    where: { id },
    select: { imageUrl: true },
  });

  // Если обновляется imageUrl и он отличается от текущего, удаляем старое изображение
  if (data.imageUrl !== undefined && currentAd && currentAd.imageUrl !== data.imageUrl) {
    // Удаляем старое изображение только если новое отличается
    if (currentAd.imageUrl && currentAd.imageUrl.startsWith('/uploads/ads/')) {
      deleteAdImage(currentAd.imageUrl);
    }
  }

  return prisma.ad.update({
    where: { id },
    data,
  });
}

/**
 * Удалить рекламный блок
 */
export async function deleteAd(id: string): Promise<void> {
  // Получаем рекламный блок перед удалением, чтобы удалить файл
  const ad = await prisma.ad.findUnique({
    where: { id },
    select: { imageUrl: true },
  });

  if (ad && ad.imageUrl) {
    // Удаляем файл изображения
    deleteAdImage(ad.imageUrl);
  }

  // Удаляем запись из БД
  await prisma.ad.delete({
    where: { id },
  });
}
