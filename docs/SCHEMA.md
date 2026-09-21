# 데이터베이스 스키마 구조 설명

## 개요

이 문서는 AI 재고·수요 예측 운영툴의 PostgreSQL  P데이터베이스 스키마 구조를 설명합니다.

스키마는 **5개 레이어**로 구성됩니다:
1. **Raw Layer**: 원본 데이터 (주문, 결제, 재고, 상품, 프로모션, 광고)
2. **Staging Layer**: ETL 정제 중간 단계
3. **Mart Layer**: 집계 및 Feature 생성
4. **Prediction Layer**: ML 모델 예측 결과
5. **Admin Layer**: 사용자, 권한, 발주안, 알림, 감사로그

---

## 데이터 흐름

```
Raw Data → Staging → Mart → Features → ML Model → Predictions
                                    ↓
                              Anomaly Detection
```

---

## 1. Raw Layer (원본 데이터)

### 1.1 products (상품 마스터) P

**목적**: SKU 단위 상품 기본 정보

**주요 컬럼**:
- `sku`: SKU 코드 (Unique)
- `name`: 상품명
- `category`: 카테고리
- `brand`: 브랜드
- `price`: 판매가
- `cost`: 원가
- `status`: 상태 (ACTIVE/INACTIVE)

**인덱스**:
- `idx_products_category`: 카테고리별 조회
- `idx_products_brand`: 브랜드별 조회

**소프트 삭제**: `deleted_at` 지원

---

### 1.2 orders (주문/판매 데이터)

**목적**: SKU 단위 주문 라인 아이템 (판매 트랜잭션)

**주요 컬럼**:
- `order_number`: 주문번호
- `order_date`: 주문일시
- `sku_id`: 상품 ID (FK → products)
- `quantity`: 주문 수량
- `unit_price`: 단가
- `channel`: 판매 채널 (WEB/APP/MARKETPLACE)
- `status`: 주문 상태 (CONFIRMED/CANCELED/RETURNED)

**인덱스**:
- `idx_orders_order_date`: 날짜별 조회
- `idx_orders_sku_date`: SKU + 날짜 복합 조회 (시계열 분석)
- `idx_orders_channel`: 채널별 조회

**제약조건**: `quantity > 0`

**소프트 삭제**: `deleted_at` 지원

---

### 1.3 payments (결제 데이터)

**목적**: 주문별 결제 정보

**주요 컬럼**:
- `order_id`: 주문 ID (FK → orders)
- `amount`: 결제 금액
- `method`: 결제 수단 (CARD/BANK_TRANSFER/POINT)
- `status`: 결제 상태 (PAID/REFUNDED/FAILED)
- `paid_at`: 결제 시각
- `refund_amount`: 환불 금액
- `refund_at`: 환불 시각

**인덱스**:
- `idx_payments_order_id`: 주문별 결제 조회
- `idx_payments_status`: 상태별 조회

**소프트 삭제**: `deleted_at` 지원

---

### 1.4 inventory (재고 스냅샷)

**목적**: 일별 SKU별 재고 수량 스냅샷

**주요 컬럼**:
- `sku_id`: 상품 ID (FK → products)
- `location_code`: 창고/지점 코드
- `quantity_on_hand`: 재고 수량
- `quantity_reserved`: 예약 수량
- `safety_stock`: 안전 재고
- `snapshot_date`: 스냅샷 날짜

**인덱스**:
- `ux_inventory_sku_location_date`: SKU + 위치 + 날짜 Unique (중복 방지)

**소프트 삭제**: `deleted_at` 지원

---

### 1.5 promotions (프로모션/할인)

**목적**: 프로모션 및 할인 정보

**주요 컬럼**:
- `name`: 프로모션명
- `promotion_type`: 유형 (COUPON/DISCOUNT/EVENT)
- `discount_type`: 할인 타입 (RATE/AMOUNT)
- `discount_value`: 할인 값 (비율 또는 금액)
- `start_at` / `end_at`: 프로모션 기간
- `target_sku_id`: 대상 SKU (FK → products, NULL이면 전체)
- `target_category`: 대상 카테고리

**인덱스**:
- `idx_promotions_period`: 기간별 조회
- `idx_promotions_target_sku`: SKU별 프로모션 조회

**소프트 삭제**: `deleted_at` 지원

---

### 1.6 ad_campaigns (광고 집행)

**목적**: 광고 캠페인 집행 정보

