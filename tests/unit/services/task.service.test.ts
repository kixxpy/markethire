import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  closeTask,
  getMyTasks,
  getTaskResponses,
} from '../../../src/services/task.service';
import { createPrismaMock, resetPrismaMock } from '../../helpers/prisma-mock';
import {
  createTestUser,
  createTestTask,
  createTestCategory,
  createTestTag,
} from '../../helpers/test-helpers';
import { Marketplace, TaskStatus, BudgetType } from '@prisma/client';

// Мокируем модуль prisma
jest.mock('../../../src/lib/prisma');

describe('Task Service', () => {
  let mockPrisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    mockPrisma = createPrismaMock();
    const prismaModule = require('../../../src/lib/prisma');
    Object.assign(prismaModule.prisma, mockPrisma);
    
    resetPrismaMock(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('должен успешно создать задачу', async () => {
      const userId = 'user-id';
      const taskData = {
        marketplace: 'WB' as Marketplace,
        categoryId: 'category-id',
        title: 'Test Task',
        description: 'Test task description',
        budget: 10000,
        budgetType: 'FIXED' as BudgetType,
        tagIds: ['tag1'],
      };

      const category = createTestCategory({ id: taskData.categoryId });
      const tag = createTestTag({ id: 'tag1', categoryId: taskData.categoryId });
      const createdTask = createTestTask({
        ...taskData,
        userId,
        tags: [{ id: tag.id, name: tag.name }],
      });

      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(category);
      (mockPrisma.tag.findMany as jest.Mock).mockResolvedValue([tag]);
      (mockPrisma.task.create as jest.Mock).mockResolvedValue({
        ...createdTask,
        user: createTestUser({ id: userId }),
        category,
        tags: [{ tag }],
        _count: { responses: 0 },
      });

      const result = await createTask(userId, taskData);

      expect(result.title).toBe(taskData.title);
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: taskData.categoryId },
      });
      expect(mockPrisma.task.create).toHaveBeenCalled();
    });

    it('должен выбросить ошибку если категория не найдена', async () => {
      const userId = 'user-id';
      const taskData = {
        marketplace: 'WB' as Marketplace,
        categoryId: 'nonexistent-category',
        title: 'Test Task',
        description: 'Test task description',
      };

      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(createTask(userId, taskData)).rejects.toThrow('Категория не найдена');
    });

    it('должен выбросить ошибку если теги не найдены', async () => {
      const userId = 'user-id';
      const taskData = {
        marketplace: 'WB' as Marketplace,
        categoryId: 'category-id',
        title: 'Test Task',
        description: 'Test task description',
        tagIds: ['tag1', 'tag2'],
      };

      const category = createTestCategory({ id: taskData.categoryId });
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(category);
      (mockPrisma.tag.findMany as jest.Mock).mockResolvedValue([]);

      await expect(createTask(userId, taskData)).rejects.toThrow(
        'Один или несколько тегов не найдены'
      );
    });
  });

  describe('getTasks', () => {
    it('должен вернуть список задач с пагинацией', async () => {
      const filters = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      const task = createTestTask();
      (mockPrisma.task.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.task.findMany as jest.Mock).mockResolvedValue([
        {
          ...task,
          user: createTestUser(),
          category: createTestCategory(),
          tags: [],
          _count: { responses: 0 },
        },
      ]);

      const result = await getTasks(filters);

      expect(result.tasks).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('должен фильтровать задачи по категории', async () => {
      const filters = {
        categoryId: 'category-id',
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      (mockPrisma.task.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.task.findMany as jest.Mock).mockResolvedValue([]);

      await getTasks(filters);

      const whereClause = (mockPrisma.task.findMany as jest.Mock).mock.calls[0][0].where;
      expect(whereClause.categoryId).toBe('category-id');
    });
  });

  describe('getTaskById', () => {
    it('должен вернуть задачу по ID', async () => {
      const taskId = 'task-id';
      const task = createTestTask({ id: taskId });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue({
        ...task,
        user: createTestUser(),
        category: createTestCategory(),
        tags: [],
        _count: { responses: 0 },
      });

      const result = await getTaskById(taskId);

      expect(result?.id).toBe(taskId);
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
        include: expect.any(Object),
      });
    });

    it('должен вернуть null если задача не найдена', async () => {
      const taskId = 'nonexistent-id';

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getTaskById(taskId);

      expect(result).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('должен успешно обновить задачу', async () => {
      const taskId = 'task-id';
      const userId = 'user-id';
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const existingTask = createTestTask({ id: taskId, userId });
      const updatedTask = { ...existingTask, ...updateData };

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(existingTask);
      (mockPrisma.task.update as jest.Mock).mockResolvedValue({
        ...updatedTask,
        user: createTestUser(),
        category: createTestCategory(),
        tags: [],
        _count: { responses: 0 },
      });

      const result = await updateTask(taskId, userId, updateData);

      expect(result.title).toBe(updateData.title);
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });

    it('должен выбросить ошибку если задача не найдена', async () => {
      const taskId = 'nonexistent-id';
      const userId = 'user-id';

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(updateTask(taskId, userId, {})).rejects.toThrow('Задача не найдена');
    });

    it('должен выбросить ошибку если пользователь не владелец', async () => {
      const taskId = 'task-id';
      const userId = 'user-id';
      const ownerId = 'owner-id';

      const existingTask = createTestTask({ id: taskId, userId: ownerId });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(existingTask);

      await expect(updateTask(taskId, userId, {})).rejects.toThrow(
        'Недостаточно прав для обновления задачи'
      );
    });
  });

  describe('deleteTask', () => {
    it('должен успешно удалить задачу', async () => {
      const taskId = 'task-id';
      const userId = 'user-id';

      const task = createTestTask({ id: taskId, userId });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);
      (mockPrisma.task.delete as jest.Mock).mockResolvedValue(task);

      await deleteTask(taskId, userId);

      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });

    it('должен выбросить ошибку если пользователь не владелец', async () => {
      const taskId = 'task-id';
      const userId = 'user-id';
      const ownerId = 'owner-id';

      const task = createTestTask({ id: taskId, userId: ownerId });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      await expect(deleteTask(taskId, userId)).rejects.toThrow(
        'Недостаточно прав для удаления задачи'
      );
    });
  });

  describe('closeTask', () => {
    it('должен успешно закрыть задачу', async () => {
      const taskId = 'task-id';
      const userId = 'user-id';

      const task = createTestTask({ id: taskId, userId, status: TaskStatus.OPEN });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);
      (mockPrisma.task.update as jest.Mock).mockResolvedValue({
        ...task,
        status: TaskStatus.CLOSED,
        user: createTestUser(),
        category: createTestCategory(),
        tags: [],
        _count: { responses: 0 },
      });

      const result = await closeTask(taskId, userId);

      expect(result.status).toBe(TaskStatus.CLOSED);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { status: TaskStatus.CLOSED },
        include: expect.any(Object),
      });
    });

    it('должен выбросить ошибку если задача уже закрыта', async () => {
      const taskId = 'task-id';
      const userId = 'user-id';

      const task = createTestTask({
        id: taskId,
        userId,
        status: TaskStatus.CLOSED,
      });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      await expect(closeTask(taskId, userId)).rejects.toThrow('Задача уже закрыта');
    });
  });

  describe('getTaskResponses', () => {
    it('должен вернуть отклики на задачу для владельца', async () => {
      const taskId = 'task-id';
      const userId = 'user-id';

      const task = createTestTask({ id: taskId, userId });
      const response = {
        id: 'response-id',
        taskId,
        userId: 'performer-id',
        message: 'Test response',
        price: 5000,
        deadline: '2024-12-31',
        createdAt: new Date(),
        user: createTestUser({ id: 'performer-id' }),
      };

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);
      (mockPrisma.response.findMany as jest.Mock).mockResolvedValue([response]);

      const result = await getTaskResponses(taskId, userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('response-id');
    });

    it('должен выбросить ошибку если пользователь не владелец', async () => {
      const taskId = 'task-id';
      const userId = 'user-id';
      const ownerId = 'owner-id';

      const task = createTestTask({ id: taskId, userId: ownerId });

      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(task);

      await expect(getTaskResponses(taskId, userId)).rejects.toThrow(
        'Недостаточно прав для просмотра откликов'
      );
    });
  });
});
