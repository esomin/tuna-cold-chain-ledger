-- Seed scenarios data for Tuna Cold Chain Ledger

BEGIN;

-- products 초기 데이터 (참치 SKU)
INSERT INTO products (id, sku, name, category, price, status) VALUES
(1, 'TUNA-BLUEFIN', '참다랑어 (Bluefin Tuna)', 'Premium', 85000.00, 'ACTIVE'),
(2, 'TUNA-BIGEYE', '눈다랑어 (Bigeye Tuna)', 'Standard', 45000.00, 'ACTIVE'),
(3, 'TUNA-YELLOWFIN', '황다랑어 (Yellowfin Tuna)', 'Standard', 35000.00, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
SELECT setval('products_id_seq', 3);

-- purchase_orders 초기 데이터 (시나리오 A)
-- PO-2026-SCENARIO-A: 전 유통 단계 정상 배송 완료 건
INSERT INTO purchase_orders (id, po_number, sku_id, quantity, status, supplier_name, notes) VALUES
(1, 'PO-2026-SCENARIO-A', 1, 100, 'COMPLETED', '부산 어항 물류', '시나리오 A: 전 유통 단계 정상 완료 (블록체인 무결성 검증 통과)')
ON CONFLICT (id) DO NOTHING;
SELECT setval('purchase_orders_id_seq', 1);

COMMIT;


