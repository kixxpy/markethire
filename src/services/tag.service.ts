import { prisma } from "../lib/prisma";

export interface TagWithCategory {
  id: string;
  name: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

export interface TagFilters {
  categoryId?: string;
}

/**
 * Получение списка всех тегов с фильтрацией по категории
 */
export async function getTags(filters?: TagFilters): Promise<TagWithCategory[]> {
  const where: any = {};

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  const tags = await prisma.tag.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return tags;
}

/**
 * Получение тега по ID
 */
export async function getTagById(tagId: string): Promise<TagWithCategory | null> {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return tag;
}
