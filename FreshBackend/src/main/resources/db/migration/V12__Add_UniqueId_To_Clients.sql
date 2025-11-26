-- V12: Добавляем unique_id в таблицу clients для интеграции с Traccar
-- Это позволит осужденным использовать GPS отслеживание

-- Добавляем поле unique_id
ALTER TABLE clients ADD COLUMN IF NOT EXISTS unique_id VARCHAR(255);

-- Устанавливаем unique_id для существующих клиентов (используем их ИНН)
UPDATE clients SET unique_id = inn WHERE unique_id IS NULL;

-- Делаем unique_id обязательным и уникальным
ALTER TABLE clients ALTER COLUMN unique_id SET NOT NULL;

-- Добавляем constraint только если не существует
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'clients_unique_id_unique'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_unique_id_unique UNIQUE (unique_id);
    END IF;
END $$;

-- Создаем индекс для быстрого поиска (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_clients_unique_id ON clients (unique_id);

-- Информационное сообщение
DO $$
BEGIN
    RAISE NOTICE 'Добавлено поле unique_id в таблицу clients';
    RAISE NOTICE 'Существующие клиенты получили unique_id = inn';
END $$;
