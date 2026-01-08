import { UserRole, Marketplace, TaskStatus, BudgetType } from '@prisma/client';

/**
 * Создает тестового пользователя
 */
export function createTestUser(overrides: Partial<any> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    role: UserRole.BOTH,
    description: null,
    priceFrom: null,
    telegram: null,
    whatsapp: null,
    emailContact: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Создает тестовую задачу
 */
export function createTestTask(overrides: Partial<any> = {}) {
  return {
    id: 'test-task-id',
    userId: 'test-user-id',
    marketplace: Marketplace.WB,
    categoryId: 'test-category-id',
    title: 'Test Task',
    description: 'Test task description',
    budget: 10000,
    budgetType: BudgetType.FIXED,
    status: TaskStatus.OPEN,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Создает тестовый отклик
 */
export function createTestResponse(overrides: Partial<any> = {}) {
  return {
    id: 'test-response-id',
    taskId: 'test-task-id',
    userId: 'test-user-id',
    message: 'Test response message',
    price: 5000,
    deadline: '2024-12-31',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Создает тестовую категорию
 */
export function createTestCategory(overrides: Partial<any> = {}) {
  return {
    id: 'test-category-id',
    name: 'Test Category',
    ...overrides,
  };
}

/**
 * Создает тестовый тег
 */
export function createTestTag(overrides: Partial<any> = {}) {
  return {
    id: 'test-tag-id',
    name: 'Test Tag',
    categoryId: 'test-category-id',
    ...overrides,
  };
}
