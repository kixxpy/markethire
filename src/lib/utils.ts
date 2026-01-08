import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Получает отображаемое имя пользователя
 * Если есть username - возвращает его, иначе возвращает часть email до знака @
 */
export function getDisplayName(
  username?: string | null,
  email?: string | null
): string {
  if (username) {
    return username;
  }
  if (email) {
    return email.split('@')[0];
  }
  return 'Пользователь';
}
