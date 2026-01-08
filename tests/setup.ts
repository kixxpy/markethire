// Глобальная настройка для тестов
import { jest } from '@jest/globals';

// Увеличиваем таймаут для тестов, которые работают с БД
jest.setTimeout(10000);

// Мокируем переменные окружения
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
