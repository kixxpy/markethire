import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Начало очистки базы данных...");

  try {
    // Получаем количество записей перед удалением
    const usersCount = await prisma.user.count();
    const tasksCount = await prisma.task.count();
    const responsesCount = await prisma.response.count();
    const notificationsCount = await prisma.notification.count();
    const userTagsCount = await prisma.userTag.count();
    const taskTagsCount = await prisma.taskTag.count();

    console.log(`📊 Текущее состояние базы данных:`);
    console.log(`   - Пользователей: ${usersCount}`);
    console.log(`   - Задач: ${tasksCount}`);
    console.log(`   - Откликов: ${responsesCount}`);
    console.log(`   - Уведомлений: ${notificationsCount}`);
    console.log(`   - Связей пользователей с тегами: ${userTagsCount}`);
    console.log(`   - Связей задач с тегами: ${taskTagsCount}`);

    if (usersCount === 0) {
      console.log("✅ База данных уже пуста. Нечего удалять.");
      return;
    }

    console.log("\n🗑️  Начало удаления данных...");

    // 1. Удаляем уведомления (Notification)
    console.log("1️⃣  Удаление уведомлений...");
    const deletedNotifications = await prisma.notification.deleteMany();
    console.log(`   ✅ Удалено уведомлений: ${deletedNotifications.count}`);

    // 2. Удаляем связи пользователей с тегами
    console.log("2️⃣  Удаление связей пользователей с тегами...");
    const deletedUserTags = await prisma.userTag.deleteMany();
    console.log(`   ✅ Удалено связей пользователей с тегами: ${deletedUserTags.count}`);

    // 3. Удаляем все отклики (Response)
    console.log("3️⃣  Удаление откликов на задачи...");
    const deletedResponses = await prisma.response.deleteMany();
    console.log(`   ✅ Удалено откликов: ${deletedResponses.count}`);

    // 4. Удаляем связи задач с тегами
    console.log("4️⃣  Удаление связей задач с тегами...");
    const deletedTaskTags = await prisma.taskTag.deleteMany();
    console.log(`   ✅ Удалено связей задач с тегами: ${deletedTaskTags.count}`);

    // 5. Удаляем все задачи (Task)
    console.log("5️⃣  Удаление задач (заказов)...");
    const deletedTasks = await prisma.task.deleteMany();
    console.log(`   ✅ Удалено задач: ${deletedTasks.count}`);

    // 6. Удаляем всех пользователей (User)
    console.log("6️⃣  Удаление пользователей...");
    const deletedUsers = await prisma.user.deleteMany();
    console.log(`   ✅ Удалено пользователей: ${deletedUsers.count}`);

    console.log("\n✅ Очистка базы данных завершена успешно!");
    console.log("\n📊 Итоговая статистика:");
    console.log(`   - Удалено пользователей: ${deletedUsers.count}`);
    console.log(`   - Удалено задач: ${deletedTasks.count}`);
    console.log(`   - Удалено откликов: ${deletedResponses.count}`);
    console.log(`   - Удалено уведомлений: ${deletedNotifications.count}`);
    console.log(`   - Удалено связей пользователей с тегами: ${deletedUserTags.count}`);
    console.log(`   - Удалено связей задач с тегами: ${deletedTaskTags.count}`);

    // Проверяем, что всё удалено
    const remainingUsers = await prisma.user.count();
    const remainingTasks = await prisma.task.count();
    const remainingResponses = await prisma.response.count();
    const remainingNotifications = await prisma.notification.count();

    if (remainingUsers === 0 && remainingTasks === 0 && remainingResponses === 0 && remainingNotifications === 0) {
      console.log("\n✨ База данных полностью очищена от пользователей и заказов!");
    } else {
      console.log("\n⚠️  Внимание: остались некоторые данные:");
      if (remainingUsers > 0) console.log(`   - Пользователей: ${remainingUsers}`);
      if (remainingTasks > 0) console.log(`   - Задач: ${remainingTasks}`);
      if (remainingResponses > 0) console.log(`   - Откликов: ${remainingResponses}`);
      if (remainingNotifications > 0) console.log(`   - Уведомлений: ${remainingNotifications}`);
    }

    // Категории и теги остаются (справочные данные)
    const categoriesCount = await prisma.category.count();
    const tagsCount = await prisma.tag.count();
    console.log(`\n📚 Справочные данные сохранены:`);
    console.log(`   - Категорий: ${categoriesCount}`);
    console.log(`   - Тегов: ${tagsCount}`);
  } catch (error) {
    console.error("❌ Ошибка при очистке базы данных:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
