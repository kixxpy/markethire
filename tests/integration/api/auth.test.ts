import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import registerHandler from '../../../pages/api/auth/register';
import loginHandler from '../../../pages/api/auth/login';
import { prisma } from '../../../src/lib/prisma';
import { hashPassword } from '../../../src/lib/auth';

describe('Auth API Integration Tests', () => {
  const testUser = {
    email: 'test-auth@example.com',
    password: 'testpassword123',
    name: 'Test User',
  };

  beforeAll(async () => {
    // Очистка тестовых данных перед началом
    await prisma.user.deleteMany({
      where: {
        email: testUser.email,
      },
    });
  });

  afterAll(async () => {
    // Очистка тестовых данных после завершения
    await prisma.user.deleteMany({
      where: {
        email: testUser.email,
      },
    });
  });

  describe('POST /api/auth/register', () => {
    it('должен успешно зарегистрировать нового пользователя', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: testUser,
      });

      await registerHandler(req as any, res as any);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.user.email).toBe(testUser.email);
      expect(data.token).toBeDefined();
    });

    it('должен вернуть ошибку при попытке регистрации с существующим email', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: testUser,
      });

      await registerHandler(req as any, res as any);

      expect(res._getStatusCode()).toBe(409);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Пользователь с таким email уже существует');
    });

    it('должен вернуть ошибку валидации при некорректных данных', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: '123', // Слишком короткий
        },
      });

      await registerHandler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Ошибка валидации');
    });

    it('должен вернуть ошибку при использовании неподдерживаемого метода', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await registerHandler(req as any, res as any);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  describe('POST /api/auth/login', () => {
    it('должен успешно войти с правильными данными', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      await loginHandler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.user.email).toBe(testUser.email);
      expect(data.token).toBeDefined();
    });

    it('должен вернуть ошибку при неверном пароле', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: testUser.email,
          password: 'wrong-password',
        },
      });

      await loginHandler(req as any, res as any);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Неверный email или пароль');
    });

    it('должен вернуть ошибку при несуществующем пользователе', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      await loginHandler(req as any, res as any);

      expect(res._getStatusCode()).toBe(401);
    });

    it('должен вернуть ошибку валидации при некорректных данных', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: '',
        },
      });

      await loginHandler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Ошибка валидации');
    });
  });
});
