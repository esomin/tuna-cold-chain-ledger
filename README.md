# Inventory Forecaster

이커머스를 위한 AI 기반 재고 및 수요 예측 시스템입니다. 수요 예측, 발주 권장 사항 및 이상 징후 감지를 자동화합니다.

## 아키텍처

4개의 독립적인 모듈로 구성된 풀스택 시스템:

| 모듈 | 스택 | 설명 |
|--------|-------|-------------|
| **Backend** | NestJS + PostgreSQL + TypeORM | 핵심 비즈니스 로직 및 REST API |
| **Frontend** | React + Ant Design | 시각화 및 운영을 위한 관리자 대시보드 |
| **ETL** | Python + SQLAlchemy | Raw → Staging → Mart 변환을 위한 데이터 파이프라인 |
| **ML** | Python + XGBoost/LightGBM | 수요 예측 및 이상 징후 감지 모델 |

## 시스템 요구사항

`requirements.md`에 정의된 EARS 구문을 기반으로 합니다.

### 1. 데이터 처리
- **수집**: 주문, 재고, 상품 데이터를 Raw 스토리지에 실시간 적재.
- **집계**: 피처 엔지니어링(계절성, 가격 추세 등)을 포함하여 Mart 테이블로 자동 변환.

### 2. AI & 예측
- **수요 예측**: XGBoost/LightGBM을 사용한 수요 예측 (7/14/30일).
- **이상 징후 감지**: 비정상적인 판매 급증/급감 및 반품율 급증 감지.
- **설명 가능성**: 예측 근거를 설명하기 위한 XAI 기능 (피처 중요도).

### 3. 발주 관리
- **권장 사항**: 예측 및 재고 소진 시점을 기반으로 자동 발주 권장.
- **위험 관리**: "품절 위험 TOP" 식별 및 강조 표시.
- **워크플로우**: 발주 승인 워크플로우 (임시 저장 → 승인 대기 → 승인됨/반려됨).

### 4. 관리자 및 인터페이스
- **대시보드**: KPI 모니터링 및 알림 설정.
- **운영**: SKU 고급 필터링, 정렬 및 관리.
- **보안**: 역할 기반 액세스 제어(RBAC) 및 중요 작업에 대한 감사 로그(Audit Logging).

## 빠른 시작

### 사전 준비 사항

- Node.js 18+
- Python 3.10+
- Docker & Docker Compose
- PostgreSQL 15+

### 데이터베이스 설정

```bash
# PostgreSQL 실행
docker-compose up -d

# 마이그레이션 실행
cd backend
npm run migration:run
```

### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev          # 개발 모드 (http://localhost:3000)
```

### Frontend (React)

```bash
cd frontend
npm install
npm start                  # 개발 서버 (http://localhost:3001)
```

### ETL (Python)

```bash
cd etl
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

python scripts/generate_fake_data.py  # 테스트 데이터 생성
python scripts/run_etl.py             # ETL 파이프라인 실행
```

### ML (Python)

```bash
cd ml
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

python scripts/train_model.py         # 모델 학습
python scripts/predict.py             # 예측 실행
python scripts/detect_anomalies.py    # 이상 징후 감지 실행
```

## 데이터 아키텍처

### 5단계 데이터베이스 스키마

```
외부 데이터 소스
      ↓
Raw 테이블 (orders, inventory, products, promotions, ad_campaigns)
      ↓
ETL 파이프라인 (Python)
      ↓
Staging 테이블 (데이터 검증 및 변환)
      ↓
Mart 테이블 (sku_daily_stats, sku_features)
      ↓
ML 모델 (XGBoost/LightGBM)
      ↓
Prediction 테이블 (predictions, anomaly_detections)
      ↓
Backend API (NestJS)
      ↓
Frontend 대시보드 (React + AntD)
```

| 레이어 | 테이블 | 목적 |
|-------|--------|---------|
| **Raw** | products, orders, payments, inventory, promotions, ad_campaigns | 원본 소스 데이터 |
| **Staging** | staging_orders, staging_inventory | ETL 중간 변환 단계 |
| **Mart** | sku_daily_stats, sku_features | 집계 데이터 및 ML 피처 |
| **Prediction** | predictions, anomaly_detections | ML 모델 출력 결과 |
| **Admin** | users, roles, purchase_orders, notifications, audit_logs | 애플리케이션 관리 |

## 주요 기능

### 수요 예측
- 7/14/30일 범위의 수요 예측
- 피처: 요일, 계절, 가격 추세, 할인율, 재고 회전율 등
- SHAP 피처 중요도를 통한 예측 설명 가능성 제공

### 이상 징후 감지
- `SALES_SPIKE` / `SALES_DROP`: 갑작스러운 수요 변화
- `RETURN_SURGE`: 비정상적인 반품율
- `INVENTORY_ANOMALY`: 재고 수준 이상

### 발주 워크플로우
- 상태 흐름: `DRAFT` → `PENDING` → `APPROVED`/`REJECTED` → `COMPLETED`
- 역할 기반 액세스: OPERATOR (작성), MANAGER (승인), ADMIN (전체 권한)

## 환경 변수

각 모듈 디렉토리에서 `.env.example` 파일을 `.env` 파일로 복사하여 사용합니다.

**Backend** (`backend/.env`):
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=inventory_db
JWT_SECRET=your-secret-key
```

**ETL & ML** (각 디렉토리의 `.env`):
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=inventory_db
```

## 사용 가능한 스크립트

### Backend
| 명령어 | 설명 |
|---------|-------------|
| `npm run start:dev` | 핫 리로드를 포함한 개발 모드 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm test` | 모든 테스트 실행 |
| `npm run test:cov` | 커버리지를 포함한 테스트 실행 |
| `npm run lint` | ESLint 실행 |
| `npm run migration:run` | 데이터베이스 마이그레이션 실행 |
| `npm run migration:generate` | 새로운 마이그레이션 생성 |

### Frontend
| 명령어 | 설명 |
|---------|-------------|
| `npm start` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm test` | 테스트 실행 |

## 문서

- 데이터베이스 스키마: `backend/docs/SCHEMA.md`
- 개발 계획: `plan/plan.md`

## 개발 현황

- [x] 프로젝트 구조 설정
- [x] 데이터베이스 스키마 및 마이그레이션
- [x] 백엔드 기본 설정 (NestJS + TypeORM)
- [x] TypeORM 엔티티 정의
- [ ] 사용자 인증 (JWT)
- [ ] 프론트엔드 대시보드
- [ ] ETL 파이프라인
- [ ] ML 모델

## 라이선스

MIT
