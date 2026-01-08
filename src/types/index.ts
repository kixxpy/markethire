// Общие типы для проекта
export type {
  User,
  Task,
  Response,
  Category,
  Tag,
  UserRole,
  Marketplace,
  BudgetType,
  TaskStatus,
  TaskModerationStatus,
} from "@prisma/client";

// Типы для аутентификации
export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  description: string | null;
  priceFrom: number | null;
  telegram: string | null;
  whatsapp: string | null;
  emailContact: string | null;
  createdAt: Date;
}
