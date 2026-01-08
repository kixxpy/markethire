# Тесты для Markethire

Этот каталог содержит все тесты для проекта.

## Структура

```
tests/
├── unit/                    # Unit тесты
│   ├── lib/                 # Тесты утилит и библиотек
│   │   ├── auth.test.ts     # Тесты аутентификации
│   │   └── validation.test.ts # Тесты валидации
│   └── services/            # Тесты сервисов
│       ├── user.service.test.ts
│       ├── task.service.test.ts
│       └── response.service.test.ts
├── integration/            # Integration тесты
│   ├── api/                # Тесты API эндпоинтов
│   │   └── auth.test.ts
│   ├── database.test.ts    # Тесты работы с БД
│   └── auth-flow.test.ts   # Тесты полного цикла аутентификации
├── helpers/                # Вспомогательные функции
│   ├── prisma-mock.ts      # Моки для Prisma
│   └── test-helpers.ts     # Утилиты для создания тестовых данных
├── setup.ts                # Настройка тестового окружения
└── README.md               # Этот файл
```

## Запуск тестов

### Все тесты
```bash
npm test
```

### Только unit тесты
```bash
npm run test:unit
```

### Только integration тесты
```bash
npm run test:integration
```

### В режиме watch (автоматический перезапуск)
```bash
npm run test:watch
```

### С покрытием кода
```bash
npm run test:coverage
```

## Требования

Для запуска integration тестов необходимо:
1. Настроенная база данных PostgreSQL
2. Переменная окружения `DATABASE_URL` в `.env`
3. Выполненный сидинг базы данных (`npm run db:seed`)

## Unit тесты

Unit тесты изолированы и используют моки для Prisma. Они не требуют реальной базы данных.

### Что тестируется:
- **Утилиты аутентификации**: хеширование паролей, генерация/верификация JWT токенов
- **Валидация**: все Zod схемы для валидации входных данных
- **Сервисы**: бизнес-логика сервисов с мокированной БД

## Integration тесты

Integration тесты работают с реальной базой данных и проверяют взаимодействие компонентов.

### Что тестируется:
- **API эндпоинты**: HTTP запросы к API с проверкой статусов и ответов
- **Работа с БД**: создание, чтение, обновление, удаление данных
- **Аутентификация**: полный цикл регистрации, входа, работы с профилем

### Важно:
- Integration тесты автоматически очищают созданные данные после выполнения
- Используйте отдельную тестовую базу данных для production окружения
- Тесты создают временные данные с уникальными email адресами

## Написание новых тестов

### Unit тест пример:
```typescript
import { describe, it, expect } from '@jest/globals';

describe('MyService', () => {
  it('должен выполнить действие', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration тест пример:
```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../../../src/lib/prisma';

describe('My Integration Test', () => {
  beforeAll(async () => {
    // Подготовка данных
  });

  afterAll(async () => {
    // Очистка данных
  });

  it('должен работать с БД', async () => {
    // Тест
  });
});
```

## Покрытие кода

Покрытие кода генерируется в каталоге `coverage/`. Откройте `coverage/index.html` в браузере для просмотра детального отчета.

Цель: покрытие не менее 80% для критичных компонентов.
