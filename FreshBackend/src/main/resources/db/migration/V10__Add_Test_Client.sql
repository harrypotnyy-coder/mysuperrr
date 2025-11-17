-- Удаляем старых тестовых клиентов
DELETE FROM geozones WHERE id > 0;
DELETE FROM geozone_violations WHERE id > 0;
DELETE FROM face_check_events WHERE id > 0;
DELETE FROM clients WHERE id > 0;

-- Добавляем одного тестового осужденного
INSERT INTO clients (
    inn,
    fio,
    identifier,
    reg_address,
    fact_address,
    app_password,
    birth_date,
    sex,
    passport,
    contact1,
    obs_start,
    obs_end,
    created_at,
    updated_at
)
VALUES (
    '1234567890123',
    'Иванов Иван Иванович',
    'test_client_001',
    'г. Бишкек, ул. Чуй 150',
    'г. Бишкек, ул. Чуй 150',
    'password123',
    '1990-01-15',
    'М',
    'AN1234567',
    '+996555123456',
    '2024-01-01',
    '2025-12-31',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Информационное сообщение
DO $$
BEGIN
    RAISE NOTICE 'Тестовый осужденный добавлен: Иванов Иван Иванович';
    RAISE NOTICE 'ИНН: 1234567890123';
    RAISE NOTICE 'Identifier: test_client_001';
END $$;
