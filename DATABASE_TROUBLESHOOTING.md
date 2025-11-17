# Решение проблем с базой данных

## Проблема: Backend не запускается из-за ошибки миграции Flyway

### Ошибка:
```
ERROR: column "address" of relation "clients" does not exist
Script V10__Add_Test_Client.sql failed
```

### Причина:
Миграция провалилась и Flyway пометил её как неудачную. Даже после исправления миграции Flyway не будет пытаться запустить её снова.

---

## Решение 1: Flyway Repair (рекомендуется)

### Windows:
```bat
fix-flyway.bat
```

### Linux/macOS:
```bash
./fix-flyway.sh
```

Или вручную:
```bash
cd FreshBackend
./gradlew flywayRepair
```

Это удалит записи о неудачных миграциях из таблицы `flyway_schema_history`.

После этого запустите backend:
```bash
./gradlew bootRun
```

---

## Решение 2: Вручную через SQL

### Подключитесь к PostgreSQL:

**Windows:**
```bat
psql -U postgres
```

**Linux/macOS:**
```bash
psql -U probation_user -d probation_db
```

### Выполните SQL:

```sql
-- Посмотреть неудачные миграции
SELECT * FROM flyway_schema_history WHERE success = false;

-- Удалить неудачные миграции
DELETE FROM flyway_schema_history WHERE success = false;

-- Или удалить конкретную миграцию V10
DELETE FROM flyway_schema_history WHERE version = '10';
```

Выйдите из psql:
```
\q
```

---

## Решение 3: Сброс базы данных (если ничего не помогло)

### ⚠️ ВНИМАНИЕ: Это удалит ВСЕ данные!

### Windows:
```bat
psql -U postgres
```

### Linux/macOS:
```bash
sudo -u postgres psql
```

### SQL команды:
```sql
-- Отключить всех пользователей
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'probation_db' AND pid <> pg_backend_pid();

-- Удалить базу
DROP DATABASE IF EXISTS probation_db;

-- Создать заново
CREATE DATABASE probation_db;
GRANT ALL PRIVILEGES ON DATABASE probation_db TO probation_user;

\q
```

После этого Flyway автоматически применит все миграции при запуске backend.

---

## Решение 4: Пропустить миграцию V10 (временно)

Если вам не нужны тестовые данные, можете пропустить миграцию:

```bash
cd FreshBackend
./gradlew flywayBaseline -Dflyway.baselineVersion=10
```

Это пометит миграцию V10 как выполненную без реального выполнения.

---

## Проверка состояния Flyway

### Проверить статус миграций:
```bash
cd FreshBackend
./gradlew flywayInfo
```

Вывод покажет:
- Какие миграции выполнены успешно (Success)
- Какие провалились (Failed)
- Какие ожидают выполнения (Pending)

### Посмотреть историю в базе:
```sql
SELECT version, description, type, script, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

---

## После исправления

### 1. Запустите backend:
```bash
cd FreshBackend
./gradlew bootRun
```

### 2. Проверьте, что миграция прошла успешно:
Вы должны увидеть в логах:
```
Successfully validated 11 migrations
Current version of schema "public": 10
Schema "public" is up to date. No migration necessary.
```

### 3. Проверьте тестового клиента:
```sql
SELECT * FROM clients WHERE inn = '1234567890123';
```

Должен вернуть одну запись с данными Иванова Ивана Ивановича.

---

## Частые ошибки

### 1. "Database does not exist"
```bash
# Создайте базу данных
sudo -u postgres psql
CREATE DATABASE probation_db;
CREATE USER probation_user WITH PASSWORD 'probation_pass';
GRANT ALL PRIVILEGES ON DATABASE probation_db TO probation_user;
```

### 2. "Connection refused"
```bash
# Проверьте, что PostgreSQL запущен
sudo systemctl status postgresql  # Linux
brew services list               # macOS

# Запустите PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
```

### 3. "Password authentication failed"
Проверьте настройки в `FreshBackend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/probation_db
spring.datasource.username=probation_user
spring.datasource.password=probation_pass
```

### 4. "Port 8083 already in use"
```bash
# Linux/macOS - найти и убить процесс
lsof -ti:8083 | xargs kill -9

# Windows - найти процесс
netstat -ano | findstr :8083
# Убить процесс по PID
taskkill /PID <PID> /F
```

---

## Полезные команды

### PostgreSQL

```bash
# Подключиться к базе
psql -U probation_user -d probation_db

# Список таблиц
\dt

# Описание таблицы
\d clients

# Выйти
\q
```

### Gradle

```bash
# Список всех задач
./gradlew tasks

# Очистить build
./gradlew clean

# Собрать без запуска
./gradlew build

# Запустить с отладкой
./gradlew bootRun --debug-jvm
```

### Flyway задачи

```bash
# Информация о миграциях
./gradlew flywayInfo

# Проверка миграций
./gradlew flywayValidate

# Исправление ошибок
./gradlew flywayRepair

# Очистка базы (УДАЛИТ ВСЕ!)
./gradlew flywayClean

# Применить миграции
./gradlew flywayMigrate
```

---

## Контакты

Если проблема не решается, обратитесь к команде разработки с полным текстом ошибки из логов.
