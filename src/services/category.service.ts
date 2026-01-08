import { prisma } from "../lib/prisma";

export interface CategoryWithTags {
  id: string;
  name: string;
  tags: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Получение списка всех категорий
 */
export async function getCategories(): Promise<CategoryWithTags[]> {
  const categories = await prisma.category.findMany({
    include: {
      tags: {
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories;
}

/**
 * Получение категории по ID с тегами
 */
export async function getCategoryById(categoryId: string): Promise<CategoryWithTags | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      tags: {
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  return category;
}
