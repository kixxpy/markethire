import { prisma } from "../lib/prisma";
import { CreateTaskInput, UpdateTaskInput, TaskFiltersInput } from "../lib/validation";
import { Marketplace, TaskStatus, BudgetType, UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { deleteTaskImages } from "./file.service";
import { createNotification } from "./notification.service";

/**
 * Общие include для задач с отношениями
 */
const TASK_INCLUDE = {
  user: {
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  _count: {
    select: {
      responses: true,
    },
  },
} as const satisfies Prisma.TaskInclude;

export interface TaskWithRelations {
  id: string;
  userId: string;
  marketplace: Marketplace[];
  categoryId: string;
  title: string;
  description: string;
  budget: number | null;
  budgetType: BudgetType;
  status: TaskStatus;
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED" | "REVISION";
  moderationComment?: string | null;
  moderatedAt?: Date | null;
  moderatedBy?: string | null;
  createdInMode: UserRole;
  createdAt: Date;
  images: string[];
  views: number;
  user: {
    id: string;
    username: string | null;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    createdAt: Date;
  };
  category: {
    id: string;
    name: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    responses: number;
  };
}

export interface PaginatedTasks {
  tasks: TaskWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Создание новой задачи
 */
export async function createTask(
  userId: string,
  data: CreateTaskInput
) {
  // Проверка существования категории
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new Error("Категория не найдена");
  }

  // Проверка существования тегов, если они указаны
  if (data.tagIds && data.tagIds.length > 0) {
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: data.tagIds },
        categoryId: data.categoryId,
      },
    });

    if (tags.length !== data.tagIds.length) {
      throw new Error("Один или несколько тегов не найдены или не принадлежат категории");
    }
  }

  // Создание задачи
  const task = await prisma.task.create({
    data: {
      userId,
      marketplace: data.marketplace,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      budget: data.budget ?? null,
      budgetType: data.budgetType,
      moderationStatus: "PENDING",
      createdInMode: data.createdInMode || 'SELLER',
      images: data.images || [],
      tags: data.tagIds && data.tagIds.length > 0 ? {
        create: data.tagIds.map(tagId => ({ tagId })),
      } : undefined,
    },
    include: TASK_INCLUDE,
  });

  const result = {
    ...task,
    moderationStatus: task.moderationStatus || "PENDING",
    tags: task.tags.map(tt => tt.tag),
  };

  // Создание уведомления о том, что задача отправлена на модерацию
  try {
    const { createNotification } = await import('./notification.service');
    const notificationRole = task.createdInMode === 'PERFORMER' ? 'PERFORMER' : 'SELLER';
    await createNotification({
      userId,
      type: 'TASK_PENDING_MODERATION',
      role: notificationRole,
      title: 'Задача отправлена на модерацию',
      message: `Ваша задача "${task.title}" отправлена на проверку администратору. Она будет опубликована после одобрения.`,
      link: `/tasks/${task.id}`,
    });
  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
  }

  return result;
}

/**
 * Получение списка задач с фильтрацией и пагинацией
 */
