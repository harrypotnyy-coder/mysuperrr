#!/bin/bash
# Скрипт для остановки системы в режиме разработки

echo "🛑 Остановка системы мониторинга осужденных..."
echo ""

# Остановка Backend
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "🔧 Остановка Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ Backend остановлен"
    else
        echo "⚠️  Backend уже не запущен"
    fi
    rm .backend.pid
else
    echo "⚠️  Backend PID не найден, останавливаем все java процессы gradlew..."
    pkill -f "gradlew bootRun"
fi

# Остановка Frontend
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "🎨 Остановка Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✅ Frontend остановлен"
    else
        echo "⚠️  Frontend уже не запущен"
    fi
    rm .frontend.pid
else
    echo "⚠️  Frontend PID не найден, останавливаем все vite процессы..."
    pkill -f "vite"
fi

echo ""
echo "✅ Система остановлена"
