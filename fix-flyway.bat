@echo off
REM Скрипт для исправления ошибок миграции Flyway

echo ========================================
echo Исправление ошибок миграции Flyway
echo ========================================
echo.

cd FreshBackend

echo Запуск Flyway repair...
echo Это удалит запись о неудачной миграции V10
echo.

gradlew.bat flywayRepair

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [OK] Flyway исправлен успешно!
    echo ========================================
    echo.
    echo Теперь можно запустить backend:
    echo   gradlew.bat bootRun
    echo.
) else (
    echo.
    echo ========================================
    echo [!] Ошибка при исправлении Flyway
    echo ========================================
    echo.
    echo Попробуйте вручную очистить таблицу:
    echo   1. Подключитесь к PostgreSQL
    echo   2. Выполните: DELETE FROM flyway_schema_history WHERE success = false;
    echo.
)

cd ..
pause
