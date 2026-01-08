import type { NextApiRequest, NextApiResponse } from "next";
import { loginUser } from "../../../src/services/user.service";
import { loginSchema } from "../../../src/lib/validation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    // Валидация данных
    const validatedData = loginSchema.parse(req.body);

    // Вход пользователя
    const result = await loginUser(validatedData);

    return res.status(200).json({
      message: "Успешный вход",
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Ошибка валидации",
        details: error.errors,
      });
    }

    if (
      error.message === "Неверный email или пароль" ||
      error.message === "Пользователь не найден"
    ) {
      return res.status(401).json({ error: error.message });
    }

    console.error("Ошибка входа:", error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
}
