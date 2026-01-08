import type { NextApiResponse } from "next";
import { AuthenticatedRequest, withAuth } from "../../../src/middleware";
import { getUserProfile, updateUserProfile } from "../../../src/services/user.service";
import { updateProfileSchema } from "../../../src/lib/validation";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Проверка аутентификации
    if (!req.user) {
      return res.status(401).json({ error: "Пользователь не аутентифицирован" });
    }

    if (req.method === "GET") {
      // Получение профиля
      const profile = await getUserProfile(req.user.userId);
      return res.status(200).json(profile);
    }

    if (req.method === "PATCH") {
      // Обновление профиля
      const validatedData = updateProfileSchema.parse(req.body);
      const updatedProfile = await updateUserProfile(
        req.user.userId,
        validatedData
      );
      return res.status(200).json({
        message: "Профиль успешно обновлен",
        user: updatedProfile,
      });
    }

    return res.status(405).json({ error: "Метод не разрешен" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Ошибка валидации",
        details: error.errors,
      });
    }

    if (error.message === "Пользователь не найден") {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === "Пользователь с таким никнеймом уже существует") {
      return res.status(400).json({ error: error.message });
    }

    console.error("Ошибка работы с профилем:", error);
    
    // В режиме разработки возвращаем детали ошибки
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error.message || "Внутренняя ошибка сервера"
      : "Внутренняя ошибка сервера";
    
    const errorDetails = process.env.NODE_ENV === "development" 
      ? { 
          message: error.message,
          stack: error.stack,
          name: error.name 
        }
      : undefined;
    
    return res.status(500).json({ 
      error: errorMessage,
      ...(errorDetails && { details: errorDetails })
    });
  }
}

export default withAuth(handler);