**주요 컬럼**:
- `name`: 캠페인명
- `channel`: 광고 채널 (GOOGLE/FACEBOOK/NAVER)
- `external_campaign_id`: 외부 시스템 캠페인 ID
- `sku_id`: 대상 SKU (FK → products)
- `daily_budget`: 일일 예산
- `start_at` / `end_at`: 집행 기간

**인덱스**:
- `idx_ad_campaigns_period`: 기간별 조회
- `idx_ad_campaigns_sku`: SKU별 광고 조회

**소프트 삭제**: `deleted_at` 지원

---

## 2. Staging Layer (ETL 중간 단계)

### 2.1 staging_orders

**목적**: Raw orders 데이터를 정제하여 Mart로 로드하기 전 중간 저장

**주요 컬럼**:
- `order_number`, `order_date`, `sku_id`, `quantity`: Raw와 동일
- `revenue`: 매출 (quantity × unit_price)
- `source_system`: 소스 시스템
- `ingestion_time`: ETL 적재 시각

**인덱스**:
- `idx_staging_orders_sku_date`: SKU + 날짜 복합 조회

**특징**: ETL 배치 처리 후 Mart로 이동되므로 일시적 데이터

---

### 2.2 staging_inventory

**목적**: Raw inventory 데이터 정제 중간 저장

**주요 컬럼**:
- `sku_id`, `snapshot_date`, `location_code`: Raw와 동일
- `quantity_on_hand`, `quantity_reserved`: 재고 수량
- `ingestion_time`: ETL 적재 시각

**인덱스**:
- `idx_staging_inventory_sku_date`: SKU + 날짜 복합 조회

---

## 3. Mart Layer (집계 및 Feature)

### 3.1 sku_daily_stats (SKU 일별 집계)

**목적**: SKU별 일일 판매/재고/반품 집계 (모델 입력용 기본 통계)

**주요 컬럼**:
- `sku_id`: 상품 ID (FK → products)
- `stat_date`: 집계 날짜
- `units_sold`: 판매 수량
- `gross_revenue`: 총 매출
- `net_revenue`: 순 매출 (반품 제외)
- `units_returned`: 반품 수량
- `ending_inventory`: 일말 재고
- `ad_spend`: 광고비
- `promo_flag`: 프로모션 여부

**인덱스**:
- `ux_sku_daily_stats_sku_date`: SKU + 날짜 Unique (중복 방지)
- `idx_sku_daily_stats_date`: 날짜별 조회

**특징**: ETL 배치로 일별 집계 생성

---

### 3.2 sku_features (SKU Feature 테이블)

**목적**: ML 모델 입력용 특징(Feature) 데이터

**주요 컬럼**:
- `sku_id`: 상품 ID (FK → products)
- `feature_date`: 기준 날짜
- `horizon_days`: 예측 기간 (7/14/30일)

**시간 관련 Feature**:
- `day_of_week`: 요일 (0-6)
- `is_weekend`: 주말 여부
- `season`: 시즌 (SPRING/SUMMER/FALL/WINTER)

**가격 관련 Feature**:
- `base_price`: 기준 가격
- `current_price`: 현재 가격
- `discount_rate`: 할인율 (0~1)

**운영 관련 Feature**:
- `lead_time_days`: 리드타임 (일)
- `inventory_turnover`: 재고회전율
- `return_rate`: 반품률
- `promo_intensity`: 프로모션 강도
- `ad_intensity`: 광고 강도

**확장 Feature**:
- `raw_features`: JSONB (추가 특징 보관)

**인덱스**:
- `idx_sku_features_sku_date_horizon`: SKU + 날짜 + 예측기간 복합 조회

**특징**: ETL Feature 생성 파이프라인으로 생성

---

## 4. Prediction Layer (ML 예측 결과)

### 4.1 predictions (수요 예측 결과)

**목적**: ML 모델의 수요 예측 결과 저장

**주요 컬럼**:
- `sku_id`: 상품 ID (FK → products)
- `prediction_date`: 예측 생성 기준일
- `target_date`: 예측 대상 날짜
- `horizon_days`: 예측 기간 (7/14/30일)
- `predicted_demand`: 예측 수요량
- `predicted_stockout_date`: 재고 소진 예상일
- `recommended_order_qty`: 발주 추천 수량
- `model_name`: 모델명 (XGBOOST/LIGHTGBM/PROPHET)
- `model_version`: 모델 버전
- `feature_importance`: JSONB (SHAP 등 특징 기여도)
- `explanation`: JSONB (룰 기반/요약 설명)

