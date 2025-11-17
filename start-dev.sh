#!/bin/bash
# Скрипт для запуска системы в режиме разработки

echo "🚀 Запуск системы мониторинга осужденных..."
echo ""

# Проверка PostgreSQL
echo "📊 Проверка PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не установлен. Установите PostgreSQL 15+"
    exit 1
fi

if ! pg_isready -q; then
    echo "❌ PostgreSQL не запущен. Запустите PostgreSQL:"
    echo "   sudo systemctl start postgresql  # Linux"
    echo "   brew services start postgresql   # macOS"
    exit 1
fi

echo "✅ PostgreSQL запущен"
echo ""

# Проверка Java
echo "☕ Проверка Java..."
if ! command -v java &> /dev/null; then
    echo "❌ Java не установлен. Установите Java 17+"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | sed '/^1\./s///' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "❌ Требуется Java 17+. Текущая версия: $JAVA_VERSION"
    exit 1
fi

echo "✅ Java установлена (версия $JAVA_VERSION)"
echo ""

# Проверка Node.js
echo "📦 Проверка Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js 18+. Текущая версия: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js установлен (версия $(node -v))"
echo ""

# Проверка базы данных
echo "🗄️  Проверка базы данных..."
if psql -U probation_user -d probation_db -c "SELECT 1" &> /dev/null; then
    echo "✅ База данных probation_db найдена"
else
    echo "⚠️  База данных не найдена. Создаём..."
    sudo -u postgres psql << EOF
CREATE DATABASE probation_db;
CREATE USER probation_user WITH PASSWORD 'probation_pass';
GRANT ALL PRIVILEGES ON DATABASE probation_db TO probation_user;
EOF
    echo "✅ База данных создана"
fi
echo ""

# Запуск Backend
echo "🔧 Запуск Backend..."
cd FreshBackend

if [ ! -f "gradlew" ]; then
    echo "❌ gradlew не найден в FreshBackend"
    exit 1
fi

# Запускаем backend в фоне
./gradlew bootRun > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend запущен (PID: $BACKEND_PID)"
echo "   Логи: tail -f backend.log"
echo ""

# Ждем запуска backend
echo "⏳ Ожидание запуска backend (это может занять 30-60 секунд)..."
for i in {1..60}; do
    if curl -s http://localhost:8083/api/health > /dev/null 2>&1; then
        echo "✅ Backend готов!"
        break
    fi
    sleep 1
    echo -n "."
done
echo ""

cd ..

# Запуск Frontend
echo "🎨 Запуск Frontend..."
cd svezh

if [ ! -d "node_modules" ]; then
    echo "📦 Установка npm зависимостей..."
    npm install
fi

# Запускаем frontend в фоне
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend запущен (PID: $FRONTEND_PID)"
echo "   Логи: tail -f frontend.log"
echo ""

cd ..

# Сохраняем PIDs
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo "✨ Система запущена!"
echo ""
echo "📍 URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8083"
echo ""
echo "📋 Управление:"
echo "   Логи backend:  tail -f backend.log"
echo "   Логи frontend: tail -f frontend.log"
echo "   Остановить:    ./stop-dev.sh"
echo ""
echo "Нажмите Ctrl+C для выхода (процессы продолжат работать в фоне)"
