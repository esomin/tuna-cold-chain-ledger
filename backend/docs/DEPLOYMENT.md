# 도커 배포 가이드 (Docker Compose Deployment Guide)

본 가이드는 클라우드 VM(GCP Compute Engine, AWS EC2) 또는 온프레미스 단일 서버 환경에서 **Docker Compose**를 사용하여 **Tuna Cold Chain Ledger** 서비스를 배포하고 운영하는 방법을 안내합니다.

---

## 도커 네트워크 및 서버 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Docker Network (coldchain-net)                         │
│                                                                                 │
│   ┌──────────────┐         ┌──────────────┐         ┌───────────────────────┐   │
│   │   frontend   │ ◄─────► │   backend    │ ◄─────► │     hardhat-node      │   │
│   │ (Vite Nginx) │         │   (NestJS)   │         │ (Local EVM SmartCont) │   │
│   └──────────────┘         └──────┬───────┘         └───────────────────────┘   │
│                                   │                                             │
│                 ┌─────────────────┼─────────────────┐                           │
│                 ▼                 ▼                 ▼                           │
│        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│        │  postgres-db    │ │  MongoDB Atlas  │ │    redis-cache  │              │
│        │ (PostgreSQL 15) │ │  (Cloud NoSQL)  │ │   (Redis 7.0)   │              │
│        └─────────────────┘ └─────────────────┘ └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 주요 도커 구성 파일

| 파일 경로 | 설명 |
| :--- | :--- |
| [`compose.yml`](file:///Users/somui/workplace/tuna-cold-chain-ledger/compose.yml) | VM/서버 배포 환경 원터치 풀스택 컨테이너 오케스트레이션 설정 |
| [`compose-local.yml`](file:///Users/somui/workplace/tuna-cold-chain-ledger/compose-local.yml) | 로컬 개발용 인프라 전용 도커 설정 (프론트/백은 호스트 런타임 실행) |
| [`.env.example`](file:///Users/somui/workplace/tuna-cold-chain-ledger/.env.example) | 도커 환경 변수 템플릿 파일 |
| [`backend/Dockerfile`](file:///Users/somui/workplace/tuna-cold-chain-ledger/backend/Dockerfile) | NestJS 백엔드 프로덕션용 Dockerfile |
| [`backend/.dockerignore`](file:///Users/somui/workplace/tuna-cold-chain-ledger/backend/.dockerignore) | node_modules, dist, .env 등 불필요한 빌드 컨텍스트 제외 |
| [`frontend/Dockerfile`](file:///Users/somui/workplace/tuna-cold-chain-ledger/frontend/Dockerfile) | React SPA 프로덕션용 멀티 스테이지 Dockerfile (Node Build -> Nginx Serve) |
| [`frontend/.dockerignore`](file:///Users/somui/workplace/tuna-cold-chain-ledger/frontend/.dockerignore) | node_modules, dist, .env 등 빌드 제외 파일 설정 |

---

## 배포 및 실행 단계

### 1단계. 사전 준비 (서버 환경)
서버에 Docker 및 Docker Compose 플러그인이 설치되어 있어야 합니다.
```bash
# Docker 동작 여부 확인
docker --version
docker compose version
```

### 2단계. 프로젝트 소스 코드 클론 및 디렉토리 이동
```bash
git clone <REPOSITORY_URL>
cd tuna-cold-chain-ledger
```

### 3단계. 환경 변수 설정
`.env.example`을 복사하여 `.env` 파일로 저장한 후 서버 환경에 맞춰 환경 변수 값을 수정합니다.

```bash
cp .env.example .env
```

#### `.env` 작성 예시
```env
# Node & App 설정
NODE_ENV=production
PORT=3000

# PostgreSQL 설정 (RDBMS - 유저, 발주, 재고 데이터)
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres_secure_pass
DB_DATABASE=inventory_db

# MongoDB Atlas 설정 (NoSQL Cloud DB - IoT 센서 Raw 텔레메트리 로그)
# Atlas 대시보드의 Connection String(사용자명, 비밀번호, 클러스터 주소) 입력
MONGO_URI=mongodb+srv://<ATLAS_USER>:<ATLAS_PASSWORD>@cluster0.xxxxx.mongodb.net/coldchain?retryWrites=true&w=majority

# Redis 설정 (온도 경고 피드 및 세션 캐싱)
REDIS_HOST=redis
REDIS_PORT=6379

# Web3 & 스마트 계약 설정
CONTRACT_ADDRESS=0xc4040d7Cdbc6923500A94427DB9c78156d70849A
HARDHAT_NETWORK_URL=http://hardhat:8545
```

### 4단계. 서비스 빌드 및 백그라운드 실행

#### A. 로컬 개발 환경 (프론트/백엔드는 내 맥/PC 런타임에서 실행 시)
인프라 데이터베이스(PostgreSQL, MongoDB, Redis)만 로컬 도커로 띄웁니다:
```bash
docker compose -f compose-local.yml up -d
```

#### B. 서버/VM 실제 배포 환경 (풀스택 컨테이너 빌드 & 실행 시)
```bash
docker compose -f compose.yml up -d --build
```

### 5단계. 데이터베이스 마이그레이션 및 초기 시드 주입 (선택)
데이터베이스 테이블 생성 및 초기 선단/발주 데이터를 주입합니다.
```bash
docker compose -f compose.yml exec backend npm run migration:run
```

---

## 모니터링 및 운영 관리

```bash
# 컨테이너 상태 확인
docker compose -f compose.yml ps

# 실시간 전체 서비스 로그 확인
docker compose -f compose.yml logs -f

# 서비스 중지 및 코드 수정 후 재시작
docker compose -f compose.yml down
docker compose -f compose.yml up -d --build
```

---

## 방화벽 / 보안 그룹(Security Group) 설정

클라우드 콘솔(GCP Firewall Rules 또는 AWS Security Group)에서 아래 인바운드 포트를 허용해야 정상 접속이 가능합니다:
- **5173 (TCP)** 또는 **80 (TCP)**: 프론트엔드 대시보드 및 소비자 QR 검증 웹뷰 접속
- **3000 (TCP)**: 백엔드 REST API 및 Socket.io WebSocket (`/api`, `ws://`) 접속
- **8545 (TCP)**: (선택) Hardhat 로컬 EVM JSON-RPC 테스트 네트워크 접속
