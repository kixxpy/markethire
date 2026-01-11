import { prisma } from "../lib/prisma";

export interface ReplyWithRelations {
  id: string;
  responseId: string;
  userId: string;
  message: string;
  createdAt: Date;
  user: {
    id: string;
    username: string | null;
    name: string | null;
    email: string;
  };
}

const MAX_MESSAGE_LENGTH = 1000; // Максимальная длина сообщения

/**
 * Создание ответа на отклик
 */
export async function createReply(
  responseId: string,
  userId: string,
  message: string
): Promise<ReplyWithRelations> {
  // Валидация длины сообщения
  if (message.trim().length === 0) {
    throw new Error("Сообщение не может быть пустым");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Сообщение не может превышать ${MAX_MESSAGE_LENGTH} символов`);
  }

  // Проверка существования отклика
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    select: {
      id: true,
      taskId: true,
      userId: true,
      task: {
        select: {
          id: true,
          userId: true,
          status: true,
        },
      },
    },
  });

  if (!response) {
    throw new Error("Отклик не найден");
  }

  // Проверка прав: только владелец задачи может отвечать на отклики
  if (response.task.userId !== userId) {
    throw new Error("Только владелец задачи может отвечать на отклики");
  }

  // Проверка: нельзя отвечать на отклики к закрытой задаче
  if (response.task.status !== "OPEN") {
    throw new Error("Нельзя отвечать на отклики к закрытой задаче");
  }

  // Создание ответа
  let reply;
  try {
    reply = await prisma.reply.create({
      data: {
        responseId,
        userId,
        message: message.trim(),
      },
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
    });
  } catch (error: any) {
    console.error("Ошибка при создании ответа:", error);
    // Проверяем, существует ли таблица Reply
    if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
      throw new Error("Таблица ответов не существует. Выполните миграцию базы данных: npx prisma db push");
    }
    throw error;
  }

  // Создание уведомления для автора отклика
  try {
    const { createNotification } = await import('./notification.service');
    await createNotification({
      userId: response.userId,
      type: 'NEW_REPLY',
      role: 'PERFORMER',
      title: 'Ответ на ваш отклик',
      message: `Владелец задачи ответил на ваш отклик`,
      link: `/tasks/${response.taskId}`,
    });
  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
  }

  return reply;
}

/**
 * Удаление ответа на отклик
 */
export async function deleteReply(
  replyId: string,
  userId: string
): Promise<void> {
  const reply = await prisma.reply.findUnique({
    where: { id: replyId },
    include: {
      response: {
        include: {
          task: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!reply) {
    throw new Error("Ответ не найден");
  }

  // Проверка прав: автор ответа или владелец задачи
  const isAuthor = reply.userId === userId;
  const isTaskOwner = reply.response.task.userId === userId;

  if (!isAuthor && !isTaskOwner) {
    throw new Error("Недостаточно прав для удаления ответа");
  }

  await prisma.reply.delete({
    where: { id: replyId },
  });
}
