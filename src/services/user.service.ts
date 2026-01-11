import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, generateToken, generateTokenPair } from "../lib/auth";
import { RegisterInput, LoginInput, UpdateProfileInput } from "../lib/validation";
import { UserRole } from "@prisma/client";
import { deleteAvatar } from "./file.service";

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
  };
  token: string;
  refreshToken?: string;
}

/**
 * Регистрация нового пользователя
 */
export async function registerUser(
  data: RegisterInput
): Promise<AuthResult> {
  // Проверка существования пользователя по email
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUserByEmail) {
    throw new Error("Пользователь с таким email уже существует");
  }

  // Проверка существования пользователя по username
  const existingUserByUsername = await prisma.user.findUnique({
    where: { username: data.username },
  });

  if (existingUserByUsername) {
    throw new Error("Пользователь с таким никнеймом уже существует");
  }

  // Хеширование пароля
  const hashedPassword = await hashPassword(data.password);

  // Создание пользователя - всегда BOTH
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
      name: data.name && data.name.trim() ? data.name.trim() : null,
      role: "BOTH", // Всегда BOTH при регистрации
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  // Генерация токенов (access + refresh)
  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { 
    user, 
    token: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
  };
}

/**
 * Вход пользователя
 */
export async function loginUser(data: LoginInput): Promise<AuthResult> {
  // Поиск пользователя
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.password) {
    throw new Error("Неверный email или пароль");
  }

  // Проверка пароля
  const isPasswordValid = await verifyPassword(data.password, user.password);

  if (!isPasswordValid) {
    throw new Error("Неверный email или пароль");
  }

  // Генерация токенов (access + refresh)
  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
  };
}

/**
 * Получение профиля пользователя
 */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      avatarUrl: true,
      description: true,
      priceFrom: true,
      telegram: true,
      whatsapp: true,
      emailContact: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  return user;
}

/**
 * Получение URL старого аватара пользователя
 */
export async function getUserAvatarUrl(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      avatarUrl: true,
    },
  });

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  return user.avatarUrl;
}

/**
 * Обновление профиля пользователя
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateProfileInput
) {
  // Проверка уникальности username, если он изменяется
  if (data.username !== undefined) {
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error("Пользователь с таким никнеймом уже существует");
    }
  }

  // Если avatarUrl устанавливается в null или пустую строку, удаляем файл
  if (data.avatarUrl === null || data.avatarUrl === '') {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    
    if (currentUser?.avatarUrl) {
      deleteAvatar(currentUser.avatarUrl);
    }
  }

  // Подготовка данных для обновления
  const updateData: any = {
    name: data.name,
    description: data.description,
    priceFrom: data.priceFrom,
    telegram: data.telegram,
    whatsapp: data.whatsapp,
    emailContact: data.emailContact,
    role: data.role,
  };

  if (data.username !== undefined) {
    updateData.username = data.username;
  }

  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl || null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      avatarUrl: true,
      description: true,
      priceFrom: true,
      telegram: true,
      whatsapp: true,
      emailContact: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Получение профиля пользователя по ID
 */
export async function getUserProfileById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      avatarUrl: true,
      description: true,
      priceFrom: true,
      telegram: true,
      whatsapp: true,
      emailContact: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  return user;
}

/**
 * Получение тегов пользователя
 */
