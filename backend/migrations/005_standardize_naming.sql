-- Migration: Standardize naming convention (Default English + _ko Korean)
-- products: name (English default), name_ko (Korean)
-- purchase_orders: supplier_name (English default), supplier_name_ko (Korean)
BEGIN;

-- 1. Standardize products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ko VARCHAR(255);

-- Migrate name_en data into name if name is empty
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'name_en'
    ) THEN
        UPDATE products SET name = name_en WHERE (name IS NULL OR name = '') AND name_en IS NOT NULL;
        ALTER TABLE products DROP COLUMN IF EXISTS name_en;
    END IF;
END $$;

UPDATE products SET name = 'Pacific Bluefin Tuna Loin (Frozen)', name_ko = '참다랑어 로인 (냉동)' WHERE sku = 'TUNA-BLUEFIN';
UPDATE products SET name = 'Bigeye Tuna Loin (Frozen)', name_ko = '눈다랑어 로인 (냉동)' WHERE sku = 'TUNA-BIGEYE';
UPDATE products SET name = 'Yellowfin Tuna Loin (Frozen)', name_ko = '황다랑어 로인 (냉동)' WHERE sku = 'TUNA-YELLOWFIN';


-- 2. Standardize purchase_orders table
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_name_ko VARCHAR(255);

-- Migrate supplier_name_en data into supplier_name if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' AND column_name = 'supplier_name_en'
    ) THEN
        UPDATE purchase_orders SET supplier_name = supplier_name_en WHERE (supplier_name IS NULL OR supplier_name = '') AND supplier_name_en IS NOT NULL;
        ALTER TABLE purchase_orders DROP COLUMN IF EXISTS supplier_name_en;
    END IF;
END $$;

UPDATE purchase_orders 
SET 
    supplier_name = 'Busan Harbor Logistics',
    supplier_name_ko = '부산 어항 물류'
WHERE po_number = 'PO-2026-SCENARIO-A' OR supplier_name_ko LIKE '%부산%';

UPDATE purchase_orders 
SET 
    supplier_name = 'Tongyeong Deep-Sea Fishery',
    supplier_name_ko = '통영 원양 수산'
WHERE po_number = 'PO-2026-SCENARIO-B' OR supplier_name_ko LIKE '%통영%';

COMMIT;
