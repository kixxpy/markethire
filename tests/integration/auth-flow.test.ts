import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../../../src/lib/prisma';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} from '../../../src/services';
import { verifyToken } from '../../../src/lib/auth';
import { UserRole } from '@prisma/client';

describe('Authentication Flow Integration Tests', () => {
  let testUserId: string;
  const testUser = {
    email: `test-auth-flow-${Date.now()}@example.com`,
    password: 'testpassword123',
    name: 'Auth Flow Test User',
  };

  beforeAll(async () => {
    // Очистка перед началом
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    // Очистка после завершения
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
  });

  describe('Полный цикл аутентификации', () => {
    it('должен пройти полный цикл: регистрация -> вход -> получение профиля -> обновление профиля', async () => {
      // Шаг 1: Регистрация
      const registerResult = await registerUser({
        ...testUser,
        role: UserRole.BOTH,
      });

      expect(registerResult.user.email).toBe(testUser.email);
      expect(registerResult.token).toBeDefined();
      testUserId = registerResult.user.id;

      // Проверяем токен
      const decodedToken = verifyToken(registerResult.token);
      expect(decodedToken).not.toBeNull();
      expect(decodedToken?.userId).toBe(testUserId);
      expect(decodedToken?.email).toBe(testUser.email);

      // Шаг 2: Вход
      const loginResult = await loginUser({
        email: testUser.email,
        password: testUser.password,
      });

      expect(loginResult.user.id).toBe(testUserId);
      expect(loginResult.token).toBeDefined();

      // Проверяем новый токен
      const decodedLoginToken = verifyToken(loginResult.token);
      expect(decodedLoginToken).not.toBeNull();
      expect(decodedLoginToken?.userId).toBe(testUserId);

      // Шаг 3: Получение профиля
      const profile = await getUserProfile(testUserId);

      expect(profile.id).toBe(testUserId);
      expect(profile.email).toBe(testUser.email);
      expect(profile.name).toBe(testUser.name);

      // Шаг 4: Обновление профиля
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        priceFrom: 2000,
        telegram: '@updated_username',
      };

      const updatedProfile = await updateUserProfile(testUserId, updateData);

      expect(updatedProfile.name).toBe(updateData.name);
      expect(updatedProfile.description).toBe(updateData.description);
      expect(updatedProfile.priceFrom).toBe(updateData.priceFrom);
      expect(updatedProfile.telegram).toBe(updateData.telegram);

      // Проверяем в БД
      const userInDb = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(userInDb?.name).toBe(updateData.name);
      expect(userInDb?.description).toBe(updateData.description);
    });

    it('должен корректно обрабатывать множественные входы одного пользователя', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password,
      };

      // Первый вход
      const login1 = await loginUser(loginData);
      expect(login1.token).toBeDefined();

      // Второй вход (должен получить новый токен)
      const login2 = await loginUser(loginData);
      expect(login2.token).toBeDefined();

      // Токены могут быть разными (так как время создания разное)
      // Но оба должны быть валидными
      const token1Valid = verifyToken(login1.token);
      const token2Valid = verifyToken(login2.token);

      expect(token1Valid).not.toBeNull();
      expect(token2Valid).not.toBeNull();
      expect(token1Valid?.userId).toBe(testUserId);
      expect(token2Valid?.userId).toBe(testUserId);
    });

    it('должен корректно обрабатывать смену роли пользователя', async () => {
      // Обновляем роль на SELLER
      await updateUserProfile(testUserId, {
        role: UserRole.SELLER,
      });

      let profile = await getUserProfile(testUserId);
      expect(profile.role).toBe(UserRole.SELLER);

      // Обновляем роль на PERFORMER
      await updateUserProfile(testUserId, {
        role: UserRole.PERFORMER,
      });

      profile = await getUserProfile(testUserId);
      expect(profile.role).toBe(UserRole.PERFORMER);

      // Возвращаем обратно на BOTH
      await updateUserProfile(testUserId, {
        role: UserRole.BOTH,
      });

      profile = await getUserProfile(testUserId);
      expect(profile.role).toBe(UserRole.BOTH);
    });
  });

  describe('Обработка ошибок аутентификации', () => {
    it('должен выбросить ошибку при попытке входа с неверным паролем', async () => {
      await expect(
        loginUser({
          email: testUser.email,
          password: 'wrong-password',
        })
      ).rejects.toThrow('Неверный email или пароль');
    });

    it('должен выбросить ошибку при попытке входа с несуществующим email', async () => {
      await expect(
        loginUser({
          email: 'nonexistent@example.com',
          password: 'any-password',
        })
      ).rejects.toThrow('Неверный email или пароль');
    });
  });
});
