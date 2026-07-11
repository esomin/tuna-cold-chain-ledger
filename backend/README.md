# Tuna Cold Chain Ledger - Backend API Server

## 1. Overview
Tuna Cold Chain Ledger의 백엔드는 참치 유통 경로 및 초저온 보관 환경 수집 데이터의 실시간 유효성 분석, 블록체인 스마트 계약 트랜잭션 서명 및 배포, 다역할 기반 발주 승인 프로세스를 통제하는 **코어 REST API 및 실시간 게이트웨이 서버**입니다.

본 서버는 IoT 시뮬레이터가 송신하는 온도/위치 데이터 스트림을 중계하고, 안전 임계치($-55^\circ\text{C}$) 이탈을 분석하여 프론트엔드로 브로드캐스팅하는 동시에 데이터 무결성 입증을 위해 해시값을 로컬 블록체인 스마트 계약에 기록하는 역할을 수행합니다.

---

## 2. Tech Stack & Integration

| 구분 | 기술 스택 / 라이브러리 | 도입 목적 |
| :--- | :--- | :--- |
| **Core Framework** | NestJS (v10) | 모듈화된 Layered Architecture(Controller-Service-Repository) 구조 제공 |
| **RDBMS & ORM** | PostgreSQL (v15) + TypeORM | 사용자 정보, 권한(RBAC), 재고 상태 및 발주 마스터 데이터 영속성 관리 |
| **NoSQL (Off-chain)** | MongoDB | 초 단위 고주기로 들어오는 IoT 실시간 온도/위치 시계열 로그 적재 |
| **In-Memory Cache** | Redis | 실시간 온도 임계치 초과 알림 발생 여부 캐싱 및 센서 상태 임시 관리 |
| **Real-time Engine** | Socket.io (WebSocket Gateways) | 프론트엔드 클라이언트로 실시간 온도 변동 및 경고 이벤트 전송 |
| **Blockchain Client** | Ethers.js | Hardhat 로컬 EVM 스마트 계약 호출, 트랜잭션 빌드 및 가스비 전송 |
| **Authentication** | Passport + JWT | 역할 기반의 접근 제어(RBAC) 및 보안 세션 제공 |

---

## 3. Project Structure

```
src/
├── auth/                   # JWT 로그인 인증 전략 및 가드(JwtAuthGuard)
├── config/                 # TypeORM 데이터베이스 연결 및 환경 변수 통합 설정
├── database/               # 데이터 마이그레이션 파일 및 초기 데이터 시딩(Seed)
├── entities/               # PostgreSQL 테이블 설정을 위한 TypeORM 데코레이터 엔티티 정의
├── users/                  # 회원가입, 사용자 조회 및 RBAC 접근 제어 서비스
├── inventory/              # 보관중인 SKU(참치 품목)의 입고 및 상태 관리
├── purchase-orders/        # 발주 단계별 결재 워크플로우 통제
├── notifications/          # Socket.io 게이트웨이 및 실시간 경고 브로드캐스트
├── audit-logs/             # 시스템 중요 변경 이력 로깅 모듈
├── common/                 # 애플리케이션 전반에 걸쳐 공통적으로 적용되는 미들웨어 및 필터
│   ├── decorators/         # 역할 권한 바인딩용 커스텀 데코레이터 (@Roles)
│   ├── guards/             # JWT 검증 및 역할별 접근 제어 가드 (RolesGuard)
│   └── interceptors/       # HTTP 응답 포맷 통합 및 예외 핸들링 인터셉터
└── main.ts                 # 전역 파이프라인 설정, Swagger 연동 및 앱 실행 (기본 3000포트)
```

---

## 4. Environment Variables
로컬 개발 및 운영 서버를 실행하고 Docker 인프라를 구동하기 위해 아래 명령어를 실행하여 `backend/.env`를 구성하고 프로젝트 루트 디렉토리에 심볼릭 링크를 생성합니다.

