import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Начало сидинга базы данных...");

  // Создание администратора
  console.log("👤 Создание администратора...");
  const adminEmail = "ekn62@bk.ru";
  const adminPassword = "Apap19091992";
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: "admin",
        password: hashedPassword,
        name: "Администратор",
        role: "ADMIN",
      },
    });
    console.log("✅ Администратор создан");
  } else {
    console.log("ℹ️  Администратор уже существует");
  }

  // Очистка существующих данных (опционально, для перезапуска)
  console.log("🧹 Очистка существующих данных...");
  await prisma.userTag.deleteMany();
  await prisma.taskTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();

  // Создание категорий
  console.log("📁 Создание категорий...");
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Дизайн и графика",
      },
    }),
    prisma.category.create({
      data: {
        name: "Копирайтинг и тексты",
      },
    }),
    prisma.category.create({
      data: {
        name: "Фото и видео",
      },
    }),
    prisma.category.create({
      data: {
        name: "SEO и продвижение",
      },
    }),
    prisma.category.create({
      data: {
        name: "Техническая поддержка",
      },
    }),
    prisma.category.create({
      data: {
        name: "Администрирование",
      },
    }),
    prisma.category.create({
      data: {
        name: "Другое",
      },
    }),
  ]);

  console.log(`✅ Создано ${categories.length} категорий`);

  // Создание тегов для каждой категории
  console.log("🏷️  Создание тегов...");

  // Дизайн и графика
  await prisma.tag.createMany({
    data: [
      { name: "Логотипы", categoryId: categories[0].id },
      { name: "Баннеры", categoryId: categories[0].id },
      { name: "Упаковка", categoryId: categories[0].id },
      { name: "Инфографика", categoryId: categories[0].id },
    ],
  });

  // Копирайтинг и тексты
  await prisma.tag.createMany({
    data: [
      { name: "Описания товаров", categoryId: categories[1].id },
      { name: "Статьи", categoryId: categories[1].id },
      { name: "SMM-тексты", categoryId: categories[1].id },
    ],
  });

  // Фото и видео
  await prisma.tag.createMany({
    data: [
      { name: "Фото товаров", categoryId: categories[2].id },
      { name: "Видеообзоры", categoryId: categories[2].id },
      { name: "Реклама", categoryId: categories[2].id },
    ],
  });

  // SEO и продвижение
  await prisma.tag.createMany({
    data: [
      { name: "Оптимизация карточек", categoryId: categories[3].id },
      { name: "Сбор ключевых слов", categoryId: categories[3].id },
    ],
  });

  // Техническая поддержка
  await prisma.tag.createMany({
    data: [
      { name: "Настройка кабинета", categoryId: categories[4].id },
      { name: "Обработка отзывов", categoryId: categories[4].id },
    ],
  });

  // Администрирование
  await prisma.tag.createMany({
    data: [
      { name: "Управление складом", categoryId: categories[5].id },
      { name: "Аналитика", categoryId: categories[5].id },
    ],
  });

  const tagsCount = await prisma.tag.count();
  console.log(`✅ Создано ${tagsCount} тегов`);

  console.log("✨ Сидинг завершен успешно!");
}

main()
  .catch((e) => {
    console.error("❌ Ошибка при сидинге:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
