# Tuna Cold Chain Ledger (참치 초저온 콜드체인 모니터링 시스템)

## 1. Overview
Tuna Cold Chain Ledger는 참치 유통 경로 및 초저온 보관 상태($-60^\circ\text{C}$)를 실시간으로 추적·모니터링하고, 데이터 위·변조를 방지하는 가상 블록체인 기반의 콜드체인 모니터링 시스템입니다.

* **프로젝트 배경**: 참치와 같은 최고급 횟감용 수산물은 가공 및 유통 과정에서 초저온 보관 온도($-60^\circ\text{C}$)가 엄격히 유지되어야 신선도가 보존되고 폐기 손실을 막을 수 있습니다. 유통 이력에 대한 투명하고 신뢰도 높은 데이터를 확보하기 위해 블록체인 스마트 계약 기술을 접목하였습니다.
* **프로젝트 범위**: 본 리드미는 실시간 IoT 센서 데이터 수집 파이프라인 및 모니터링 경고, 그리고 블록체인을 통한 데이터 무결성 검증을 다루는 **Phase 1** 명세서입니다.
* **Phase 2 로드맵**: 수집된 데이터를 바탕으로 AI 기반 재고 및 수요 예측을 연동하는 고도화 과정은 [PHASE2-OVERVIEW.md](./PHASE2-OVERVIEW.md) 파일에 명세되어 있습니다.

---

## 2. Key Features
* **IoT 센서 데이터 시뮬레이션**
  * Node.js 백엔드 스크립트를 활용해 5초 주기로 가상의 GPS 위치(위·경도) 및 온도 데이터를 무작위로 생성하여 전송하는 환경 구축.
* **실시간 대시보드 및 모니터링**
  * React 및 Socket.io 웹소켓 통신을 이용해 차량 및 선박의 이동 경로와 실시간 온도 그래프(Recharts)를 렌더링.
* **초저온 임계치 실시간 경고**
  * 보관 온도가 안전 임계치인 $-55^\circ\text{C}$를 초과하여 이탈할 경우 프론트엔드 대시보드에 즉각적인 위험 감지 알림 이벤트 전송.
* **블록체인 무결성 기록 (On-chain)**
  * 어획 완료, 하역 완료, 가공 완료, 배송 완료 등 주요 체크포인트 마일스톤 도달 시 핵심 요약본과 데이터 해시(Hash) 값을 Hardhat 기반 로컬 EVM 스마트 계약에 기록.
* **소비자용 QR 이력 조회 및 무결성 검증**
  * 소비자가 모바일 기기로 QR 코드를 스캔할 때 제공되는 웹 뷰로, DB 데이터의 해시와 블록체인 온체인에 기록된 해시를 비교하여 변조 여부("데이터 무결성 인증 완료")를 시각적으로 검증.
