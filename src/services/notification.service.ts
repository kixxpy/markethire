import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: string;
  role: UserRole;
  title: string;
  message: string;
  link?: string;
}

export interface NotificationWithUser {
  id: string;
  userId: string;
  type: string;
  role: UserRole;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: Date;
}

/**
 * Создание уведомления
 */
export async function createNotification(
  data: CreateNotificationInput
): Promise<NotificationWithUser> {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      role: data.role,
      title: data.title,
      message: data.message,
      link: data.link || null,
    },
  });

  return notification;
}

/**
 * Получение уведомлений пользователя
 */
export async function getUserNotifications(
  userId: string,
  role?: UserRole,
  unreadOnly: boolean = false
): Promise<NotificationWithUser[]> {
  const where: any = {
    userId,
  };

  if (role) {
    where.role = role;
  }

  if (unreadOnly) {
    where.read = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Ограничиваем последними 50 уведомлениями
  });

  return notifications;
}

/**
 * Получение количества непрочитанных уведомлений
 */
export async function getUnreadNotificationCount(
  userId: string,
  role?: UserRole
): Promise<number> {
  const where: any = {
    userId,
    read: false,
  };

  if (role) {
    where.role = role;
  }

  return prisma.notification.count({ where });
}

/**
 * Пометить уведомление как прочитанное
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<NotificationWithUser> {
  // Проверяем, что уведомление принадлежит пользователю
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error("Уведомление не найдено");
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return updated;
}

/**
 * Пометить все уведомления как прочитанные
 */
export async function markAllNotificationsAsRead(
  userId: string,
  role?: UserRole
): Promise<{ count: number }> {
  const where: any = {
    userId,
    read: false,
  };

  if (role) {
    where.role = role;
  }

  const result = await prisma.notification.updateMany({
    where,
    data: { read: true },
  });

  return { count: result.count };
}
