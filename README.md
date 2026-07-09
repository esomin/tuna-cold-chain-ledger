# TunaChain (참치 초저온 콜드체인 모니터링 및 AI 재고·수요 예측 시스템)

## 1. Overview
TunaChain은 참치 유통 경로 및 초저온 보관 상태($-60^\circ\text{C}$)를 실시간으로 추적·모니터링하고, 데이터 위·변조를 방지하는 가상 블록체인 기반의 콜드체인 모니터링 시스템입니다.

본 프로젝트는 IoT 시뮬레이터에서 주기적으로 생성되는 온도와 GPS 위치 정보를 실시간 대시보드에 매핑하여 제공하며, 임계값($-55^\circ\text{C}$) 초과 시 즉각적인 예외 경고를 알립니다. 또한, 수집된 데이터를 블록체인 온체인(On-chain) 해시 검증을 통해 유통 이력의 무결성을 소비자에게 QR 코드로 공개합니다.

이후 Phase 2 단계에서, 축적된 실시간 및 이력 데이터를 ETL 파이프라인으로 적재하고 ML 모델(XGBoost, LightGBM)을 활용해 신선도 저하로 인한 재고 손실률 및 장기 수요를 정밀하게 예측하는 시스템으로 완성됩니다.

---

## 2. Key Features

| Phase | 기능 | 설명 |
| :--- | :--- | :--- |
| **Phase 1** | **IoT 센서 데이터 시뮬레이션** | 가상의 GPS 위치 및 보관 온도 데이터를 주기적(5초 간격)으로 생성하고 백엔드로 전송하는 시뮬레이터 스크립트 구축 |
| **Phase 1** | **실시간 대시보드 모니터링** | React 프론트엔드 및 Socket.io를 통해 실시간 이동 경로 및 온도 추이 그래프(Recharts) 표시 |
| **Phase 1** | **초저온 임계치 실시간 경고** | 보관 온도 임계치($-55^\circ\text{C}$) 이탈 감지 시 즉각적인 실시간 웹 푸시 알림 및 경고 상태 표시 |
| **Phase 1** | **블록체인 무결성 기록 (On-chain)** | 어획 완료, 하역 완료, 가공 완료, 배송 완료 등 주요 마일스톤 도달 시 데이터를 해싱하여 스마트 계약에 영구 기록 |
| **Phase 1** | **소비자용 QR 이력 조회 및 검증** | 소비자 모바일 뷰에서 QR 코드 스캔 시 오프체인 DB 정보와 온체인 스마트 계약 해시값을 대조하여 데이터 무결성을 실시간 검증 및 시각화 |
| **Phase 1** | **기본 재고 및 발주 관리** | 백엔드(NestJS + TypeORM) 기반의 기본 재고 상태 추적 및 다역할(OPERATOR, MANAGER, ADMIN) 결재 워크플로우 관리 |
| **Phase 2** | **ETL 데이터 파이프라인** | 시계열 센서 정보 및 발주 데이터를 Mart 테이블 형태로 가공하는 정기 Python ETL 파이프라인 구축 |
| **Phase 2** | **AI 수요 및 재고 폐기 예측** | XGBoost/LightGBM 기반의 7/14/30일 예측 모델 및 온도 이탈 빈도에 따른 신선도 저하/재고 손실 확률 예측 |
| **Phase 2** | **예측 결과 XAI 시각화** | SHAP 피처 중요도를 활용하여 예측 결과에 대한 기여 원인을 대시보드에 직관적으로 시각화 |

---

## 3. Architecture