export async function getTasks(filters: TaskFiltersInput): Promise<PaginatedTasks> {
  const {
    categoryId,
    tagIds,
    marketplace,
    status,
    budgetMin,
    budgetMax,
    search,
    sortBy,
    sortOrder,
    page,
    limit,
    createdInMode,
  } = filters;

  const skip = (page - 1) * limit;

  // Построение условий фильтрации
  // Показываем одобренные задачи или задачи без статуса (старые задачи)
  // Исключаем PENDING, REJECTED и REVISION, что автоматически включит APPROVED и null
  const where: any = {
    moderationStatus: {
      notIn: ["PENDING", "REJECTED", "REVISION"],
    },
  };

  // Фильтр по режиму создания
  if (createdInMode) {
    where.createdInMode = createdInMode;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (marketplace) {
    where.marketplace = {
      has: marketplace,
    };
  }

  if (status) {
    where.status = status;
  }

  if (budgetMin !== undefined || budgetMax !== undefined) {
    where.budget = {};
    if (budgetMin !== undefined) {
      where.budget.gte = budgetMin;
    }
    if (budgetMax !== undefined) {
      where.budget.lte = budgetMax;
    }
  }

  // Поиск по названию и описанию
  if (search && search.trim()) {
    const searchConditions = {
      OR: [
        {
          title: {
            contains: search.trim(),
            mode: 'insensitive' as const,
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: 'insensitive' as const,
          },
        },
      ],
    };

    // Добавляем поиск через AND для правильного объединения с другими условиями
    if (!where.AND) {
      where.AND = [];
    }
    where.AND.push(searchConditions);
  }

  // Фильтрация по тегам
  if (tagIds && tagIds.length > 0) {
    where.tags = {
      some: {
        tagId: { in: tagIds },
      },
    };
  }

  // Подсчет общего количества
  const total = await prisma.task.count({ where });

  // Получение задач
  const tasks = await prisma.task.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          responses: true,
        },
      },
    },
  });

  return {
    tasks: tasks.map(task => ({
      ...task,
      moderationStatus: task.moderationStatus || "APPROVED",
      tags: task.tags.map(tt => tt.tag),
    })) as TaskWithRelations[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Получение задачи по ID
 */
export async function getTaskById(taskId: string): Promise<TaskWithRelations | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: TASK_INCLUDE,
  });

  if (!task) {
    return null;
  }

  return {
    ...task,
    moderationStatus: task.moderationStatus || "APPROVED", // Значение по умолчанию для старых задач
    tags: task.tags.map(tt => tt.tag),
  };
}

/**
 * Обновление задачи
 */
