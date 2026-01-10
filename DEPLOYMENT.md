# Руководство по развертыванию в продакшене

Это руководство описывает процесс развертывания приложения Markethire в продакшене.

## 📋 Предварительные требования

- Node.js 18+ установлен на сервере
- PostgreSQL 12+ база данных
- Домен с настроенным SSL сертификатом (для HTTPS)
- Доступ к серверу через SSH

## 🔐 Настройка переменных окружения

1. Скопируйте `.env.example` в `.env.production`:

```bash
cp .env.example .env.production
```

2. Заполните все обязательные переменные:

```env
# База данных
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT секреты (ОБЯЗАТЕЛЬНО измените на случайные значения!)
# Генерация: openssl rand -base64 32
JWT_SECRET="your-production-secret-key-minimum-32-characters"
JWT_REFRESH_SECRET="your-production-refresh-secret-key-minimum-32-characters"

# Окружение
NODE_ENV="production"

# CORS (укажите ваш домен)
CORS_ORIGIN="https://yourdomain.com"

# Логирование
LOG_LEVEL="info"

# Максимальный размер запроса
MAX_REQUEST_SIZE="1mb"
```

⚠️ **ВАЖНО**: Никогда не коммитьте файл `.env.production` в репозиторий!

## 🗄️ Настройка базы данных

### 1. Создание базы данных

```sql
CREATE DATABASE markethire_production;
CREATE USER markethire_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE markethire_production TO markethire_user;
```

### 2. Применение миграций

```bash
# Установите переменную окружения
export DATABASE_URL="postgresql://markethire_user:secure_password@localhost:5432/markethire_production"

# Примените миграции
npm run db:migrate

# Сгенерируйте Prisma Client
npm run db:generate

# Заполните начальными данными (категории и теги)
npm run db:seed
```

### 3. Настройка бэкапов

Рекомендуется настроить автоматические бэкапы базы данных:

```bash
# Пример cron задачи для ежедневного бэкапа в 2:00
0 2 * * * pg_dump -U markethire_user markethire_production > /backups/markethire_$(date +\%Y\%m\%d).sql
```

## 🚀 Развертывание приложения

### Вариант 1: Использование PM2 (рекомендуется)

1. Установите PM2:

```bash
npm install -g pm2
```

2. Соберите приложение:

```bash
npm install
npm run build
```

3. Создайте файл `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'markethire',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 2, // Количество инстансов (рекомендуется: количество CPU ядер)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
  }]
};
```

4. Запустите приложение:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Вариант 2: Использование systemd

1. Создайте файл `/etc/systemd/system/markethire.service`:

```ini
[Unit]
Description=Markethire Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/markethire
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/markethire/.env.production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. Запустите сервис:

```bash
sudo systemctl daemon-reload
sudo systemctl enable markethire
sudo systemctl start markethire
```

## 🌐 Настройка Nginx (реверс-прокси)

Создайте конфигурацию Nginx `/etc/nginx/sites-available/markethire`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL сертификаты (используйте Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL настройки безопасности
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Максимальный размер загружаемых файлов
    client_max_body_size 10M;

    # Проксирование на Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Кэширование статических файлов
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60d;
        add_header Cache-Control "public, immutable";
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/markethire /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Настройка SSL (Let's Encrypt)

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot автоматически обновит конфигурацию Nginx и настроит автоматическое обновление сертификатов.

## 📊 Мониторинг

### Health Check

Приложение предоставляет endpoint для проверки здоровья:

```bash
curl https://yourdomain.com/api/health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "responseTime": 5
  },
  "environment": "production"
}
```

### Логирование

Логи приложения находятся в:
- PM2: `~/.pm2/logs/`
- systemd: `journalctl -u markethire -f`

Структурированные логи доступны через Pino logger.

## 🔄 Обновление приложения

1. Получите последние изменения:

```bash
git pull origin main
```

2. Установите зависимости:

```bash
npm install
```

3. Примените миграции (если есть):

```bash
npm run db:migrate
```

4. Пересоберите приложение:

```bash
npm run build
```

5. Перезапустите приложение:

```bash
# PM2
pm2 restart markethire

# systemd
sudo systemctl restart markethire
```

## 🛡️ Безопасность

### Рекомендации:

1. **Firewall**: Настройте firewall для ограничения доступа:

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

2. **Rate Limiting**: Rate limiting уже настроен в приложении, но рекомендуется также настроить на уровне Nginx.

3. **Регулярные обновления**: Регулярно обновляйте зависимости:

```bash
npm audit
npm audit fix
```

4. **Мониторинг**: Настройте мониторинг ошибок (Sentry, LogRocket и т.д.)

5. **Бэкапы**: Настройте автоматические бэкапы базы данных

## 📈 Оптимизация производительности

1. **Кэширование**: Настройте Redis для кэширования (опционально)

2. **CDN**: Используйте CDN для статических файлов

3. **Database indexes**: Убедитесь, что все необходимые индексы созданы (проверьте `prisma/schema.prisma`)

4. **Connection pooling**: Prisma автоматически использует connection pooling

## 🐛 Отладка

### Проверка логов

```bash
# PM2
pm2 logs markethire

# systemd
sudo journalctl -u markethire -f
```

### Проверка подключения к БД

```bash
npm run db:studio
```

### Проверка переменных окружения

```bash
node -e "require('./src/lib/config')"
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи приложения
2. Проверьте health check endpoint
3. Проверьте подключение к базе данных
4. Проверьте переменные окружения
