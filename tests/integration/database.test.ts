import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../../../src/lib/prisma';
import { hashPassword } from '../../../src/lib/auth';
import {
  registerUser,
  loginUser,
  createTask,
  createResponse,
} from '../../../src/services';
import { UserRole, Marketplace, TaskStatus, BudgetType } from '@prisma/client';

describe('Database Integration Tests', () => {
  let testUserId: string;
  let testCategoryId: string;
  let testTagId: string;
  let testTaskId: string;

  beforeAll(async () => {
    // Создаем тестовую категорию и тег
    const category = await prisma.category.findFirst({
      where: { name: 'Дизайн и графика' },
    });
    
    if (!category) {
      throw new Error('Тестовая категория не найдена. Запустите сидинг базы данных.');
    }
    
    testCategoryId = category.id;
    
    const tag = await prisma.tag.findFirst({
      where: { categoryId: testCategoryId },
    });
    
    if (!tag) {
      throw new Error('Тестовый тег не найден. Запустите сидинг базы данных.');
    }
    
    testTagId = tag.id;
  });

  afterAll(async () => {
    // Очистка тестовых данных
    if (testTaskId) {
      await prisma.task.deleteMany({
        where: { id: testTaskId },
      });
    }
    
    if (testUserId) {
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
    }
  });

  beforeEach(async () => {
    // Очистка перед каждым тестом
    if (testTaskId) {
      await prisma.response.deleteMany({
        where: { taskId: testTaskId },
      });
    }
  });

  describe('User Operations', () => {
    it('должен создать пользователя в базе данных', async () => {
      const userData = {
        email: `test-db-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Test DB User',
        role: UserRole.BOTH,
      };

      const result = await registerUser(userData);

      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBeDefined();

      testUserId = result.user.id;

      // Проверяем, что пользователь действительно в БД
      const userInDb = await prisma.user.findUnique({
        where: { id: result.user.id },
      });

      expect(userInDb).not.toBeNull();
      expect(userInDb?.email).toBe(userData.email);
    });

    it('должен найти пользователя в базе данных при входе', async () => {
      const userData = {
        email: `test-login-${Date.now()}@example.com`,
        password: 'testpassword123',
      };

      // Создаем пользователя напрямую в БД
      const hashedPassword = await hashPassword(userData.password);
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
        },
      });

      // Пытаемся войти
      const result = await loginUser(userData);

      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBeDefined();

      // Очистка
      await prisma.user.delete({
        where: { id: user.id },
      });
    });
  });

  describe('Task Operations', () => {
    it('должен создать задачу в базе данных', async () => {
      // Сначала создаем пользователя
      const userData = {
        email: `test-task-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Task Creator',
      };

      const userResult = await registerUser(userData);
      testUserId = userResult.user.id;

      // Создаем задачу
      const taskData = {
        marketplace: Marketplace.WB,
        categoryId: testCategoryId,
        title: 'Test Task from DB Test',
        description: 'This is a test task created during database integration test',
        budget: 10000,
        budgetType: BudgetType.FIXED,
        tagIds: [testTagId],
      };

      const task = await createTask(testUserId, taskData);

      expect(task.id).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.userId).toBe(testUserId);
      expect(task.categoryId).toBe(testCategoryId);

      testTaskId = task.id;

      // Проверяем, что задача действительно в БД
      const taskInDb = await prisma.task.findUnique({
        where: { id: task.id },
        include: {
          tags: true,
        },
      });

      expect(taskInDb).not.toBeNull();
      expect(taskInDb?.title).toBe(taskData.title);
      expect(taskInDb?.tags.length).toBeGreaterThan(0);
    });

    it('должен обновить задачу в базе данных', async () => {
      if (!testTaskId) {
        // Создаем задачу если её нет
        const userData = {
          email: `test-update-${Date.now()}@example.com`,
          password: 'testpassword123',
        };
        const userResult = await registerUser(userData);
        testUserId = userResult.user.id;

        const taskData = {
          marketplace: Marketplace.WB,
          categoryId: testCategoryId,
          title: 'Original Title',
          description: 'Original description for update test',
        };
        const task = await createTask(testUserId, taskData);
        testTaskId = task.id;
      }

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const { updateTask } = await import('../../../src/services/task.service');
      const updatedTask = await updateTask(testTaskId, testUserId, updateData);

      expect(updatedTask.title).toBe(updateData.title);
      expect(updatedTask.description).toBe(updateData.description);

      // Проверяем в БД
      const taskInDb = await prisma.task.findUnique({
        where: { id: testTaskId },
      });

      expect(taskInDb?.title).toBe(updateData.title);
    });
  });

  describe('Response Operations', () => {
    it('должен создать отклик в базе данных', async () => {
      // Создаем задачу и двух пользователей
      const sellerData = {
        email: `test-seller-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Seller',
      };
      const sellerResult = await registerUser(sellerData);

      const performerData = {
        email: `test-performer-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Performer',
      };
      const performerResult = await registerUser(performerData);

      // Создаем задачу от имени селлера
      const taskData = {
        marketplace: Marketplace.WB,
        categoryId: testCategoryId,
        title: 'Task for Response Test',
        description: 'This task is for testing response creation',
      };
      const task = await createTask(sellerResult.user.id, taskData);

      // Создаем отклик от имени исполнителя
      const responseData = {
        message: 'I can help with this task. I have experience in this area.',
        price: 5000,
        deadline: '2024-12-31',
      };

      const response = await createResponse(task.id, performerResult.user.id, responseData);

      expect(response.id).toBeDefined();
      expect(response.message).toBe(responseData.message);
      expect(response.taskId).toBe(task.id);
      expect(response.userId).toBe(performerResult.user.id);

      // Проверяем в БД
      const responseInDb = await prisma.response.findUnique({
        where: { id: response.id },
      });

      expect(responseInDb).not.toBeNull();
      expect(responseInDb?.message).toBe(responseData.message);

      // Очистка
      await prisma.response.delete({ where: { id: response.id } });
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.user.delete({ where: { id: sellerResult.user.id } });
      await prisma.user.delete({ where: { id: performerResult.user.id } });
    });
  });

  describe('Relations and Constraints', () => {
    it('должен поддерживать связь пользователь-задача', async () => {
      const userData = {
        email: `test-relation-${Date.now()}@example.com`,
        password: 'testpassword123',
      };
      const userResult = await registerUser(userData);

      const taskData = {
        marketplace: Marketplace.WB,
        categoryId: testCategoryId,
        title: 'Relation Test Task',
        description: 'Testing user-task relation',
      };
      const task = await createTask(userResult.user.id, taskData);

      // Проверяем связь через Prisma
      const userWithTasks = await prisma.user.findUnique({
        where: { id: userResult.user.id },
        include: { tasks: true },
      });

      expect(userWithTasks?.tasks.length).toBeGreaterThan(0);
      expect(userWithTasks?.tasks[0].id).toBe(task.id);

      // Очистка
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.user.delete({ where: { id: userResult.user.id } });
    });
  });
});
