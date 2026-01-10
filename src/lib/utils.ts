import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useEffect, useState } from "react"

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

/**
 * Хук для debounce значения
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