* **기본 재고 및 발주 관리**
  * NestJS와 TypeORM을 통해 원본 데이터를 CRUD하고 발주 결재 프로세스(DRAFT -> PENDING -> APPROVED/REJECTED -> COMPLETED) 및 역할 기반 권한 제어(RBAC) 제공.

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
|   | NestJS Modules (Users, Inventory,  | Audit-logs Engine (Tamper-proofing)  |   |
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
| - Audit Trail Logs   |      |                      |      | - Tamper-proof Hash   |
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

| 영역 (Area) | 기술 스택 (Tech Stack) | 도입 목적 및 상세 |
| :--- | :--- | :--- |
| **Frontend** | React (v19), Ant Design (v6), Recharts | 대시보드 UI 컴포넌트 빌드 및 실시간 그래프 시각화 |
| **Frontend** | Ethers.js | 스마트 계약 검증 정보 직접 조회 및 Web3 연동 |
| **Backend** | NestJS (v10) | 모듈식 아키텍처 및 의존성 주입(DI)으로 높은 테스트 가능성과 확장성 제공 |
| **Backend** | Socket.io | 실시간 IoT 데이터 브로드캐스팅 및 경고 이벤트 처리 |
| **Backend** | TypeORM | PostgreSQL 데이터 모델 매핑 및 마이그레이션 도구 |
| **Backend** | Ethers.js | 트랜잭션 서명 및 Hardhat 로컬 블록체인 네트워크 호출 |
| **Database** | PostgreSQL (v15) | 사용자, 권한(RBAC), 재고 마스터 데이터 관리 |
| **Database** | MongoDB | 초 단위 수집 센서 로그 및 이력 정보의 대용량 저장을 위한 오프체인 스토리지 |
| **Database** | Redis | 실시간 한계치 이탈 경고 발생 여부 캐싱 및 임시 세션 상태 관리 |
| **Blockchain** | Solidity, Hardhat | 가상 로컬 EVM 환경 상에 무결성 보장용 스마트 계약 컴파일 및 로컬 배포 |
| **DevSecOps** | Docker, Docker Compose | RDBMS, NoSQL, Redis 인프라 환경의 가상 네트워크 분리 및 격리 구동 |

---

## 5. Project Structure

```
.
├── backend/                        # NestJS Backend API
│   ├── src/
│   │   ├── auth/                   # 인증 및 JWT
│   │   ├── config/                 # 환경 설정
│   │   ├── database/               # DB 마이그레이션 & 시드
│   │   ├── entities/               # DB 엔티티 (TypeORM)
│   │   ├── users/                  # 사용자 및 권한(RBAC)
│   │   ├── inventory/              # 재고 관리
│   │   ├── purchase-orders/        # 발주 및 결재 워크플로우
│   │   ├── notifications/          # 알림 (Socket.io)
│   │   ├── audit-logs/             # 감사 로그
│   │   └── main.ts                 # 서버 진입점
│   ├── contracts/                  # 스마트 계약 (Solidity)
│   │   └── ColdChainTracker.sol    # 해시 검증 스마트 계약
│   └── scripts/                    # 배포 스크립트 (deploy.ts)
├── frontend/                       # Vite + React Client
│   ├── src/
│   │   ├── assets/                 # 정적 자산
│   │   ├── components/             # 공통 UI 컴포넌트 (지도, 그래프 등)
│   │   ├── config/                 # 글로벌 환경 설정
│   │   ├── contexts/               # 전역 상태 관리 (Context API)
│   │   ├── pages/                  # 대시보드 및 QR 검증 페이지
│   │   ├── routes/                 # 라우터 및 권한 가드
│   │   ├── services/               # 백엔드 API & Web3 서비스
│   │   ├── App.tsx                 # 최상위 앱 컴포넌트
│   │   └── main.tsx                # 앱 진입점
│   ├── package.json
│   └── tsconfig.json
├── etl/                            # 데이터 파이프라인 (Phase 2 준비 구역)
├── ml/                             # 머신러닝 모듈 (Phase 2 준비 구역)
├── docker-compose.yml              # RDBMS, NoSQL, Redis 인프라 구성 파일
├── PROJECT-OVERVIEW.md             # 프로젝트 초기 기획 및 명세서
├── PHASE2-OVERVIEW.md              # Phase 2 AI 예측 시스템 오버뷰 명세
└── README.md                       # 통합 프로젝트 메인 문서 (본 파일)
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
```

---

## 6. Getting Started

### Prerequisites
* **Node.js**: `v18.x` 이상
* **Docker & Docker Compose**

### Quick Start (Core Commands)

```bash
# 1. 인프라 서비스 실행 (PostgreSQL, MongoDB, Redis)
docker-compose up -d

# 2. 로컬 블록체인 네트워크 기동 및 스마트 계약 배포
cd backend && npm install
npx hardhat node &
npx hardhat run scripts/deploy.ts --network localhost

# 3. 백엔드 데이터베이스 마이그레이션 및 서버 실행
npm run migration:run
npm run start:dev &

# 4. 프론트엔드 의존성 설치 및 실행
cd ../frontend && npm install
npm run dev
```
