import { z } from "zod";

/**
 * Схема валидации для регистрации
 */
export const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  username: z
    .string()
    .min(3, "Никнейм должен содержать минимум 3 символа")
    .regex(/^[a-zA-Z0-9]+$/, "Никнейм может содержать только английские буквы и цифры")
    .refine((val) => !val.includes(" "), "Никнейм не должен содержать пробелов"),
  name: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim().length >= 2) {
        return val.trim();
      }
      return undefined;
    },
    z.string().min(2, "Имя должно содержать минимум 2 символа").optional()
  ),
});

/**
 * Схема валидации для входа
 */
export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен"),
});

/**
 * Схема валидации для обновления профиля
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  username: z
    .string()
    .min(3, "Никнейм должен содержать минимум 3 символа")
    .regex(/^[a-zA-Z0-9]+$/, "Никнейм может содержать только английские буквы и цифры")
    .refine((val) => !val.includes(" "), "Никнейм не должен содержать пробелов")
    .optional(),
  avatarUrl: z.string().url("Некорректный URL аватара").optional().or(z.literal("").transform(() => undefined)),
  description: z.string().optional(),
  priceFrom: z.number().int().positive().optional(),
  telegram: z.string().optional(),
  whatsapp: z.string().optional(),
  emailContact: z.string().email().optional(),
  role: z.enum(["SELLER", "PERFORMER", "BOTH"]).optional(),
});

/**
 * Схема валидации для создания задачи
 */
export const createTaskSchema = z.object({
  marketplace: z.enum(["WB", "OZON"], {
    errorMap: () => ({ message: "Маркетплейс должен быть WB или OZON" }),
  }),
  categoryId: z.string().min(1, "Категория обязательна"),
  title: z.string().min(3, "Заголовок должен содержать минимум 3 символа"),
  description: z.string().min(10, "Описание должно содержать минимум 10 символов"),
  budget: z.number().int().positive().optional(),
  budgetType: z.enum(["FIXED", "NEGOTIABLE"]).default("FIXED"),
  tagIds: z.array(z.string()).optional(),
});

/**
 * Схема валидации для обновления задачи
 */
export const updateTaskSchema = z.object({
  marketplace: z.enum(["WB", "OZON"]).optional(),
  categoryId: z.string().optional(),
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  budget: z.number().int().positive().nullable().optional(),
  budgetType: z.enum(["FIXED", "NEGOTIABLE"]).optional(),
  tagIds: z.array(z.string()).optional(),
});

/**
 * Схема валидации для фильтров задач
 */
export const taskFiltersSchema = z.object({
  categoryId: z.string().optional(),
  tagIds: z.string().optional().transform((val) => 
    val ? val.split(",").filter(Boolean) : undefined
  ),
  marketplace: z.enum(["WB", "OZON"]).optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  budgetMin: z.string().optional().transform((val) => 
    val ? parseInt(val, 10) : undefined
  ),
  budgetMax: z.string().optional().transform((val) => 
    val ? parseInt(val, 10) : undefined
  ),
  sortBy: z.enum(["createdAt", "budget"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.string().optional().transform((val) => 
    val ? parseInt(val, 10) : 1
  ),
  limit: z.string().optional().transform((val) => 
    val ? parseInt(val, 10) : 20
  ),
});

/**
 * Схема валидации для создания отклика
 */
export const createResponseSchema = z.object({
  message: z.string().min(10, "Сообщение должно содержать минимум 10 символов"),
  price: z.number().int().positive("Цена должна быть положительным числом").optional(),
  deadline: z.string().min(1, "Дедлайн обязателен").optional(),
});

/**
 * Схема валидации для обновления отклика
 */
export const updateResponseSchema = z.object({
  message: z.string().min(10).optional(),
  price: z.number().int().positive().nullable().optional(),
  deadline: z.string().min(1).nullable().optional(),
});

/**
 * Схема валидации для добавления тегов к профилю
 */
export const addTagsSchema = z.object({
  tagIds: z.array(z.string().min(1, "ID тега обязателен")).min(1, "Необходимо указать хотя бы один тег"),
});

/**
 * Схема валидации для фильтров исполнителей
 */
export const performerFiltersSchema = z.object({
  tagIds: z.string().optional().transform((val) => 
    val ? val.split(",").filter(Boolean) : undefined
  ),
  categoryIds: z.string().optional().transform((val) => 
    val ? val.split(",").filter(Boolean) : undefined
  ),
  priceFrom: z.string().optional().transform((val) => 
    val ? parseInt(val, 10) : undefined
  ),
  search: z.string().optional(),
  page: z.string().optional().transform((val) => 
    val ? parseInt(val, 10) : 1
  ),
  limit: z.string().optional().transform((val) => 
    val ? parseInt(val, 10) : 20
  ),
});

/**
 * Константы для валидации аватара
 * Экспортируются для использования в сервисах
 */
export const AVATAR_CONSTRAINTS = {
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
export type CreateResponseInput = z.infer<typeof createResponseSchema>;
export type UpdateResponseInput = z.infer<typeof updateResponseSchema>;
export type AddTagsInput = z.infer<typeof addTagsSchema>;
export type PerformerFiltersInput = z.infer<typeof performerFiltersSchema>;