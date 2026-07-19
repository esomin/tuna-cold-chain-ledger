-- Initial schema for Tuna Cold Chain Ledger (Slim Demo Edition)
-- Active tables: products, purchase_orders, audit_logs

BEGIN;

-- Products (상품 마스터)
CREATE TABLE IF NOT EXISTS products (
    id              BIGSERIAL PRIMARY KEY,
    sku             VARCHAR(64) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(128),
    price           NUMERIC(12, 2) NOT NULL,
    status          VARCHAR(32) DEFAULT 'ACTIVE', -- ACTIVE / INACTIVE
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);


-- Purchase Orders (발주 및 유통 상태 정보)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id                      BIGSERIAL PRIMARY KEY,
    po_number               VARCHAR(64) NOT NULL UNIQUE,
    sku_id                  BIGINT NOT NULL REFERENCES products(id),
    quantity                INTEGER NOT NULL CHECK (quantity > 0),
    status                  VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT / PENDING / COMPLETED 등
    supplier_name           VARCHAR(255),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_sku ON purchase_orders (sku_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders (status);


-- Audit Logs (블록체인 Tx 영구 기록 매핑용 감사 추적 로그)
CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    action          VARCHAR(128) NOT NULL,
    data_hash       VARCHAR(128) NOT NULL,
    tx_hash         VARCHAR(128) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);

COMMIT;
