import { prisma } from "../lib/prisma";
import { CreateTaskInput, UpdateTaskInput, TaskFiltersInput } from "../lib/validation";
import { Marketplace, TaskStatus, BudgetType, UserRole } from "@prisma/client";

export interface TaskWithRelations {
  id: string;
  userId: string;
  marketplace: Marketplace;
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
  user: {
    id: string;
    username: string | null;
    name: string | null;
    email: string;
    avatarUrl: string | null;
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
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatarUrl: true,
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
    where.marketplace = marketplace;
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
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatarUrl: true,
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
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatarUrl: true,
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
  // Проверка существования задачи и прав доступа
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!existingTask) {
    throw new Error("Задача не найдена");
  }

  if (existingTask.userId !== userId) {
    throw new Error("Недостаточно прав для обновления задачи");
  }

  // Проверка категории, если она обновляется
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error("Категория не найдена");
    }
  }

  // Проверка тегов, если они обновляются
  if (data.tagIds !== undefined) {
    const categoryId = data.categoryId || existingTask.categoryId;
    if (data.tagIds.length > 0) {
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

  // Обновление задачи
  const updateData: any = {};

  if (data.marketplace !== undefined) {
    updateData.marketplace = data.marketplace;
  }

  if (data.categoryId !== undefined) {
    updateData.categoryId = data.categoryId;
  }

  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.budget !== undefined) {
    updateData.budget = data.budget;
  }

  if (data.budgetType !== undefined) {
    updateData.budgetType = data.budgetType;
  }

  if (data.images !== undefined) {
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
        const { deleteTaskImages } = await import("./file.service");
        deleteTaskImages(imagesToDelete);
      }
    }

    updateData.images = data.images;
  }

  // После редактирования задача должна попасть на модерацию
  updateData.moderationStatus = "PENDING";
  updateData.moderationComment = null;
  updateData.moderatedAt = null;
  updateData.moderatedBy = null;

  // Обновление тегов
  if (data.tagIds !== undefined) {
    // Удаляем все существующие связи
    await prisma.taskTag.deleteMany({
      where: { taskId },
    });

    // Создаем новые связи
    if (data.tagIds.length > 0) {
      await prisma.taskTag.createMany({
        data: data.tagIds.map(tagId => ({
          taskId,
          tagId,
        })),
      });
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatarUrl: true,
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
      message: `Ваша задача "${task.title}" отправлена на проверку администратору после редактирования. Она будет опубликована после одобрения.`,
      link: `/tasks/${task.id}`,
    });
  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
  }

  return result;
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

  await prisma.task.delete({
    where: { id: taskId },
  });

  // Если задача удалена администратором, создаем уведомление владельцу
  if (isAdmin && taskOwnerId !== userId) {
    try {
      const { createNotification } = await import('./notification.service');
      
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
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatarUrl: true,
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
      responses: {
        select: {
          userId: true,
        },
      },
      _count: {
        select: {
          responses: true,
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
    where.marketplace = marketplace;
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
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatarUrl: true,
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
 * Получение откликов на задачу
 */
export async function getTaskResponses(taskId: string, userId?: string) {
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

  const responses = await prisma.response.findMany({
    where: { taskId },
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

  return responses;
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
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatarUrl: true,
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