export async function getUserTags(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  const tags = await prisma.userTag.findMany({
    where: { userId },
    include: {
      tag: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return tags.map((ut) => ({
    id: ut.tag.id,
    name: ut.tag.name,
    category: ut.tag.category,
  }));
}

/**
 * Добавление тегов к профилю пользователя
 */
export async function addTagsToUser(userId: string, tagIds: string[]) {
  // Проверка существования пользователя
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  // Проверка существования тегов
  const tags = await prisma.tag.findMany({
    where: {
      id: { in: tagIds },
    },
  });

  if (tags.length !== tagIds.length) {
    throw new Error("Один или несколько тегов не найдены");
  }

  // Добавление тегов (используем createMany с skipDuplicates)
  await prisma.userTag.createMany({
    data: tagIds.map((tagId) => ({
      userId,
      tagId,
    })),
    skipDuplicates: true,
  });

  // Возвращаем обновленный список тегов
  return getUserTags(userId);
}

/**
 * Удаление тега из профиля пользователя
 */
export async function removeTagFromUser(userId: string, tagId: string) {
  // Проверка существования связи
  const userTag = await prisma.userTag.findUnique({
    where: {
      userId_tagId: {
        userId,
        tagId,
      },
    },
  });

  if (!userTag) {
    throw new Error("Тег не найден в профиле пользователя");
  }

  await prisma.userTag.delete({
    where: {
      userId_tagId: {
        userId,
        tagId,
      },
    },
  });

  return { message: "Тег успешно удален из профиля" };
}

/**
 * Поиск исполнителей с фильтрацией
 */
export interface PerformerFilters {
  tagIds?: string[];
  categoryIds?: string[];
  priceFrom?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getPerformers(filters: PerformerFilters = {}) {
  const {
    tagIds,
    categoryIds,
    priceFrom,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const skip = (page - 1) * limit;

  // Базовые условия для исполнителей
  const where: any = {
    OR: [
      { role: "PERFORMER" },
      { role: "BOTH" },
    ],
  };

  // Фильтр по минимальной цене
  if (priceFrom !== undefined) {
    where.priceFrom = {
      gte: priceFrom,
    };
  }

  // Поиск по имени или описанию
  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      },
    ];
  }

  // Фильтр по тегам и категориям
  const tagFilters: any[] = [];
  
  if (tagIds && tagIds.length > 0) {
    tagFilters.push({
      tagId: {
        in: tagIds,
      },
    });
  }

  if (categoryIds && categoryIds.length > 0) {
    tagFilters.push({
      tag: {
        categoryId: {
          in: categoryIds,
        },
      },
    });
  }

  if (tagFilters.length > 0) {
    const tagsCondition = {
      some: tagFilters.length === 1 
        ? tagFilters[0]
        : {
            OR: tagFilters,
          },
    };
    
    where.AND = [
      ...(where.AND || []),
      { tags: tagsCondition },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        description: true,
        priceFrom: true,
        telegram: true,
        whatsapp: true,
        emailContact: true,
        createdAt: true,
        tags: {
          include: {
            tag: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    performers: users.map((user) => ({
      ...user,
      tags: user.tags.map((ut) => ({
        id: ut.tag.id,
        name: ut.tag.name,
        category: ut.tag.category,
      })),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Получение статистики пользователя
 */
export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  // Статистика как Seller
  const sellerStats = {
    activeTasks: await prisma.task.count({
      where: {
        userId,
        status: 'OPEN',
      },
    }),
    totalTasks: await prisma.task.count({
      where: { userId },
    }),
    totalResponses: await prisma.response.count({
      where: {
        task: {
          userId,
        },
      },
    }),
    totalSpent: await prisma.task.aggregate({
      where: {
        userId,
        status: 'CLOSED',
      },
      _sum: {
        budget: true,
      },
    }).then(result => result._sum.budget || 0),
    rating: null as number | null, // Заглушка для будущей системы рейтингов
  };

  // Статистика как Executor
  const executorStats = {
    activeProjects: await prisma.response.count({
      where: {
        userId,
        task: {
          status: 'OPEN',
        },
      },
    }),
    totalResponses: await prisma.response.count({
      where: { userId },
    }),
    totalEarned: 0, // Заглушка для будущей системы платежей
    rating: null as number | null, // Заглушка для будущей системы рейтингов
    profileViews: 0, // Заглушка для будущей системы аналитики
  };

  return {
    seller: sellerStats,
    executor: executorStats,
  };
}
