# 도커 배포 가이드 (Docker Compose Deployment Guide)

본 가이드는 클라우드 VM(GCP Compute Engine, AWS EC2) 또는 온프레미스 단일 서버 환경에서 **Docker Compose**를 사용하여 **Tuna Cold Chain Ledger** 서비스를 배포하고 운영하는 방법을 안내합니다.

---

## 도커 네트워크 및 서버 아키텍처

배포 환경은 VM 내부에 경량화된 컨테이너 서비스(Nginx, NestJS, PostgreSQL, Redis)를 가동하고, IoT 센서 대용량 데이터는 **MongoDB Atlas(Cloud)**, 위변조 방지 원장은 **Ethereum Sepolia Testnet**과 안전하게 연동합니다.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Docker Network (coldchain-net)                         │
│                                                                                 │
│   ┌──────────────┐         ┌──────────────┐         ┌───────────────────────┐   │
│   │   frontend   │ ◄─────► │   backend    │ ◄─────► │  Ethereum Sepolia     │   │
│   │ (Vite Nginx) │         │   (NestJS)   │         │  (Public Testnet)     │   │
│   │  [Port 5173] │         │  [Port 3000] │         │  (Etherscan Verified) │   │
│   └──────────────┘         └──────┬───────┘         └───────────────────────┘   │
│                                   │                                             │
│                 ┌─────────────────┼─────────────────┐                           │
│                 ▼                 ▼                 ▼                           │
│        ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│        │  coldchain_db   │ │  MongoDB Atlas  │ │    redis-cache  │              │
│        │ (PostgreSQL 15) │ │  (Cloud NoSQL)  │ │   (Redis 7.2)   │              │
│        └─────────────────┘ └─────────────────┘ └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 주요 구성 파일

| 파일 경로 | 설명 |
| :--- | :--- |
| [`compose.yml`](../compose.yml) | VM/서버 배포 환경 원터치 풀스택 컨테이너 오케스트레이션 설정 |
| [`compose-local.yml`](../compose-local.yml) | 로컬 개발용 인프라 전용 도커 설정 (프론트/백은 호스트 런타임 실행) |
| [`.env.example`](../.env.example) | 프로덕션/배포용 환경 변수 템플릿 파일 (Sepolia 연동) |
| [`.env.local.example`](../.env.local.example) | 로컬 개발용 환경 변수 템플릿 파일 (Hardhat 연동) |
| [`backend/Dockerfile`](../backend/Dockerfile) | NestJS 백엔드 프로덕션용 Dockerfile |
| [`frontend/Dockerfile`](../frontend/Dockerfile) | React SPA 프로덕션용 멀티 스테이지 Dockerfile (Node Build -> Nginx Serve) |

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

#### `.env` 작성 예시 (Production / Sepolia Testnet)
```env
# Node & App 설정
NODE_ENV=production
PORT=3000

# PostgreSQL 설정 (RDBMS - 유저, 발주, 재고 데이터)
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres_secure_pass
DB_DATABASE=coldchain_db

# Auth JWT 시크릿 키
JWT_SECRET=your_production_secure_jwt_secret_key

# MongoDB Atlas 설정 (NoSQL Cloud DB - IoT 센서 Raw 텔레메트리 로그)
MONGO_URI=mongodb+srv://<ATLAS_USER>:<ATLAS_PASSWORD>@cluster0.xxxxx.mongodb.net/coldchain?retryWrites=true&w=majority

# Redis 설정 (온도 경고 피드 및 세션 캐싱)
REDIS_HOST=redis
REDIS_PORT=6379

# Web3 & 스마트 계약 설정 (Ethereum Sepolia Testnet)
CONTRACT_ADDRESS=0xc4040d7Cdbc6923500A94427DB9c78156d70849A
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
PRIVATE_KEY=0xYOUR_SEPOLIA_PRIVATE_KEY
```

### 4단계. 서비스 빌드 및 백그라운드 실행

```bash
docker compose up -d --build
```
> 이 명령어로 PostgreSQL, Redis, Backend(NestJS), Frontend(Nginx) 4개 컨테이너가 빌드 및 기동됩니다.

### 5단계. 데이터베이스 마이그레이션 및 초기 시드 주입

백엔드 컨테이너 내부에서 스키마 마이그레이션과 초기 온체인/오프체인 시드를 주입합니다:

```bash
# 1. PostgreSQL 스키마 생성 및 초기 데이터 주입
cat backend/migrations/*.sql | docker compose exec -T postgres psql -U postgres -d coldchain_db

# 2. 이더리움 Sepolia 온체인 체크포인트 등록 (시나리오 A & B)
docker compose exec backend npm run seed:onchain

# 3. MongoDB 초저온(-58°C) 센서 텔레메트리 시계열 데이터 시딩
docker compose exec backend npm run seed:mongo
```

---

## 모니터링 및 운영 관리

```bash
# 실행 중인 컨테이너 상태 확인
docker compose ps

# 실시간 전체 서비스 로그 확인
docker compose logs -f

# 특정 컨테이너 로그만 확인 (예: 백엔드)
docker compose logs -f backend

# 서비스 중지 및 코드 수정 후 무중단 재빌드
docker compose down
docker compose up -d --build
```

---

## 방화벽 / 보안 그룹(Security Group) 설정

클라우드 콘솔(GCP Firewall Rules 또는 AWS Security Group)에서 아래 인바운드 포트를 허용해야 정상 접속이 가능합니다:

- **5173 (TCP)**: 프론트엔드 웹 대시보드 및 소비자 QR 검증 웹뷰 접속 (`http://<서버IP>:5173`)
  *(※ Nginx 리버스 프록시 또는 도메인 연결 시 80 / 443 포트로 포워딩 권장)*
- **3000 (TCP)**: 백엔드 REST API 및 Socket.io WebSocket 통신 (`http://<서버IP>:3000/api`, `ws://`)
- **Sepolia RPC**: 아웃바운드 HTTPS(443) 통신을 통해 Alchemy 엔드포인트로 나가므로, 인바운드 블록체인 포트는 외부에 개방할 필요가 없어 보안상 매우 안전합니다.
