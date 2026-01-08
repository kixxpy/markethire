import { prisma } from "../lib/prisma";
import { CreateResponseInput, UpdateResponseInput } from "../lib/validation";

export interface ResponseWithRelations {
  id: string;
  taskId: string;
  userId: string;
  message: string;
  price: number | null;
  deadline: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string | null;
    name: string | null;
    email: string;
    description: string | null;
    priceFrom: number | null;
  };
  task: {
    id: string;
    title: string;
    status: string;
    userId: string;
  };
}

/**
 * Создание отклика на задачу
 */
export async function createResponse(
  taskId: string,
  userId: string,
  data: CreateResponseInput
): Promise<ResponseWithRelations> {
  // Проверка существования задачи
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

  // Проверка: нельзя откликаться на свою задачу
  if (task.userId === userId) {
    throw new Error("Нельзя откликаться на свою задачу");
  }

  // Проверка: задача должна быть открыта
  if (task.status !== "OPEN") {
    throw new Error("Нельзя откликаться на закрытую задачу");
  }

  // Проверка: один пользователь - один отклик на задачу
  const existingResponse = await prisma.response.findFirst({
    where: {
      taskId,
      userId,
    },
  });

  if (existingResponse) {
    throw new Error("Вы уже откликнулись на эту задачу");
  }

  // Валидация цены (если указана)
  if (data.price !== undefined && data.price <= 0) {
    throw new Error("Цена должна быть положительным числом");
  }

  // Валидация дедлайна (если указан)
  if (data.deadline) {
    const deadlineDate = new Date(data.deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      throw new Error("Дедлайн должен быть в будущем");
    }
  }

  // Создание отклика
  const response = await prisma.response.create({
    data: {
      taskId,
      userId,
      message: data.message,
      price: data.price ?? null,
      deadline: data.deadline ?? null,
    },
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
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          userId: true,
        },
      },
    },
  });

  // Создание уведомления для селлера о новом отклике
  try {
    const { createNotification } = await import('./notification.service');
    await createNotification({
      userId: task.userId,
      type: 'NEW_RESPONSE',
      role: 'SELLER',
      title: 'Новый отклик на задачу',
      message: `На вашу задачу "${task.title}" поступил новый отклик`,
      link: `/tasks/${taskId}`,
    });
  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
    // Не прерываем выполнение, если уведомление не создалось
  }

  return response;
}

/**
 * Получение отклика по ID
 */
export async function getResponseById(
  responseId: string,
  userId?: string
): Promise<ResponseWithRelations | null> {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
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
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          userId: true,
        },
      },
    },
  });

  if (!response) {
    return null;
  }

  // Проверка прав доступа:
  // - Автор отклика может видеть свой отклик
  // - Владелец задачи может видеть отклики на свою задачу
  if (userId) {
    const canView =
      response.userId === userId || response.task.userId === userId;
    if (!canView) {
      throw new Error("Недостаточно прав для просмотра отклика");
    }
  }

  return response;
}

/**
 * Получение откликов пользователя
 */
export async function getMyResponses(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [responses, total] = await Promise.all([
    prisma.response.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            budgetType: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.response.count({
      where: { userId },
    }),
  ]);

  return {
    responses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Обновление отклика
 */
export async function updateResponse(
  responseId: string,
  userId: string,
  data: UpdateResponseInput
): Promise<ResponseWithRelations> {
  // Проверка существования отклика
  const existingResponse = await prisma.response.findUnique({
    where: { id: responseId },
    include: {
      task: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!existingResponse) {
    throw new Error("Отклик не найден");
  }

  // Проверка прав доступа (только автор может обновить)
  if (existingResponse.userId !== userId) {
    throw new Error("Недостаточно прав для обновления отклика");
  }

  // Проверка: нельзя обновлять отклик на закрытую задачу
  if (existingResponse.task.status !== "OPEN") {
    throw new Error("Нельзя обновлять отклик на закрытую задачу");
  }

  // Валидация цены (если указана)
  if (data.price !== undefined && data.price !== null && data.price <= 0) {
    throw new Error("Цена должна быть положительным числом");
  }

  // Валидация дедлайна (если указан)
  if (data.deadline !== undefined && data.deadline !== null) {
    const deadlineDate = new Date(data.deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      throw new Error("Дедлайн должен быть в будущем");
    }
  }

  // Обновление отклика
  const updateData: any = {};

  if (data.message !== undefined) {
    updateData.message = data.message;
  }

  if (data.price !== undefined) {
    updateData.price = data.price;
  }

  if (data.deadline !== undefined) {
    updateData.deadline = data.deadline;
  }

  const response = await prisma.response.update({
    where: { id: responseId },
    data: updateData,
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
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          userId: true,
        },
      },
    },
  });

  return response;
}

/**
 * Удаление отклика
 */
export async function deleteResponse(
  responseId: string,
  userId: string
): Promise<void> {
  // Проверка существования отклика
  const existingResponse = await prisma.response.findUnique({
    where: { id: responseId },
    include: {
      task: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!existingResponse) {
    throw new Error("Отклик не найден");
  }

  // Проверка прав доступа (только автор может удалить)
  if (existingResponse.userId !== userId) {
    throw new Error("Недостаточно прав для удаления отклика");
  }

  // Удаление отклика
  await prisma.response.delete({
    where: { id: responseId },
  });
}
