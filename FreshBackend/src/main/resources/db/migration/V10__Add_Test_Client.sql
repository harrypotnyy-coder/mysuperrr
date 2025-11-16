-- Удаляем старых тестовых клиентов
DELETE FROM geozones WHERE id > 0;
DELETE FROM geozone_violations WHERE id > 0;
DELETE FROM face_check_events WHERE id > 0;
DELETE FROM clients WHERE id > 0;

-- Добавляем одного тестового осужденного
INSERT INTO clients (
    inn,
    fio,
    unique_id,
    address,
    district_id,
    created_at,
    updated_at
)
SELECT
    '1234567890123',
    'Иванов Иван Иванович',
    'test_client_001',
    'г. Алматы, ул. Абая 150',
    d.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM districts d
WHERE d.code = 'DIST001'
LIMIT 1;

-- Информационное сообщение
DO $$
BEGIN
    RAISE NOTICE 'Тестовый осужденный добавлен: Иванов Иван Иванович';
    RAISE NOTICE 'ИНН: 1234567890123';
    RAISE NOTICE 'Unique ID: test_client_001';
END $$;
