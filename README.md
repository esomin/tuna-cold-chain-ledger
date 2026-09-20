# Tuna Cold Chain Ledger (참치 초저온 콜드체인 모니터링 시스템)

## 1. Overview
Tuna Cold Chain Ledger는 참치 유통 경로 및 공정별 초저온 보관 상태(기본 규격 $-55^\circ\text{C}$)를 실시간으로 추적·모니터링하고, 데이터 위·변조를 방지하는 가상 블록체인 기반의 콜드체인 모니터링 시스템입니다.

* **프로젝트 배경**: 참치와 같은 최고급 횟감용 수산물은 가공 및 유통 과정에서 목표 보관 온도($-55^\circ\text{C}$)가 엄격히 유지되어야 미오글로빈 산화(갈변 현상)를 방지하고 신선도를 보존할 수 있습니다. 유통 이력에 대한 투명하고 신뢰도 높은 데이터를 확보하기 위해 블록체인 스마트 계약 기술을 접목하였습니다.
* **프로젝트 범위**: 본 문서는 실시간 IoT 센서 데이터 수집 파이프라인, 공정 4단계(어획·가공·운송·입고)별 차등화된 목표 온도 및 안전 임계치(Safety / Warning) 관리 체계, 그리고 블록체인을 통한 데이터 무결성 검증을 다루는 명세서입니다.
* **개발 로드맵 및 상세 시나리오**: 단계별 개발 계획 및 시나리오는 [ROADMAP.md](./ROADMAP.md) 및 [SCENARIOS.md](./SCENARIOS.md) 파일에 명세되어 있습니다.

---

## 2. Key Features
* **IoT 센서 데이터 시뮬레이션 & 센서 동기화**
  * Node.js 백엔드 스크립트 및 WebSocket을 통해 5초 주기로 가상의 GPS 위치(위·경도) 및 초저온 온도 데이터를 전송 및 대시보드 온디맨드 센서 동기화(`GET /api/purchase-orders/:id/telemetry/latest`).
* **원양 어선단(Fleet) 관제 & 출항지 홈포트 동기화**
  * 원양 어선단(태평양 3호선 `NP3`, 태평양 7호선 `PC7`, 태평양 12호선 `PF12`)의 출항지 홈포트(포항 구룡포항, 부산 감천항만, 인천항) 정보 및 궤도 좌표 DB 자동 시딩 및 관제 연동.
* **실시간 대시보드 및 MapLibre GL 위성 지도 관제**
  * React, Socket.io 및 MapLibre GL 실시간 벡터 지도를 이용해 선박의 궤적 좌표 위치와 실시간 온도 추이 그래프(Recharts) 시각화.
* **공정 단계별 목표 온도 및 안전 임계치 모니터링 (Temperature Compliance Standard)**
  * 식품 콜드체인(HACCP) 및 참치 유통 특성을 반영하여, 보관·운송 구간과 원어 절단·손질이 진행되는 가공 구간의 모니터링 기준을 차등 적용합니다:

| 공정 단계 | 모니터링 대상 기준 | 목표 온도 (Target) | 안전 임계치 (Safety / Warning) |
| :--- | :--- | :---: | :---: |
| **1. 어획 단계** | 급속 동결실 및 어창 내부 | **-55°C** | **-45°C** |
| **2. 가공 단계** | 작업 중 원어 및 블록 표면 | **-25°C** | **-22°C** |
| **3. 운송 단계** | 초저온 리퍼 컨테이너 내부 | **-55°C** | **-45°C** |
| **4. 입고 단계** | 초저온 물류 창고 내부 | **-55°C** | **-45°C** |

  * **목표 온도 (Target)**: 최적 품질 및 선도를 보존하기 위해 상시 유지해야 하는 기준 온도 (1·3·4단계: $-55^\circ\text{C}$, 2단계: $-25^\circ\text{C}$).
  * **안전 임계치 (Safety / Warning)**: 해당 온도 초과 시 품질 저하 주의 및 이상 징후로 판단하여 대시보드 이상 경보(Alert) 및 이탈 사건(Excursion Incident)으로 집계 (1·3·4단계: $-45^\circ\text{C}$, 2단계: $-22^\circ\text{C}$).
* **블록체인 무결성 기록 (On-chain) & Sepolia Etherscan Explorer**
  * 어획 완료(`HARVESTED`), 가공 완료(`PROCESSING`), 운송중(`IN_TRANSIT`), 입고 완료(`DELIVERED`) 등 4단계 체크포인트 도달 시 Keccak256 데이터 해시(Hash) 값을 Sepolia/로컬 EVM 스마트 계약에 기록하고 Etherscan 원장 탐색기 제공.
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
|   | NestJS Modules (Users, Inventory,  | Audit-logs & Fleets Module           |   |
|   |   Purchase Orders, Fleets, Audit)  | (Tamper-proofing & Fleet DB)         |   |
|   +------------------------------------+--------------------------------------+   |
+-----------------------------------------------------------------------------------+
           |                              |                              |
           | PostgreSQL                   | MongoDB                      | Smart Contract
           | Connection                   | Connection                   | Call (JSON-RPC)
           v                              v                              v
