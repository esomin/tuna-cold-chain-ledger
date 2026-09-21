-- Migration: Add i18n columns to purchase_orders (supplier_name_ko, supplier_name_en)
BEGIN;

-- 1. Add supplier_name_ko and supplier_name_en columns if they don't exist
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_name_ko VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_name_en VARCHAR(255);

-- 2. Migrate existing supplier_name to supplier_name_ko if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' AND column_name = 'supplier_name'
    ) THEN
        UPDATE purchase_orders 
        SET supplier_name_ko = supplier_name 
        WHERE (supplier_name_ko IS NULL OR supplier_name_ko = '') AND supplier_name IS NOT NULL;

        ALTER TABLE purchase_orders ALTER COLUMN supplier_name DROP NOT NULL;
    END IF;
END $$;

-- 3. Set default / refined localized names for scenario purchase orders
UPDATE purchase_orders 
SET 
    supplier_name_ko = '부산 어항 물류',
    supplier_name_en = 'Busan Harbor Logistics'
WHERE po_number = 'PO-2026-SCENARIO-A' OR supplier_name_ko LIKE '%부산%';

UPDATE purchase_orders 
SET 
    supplier_name_ko = '통영 원양 수산',
    supplier_name_en = 'Tongyeong Deep-Sea Fishery'
WHERE po_number = 'PO-2026-SCENARIO-B' OR supplier_name_ko LIKE '%통영%';

COMMIT;