```
+-----------------------------------------------------------------------------------+
|                                 1. IoT Simulator                                  |
|         (Simulates Temp/GPS data and transmits to Backend every 5 seconds)        |
+-----------------------------------------------------------------------------------+
                                          |
                                          | HTTP POST / WebSocket
                                          v
+-----------------------------------------------------------------------------------+
|                                2. NestJS Backend                                  |
|   +------------------------------------+--------------------------------------+   |
|   | Socket.io Gateway (Real-time Hub)  | Ethers.js Client (Web3 Integrator)   |   |
|   +------------------------------------+--------------------------------------+   |
|   | NestJS Modules (Users, Inventory,  | ETL/ML API Endpoints (Phase 2)       |   |
|   |                 Orders, Audit Logs)|                                      |   |
|   +------------------------------------+--------------------------------------+   |
+-----------------------------------------------------------------------------------+
           |                              |                              |
           | PostgreSQL                   | MongoDB                      | Smart Contract
           | Connection                   | Connection                   | Call (JSON-RPC)
           v                              v                              v
+----------------------+      +----------------------+      +-----------------------+
|  PostgreSQL Database |      |   MongoDB Database   |      |  Hardhat Local Chain  |
|                      |      |                      |      |                       |
| - Users & Admin Roles|      | - IoT Sensor Raw Log |      | - Solidity Smart      |
| - Inventory & Orders |      | - Off-chain Metadata |      |   Contract            |
| - Predictions (Ph 2) |      |                      |      | - Tamper-proof Hash   |
+----------------------+      +----------------------+      +-----------------------+
           ^                                                             ^
           | Read DB Data                                                | Read On-chain Hash
           +------------------------------+------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                 3. Frontend App                                   |
|   +---------------------------------------------------------------------------+   |
|   | Admin Dashboard (Vite + React)                                            |   |
|   | - Real-time Location Map (GPS Tracking)                                   |   |
|   | - Real-time Temp Chart (Recharts) with threshold line (-55°C)             |   |
|   | - Purchase Order Status Tracker                                           |   |
|   +---------------------------------------------------------------------------+   |
|   | Consumer Mobile View (QR scanner page for integrity check)                |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 4. Tech Stack

| 영역 (Area) | 기술 스택 (Tech Stack) | 도입 단계 (Phase) | 도입 목적 및 상세 |
| :--- | :--- | :--- | :--- |
| **Frontend** | React (v19) | Phase 1 | 컴포넌트 기반 상태 관리 및 SPA UI 렌더링 |
| **Frontend** | Ant Design (v6) | Phase 1 | 관리자 대시보드 구축을 위한 엔터프라이즈급 UI 컴포넌트 라이브러리 |
| **Frontend** | Recharts | Phase 1 | 초저온 기준 및 이상 감지선이 반영된 실시간 시각화 차트 |
| **Backend** | NestJS (v10) | Phase 1 | 구조화된 모듈식 아키텍처 및 의존성 주입(DI) 지원을 통한 확장성 확보 |
| **Backend** | Socket.io | Phase 1 | 백엔드-프론트엔드 간 양방향 실시간 센서 및 경고 이벤트 스트리밍 |
| **Backend** | TypeORM | Phase 1 | PostgreSQL 데이터베이스 객체 관계 매핑(ORM) 및 스키마 마이그레이션 관리 |
| **Backend** | Ethers.js | Phase 1 | EVM 호환 블록체인 네트워크 및 스마트 계약 트랜잭션 전송 및 조회 |
| **Database** | PostgreSQL (v15) | Phase 1 | 사용자 정보, 발주 승인 로그, 기본 재고 메타데이터 관리 (RDBMS) |
| **Database** | MongoDB | Phase 1 | 대용량 고주기 IoT 시계열 데이터(온도/GPS)를 적재하기 위한 오프체인 스토리지 |
| **Database** | Redis | Phase 1 | 실시간 이상 징후 알림 캐싱 및 시뮬레이터 실시간 상태 캐시 관리 |
| **Blockchain**| Solidity | Phase 1 | 신뢰성 검증용 해시 및 체크포인트를 기록하기 위한 스마트 계약 작성 |
| **Blockchain**| Hardhat | Phase 1 | 로컬 개발 환경용 블록체인 테스트 네트워크 구동 및 스마트 계약 컴파일/배포 |
| **ETL Pipeline**| Python (v3.10) | Phase 2 | Raw 및 Off-chain 데이터를 Mart 테이블로 정제하기 위한 Python 엔진 |
| **ETL Pipeline**| SQLAlchemy | Phase 2 | 데이터 변환 및 적재 작업을 위해 데이터베이스 엔티티와 연동하는 ORM 라이브러리 |
| **ML Engine** | XGBoost / LightGBM | Phase 2 | 과거 보관 환경 요소를 통합 분석하여 수요 및 폐기 리스크 예측 모델 구축 |
| **ML Engine** | SHAP | Phase 2 | AI 모델 예측의 설명 가능성(Explainable AI) 확보 및 중요 피처 중요도 분석 |

---

## 5. Project Structure

```
.
├── backend/                        # NestJS Backend Application
│   ├── src/
│   │   ├── auth/                   # 사용자 인증 및 JWT 전략
│   │   ├── config/                 # 환경 변수 및 DB 연결 설정
│   │   ├── database/               # 마이그레이션 파일 및 초기 데이터 시딩(Seed)
│   │   ├── entities/               # PostgreSQL 관계형 테이블 스키마 정의 (TypeORM)
│   │   ├── users/                  # 회원 가입 및 RBAC 권한 관리 (ADMIN, OPERATOR, MANAGER)
│   │   ├── inventory/              # 보관중인 참치 품목 및 재고 상태 관리
│   │   ├── purchase-orders/        # 발주 신청, 결재(결재선 상태) 워크플로우 관리
│   │   ├── notifications/          # 실시간 소켓 통신 게이트웨이 (Socket.io)
│   │   ├── predictions/            # AI 예측 결과 저장용 스키마 및 서비스 (Phase 2)
│   │   ├── audit-logs/             # 유통 과정 위변조 증적용 백업 로깅
│   │   └── main.ts                 # 애플리케이션 진입점
│   ├── contracts/                  # Solidity Smart Contracts (Phase 1)
│   │   └── ColdChainTracker.sol    # 유통 체크포인트 해시 검증 스마트 계약
│   ├── scripts/                    # 블록체인 배포 및 태스크 실행 스크립트
│   │   └── deploy.ts               # 스마트 계약 로컬 네트워크 배포 스크립트
│   ├── package.json
│   └── tsconfig.json
├── frontend/                       # Vite + React Frontend Application
│   ├── src/
│   │   ├── assets/                 # 이미지, 아이콘 등 정적 자원
│   │   ├── components/             # 지도(GPS), 온도 실선 그래프, 승인 요청 공통 컴포넌트
│   │   ├── config/                 # 환경 설정 및 글로벌 상수 설정
│   │   ├── contexts/               # 전역 상태(Auth context, Socket connection)
│   │   ├── pages/                  # 관리자 메인 대시보드, 소비자 QR 검증용 퍼블릭 페이지
│   │   ├── routes/                 # 대시보드 권한 라우터 정의
│   │   ├── services/               # REST API 통신(Axios) 및 Web3 블록체인 노드 통신 레이어
│   │   ├── App.tsx                 # 최상위 React 컴포넌트 및 기본 테마 정의
│   │   └── main.tsx                # 프론트엔드 진입점
│   ├── package.json
│   └── tsconfig.json
├── etl/                            # 데이터 파이프라인 (Phase 2)
│   ├── scripts/                    # 데이터 변환 파이프라인 (Python)
│   └── requirements.txt            # ETL 모듈 설치 패키지 목록
├── ml/                             # 머신러닝 모듈 (Phase 2)
│   ├── scripts/                    # XGBoost/LightGBM 모델 훈련 및 추론 스크립트
│   └── requirements.txt            # ML 필수 라이브러리 목록
├── docker-compose.yml              # Local Infra (PostgreSQL 15, MongoDB, Redis 컨테이너 구성)
├── PROJECT-OVERVIEW.md             # 프로젝트의 초기 아이디어 및 기획 명세서
└── README.md                       # 메인 프로젝트 문서 (본 파일)
```

### Dependency Flow (패키지 의존성 방향)
```
[IoT Simulator] ------------------------+
       | (HTTP POST / WebSocket)        |
       v                                v