+----------------------+      +----------------------+      +-----------------------+
|  PostgreSQL Database |      |   MongoDB Database   |      | Sepolia / Hardhat     |
|                      |      |                      |      | Smart Contract        |
| - Users & Admin Roles|      | - IoT Sensor Raw Log |      | - ColdChainTracker.sol|
| - Inventory & Orders |      | - Off-chain Metadata |      | - Keccak256 Integrity |
| - Fleets Master DB   |      |                      |      |   Hash Checkpoints    |
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
|   | - MapLibre GL Real-time Location Map (GPS Tracking)                       |   |
|   | - Real-time Temp Chart (Recharts) with segmented stage thresholds         |
|   |   (Target: -55°C/-25°C, Warning: -45°C/-22°C)                             |
|   | - Purchase Order Status Tracker & Fleet Information                       |   |
|   +---------------------------------------------------------------------------+   |
|   | On-Chain Ledger Explorer & Consumer QR Scanner Integrity Verification View|   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 4. Tech Stack

| 영역 (Area) | 기술 스택 (Tech Stack) | 도입 목적 및 상세 |
| :--- | :--- | :--- |
| **Frontend** | React (v19), TailwindCSS, Recharts | 대시보드 UI 컴포넌트 빌드 및 실시간 그래프 시각화 |
| **Frontend** | MapLibre GL | 어선단 및 운송 차량의 실시간 GPS 위치 동적 지도 시각화 |
| **Frontend** | Ethers.js | 스마트 계약 검증 정보 직접 조회 및 Web3 연동 |
| **Backend** | NestJS (v10) | 모듈식 아키텍처 및 의존성 주입(DI)으로 높은 테스트 가능성과 확장성 제공 |
| **Backend** | Socket.io | 실시간 IoT 데이터 브로드캐스팅 및 경고 이벤트 처리 |
| **Backend** | TypeORM | PostgreSQL/SQLite 데이터 모델 매핑 및 마이그레이션 도구 |
| **Backend** | Ethers.js | 트랜잭션 서명 및 Sepolia/Hardhat 블록체인 네트워크 호출 |
| **Database** | PostgreSQL (v15) | 사용자, 권한(RBAC), 재고, 어선단(Fleet) 마스터 데이터 관리 |
| **Database** | MongoDB | 초 단위 수집 센서 로그 및 이력 정보의 대용량 저장을 위한 오프체인 스토리지 |
| **Database** | Redis | 실시간 한계치 이탈 경고 발생 여부 캐싱 및 임시 세션 상태 관리 |
| **Blockchain** | Solidity, Hardhat, Sepolia | EVM 환경 상에 무결성 보장용 스마트 계약 배포 및 Etherscan 검증 |
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
│   │   ├── entities/               # DB 엔티티 (PurchaseOrder, Fleet 등)
│   │   ├── fleets/                 # 어선단 관리 및 출항지 좌표 서비스
│   │   ├── users/                  # 사용자 및 권한(RBAC)
│   │   ├── inventory/              # 재고 관리
│   │   ├── purchase-orders/        # 발주/결재 및 텔레메트리 조회
│   │   ├── notifications/          # 알림 (Socket.io)
│   │   ├── audit-logs/             # 감사 로그 엔진
│   │   └── main.ts                 # 서버 진입점
│   ├── contracts/                  # 스마트 계약 (Solidity)
│   │   └── ColdChainTracker.sol    # 해시 검증 스마트 계약
│   └── scripts/                    # 배포 스크립트 (deploy.ts)
├── frontend/                       # Vite + React Client
│   ├── src/
│   │   ├── assets/                 # 정적 자산
│   │   ├── components/             # 공통 UI 컴포넌트 (LiveMaplibreMap 등)
│   │   ├── config/                 # 글로벌 환경 설정
│   │   ├── contexts/               # 전역 상태 관리 (Context API)
│   │   ├── pages/                  # 대시보드, 원장탐색기 및 QR 검증 페이지
│   │   ├── routes/                 # 라우터 및 권한 가드
│   │   ├── services/               # 백엔드 API & Web3 서비스
│   │   ├── App.tsx                 # 최상위 앱 컴포넌트
│   │   └── main.tsx                # 앱 진입점
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml              # RDBMS, NoSQL, Redis 인프라 구성 파일
├── PROJECT-OVERVIEW.md             # 프로젝트 초기 기획 및 명세서
├── ROADMAP.md                      # 프로젝트 로드맵 및 개발 마일스톤
├── SCENARIOS.md                    # 블록체인 검증 시나리오 명세서
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