export async function updateTask(
  taskId: string,
  userId: string,
  data: UpdateTaskInput
) {
  // Получаем полную текущую версию задачи с тегами
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!existingTask) {
    throw new Error("Задача не найдена");
  }

  if (existingTask.userId !== userId) {
    throw new Error("Недостаточно прав для обновления задачи");
  }

  // Проверка категории, если она обновляется
  if (data.categoryId !== undefined) {
    // Валидация ID категории
    if (typeof data.categoryId !== 'string' || data.categoryId.trim() === '') {
      throw new Error("Некорректный ID категории");
    }

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error("Категория не найдена");
    }
  }

  // Проверка тегов, если они обновляются
  if (data.tagIds !== undefined) {
    // Валидация массива тегов
    if (!Array.isArray(data.tagIds)) {
      throw new Error("Теги должны быть массивом");
    }

    const categoryId = data.categoryId || existingTask.categoryId;
    if (data.tagIds.length > 0) {
      // Проверяем, что все ID тегов - это строки
      const invalidTagIds = data.tagIds.filter(id => typeof id !== 'string' || id.trim() === '');
      if (invalidTagIds.length > 0) {
        throw new Error("Некорректные ID тегов");
      }

      const tags = await prisma.tag.findMany({
        where: {
          id: { in: data.tagIds },
          categoryId,
        },
      });

      if (tags.length !== data.tagIds.length) {
        throw new Error("Один или несколько тегов не найдены или не принадлежат категории");
      }
    }
  }

  // Вычисляем изменения
  const changes: Record<string, { old: any; new: any }> = {};
  const changedFields: string[] = [];

  // Сравниваем каждое поле
  if (data.title !== undefined && data.title !== existingTask.title) {
    changes.title = { old: existingTask.title, new: data.title };
    changedFields.push('title');
  }

  if (data.description !== undefined && data.description !== existingTask.description) {
    changes.description = { old: existingTask.description, new: data.description };
    changedFields.push('description');
  }

  if (data.budget !== undefined && data.budget !== existingTask.budget) {
    changes.budget = { old: existingTask.budget, new: data.budget };
    changedFields.push('budget');
  }

  if (data.budgetType !== undefined && data.budgetType !== existingTask.budgetType) {
    changes.budgetType = { old: existingTask.budgetType, new: data.budgetType };
    changedFields.push('budgetType');
  }

  if (data.categoryId !== undefined && data.categoryId !== existingTask.categoryId) {
    changes.categoryId = { old: existingTask.categoryId, new: data.categoryId };
    changedFields.push('categoryId');
  }

  if (data.marketplace !== undefined) {
    const oldMarketplace = existingTask.marketplace;
    const newMarketplace = data.marketplace;
    if (JSON.stringify([...oldMarketplace].sort()) !== JSON.stringify([...newMarketplace].sort())) {
      changes.marketplace = { old: oldMarketplace, new: newMarketplace };
      changedFields.push('marketplace');
    }
  }

  if (data.images !== undefined) {
    const oldImages = existingTask.images || [];
    const newImages = data.images || [];
    if (JSON.stringify(oldImages) !== JSON.stringify(newImages)) {
      changes.images = { old: oldImages, new: newImages };
      changedFields.push('images');
    }
  }

  if (data.tagIds !== undefined) {
    const oldTagIds = existingTask.tags.map(tt => tt.tagId).sort();
    const newTagIds = [...(data.tagIds || [])].sort();
    if (JSON.stringify(oldTagIds) !== JSON.stringify(newTagIds)) {
      changes.tagIds = { old: oldTagIds, new: newTagIds };
      changedFields.push('tagIds');
    }
  }

  // Подготавливаем данные для сохранения предыдущей версии
  const previousData = {
    title: existingTask.title,
    description: existingTask.description,
    budget: existingTask.budget,
    budgetType: existingTask.budgetType,
    categoryId: existingTask.categoryId,
    marketplace: existingTask.marketplace,
    images: existingTask.images,
    tagIds: existingTask.tags.map(tt => tt.tagId),
  };

  // Обновление задачи
  const updateData: any = {};

  if (data.marketplace !== undefined) {
    // Убеждаемся, что marketplace - это массив
    if (Array.isArray(data.marketplace) && data.marketplace.length > 0) {
      // Валидация значений enum
      const validMarketplaces: Marketplace[] = ['WB', 'OZON', 'YANDEX_MARKET', 'LAMODA'];
      const invalidValues = data.marketplace.filter(m => !validMarketplaces.includes(m as Marketplace));
      if (invalidValues.length > 0) {
        throw new Error(`Недопустимые значения маркетплейсов: ${invalidValues.join(', ')}`);
      }
      updateData.marketplace = data.marketplace as Marketplace[];
    } else {
      throw new Error("Необходимо выбрать хотя бы один маркетплейс");
    }
  }

  if (data.categoryId !== undefined) {
    updateData.categoryId = data.categoryId;
  }

  if (data.title !== undefined) {
    // Валидация заголовка
    if (typeof data.title !== 'string' || data.title.trim().length < 3) {
      throw new Error("Заголовок должен содержать минимум 3 символа");
    }
    updateData.title = data.title.trim();
  }

  if (data.description !== undefined) {
    // Валидация описания
    if (typeof data.description !== 'string' || data.description.trim().length < 10) {
      throw new Error("Описание должно содержать минимум 10 символов");
    }
    updateData.description = data.description.trim();
  }

  if (data.budget !== undefined) {
    // Обрабатываем null и положительные числа
    if (data.budget === null || (typeof data.budget === 'number' && data.budget > 0)) {
      updateData.budget = data.budget;
    } else if (data.budget !== null) {
      throw new Error("Бюджет должен быть положительным числом или null");
    }
  }

  if (data.budgetType !== undefined) {
    updateData.budgetType = data.budgetType;
  }

  if (data.images !== undefined) {
    // Валидация массива изображений
    if (!Array.isArray(data.images)) {
      throw new Error("Изображения должны быть массивом");
    }
    
    if (data.images.length > 3) {
      throw new Error("Максимум 3 изображения");
    }

    // Получаем текущие изображения для удаления старых
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { images: true },
    });

    if (currentTask) {
      // Удаляем изображения, которых нет в новом списке
      const imagesToDelete = (currentTask.images || []).filter(
        (img) => !data.images?.includes(img)
      );
      
      if (imagesToDelete.length > 0) {
        try {
          const { deleteTaskImages } = await import("./file.service");
          deleteTaskImages(imagesToDelete);
        } catch (error) {
          console.error('Ошибка удаления изображений задачи:', error);
          // Не прерываем выполнение, если удаление изображений не удалось
        }
      }
    }

    updateData.images = data.images;
  }

  // После редактирования задача должна попасть на модерацию
  updateData.moderationStatus = "PENDING";
  updateData.moderationComment = null;
  updateData.moderatedAt = null;
  updateData.moderatedBy = null;

  // Подготавливаем данные новой версии для истории
  const newDataForHistory = {
    title: updateData.title !== undefined ? updateData.title : existingTask.title,
    description: updateData.description !== undefined ? updateData.description : existingTask.description,
    budget: updateData.budget !== undefined ? updateData.budget : existingTask.budget,
    budgetType: updateData.budgetType !== undefined ? updateData.budgetType : existingTask.budgetType,
    categoryId: updateData.categoryId !== undefined ? updateData.categoryId : existingTask.categoryId,
    marketplace: updateData.marketplace !== undefined ? updateData.marketplace : existingTask.marketplace,
    images: updateData.images !== undefined ? updateData.images : existingTask.images,
    tagIds: data.tagIds !== undefined ? (data.tagIds || []) : existingTask.tags.map(tt => tt.tagId),
  };

  // Обновляем задачу в транзакции вместе с историей
  const result = await prisma.$transaction(async (tx) => {
    try {
      // Обновление тегов (если нужно)
      if (data.tagIds !== undefined) {
        // Удаляем все существующие связи
        await tx.taskTag.deleteMany({
          where: { taskId },
        });

        // Создаем новые связи
        if (data.tagIds.length > 0) {
          await tx.taskTag.createMany({
            data: data.tagIds.map(tagId => ({
              taskId,
              tagId,
            })),
          });
        }
      }

      // Обновляем задачу
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: updateData,
        include: TASK_INCLUDE,
      });

      // Сохраняем историю изменений, если были изменения
      if (changedFields.length > 0) {
        try {
          await tx.taskModerationHistory.create({
            data: {
              taskId,
              previousData: previousData as any,
              newData: newDataForHistory as any,
              changedFields,
              changedBy: userId,
              reason: 'Редактирование пользователем',
            },
          });
        } catch (historyError: any) {
          console.error('Ошибка сохранения истории изменений:', historyError);
          // Не прерываем выполнение, если история не сохранилась
        }
      }

      return updatedTask;
    } catch (error: any) {
      console.error('Ошибка в транзакции обновления задачи:', error);
      console.error('Детали:', {
        taskId,
        updateData,
        changedFields,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      throw error;
    }
  });

  const finalResult = {
    ...result,
    moderationStatus: result.moderationStatus || "PENDING",
    tags: result.tags.map(tt => tt.tag),
  };

  // Создаем уведомление пользователю
  try {
    const { createNotification } = await import('./notification.service');
    const notificationRole = result.createdInMode === 'PERFORMER' ? 'PERFORMER' : 'SELLER';
    await createNotification({
      userId,
      type: 'TASK_PENDING_MODERATION',
      role: notificationRole,
      title: 'Задача отправлена на модерацию',
      message: `Ваша задача "${result.title}" отправлена на проверку после редактирования. Она будет опубликована после одобрения.`,
      link: `/tasks/${taskId}`,
    });
  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
  }

  // Уведомляем администраторов о необходимости модерации
  if (changedFields.length > 0) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      const { createNotification } = await import('./notification.service');
      await Promise.all(
        admins.map(admin =>
          createNotification({
            userId: admin.id,
            type: 'TASK_UPDATED_FOR_MODERATION',
            role: 'ADMIN',
            title: 'Задача обновлена и требует модерации',
            message: `Задача "${result.title}" была отредактирована пользователем. Изменены поля: ${changedFields.join(', ')}. Требуется проверка.`,
            link: `/admin/dashboard?taskId=${taskId}`,
          }).catch(err => console.error('Ошибка уведомления администратора:', err))
        )
      );
    } catch (error) {
      console.error('Ошибка уведомления администраторов:', error);
    }
  }

  return finalResult;
}