```bash
# 1. 예시 설정 파일을 복사하여 실제 .env 생성
cp backend/.env.example backend/.env

# 2. 루트 디렉토리에 심볼릭 링크 생성 (Mac / Linux 기준)
ln -sf backend/.env .env
```

`backend/.env` 파일에 설정해야 하는 주요 변수 목록은 다음과 같습니다.

* **`PORT`** (기본값: `3000`)
* **`DB_HOST`**, **`DB_PORT`**, **`DB_USERNAME`**, **`DB_PASSWORD`**, **`DB_DATABASE`**
* **`JWT_SECRET`** (사용자 인증 토큰 키)
* **`MONGO_URI`** (MongoDB 연결 URI)
* **`REDIS_HOST`**, **`REDIS_PORT`** (Redis 연결 정보)
* **`BLOCKCHAIN_RPC_URL`** (로컬 Hardhat EVM의 RPC 엔드포인트 URL, 예: `http://localhost:8545`)
* **`CONTRACT_ADDRESS`** (온체인 해시 기록을 위해 로컬망에 배포된 스마트 계약 주소)
* **`CONTRACT_PRIVATE_KEY`** (트랜잭션을 발행하고 가스비를 소모할 서버 측 지갑의 개인키(Private Key))

---

## 5. Database & Migration

### 엔티티 관계 (Entity Relationship)
* **User ➜ Role (다대일)**: 한 사용자는 단 하나의 시스템 접근 역할(ADMIN, OPERATOR, MANAGER)을 부여받습니다.
* **Product ➜ Inventory (일대다)**: 하나의 참치 제품군(Product/SKU)은 창고 입고 이력 및 현재 보관 위치/재고 수준을 나타내는 다수의 `Inventory` 정보를 가집니다.
* **PurchaseOrder ➜ User (다대일)**: 발주 결재 프로세스(DRAFT -> PENDING -> APPROVED/REJECTED) 진행 시, 각 발주는 발주 담당자(OPERATOR) 및 승인권자(MANAGER) 정보와 관계를 맺습니다.
* **AuditLog ➜ User (다대일)**: 중요 상태 변경 작업 발생 시, 어떤 사용자(User)가 행위를 수행했는지 증적 로그를 영구 매핑합니다.

### TypeORM 마이그레이션 명령어
백엔드에서는 TypeORM CLI를 활용해 스키마 변경 이력을 관리합니다.

* **마이그레이션 파일 생성** (코드 엔티티의 수정사항을 기반으로 차분 쿼리 파일 생성):
  ```bash
  npm run migration:generate --name=AddTunaEntity
  ```
* **마이그레이션 실행** (대기 중인 마이그레이션 파일들을 DB 스키마에 즉각 적용):
  ```bash
  npm run migration:run
  ```
* **마이그레이션 롤백** (가장 최근에 반영되었던 마이그레이션 단계를 뒤로 되돌림):
  ```bash
  npm run migration:revert
  ```

---

## 6. Getting Started

### Development Server (개발 서버 구동)
```bash
# 의존성 설치
npm install

# 로컬 개발 서버 구동 (핫 리로드 감지 모드)
npm run start:dev
```

### Build & Production (컴파일 및 빌드)
```bash
# 프로덕션 빌드 컴파일 (dist/ 디렉토리에 빌드 결과물 생성)
npm run build

# 컴파일 완료 파일 구동
npm run start:prod
```

### API Documentation (API 문서화)
본 백엔드 어플리케이션은 Swagger 모듈을 통해 API 명세서가 코드를 통해 동적으로 문서화되어 제공됩니다.
* **Swagger UI 엔드포인트**: `http://localhost:3000/api-docs`
* **테스트 수행**: E2E 통합 테스트를 통해 백엔드 API 명세 전체의 정합성을 검증할 수 있습니다.
  ```bash
  # Jest e2e 통합 테스트 실행
  npm run test:e2e
  ```
