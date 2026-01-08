import { PrismaClient } from '@prisma/client';
import { jest } from '@jest/globals';

/**
 * Создает мок для Prisma Client
 * Используется в unit тестах для изоляции от реальной БД
 */
export function createPrismaMock() {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    response: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    tag: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    userTag: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    taskTag: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaClient;

  return mockPrisma;
}

/**
 * Сбрасывает все моки Prisma
 */
export function resetPrismaMock(mockPrisma: ReturnType<typeof createPrismaMock>) {
  Object.values(mockPrisma).forEach((model) => {
    if (model && typeof model === 'object') {
      Object.values(model).forEach((method) => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  });
}