/**
 * Удаление задачи
 */
export async function deleteTask(taskId: string, userId: string, isAdmin: boolean = false) {
  // Проверка существования задачи и прав доступа
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error("Задача не найдена");
  }

  // Если не администратор, проверяем права владельца
  if (!isAdmin && task.userId !== userId) {
    throw new Error("Недостаточно прав для удаления задачи");
  }

  // Сохраняем информацию о задаче и владельце перед удалением
  const taskOwnerId = task.userId;
  const taskCreatedInMode = task.createdInMode;
  const taskTitle = task.title;
  const taskImages = task.images || [];

  // Удаляем изображения задачи из файловой системы
  if (taskImages.length > 0) {
    try {
      deleteTaskImages(taskImages);
    } catch (error) {
      console.error('Ошибка удаления изображений задачи:', error);
      // Не прерываем выполнение, если удаление изображений не удалось
    }
  }

  // Удаляем задачу и все связанные данные в транзакции
  await prisma.$transaction(async (tx) => {
    // 1. Удаляем связи задачи с тегами (TaskTag)
    await tx.taskTag.deleteMany({
      where: { taskId },
    });

    // 2. Удаляем отклики на задачу (Response)
    await tx.response.deleteMany({
      where: { taskId },
    });

    // 3. Удаляем задачу (TaskModerationHistory удалится автоматически благодаря onDelete: Cascade)
    await tx.task.delete({
      where: { id: taskId },
    });
  });

  // Если задача удалена администратором, создаем уведомление владельцу
  if (isAdmin && taskOwnerId !== userId) {
    try {
      // Определяем роль для уведомления на основе createdInMode
      const notificationRole = taskCreatedInMode === 'PERFORMER' ? 'PERFORMER' : 'SELLER';

      await createNotification({
        userId: taskOwnerId,
        type: 'TASK_DELETED_BY_ADMIN',
        role: notificationRole,
        title: 'Задача удалена администратором',
        message: `Ваша задача "${taskTitle}" была удалена администратором. Для уточнения причины обратитесь к администратору.`,
        link: null, // Задача уже удалена, ссылка не нужна
      });
    } catch (error) {
      console.error('Ошибка создания уведомления:', error);
      // Не прерываем выполнение, если уведомление не создалось
    }
  }
}

