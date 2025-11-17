# Система мониторинга осужденных

Веб-приложение для мониторинга местоположения и контроля осужденных, находящихся под надзором.

## Возможности

- 📍 **Карта в реальном времени** - отображение всех осужденных на карте Бишкека с их фотографиями
- 🔍 **Детальная информация** - при клике на маркер показывается полная информация об осужденном
- 📊 **Админ-панель** - управление осужденными, устройствами и геозонами
- 🎬 **История перемещений** - воспроизведение истории передвижений осужденного
- 🗺️ **Управление геозонами** - создание и редактирование разрешенных зон

## Технологии

- **Frontend**: React, TypeScript, Vite, Leaflet
- **Backend**: Spring Boot, Kotlin, PostgreSQL
- **Maps**: OpenStreetMap, Leaflet
- **Deploy**: Docker или ручной запуск

## Быстрый старт

### Вариант 1: Docker (рекомендуется)

```bash
# Запустить все сервисы
docker-compose up -d --build

# Открыть в браузере
open http://localhost
```

Подробнее: [DEPLOYMENT.md](DEPLOYMENT.md)

### Вариант 2: Без Docker

#### Требования
- PostgreSQL 15+
- Java 17+
- Node.js 18+

#### Автоматический запуск (Linux/macOS)

```bash
# Запуск системы
./start-dev.sh

# Остановка системы
./stop-dev.sh
```

#### Ручной запуск

**1. Создайте базу данных:**
```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE probation_db;
CREATE USER probation_user WITH PASSWORD 'probation_pass';
GRANT ALL PRIVILEGES ON DATABASE probation_db TO probation_user;
```

**2. Запустите Backend:**
```bash
cd FreshBackend
./gradlew bootRun
```

**3. Запустите Frontend:**
```bash
cd svezh
npm install
npm run dev
```

**4. Откройте в браузере:**
```
http://localhost:5173
```

Подробнее: [DEPLOYMENT_NO_DOCKER.md](DEPLOYMENT_NO_DOCKER.md)

## Структура проекта

```
my-super-project/
├── FreshBackend/          # Spring Boot Backend
│   ├── src/
│   │   └── main/
│   │       ├── kotlin/    # Kotlin код
│   │       └── resources/ # Конфигурация, миграции
│   └── build.gradle.kts
├── svezh/                 # React Frontend
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── services/      # API сервисы
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml     # Docker оркестрация
├── nginx.conf            # Nginx конфигурация
├── DEPLOYMENT.md         # Инструкция с Docker
└── DEPLOYMENT_NO_DOCKER.md  # Инструкция без Docker
```

## Основные компоненты

### Frontend

- **RealMap** (`svezh/src/components/map/RealMap.tsx`) - Карта в реальном времени с фотографиями осужденных
- **AdminPanel** - Управление осужденными
- **GeoZoneManager** - Управление геозонами
- **TrackPlayback** - Воспроизведение истории передвижений

### Backend API

- `/api/admin/clients` - Управление осужденными
- `/api/devices` - Управление устройствами
- `/api/geozones` - Управление геозонами
- `/api/positions` - Данные о позиции
- `/api/faces/photos/{photoKey}` - Фотографии осужденных

## Конфигурация

### Backend

Файл: `FreshBackend/src/main/resources/application.properties`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/probation_db
spring.datasource.username=probation_user
spring.datasource.password=probation_pass
server.port=8083
```

### Frontend

Файл: `svezh/src/services/api.ts`

```typescript
const api = axios.create({
  baseURL: 'http://localhost:8083/api',
});
```

## Скриншоты

### Карта с фотографиями осужденных
![Карта](docs/screenshots/map.png)

### Детальная информация
![Popup](docs/screenshots/popup.png)

### История передвижений
![История](docs/screenshots/track-playback.png)

## Production развертывание

### С Docker

```bash
docker-compose up -d --build
```

Система будет доступна на порту 80.

### Без Docker + Nginx

1. Соберите frontend:
```bash
cd svezh
npm run build
```

2. Настройте nginx (см. [DEPLOYMENT_NO_DOCKER.md](DEPLOYMENT_NO_DOCKER.md))

3. Запустите backend:
```bash
cd FreshBackend
./gradlew build
java -jar build/libs/*.jar
```

## Мониторинг

### Логи

**Docker:**
```bash
docker-compose logs -f
```

**Без Docker:**
```bash
# Backend
tail -f FreshBackend/logs/application.log

# Frontend (dev mode)
# Логи в консоли где запущен npm run dev

# Nginx
tail -f /var/log/nginx/error.log
```

### Healthcheck endpoints

- Backend: http://localhost:8083/actuator/health
- Frontend: http://localhost:5173 (dev) или http://localhost (production)

## Резервное копирование

```bash
# База данных
pg_dump -U probation_user probation_db > backup.sql

# Восстановление
psql -U probation_user probation_db < backup.sql
```

## Troubleshooting

### Backend не запускается

1. Проверьте, что PostgreSQL запущен
2. Проверьте логи: `tail -f backend.log`
3. Убедитесь, что порт 8083 свободен

### Frontend не загружается

1. Очистите кэш браузера
2. Проверьте консоль браузера (F12)
3. Убедитесь, что backend доступен

### Карта не отображает маркеры

1. Проверьте, что API `/admin/clients` возвращает данных
2. Проверьте консоль браузера на ошибки
3. Убедитесь, что у осужденных есть координаты

## Разработка

### Запуск в режиме разработки

```bash
# Терминал 1 - Backend
cd FreshBackend
./gradlew bootRun

# Терминал 2 - Frontend
cd svezh
npm run dev
```

### Горячая перезагрузка

- Frontend: автоматически через Vite
- Backend: используйте Spring DevTools

## Лицензия

Проприетарное ПО. Все права защищены.

## Контакты

По вопросам и поддержке обращайтесь к команде разработки.
