# Развертывание без Docker

Инструкция по запуску системы мониторинга осужденных без использования Docker.

## Требования

- PostgreSQL 15+
- Java 17+
- Node.js 18+
- Nginx (опционально)

## 1. Настройка базы данных PostgreSQL

### Установка PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Скачайте с https://www.postgresql.org/download/windows/

### Создание базы данных

```bash
# Подключитесь к PostgreSQL
sudo -u postgres psql

# В psql создайте базу и пользователя
CREATE DATABASE probation_db;
CREATE USER probation_user WITH PASSWORD 'probation_pass';
GRANT ALL PRIVILEGES ON DATABASE probation_db TO probation_user;
\q
```

## 2. Backend (Spring Boot)

### Настройка application.properties

Создайте или отредактируйте файл `FreshBackend/src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/probation_db
spring.datasource.username=probation_user
spring.datasource.password=probation_pass

# Server
server.port=8083

# File uploads
spring.servlet.multipart.max-file-size=20MB
spring.servlet.multipart.max-request-size=20MB

# Logging
logging.level.root=INFO
logging.file.name=logs/application.log
```

### Сборка и запуск

```bash
cd FreshBackend

# Linux/macOS
./gradlew build
./gradlew bootRun

# Windows
gradlew.bat build
gradlew.bat bootRun

# Или запуск jar напрямую
./gradlew build
java -jar build/libs/*.jar
```

Backend будет доступен на http://localhost:8083

## 3. Frontend (React + Vite)

### Настройка API endpoint

Отредактируйте `svezh/src/services/api.ts` (если требуется):

```typescript
const api = axios.create({
  baseURL: 'http://localhost:8083/api',
  // ...
});
```

### Установка зависимостей и запуск

```bash
cd svezh

# Установка зависимостей
npm install

# Режим разработки (hot reload)
npm run dev
# Приложение будет доступно на http://localhost:5173

# Или сборка для production
npm run build
# Собранные файлы будут в svezh/dist/
```

## 4. Nginx (опционально, для production)

Если вы хотите использовать nginx как reverse proxy:

### Упрощенная конфигурация для локального развертывания

Создайте файл `/etc/nginx/sites-available/probation` (Linux) или отредактируйте nginx.conf:

```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend
    root /path/to/my-super-project/svezh/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8083/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Linux:**
```bash
# Создайте символическую ссылку
sudo ln -s /etc/nginx/sites-available/probation /etc/nginx/sites-enabled/

# Проверьте конфигурацию
sudo nginx -t

# Перезапустите nginx
sudo systemctl restart nginx
```

**macOS:**
```bash
# Скопируйте конфигурацию
sudo cp probation.conf /usr/local/etc/nginx/servers/

# Перезапустите nginx
brew services restart nginx
```

**Windows:**
Отредактируйте `C:\nginx\conf\nginx.conf` и добавьте server block выше.

## 5. Быстрый старт (режим разработки)

Запустите в отдельных терминалах:

**Терминал 1 - Backend:**
```bash
cd FreshBackend
./gradlew bootRun
```

**Терминал 2 - Frontend:**
```bash
cd svezh
npm run dev
```

Откройте в браузере: http://localhost:5173

## 6. Production развертывание (без nginx)

### Backend:
```bash
cd FreshBackend
./gradlew build
nohup java -jar build/libs/*.jar > backend.log 2>&1 &
```

### Frontend:
```bash
cd svezh
npm install
npm run build
# Раздавайте svezh/dist через любой статический сервер
npx serve -s dist -p 3000
```

## 7. Production развертывание (с nginx)

### 1. Соберите frontend:
```bash
cd svezh
npm install
npm run build
```

### 2. Скопируйте собранные файлы:
```bash
# Linux/macOS
sudo cp -r svezh/dist/* /var/www/probation/
# или
sudo cp -r svezh/dist/* /usr/share/nginx/html/

# Установите права
sudo chown -R www-data:www-data /var/www/probation/
sudo chmod -R 755 /var/www/probation/
```

### 3. Запустите backend:
```bash
cd FreshBackend
./gradlew build
nohup java -jar build/libs/*.jar > backend.log 2>&1 &
```

### 4. Настройте nginx (см. пункт 4)

### 5. Откройте в браузере: http://localhost

## Управление процессами

### Остановка backend:
```bash
# Найдите процесс
ps aux | grep java

# Остановите процесс
kill <PID>
```

### Перезапуск nginx:
```bash
# Linux
sudo systemctl restart nginx

# macOS
brew services restart nginx

# Windows
nginx -s reload
```

## Автозапуск (Linux systemd)

### Backend service

Создайте `/etc/systemd/system/probation-backend.service`:

```ini
[Unit]
Description=Probation Backend Service
After=postgresql.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/FreshBackend
ExecStart=/usr/bin/java -jar /path/to/FreshBackend/build/libs/your-app.jar
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable probation-backend
sudo systemctl start probation-backend
sudo systemctl status probation-backend
```

## Логи

### Backend:
```bash
tail -f FreshBackend/logs/application.log
# или если запущен через nohup
tail -f backend.log
```

### Nginx:
```bash
# Access log
tail -f /var/log/nginx/access.log

# Error log
tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Backend не запускается

1. Проверьте, что PostgreSQL запущен:
```bash
sudo systemctl status postgresql
```

2. Проверьте подключение к БД:
```bash
psql -h localhost -U probation_user -d probation_db
```

3. Проверьте порт 8083:
```bash
netstat -tulpn | grep 8083
```

### Frontend не собирается

1. Очистите node_modules:
```bash
cd svezh
rm -rf node_modules package-lock.json
npm install
```

2. Проверьте версию Node.js:
```bash
node --version  # Должно быть >= 18
```

### Nginx не работает

1. Проверьте синтаксис конфигурации:
```bash
sudo nginx -t
```

2. Проверьте логи:
```bash
sudo tail -f /var/log/nginx/error.log
```

3. Проверьте, что порт 80 свободен:
```bash
sudo netstat -tulpn | grep :80
```

## Переменные окружения (опционально)

Для настройки через переменные окружения:

```bash
# Экспортируйте переменные
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/probation_db
export SPRING_DATASOURCE_USERNAME=probation_user
export SPRING_DATASOURCE_PASSWORD=probation_pass
export SERVER_PORT=8083

# Запустите backend
cd FreshBackend
./gradlew bootRun
```

## Резервное копирование

### База данных:
```bash
# Backup
pg_dump -U probation_user -d probation_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U probation_user -d probation_db < backup_20250101.sql
```

### Файлы:
```bash
# Создайте backup директорию uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /path/to/uploads/
```

## Безопасность

1. **Измените пароли базы данных** в production
2. **Используйте HTTPS** (настройте SSL в nginx)
3. **Настройте firewall**:
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

Теперь система запущена без Docker! 🚀