/**
 * Закрытие задачи
 */
export async function closeTask(taskId: string, userId: string) {
  // Проверка существования задачи и прав доступа
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Задача не найдена");
  }

  if (task.userId !== userId) {
    throw new Error("Недостаточно прав для закрытия задачи");
  }

  if (task.status === "CLOSED") {
    throw new Error("Задача уже закрыта");
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { status: "CLOSED" },
    include: {
      ...TASK_INCLUDE,
      responses: {
        select: {
          userId: true,
        },
      },
    },
  });

  // Создание уведомлений для исполнителей, которые откликнулись на задачу
  try {
    const { createNotification } = await import('./notification.service');
    const uniqueUserIds = [...new Set(updatedTask.responses.map(r => r.userId))];
    
    await Promise.all(
      uniqueUserIds.map(userId =>
        createNotification({
          userId,
          type: 'TASK_CLOSED',
          role: 'PERFORMER',
          title: 'Задача закрыта',
          message: `Задача "${updatedTask.title}" была закрыта заказчиком`,
          link: `/tasks/${taskId}`,
        }).catch(err => {
          console.error(`Ошибка создания уведомления для пользователя ${userId}:`, err);
        })
      )
    );
  } catch (error) {
    console.error('Ошибка создания уведомлений:', error);
    // Не прерываем выполнение, если уведомления не создались
  }

  return {
    ...updatedTask,
    moderationStatus: updatedTask.moderationStatus || "APPROVED",
    tags: updatedTask.tags.map(tt => tt.tag),
  };
}

/**
 * Получение задач пользователя
 */
