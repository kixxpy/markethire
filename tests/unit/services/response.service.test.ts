import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createResponse,
  getResponseById,
  getMyResponses,
  updateResponse,
  deleteResponse,
} from '../../../src/services/response.service';
import { createPrismaMock, resetPrismaMock } from '../../helpers/prisma-mock';
import {
  createTestUser,
  createTestTask,
  createTestResponse,
} from '../../helpers/test-helpers';
import { TaskStatus } from '@prisma/client';

// Мокируем модуль prisma
jest.mock('../../../src/lib/prisma');

describe('Response Service', () => {
  let mockPrisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    mockPrisma = createPrismaMock();
    const prismaModule = require('../../../src/lib/prisma');
    Object.assign(prismaModule.prisma, mockPrisma);
    
    resetPrismaMock(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createResponse', () => {
    it('должен успешно создать отклик', async () => {
      const taskId = 'task-id';
      const userId = 'performer-id';
      const responseData = {
        message: 'I can help with this task',
        price: 5000,
        deadline: '2024-12-31',
      };

      const task = createTestTask({
        id: taskId,
        userId: 'seller-id',
        status: TaskStatus.OPEN,
      });
      const createdResponse = createTestResponse({
        taskId,
        userId,
        ...responseData,
      });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue({
        ...task,
        user: createTestUser({ id: 'seller-id' }),
      });
      (mockPrisma.response.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.response.create as jest.Mock).mockResolvedValue({
        ...createdResponse,
        user: createTestUser({ id: userId }),
        task: {
          id: taskId,
          title: task.title,
          status: task.status,
          userId: task.userId,
        },
      });

      const result = await createResponse(taskId, userId, responseData);

      expect(result.message).toBe(responseData.message);
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
        include: expect.any(Object),
      });
      expect(mockPrisma.response.create).toHaveBeenCalled();
    });

    it('должен выбросить ошибку если задача не найдена', async () => {
      const taskId = 'nonexistent-id';
      const userId = 'performer-id';

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        createResponse(taskId, userId, { message: 'Test message' })
      ).rejects.toThrow('Задача не найдена');
    });

    it('должен выбросить ошибку если пользователь пытается откликнуться на свою задачу', async () => {
      const taskId = 'task-id';
      const userId = 'user-id';

      const task = createTestTask({ id: taskId, userId });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue({
        ...task,
        user: createTestUser({ id: userId }),
      });

      await expect(
        createResponse(taskId, userId, { message: 'Test message' })
      ).rejects.toThrow('Нельзя откликаться на свою задачу');
    });

    it('должен выбросить ошибку если задача закрыта', async () => {
      const taskId = 'task-id';
      const userId = 'performer-id';

      const task = createTestTask({
        id: taskId,
        userId: 'seller-id',
        status: TaskStatus.CLOSED,
      });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue({
        ...task,
        user: createTestUser({ id: 'seller-id' }),
      });

      await expect(
        createResponse(taskId, userId, { message: 'Test message' })
      ).rejects.toThrow('Нельзя откликаться на закрытую задачу');
    });

    it('должен выбросить ошибку если пользователь уже откликнулся', async () => {
      const taskId = 'task-id';
      const userId = 'performer-id';

      const task = createTestTask({
        id: taskId,
        userId: 'seller-id',
        status: TaskStatus.OPEN,
      });
      const existingResponse = createTestResponse({ taskId, userId });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue({
        ...task,
        user: createTestUser({ id: 'seller-id' }),
      });
      (mockPrisma.response.findFirst as jest.Mock).mockResolvedValue(existingResponse);

      await expect(
        createResponse(taskId, userId, { message: 'Test message' })
      ).rejects.toThrow('Вы уже откликнулись на эту задачу');
    });

    it('должен выбросить ошибку если цена отрицательная', async () => {
      const taskId = 'task-id';
      const userId = 'performer-id';

      const task = createTestTask({
        id: taskId,
        userId: 'seller-id',
        status: TaskStatus.OPEN,
      });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue({
        ...task,
        user: createTestUser({ id: 'seller-id' }),
      });
      (mockPrisma.response.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        createResponse(taskId, userId, {
          message: 'Test message',
          price: -100,
        })
      ).rejects.toThrow('Цена должна быть положительным числом');
    });
  });

  describe('getResponseById', () => {
    it('должен вернуть отклик по ID для автора', async () => {
      const responseId = 'response-id';
      const userId = 'performer-id';

      const response = createTestResponse({ id: responseId, userId });

      (mockPrisma.response.findUnique as jest.Mock).mockResolvedValue({
        ...response,
        user: createTestUser({ id: userId }),
        task: {
          id: response.taskId,
          title: 'Test Task',
          status: TaskStatus.OPEN,
          userId: 'seller-id',
        },
      });

      const result = await getResponseById(responseId, userId);

      expect(result?.id).toBe(responseId);
    });

    it('должен вернуть отклик по ID для владельца задачи', async () => {
      const responseId = 'response-id';
      const taskOwnerId = 'seller-id';
      const performerId = 'performer-id';

      const response = createTestResponse({
        id: responseId,
        userId: performerId,
        taskId: 'task-id',
      });

      (mockPrisma.response.findUnique as jest.Mock).mockResolvedValue({
        ...response,
        user: createTestUser({ id: performerId }),
        task: {
          id: response.taskId,
          title: 'Test Task',
          status: TaskStatus.OPEN,
          userId: taskOwnerId,
        },
      });

      const result = await getResponseById(responseId, taskOwnerId);

      expect(result?.id).toBe(responseId);
    });

    it('должен выбросить ошибку если нет прав доступа', async () => {
      const responseId = 'response-id';
      const userId = 'unauthorized-id';

      const response = createTestResponse({
        id: responseId,
        userId: 'performer-id',
        taskId: 'task-id',
      });

      (mockPrisma.response.findUnique as jest.Mock).mockResolvedValue({
        ...response,
        user: createTestUser({ id: 'performer-id' }),
        task: {
          id: response.taskId,
          title: 'Test Task',
          status: TaskStatus.OPEN,
          userId: 'seller-id',
        },
      });

      await expect(getResponseById(responseId, userId)).rejects.toThrow(
        'Недостаточно прав для просмотра отклика'
      );
    });
  });

  describe('updateResponse', () => {
    it('должен успешно обновить отклик', async () => {
      const responseId = 'response-id';
      const userId = 'performer-id';
      const updateData = {
        message: 'Updated message',
        price: 6000,
      };

      const existingResponse = createTestResponse({
        id: responseId,
        userId,
        taskId: 'task-id',
      });

      (mockPrisma.response.findUnique as jest.Mock).mockResolvedValue({
        ...existingResponse,
        task: {
          status: TaskStatus.OPEN,
        },
      });
      (mockPrisma.response.update as jest.Mock).mockResolvedValue({
        ...existingResponse,
        ...updateData,
        user: createTestUser({ id: userId }),
        task: {
          id: 'task-id',
          title: 'Test Task',
          status: TaskStatus.OPEN,
          userId: 'seller-id',
        },
      });

      const result = await updateResponse(responseId, userId, updateData);

      expect(result.message).toBe(updateData.message);
      expect(mockPrisma.response.update).toHaveBeenCalled();
    });

    it('должен выбросить ошибку если пользователь не автор', async () => {
      const responseId = 'response-id';
      const userId = 'unauthorized-id';

      const existingResponse = createTestResponse({
        id: responseId,
        userId: 'performer-id',
      });

      (mockPrisma.response.findUnique as jest.Mock).mockResolvedValue({
        ...existingResponse,
        task: {
          status: TaskStatus.OPEN,
        },
      });

      await expect(updateResponse(responseId, userId, {})).rejects.toThrow(
        'Недостаточно прав для обновления отклика'
      );
    });
  });

  describe('deleteResponse', () => {
    it('должен успешно удалить отклик', async () => {
      const responseId = 'response-id';
      const userId = 'performer-id';

      const existingResponse = createTestResponse({
        id: responseId,
        userId,
      });

      (mockPrisma.response.findUnique as jest.Mock).mockResolvedValue({
        ...existingResponse,
        task: {
          status: TaskStatus.OPEN,
        },
      });
      (mockPrisma.response.delete as jest.Mock).mockResolvedValue(existingResponse);

      await deleteResponse(responseId, userId);

      expect(mockPrisma.response.delete).toHaveBeenCalledWith({
        where: { id: responseId },
      });
    });

    it('должен выбросить ошибку если пользователь не автор', async () => {
      const responseId = 'response-id';
      const userId = 'unauthorized-id';

      const existingResponse = createTestResponse({
        id: responseId,
        userId: 'performer-id',
      });

      (mockPrisma.response.findUnique as jest.Mock).mockResolvedValue({
        ...existingResponse,
        task: {
          status: TaskStatus.OPEN,
        },
      });

      await expect(deleteResponse(responseId, userId)).rejects.toThrow(
        'Недостаточно прав для удаления отклика'
      );
    });
  });
});
