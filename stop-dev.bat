@echo off
REM Скрипт остановки для Windows

echo ========================================
echo Остановка системы
echo ========================================
echo.

echo Остановка Backend (Java процессы)...
taskkill /F /FI "WINDOWTITLE eq Backend Server*" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend остановлен
) else (
    echo [!] Backend процесс не найден
)

echo.
echo Остановка Frontend (Node процессы)...
taskkill /F /FI "WINDOWTITLE eq Frontend Server*" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Frontend остановлен
) else (
    echo [!] Frontend процесс не найден
)

echo.
echo ========================================
echo Система остановлена
echo ========================================
pause