export async function getMyTasks(
  userId: string,
  filters: Omit<TaskFiltersInput, "page" | "limit"> & { 
    page?: number; 
    limit?: number;
    createdInMode?: 'SELLER' | 'PERFORMER';
  }
): Promise<PaginatedTasks> {
  const {
    categoryId,
    tagIds,
    marketplace,
    status,
    budgetMin,
    budgetMax,
    sortBy,
    sortOrder,
    page = 1,
    limit = 20,
    createdInMode,
  } = filters;

  const skip = (page - 1) * limit;

  // Построение условий фильтрации
  const where: any = {
    userId,
  };

  // Фильтр по режиму создания
  if (createdInMode) {
    where.createdInMode = createdInMode;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (marketplace) {
    where.marketplace = {
      has: marketplace,
    };
  }

  if (status) {
    where.status = status;
  }

  if (budgetMin !== undefined || budgetMax !== undefined) {
    where.budget = {};
    if (budgetMin !== undefined) {
      where.budget.gte = budgetMin;
    }
    if (budgetMax !== undefined) {
      where.budget.lte = budgetMax;
    }
  }

  // Фильтрация по тегам
  if (tagIds && tagIds.length > 0) {
    where.tags = {
      some: {
        tagId: { in: tagIds },
      },
    };
  }

  // Подсчет общего количества
  const total = await prisma.task.count({ where });

  // Получение задач
  const tasks = await prisma.task.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: TASK_INCLUDE,
  });

  return {
    tasks: tasks.map(task => ({
      ...task,
      moderationStatus: task.moderationStatus || "APPROVED",
      tags: task.tags.map(tt => tt.tag),
    })) as TaskWithRelations[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Получение откликов на задачу с пагинацией
 */
export async function getTaskResponses(
  taskId: string,
  userId?: string,
  page: number = 1,
  limit: number = 10
) {
  // Проверка существования задачи
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Задача не найдена");
  }

  // Проверка прав доступа (только владелец задачи может видеть отклики)
  if (!userId) {
    throw new Error("Необходима авторизация для просмотра откликов");
  }

  if (task.userId !== userId) {
    throw new Error("Недостаточно прав для просмотра откликов");
  }

  const skip = (page - 1) * limit;

  // Пытаемся получить отклики с replies
  let responses;
  try {
    responses = await prisma.response.findMany({
      where: { taskId },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            description: true,
            priceFrom: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Самый свежий сверху
      },
    });
  } catch (error: any) {
    // Если ошибка связана с replies (таблица не существует), получаем без них
    console.warn("Не удалось загрузить replies, загружаем без них:", error.message);
    responses = await prisma.response.findMany({
      where: { taskId },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            description: true,
            priceFrom: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // Добавляем пустой массив replies к каждому отклику
    responses = responses.map((r: any) => ({ ...r, replies: [] }));
  }

  const total = await prisma.response.count({
    where: { taskId },
  });

  return {
    responses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return {
    responses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Модерация задачи (одобрение/отклонение)
 */
export async function moderateTask(
  taskId: string,
  adminId: string,
  action: "APPROVE" | "REJECT" | "REVISION",
  comment?: string
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error("Задача не найдена");
  }

  if (task.moderationStatus !== "PENDING" && task.moderationStatus !== "REVISION") {
    throw new Error("Задача уже была промодерирована");
  }

  const moderationStatus = action === "APPROVE" 
    ? "APPROVED" 
    : action === "REJECT" 
    ? "REJECTED" 
    : "REVISION";
  
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      moderationStatus,
      moderationComment: comment || null,
      moderatedAt: new Date(),
      moderatedBy: adminId,
    },
    include: TASK_INCLUDE,
  });

  // Создание уведомления для пользователя
  try {
    const { createNotification } = await import('./notification.service');
    const notificationType = action === "APPROVE" 
      ? 'TASK_APPROVED' 
      : action === "REJECT"
      ? 'TASK_REJECTED'
      : 'TASK_REVISION';
    const notificationTitle = action === "APPROVE"
      ? 'Задача одобрена'
      : action === "REJECT"
      ? 'Задача отклонена'
      : 'Задача отправлена на доработку';
    const notificationMessage = action === "APPROVE"
      ? `Ваша задача "${task.title}" была одобрена и опубликована.`
      : action === "REJECT"
      ? `Ваша задача "${task.title}" была отклонена.${comment ? ` Причина: ${comment}` : ''}`
      : `Ваша задача "${task.title}" отправлена на доработку.${comment ? ` Комментарий: ${comment}` : ''}`;

    const notificationRole = updatedTask.createdInMode === 'PERFORMER' ? 'PERFORMER' : 'SELLER';
    await createNotification({
      userId: task.userId,
      type: notificationType,
      role: notificationRole,
      title: notificationTitle,
      message: notificationMessage,
      link: `/tasks/${taskId}`,
    });
  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
  }

  return {
    ...updatedTask,
    moderationStatus: updatedTask.moderationStatus || "APPROVED",
    tags: updatedTask.tags.map(tt => tt.tag),
  };
}

/**
 * Получение задач на модерации (для администратора)
 */
export async function getPendingTasks(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedTasks> {
  const skip = (page - 1) * limit;

  const where = {
    moderationStatus: {
      in: ["PENDING", "REVISION"],
    },
  };

  const total = await prisma.task.count({ where });

  const tasks = await prisma.task.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      ...TASK_INCLUDE,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          telegram: true,
          whatsapp: true,
          emailContact: true,
        },
      },
    },
  });

  return {
    tasks: tasks.map(task => ({
      ...task,
      moderationStatus: task.moderationStatus || "APPROVED",
      tags: task.tags.map(tt => tt.tag),
    })) as TaskWithRelations[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
