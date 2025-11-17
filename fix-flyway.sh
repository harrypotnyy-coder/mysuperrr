#!/bin/bash
# Скрипт для исправления ошибок миграции Flyway

echo "========================================"
echo "Исправление ошибок миграции Flyway"
echo "========================================"
echo ""

cd FreshBackend

echo "Запуск Flyway repair..."
echo "Это удалит запись о неудачной миграции V10"
echo ""

./gradlew flywayRepair

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "[OK] Flyway исправлен успешно!"
    echo "========================================"
    echo ""
    echo "Теперь можно запустить backend:"
    echo "  ./gradlew bootRun"
    echo ""
else
    echo ""
    echo "========================================"
    echo "[!] Ошибка при исправлении Flyway"
    echo "========================================"
    echo ""
    echo "Попробуйте вручную очистить таблицу:"
    echo "  1. Подключитесь к PostgreSQL"
    echo "  2. Выполните: DELETE FROM flyway_schema_history WHERE success = false;"
    echo ""
fi

cd ..
