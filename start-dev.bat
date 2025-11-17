@echo off
REM Скрипт запуска для Windows

echo ========================================
echo Запуск системы мониторинга осужденных
echo ========================================
echo.

REM Проверка Java
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Java не установлена. Установите Java 17+
    pause
    exit /b 1
)

echo [OK] Java установлена
echo.

REM Проверка Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js не установлен. Установите Node.js 18+
    pause
    exit /b 1
)

echo [OK] Node.js установлен
echo.

REM Запуск Backend
echo ========================================
echo Запуск Backend...
echo ========================================
cd FreshBackend
start "Backend Server" cmd /k "gradlew.bat bootRun"
echo [OK] Backend запускается...
echo     Смотрите окно "Backend Server"
cd ..
echo.

REM Ждем 30 секунд для запуска backend
echo Ожидание запуска Backend (30 секунд)...
timeout /t 30 /nobreak
echo.

REM Запуск Frontend
echo ========================================
echo Запуск Frontend...
echo ========================================
cd svezh

if not exist "node_modules" (
    echo Установка зависимостей npm...
    call npm install
)

start "Frontend Server" cmd /k "npm run dev"
echo [OK] Frontend запускается...
echo     Смотрите окно "Frontend Server"
cd ..
echo.

echo ========================================
echo Система запущена!
echo ========================================
echo.
echo URLs:
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8083
echo.
echo Для остановки закройте окна серверов
echo или запустите stop-dev.bat
echo.
pause
