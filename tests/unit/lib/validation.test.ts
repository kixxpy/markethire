import { describe, it, expect } from '@jest/globals';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  createTaskSchema,
  updateTaskSchema,
  createResponseSchema,
  updateResponseSchema,
  addTagsSchema,
} from '../../../src/lib/validation';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('должен валидировать корректные данные регистрации', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'BOTH',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен валидировать данные без опциональных полей', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен отклонять некорректный email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять короткий пароль', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345', // Меньше 6 символов
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять короткое имя', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'A', // Меньше 2 символов
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять невалидную роль', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'INVALID_ROLE',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('должен валидировать корректные данные входа', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен отклонять некорректный email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять пустой пароль', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('должен валидировать корректные данные обновления профиля', () => {
      const validData = {
        name: 'New Name',
        description: 'New description',
        priceFrom: 1000,
        telegram: '@username',
        whatsapp: '+79991234567',
        emailContact: 'contact@example.com',
        role: 'SELLER',
      };

      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен валидировать пустой объект (все поля опциональны)', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('должен отклонять некорректный emailContact', () => {
      const invalidData = {
        emailContact: 'not-an-email',
      };

      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять отрицательный priceFrom', () => {
      const invalidData = {
        priceFrom: -100,
      };

      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createTaskSchema', () => {
    it('должен валидировать корректные данные создания задачи', () => {
      const validData = {
        marketplace: 'WB',
        categoryId: 'category-id',
        title: 'Test Task Title',
        description: 'This is a test task description',
        budget: 10000,
        budgetType: 'FIXED',
        tagIds: ['tag1', 'tag2'],
      };

      const result = createTaskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен валидировать данные без опциональных полей', () => {
      const validData = {
        marketplace: 'OZON',
        categoryId: 'category-id',
        title: 'Test Task',
        description: 'Test description with enough characters',
      };

      const result = createTaskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен отклонять невалидный marketplace', () => {
      const invalidData = {
        marketplace: 'INVALID',
        categoryId: 'category-id',
        title: 'Test Task',
        description: 'Test description',
      };

      const result = createTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять короткий заголовок', () => {
      const invalidData = {
        marketplace: 'WB',
        categoryId: 'category-id',
        title: 'AB', // Меньше 3 символов
        description: 'Test description',
      };

      const result = createTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять короткое описание', () => {
      const invalidData = {
        marketplace: 'WB',
        categoryId: 'category-id',
        title: 'Test Task',
        description: 'Short', // Меньше 10 символов
      };

      const result = createTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createResponseSchema', () => {
    it('должен валидировать корректные данные отклика', () => {
      const validData = {
        message: 'This is a test response message',
        price: 5000,
        deadline: '2024-12-31',
      };

      const result = createResponseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен валидировать данные без опциональных полей', () => {
      const validData = {
        message: 'This is a test response message',
      };

      const result = createResponseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен отклонять короткое сообщение', () => {
      const invalidData = {
        message: 'Short', // Меньше 10 символов
      };

      const result = createResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять отрицательную цену', () => {
      const invalidData = {
        message: 'This is a test response message',
        price: -100,
      };

      const result = createResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('addTagsSchema', () => {
    it('должен валидировать корректные данные добавления тегов', () => {
      const validData = {
        tagIds: ['tag1', 'tag2', 'tag3'],
      };

      const result = addTagsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен отклонять пустой массив тегов', () => {
      const invalidData = {
        tagIds: [],
      };

      const result = addTagsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять массив с пустыми строками', () => {
      const invalidData = {
        tagIds: ['tag1', '', 'tag2'],
      };

      const result = addTagsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