**인덱스**:
- `idx_predictions_sku_target`: SKU + 대상날짜 + 예측기간 복합 조회
- `idx_predictions_created_at`: 생성 시각별 조회

**특징**: 배치 예측 또는 실시간 예측 결과 저장

---

### 4.2 anomaly_detections (이상탐지 결과)

**목적**: 이상징후 탐지 결과 저장

**주요 컬럼**:
- `sku_id`: 상품 ID (FK → products)
- `event_date`: 이상 발생 날짜
- `anomaly_type`: 이상 유형
  - `SALES_SPIKE`: 판매 급증
  - `SALES_DROP`: 판매 급감
  - `RETURN_SURGE`: 반품률 폭증
  - `INVENTORY_ANOMALY`: 재고 이상
- `severity`: 심각도 (LOW/MEDIUM/HIGH/CRITICAL)
- `observed_value`: 관측값
- `expected_value`: 예상값
- `delta_value`: 차이값
- `details`: JSONB (상세 정보)
- `status`: 상태 (OPEN/ACKED/RESOLVED)
- `resolved_at`: 해결 시각

**인덱스**:
- `idx_anomaly_sku_date`: SKU + 날짜 복합 조회
- `idx_anomaly_status`: 상태별 조회

**특징**: 이상탐지 모델 결과 저장

---

## 5. Admin Layer (관리 기능)

### 5.1 roles (역할)

**목적**: 사용자 역할 정의

**주요 컬럼**:
- `name`: 역할명 (OPERATOR/MANAGER/ADMIN)
- `description`: 설명

**역할별 권한**:
- **OPERATOR**: 발주안 생성, 조회
- **MANAGER**: 발주안 승인, 조회
- **ADMIN**: 모든 권한

---

### 5.2 users (사용자)

**목적**: 시스템 사용자 정보

**주요 컬럼**:
- `email`: 이메일 (Unique, 로그인 ID)
- `password_hash`: 비밀번호 해시 (bcrypt)
- `name`: 이름
- `role_id`: 역할 ID (FK → roles)
- `is_active`: 활성화 여부
- `last_login_at`: 마지막 로그인 시각

**인덱스**:
- `idx_users_role_id`: 역할별 조회

**소프트 삭제**: `deleted_at` 지원

---

### 5.3 purchase_orders (발주안)

**목적**: 발주안 생성/승인 워크플로우 관리

**주요 컬럼**:
- `po_number`: 발주안 번호 (Unique)
- `sku_id`: 상품 ID (FK → products)
- `quantity`: 발주 수량
- `status`: 상태
  - `DRAFT`: 초안
  - `PENDING`: 승인 대기
  - `APPROVED`: 승인됨
  - `REJECTED`: 거부됨
  - `COMPLETED`: 완료
- `recommended_by_prediction_id`: 예측 ID (FK → predictions)
- `requested_by_user_id`: 요청자 ID (FK → users)
- `approved_by_user_id`: 승인자 ID (FK → users)
- `expected_arrival_date`: 입고 예정일
- `supplier_name`: 공급업체명
- `notes`: 메모

**인덱스**:
- `idx_purchase_orders_sku`: SKU별 발주안 조회
- `idx_purchase_orders_status`: 상태별 조회

**소프트 삭제**: `deleted_at` 지원

---

### 5.4 notifications (알림 설정)

**목적**: 알림 설정 (슬랙/이메일 모킹)

**주요 컬럼**:
- `name`: 알림명
- `channel`: 채널 (SLACK/EMAIL)
- `target_address`: 대상 주소 (이메일/웹훅 URL)
- `is_active`: 활성화 여부
- `config`: JSONB (임계치, 조건 등)
- `created_by`: 생성자 ID (FK → users)

**인덱스**:
- `idx_notifications_channel`: 채널별 조회

**소프트 삭제**: `deleted_at` 지원

---

### 5.5 audit_logs (감사로그)

**목적**: 중요 작업 감사 로그

**주요 컬럼**:
- `user_id`: 사용자 ID (FK → users)
- `action`: 작업 (예: CREATE_PURCHASE_ORDER, APPROVE_PURCHASE_ORDER)
- `entity_type`: 엔티티 타입 (예: purchase_orders)
- `entity_id`: 엔티티 ID
- `metadata`: JSONB (추가 정보)
- `created_at`: 생성 시각

