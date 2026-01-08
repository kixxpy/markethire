import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractTokenFromHeader,
} from '../../../src/lib/auth';
import { config } from '../../../src/lib/config';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('должен хешировать пароль', async () => {
      const password = 'testpassword123';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('должен создавать разные хеши для одного пароля', async () => {
      const password = 'testpassword123';
      const hashed1 = await hashPassword(password);
      const hashed2 = await hashPassword(password);

      // Хеши должны быть разными из-за соли
      expect(hashed1).not.toBe(hashed2);
    });
  });

  describe('verifyPassword', () => {
    it('должен корректно проверять правильный пароль', async () => {
      const password = 'testpassword123';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('должен отклонять неправильный пароль', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('должен генерировать JWT токен', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'BOTH',
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT имеет 3 части
    });

    it('должен генерировать разные токены для разных payload', () => {
      const payload1 = {
        userId: 'user1',
        email: 'user1@example.com',
        role: 'SELLER',
      };

      const payload2 = {
        userId: 'user2',
        email: 'user2@example.com',
        role: 'PERFORMER',
      };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('должен корректно верифицировать валидный токен', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'BOTH',
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
    });

    it('должен возвращать null для невалидного токена', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('должен возвращать null для пустой строки', () => {
      const decoded = verifyToken('');

      expect(decoded).toBeNull();
    });

    it('должен возвращать null для токена с неправильным секретом', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'BOTH',
      };

      const token = generateToken(payload);
      
      // Меняем секрет
      const originalSecret = config.jwtSecret;
      config.jwtSecret = 'different-secret';
      
      const decoded = verifyToken(token);
      expect(decoded).toBeNull();
      
      // Восстанавливаем секрет
      config.jwtSecret = originalSecret;
    });
  });

  describe('extractTokenFromHeader', () => {
    it('должен извлекать токен из заголовка Authorization', () => {
      const token = 'test-token-123';
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('должен возвращать null для заголовка без Bearer', () => {
      const header = 'test-token-123';

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBeNull();
    });

    it('должен возвращать null для undefined', () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });

    it('должен возвращать null для пустой строки', () => {
      const extracted = extractTokenFromHeader('');

      expect(extracted).toBeNull();
    });

    it('должен корректно извлекать токен с пробелами', () => {
      const token = 'test-token-123';
      const header = `Bearer  ${token}`; // Два пробела

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(` ${token}`); // Один пробел остается
    });
  });
});
