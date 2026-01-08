import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserProfileById,
  getUserTags,
  addTagsToUser,
  removeTagFromUser,
  getPerformers,
} from '../../../src/services/user.service';
import { createPrismaMock, resetPrismaMock } from '../../helpers/prisma-mock';
import { createTestUser, createTestCategory, createTestTag } from '../../helpers/test-helpers';
import * as authLib from '../../../src/lib/auth';

// Мокируем модуль auth
jest.mock('../../../src/lib/auth');
// Мокируем модуль prisma
jest.mock('../../../src/lib/prisma');

describe('User Service', () => {
  let mockPrisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    mockPrisma = createPrismaMock();
    // Заменяем prisma в модуле
    const prismaModule = require('../../../src/lib/prisma');
    Object.assign(prismaModule.prisma, mockPrisma);
    
    resetPrismaMock(mockPrisma);
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('должен успешно зарегистрировать нового пользователя', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'BOTH' as const,
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (authLib.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: registerData.email,
        name: registerData.name,
        role: registerData.role,
      });
      (authLib.generateToken as jest.Mock).mockReturnValue('test-token');

      const result = await registerUser(registerData);

      expect(result.user.email).toBe(registerData.email);
      expect(result.token).toBe('test-token');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(authLib.hashPassword).toHaveBeenCalledWith(registerData.password);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('должен выбросить ошибку если пользователь уже существует', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user-id',
        email: registerData.email,
      });

      await expect(registerUser(registerData)).rejects.toThrow(
        'Пользователь с таким email уже существует'
      );
    });
  });

  describe('loginUser', () => {
    it('должен успешно войти с правильными данными', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123',
      };

      const user = createTestUser({
        email: loginData.email,
        password: 'hashed-password',
      });

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (authLib.verifyPassword as jest.Mock).mockResolvedValue(true);
      (authLib.generateToken as jest.Mock).mockReturnValue('test-token');

      const result = await loginUser(loginData);

      expect(result.user.email).toBe(loginData.email);
      expect(result.token).toBe('test-token');
      expect(authLib.verifyPassword).toHaveBeenCalledWith(
        loginData.password,
        user.password
      );
    });

    it('должен выбросить ошибку при неверном пароле', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'wrong-password',
      };

      const user = createTestUser({
        email: loginData.email,
        password: 'hashed-password',
      });

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (authLib.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(loginUser(loginData)).rejects.toThrow(
        'Неверный email или пароль'
      );
    });

    it('должен выбросить ошибку если пользователь не найден', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(loginUser(loginData)).rejects.toThrow(
        'Неверный email или пароль'
      );
    });
  });

  describe('getUserProfile', () => {
    it('должен вернуть профиль пользователя', async () => {
      const userId = 'user-id';
      const user = createTestUser({ id: userId });

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await getUserProfile(userId);

      expect(result.id).toBe(userId);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
    });

    it('должен выбросить ошибку если пользователь не найден', async () => {
      const userId = 'nonexistent-id';

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getUserProfile(userId)).rejects.toThrow('Пользователь не найден');
    });
  });

  describe('updateUserProfile', () => {
    it('должен успешно обновить профиль пользователя', async () => {
      const userId = 'user-id';
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        priceFrom: 2000,
      };

      const updatedUser = createTestUser({
        id: userId,
        ...updateData,
      });

      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await updateUserProfile(userId, updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: expect.any(Object),
      });
    });
  });

  describe('getUserTags', () => {
    it('должен вернуть теги пользователя', async () => {
      const userId = 'user-id';
      const category = createTestCategory();
      const tag = createTestTag({ categoryId: category.id });

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
      });
      (mockPrisma.userTag.findMany as jest.Mock).mockResolvedValue([
        {
          tag: {
            id: tag.id,
            name: tag.name,
            category: category,
          },
        },
      ]);

      const result = await getUserTags(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(tag.id);
      expect(result[0].category.id).toBe(category.id);
    });

    it('должен выбросить ошибку если пользователь не найден', async () => {
      const userId = 'nonexistent-id';

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(getUserTags(userId)).rejects.toThrow('Пользователь не найден');
    });
  });

  describe('addTagsToUser', () => {
    it('должен успешно добавить теги к пользователю', async () => {
      const userId = 'user-id';
      const tagIds = ['tag1', 'tag2'];

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
      });
      (mockPrisma.tag.findMany as jest.Mock).mockResolvedValue([
        { id: 'tag1' },
        { id: 'tag2' },
      ]);
      (mockPrisma.userTag.createMany as jest.Mock).mockResolvedValue({});
      (mockPrisma.userTag.findMany as jest.Mock).mockResolvedValue([]);

      await addTagsToUser(userId, tagIds);

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        where: { id: { in: tagIds } },
      });
      expect(mockPrisma.userTag.createMany).toHaveBeenCalled();
    });

    it('должен выбросить ошибку если теги не найдены', async () => {
      const userId = 'user-id';
      const tagIds = ['tag1', 'tag2'];

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
      });
      (mockPrisma.tag.findMany as jest.Mock).mockResolvedValue([{ id: 'tag1' }]);

      await expect(addTagsToUser(userId, tagIds)).rejects.toThrow(
        'Один или несколько тегов не найдены'
      );
    });
  });

  describe('removeTagFromUser', () => {
    it('должен успешно удалить тег из профиля пользователя', async () => {
      const userId = 'user-id';
      const tagId = 'tag-id';

      (mockPrisma.userTag.findUnique as jest.Mock).mockResolvedValue({
        userId,
        tagId,
      });
      (mockPrisma.userTag.delete as jest.Mock).mockResolvedValue({});

      const result = await removeTagFromUser(userId, tagId);

      expect(result.message).toBe('Тег успешно удален из профиля');
      expect(mockPrisma.userTag.delete).toHaveBeenCalled();
    });

    it('должен выбросить ошибку если тег не найден в профиле', async () => {
      const userId = 'user-id';
      const tagId = 'tag-id';

      (mockPrisma.userTag.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(removeTagFromUser(userId, tagId)).rejects.toThrow(
        'Тег не найден в профиле пользователя'
      );
    });
  });

  describe('getPerformers', () => {
    it('должен вернуть список исполнителей с пагинацией', async () => {
      const filters = {
        page: 1,
        limit: 20,
      };

      const performers = [createTestUser({ role: 'PERFORMER' as any })];
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(performers);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await getPerformers(filters);

      expect(result.performers).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it('должен фильтровать исполнителей по тегам', async () => {
      const filters = {
        tagIds: ['tag1', 'tag2'],
        page: 1,
        limit: 20,
      };

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(0);

      await getPerformers(filters);

      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      const whereClause = (mockPrisma.user.findMany as jest.Mock).mock.calls[0][0].where;
      expect(whereClause.AND).toBeDefined();
    });
  });
});