[React Frontend] (REST / Socket.io) -> [NestJS Backend] -> (TypeORM) -> [PostgreSQL]
       |                                   |            -> (Mongoose) -> [MongoDB]
       |                                   |            -> (Redis-Client) -> [Redis]
       | (JSON-RPC / Web3)                 | (Ethers.js)
       v                                   v
[Hardhat EVM Local Network] <---------------+
       ^
       |
[Solidity Smart Contract (ColdChainTracker.sol)]
       ^
       | (Read / Write for Integrity Verification)
[ETL & ML (Phase 2)] -> (Extract) -> [PostgreSQL/MongoDB] -> (Load) -> [PostgreSQL Mart]
```

---

## 6. Getting Started

### Prerequisites
프로젝트 실행을 위해 로컬 환경에 다음 도구들이 설치되어 있어야 합니다.
* **Node.js**: `v18.x` 이상
* **Docker & Docker Compose**: 로컬 데이터베이스 및 인프라 서버 구성용
* **Python**: `v3.10` 이상 (Phase 2 실행용)

---

### Installation & Run

#### Step 1. 리포지토리 클론 및 인프라 서버 기동 (Docker)
```bash
# 리포지토리 클론
git clone https://github.com/somui/ml-demand-analyzer.git
cd ml-demand-analyzer

# Docker Compose를 이용해 PostgreSQL, MongoDB, Redis 컨테이너 동시 기동
docker-compose up -d
```

#### Step 2. 로컬 블록체인 네트워크 기동 및 스마트 계약 배포
```bash
# backend 디렉토리로 이동하여 관련 패키지 설치
cd backend
npm install

# 가상 로컬 EVM 블록체인 네트워크(Hardhat Node) 실행
npx hardhat node &

# 다른 터미널 혹은 백그라운드에서 로컬 네트워크로 스마트 계약 컴파일 및 배포
npx hardhat run scripts/deploy.ts --network localhost
```

#### Step 3. Backend 서버 설정 및 마이그레이션 실행
```bash
# .env.example 파일을 복사하여 환경 설정 생성
cp .env.example .env

# 데이터베이스 테이블 생성을 위한 TypeORM 마이그레이션 실행
npm run migration:run

# NestJS 백엔드 애플리케이션 실행 (개발 모드)
npm run start:dev
```

#### Step 4. Frontend 서버 기동
```bash
# 별도의 터미널 창에서 frontend 폴더로 이동
cd ../frontend
npm install

# .env.example 파일을 복사하여 환경 설정 생성
cp .env.example .env

# Vite 개발 서버 실행
npm run dev
```

#### Step 5. IoT 시뮬레이터 실행 (실시간 데이터 스트리밍 테스트)
```bash
# backend 폴더 내에 포함된 IoT 시뮬레이터 스크립트 실행 (5초 주기 온도/GPS 전송 시작)
cd ../backend
npm run start:simulator
```

#### Step 6. 테스트 수행
```bash
# 백엔드 Jest 단위 테스트 및 E2E 테스트 실행
cd ../backend
npm test

# 프론트엔드 빌드 및 코드 린트 검사
cd ../frontend
npm run lint
```