**인덱스**:
- `idx_audit_logs_user`: 사용자별 조회
- `idx_audit_logs_entity`: 엔티티별 조회

**특징**: 모든 중요 작업 자동 기록

---

## 테이블 간 관계도

```
products (1) ──< (N) orders
orders (1) ──< (N) payments
products (1) ──< (N) inventory
products (1) ──< (N) promotions
products (1) ──< (N) ad_campaigns

products (1) ──< (N) sku_daily_stats
products (1) ──< (N) sku_features

products (1) ──< (N) predictions
products (1) ──< (N) anomaly_detections

roles (1) ──< (N) users
users (1) ──< (N) purchase_orders (requested_by)
users (1) ──< (N) purchase_orders (approved_by)
products (1) ──< (N) purchase_orders
predictions (1) ──< (N) purchase_orders
users (1) ──< (N) notifications
users (1) ──< (N) audit_logs
```

---

## 주요 인덱스 전략

### 조회 패턴 기반 인덱스

1. **시계열 조회**: `order_date`, `stat_date`, `prediction_date` 등 날짜 컬럼 인덱스
2. **SKU 중심 조회**: `sku_id` + 날짜 복합 인덱스
3. **상태별 필터링**: `status` 컬럼 인덱스
4. **Unique 제약**: 중복 방지 (예: SKU + 날짜)

### 성능 최적화

- **복합 인덱스**: 자주 함께 조회되는 컬럼 조합
- **부분 인덱스**: 특정 조건만 인덱싱 (필요시)
- **인덱스 순서**: WHERE 절에서 자주 사용되는 순서로 정렬

---

## 소프트 삭제 (Soft Delete)

다음 테이블은 `deleted_at` 컬럼으로 소프트 삭제 지원:
- `products`
- `orders`
- `payments`
- `inventory`
- `promotions`
- `ad_campaigns`
- `users`
- `purchase_orders`
- `notifications`

**사용법**: `deleted_at IS NULL` 조건으로 활성 레코드만 조회

---

## 타임스탬프 필드

모든 테이블에 다음 타임스탬프 필드 포함:
- `created_at`: 생성 시각 (NOT NULL, DEFAULT NOW())
- `updated_at`: 수정 시각 (NOT NULL, DEFAULT NOW())
- `deleted_at`: 삭제 시각 (NULL이면 활성)

**특징**: `TIMESTAMPTZ` 타입 사용 (타임존 포함)

---

## 제약조건 (Constraints)

### CHECK 제약조건
- `orders.quantity > 0`: 주문 수량은 양수
- `purchase_orders.quantity > 0`: 발주 수량은 양수

### 외래키 (Foreign Keys)
- 모든 FK는 `ON DELETE` 동작 명시 (대부분 RESTRICT 또는 CASCADE)
- 참조 무결성 보장

### UNIQUE 제약조건
- `products.sku`: SKU 코드 중복 방지
- `purchase_orders.po_number`: 발주안 번호 중복 방지
- `users.email`: 이메일 중복 방지
- `roles.name`: 역할명 중복 방지

---

## 확장 가능성

### JSONB 필드 활용
- `sku_features.raw_features`: 추가 Feature 확장
- `predictions.feature_importance`: SHAP 등 다양한 설명 가능성 도구 지원
- `predictions.explanation`: 룰 기반 설명 확장
- `anomaly_detections.details`: 이상탐지 상세 정보 확장
- `notifications.config`: 알림 설정 확장

### 향후 추가 가능한 테이블
- `suppliers`: 공급업체 마스터
- `warehouses`: 창고 마스터
- `return_reasons`: 반품 사유 마스터
- `price_history`: 가격 변동 이력

---

## 마이그레이션 실행

```bash
# PostgreSQL에 연결하여 실행
psql -U postgres -d coldchain_db -f backend/migrations/001_init_schema.sql

# 또는 NestJS TypeORM 사용
cd backend
npm run migration:run
```

---

## 참고사항

- 모든 테이블은 트랜잭션(`BEGIN`/`COMMIT`)으로 감싸져 있어 원자성 보장
- `CREATE TABLE IF NOT EXISTS` 사용으로 중복 실행 안전
- 인덱스는 `CREATE INDEX IF NOT EXISTS` 사용
