import type { NextApiRequest, NextApiResponse } from "next";
import { registerUser } from "../../../src/services/user.service";
import { registerSchema } from "../../../src/lib/validation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    // Валидация данных
    const validatedData = registerSchema.parse(req.body);

    // Регистрация пользователя
    const result = await registerUser(validatedData);

    return res.status(201).json({
      message: "Пользователь успешно зарегистрирован",
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

    if (error.message === "Пользователь с таким email уже существует") {
      return res.status(409).json({ error: error.message });
    }

    if (error.message === "Пользователь с таким никнеймом уже существует") {
      return res.status(409).json({ error: error.message });
    }

    console.error("Ошибка регистрации:", error);
    console.error("Стек ошибки:", error.stack);
    return res.status(500).json({ 
      error: "Внутренняя ошибка сервера",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
