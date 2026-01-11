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
  // Удаляем в правильном порядке с учетом внешних ключей
  await prisma.response.deleteMany(); // Ссылается на Task
  await prisma.taskTag.deleteMany(); // Ссылается на Task и Tag
  await prisma.task.deleteMany(); // Ссылается на Category
  await prisma.userTag.deleteMany(); // Ссылается на User и Tag
  await prisma.tag.deleteMany(); // Ссылается на Category
  await prisma.category.deleteMany(); // Базовые данные

  // Создание категорий
  console.log("📁 Создание категорий...");
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Аналитика и стратегия",
      },
    }),
    prisma.category.create({
      data: {
        name: "SEO и оптимизация карточек",
      },
    }),
    prisma.category.create({
      data: {
        name: "Контент",
      },
    }),
    prisma.category.create({
      data: {
        name: "Реклама",
      },
    }),
    prisma.category.create({
      data: {
        name: "Логистика и операционный менеджмент",
      },
    }),
    prisma.category.create({
      data: {
        name: "Рейтинг и отзывы",
      },
    }),
    prisma.category.create({
      data: {
        name: "Управление магазином",
      },
    }),
    prisma.category.create({
      data: {
        name: "Другое",
      },
    }),
  ]);

  console.log(`✅ Создано ${categories.length} категорий`);

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
