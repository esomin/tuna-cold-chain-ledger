-- Migration: Add i18n columns to products (name_ko, name_en)
BEGIN;

-- 1. Add name_ko and name_en columns if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ko VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);

-- 2. Make old 'name' column nullable if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'name'
    ) THEN
        ALTER TABLE products ALTER COLUMN name DROP NOT NULL;
        -- Migrate existing 'name' into 'name_ko' if name_ko is empty
        UPDATE products SET name_ko = name WHERE name_ko IS NULL OR name_ko = '';
    END IF;
END $$;

-- 3. Set default / refined localized names for core tuna SKUs
UPDATE products 
SET 
    name_ko = '참다랑어 로인 (냉동)',
    name_en = 'Pacific Bluefin Tuna Loin (Frozen)'
WHERE sku = 'TUNA-BLUEFIN';

UPDATE products 
SET 
    name_ko = '눈다랑어 로인 (냉동)',
    name_en = 'Bigeye Tuna Loin (Frozen)'
WHERE sku = 'TUNA-BIGEYE';

UPDATE products 
SET 
    name_ko = '황다랑어 로인 (냉동)',
    name_en = 'Yellowfin Tuna Loin (Frozen)'
WHERE sku = 'TUNA-YELLOWFIN';

-- Ensure name_ko is NOT NULL for future inserts
ALTER TABLE products ALTER COLUMN name_ko SET NOT NULL;

COMMIT;
