import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "./config";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Хеширование пароля
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Проверка пароля
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Генерация access токена (короткоживущий)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: "15m", // 15 минут
  });
}

/**
 * Генерация refresh токена (долгоживущий)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: "7d", // 7 дней
  });
}

/**
 * Генерация пары токенов (access + refresh)
 */
export function generateTokenPair(payload: JWTPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Генерация JWT токена (обратная совместимость)
 * @deprecated Используйте generateAccessToken или generateTokenPair
 */
export function generateToken(payload: JWTPayload): string {
  return generateAccessToken(payload);
}

/**
 * Верификация access токена
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Верификация refresh токена
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Верификация JWT токена (обратная совместимость)
 * @deprecated Используйте verifyAccessToken
 */
export function verifyToken(token: string): JWTPayload | null {
  return verifyAccessToken(token);
}

/**
 * Извлечение токена из заголовка Authorization
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
