# GCP (Google Cloud Platform) 배포 및 운영 가이드

본 문서는 **Tuna Cold Chain Ledger (참치 초저온 콜드체인 모니터링 시스템)** 서비스를 Google Cloud Platform (GCP) 환경에 프로덕션급으로 빌드 및 배포하기 위한 아키텍처 및 단계별 가이드입니다.

---

## 1. GCP 프로덕션 아키텍처 (GCP Architecture Overview)

```
[ 클라이언트 (소비자 QR / 대시보드 관리자) ]
                    │
                    ▼ (HTTPS / WSS)
    ┌───────────────────────────────┐
    │     Cloud Load Balancing      │
    │      + Cloud Armor (WAF)      │
    └───────────────┬───────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  Cloud Run   │        │  Cloud Run   │
│  (Frontend)  │        │  (Backend)   │
│ React + Vite │        │ NestJS + WS  │
└──────────────┘        └───────┬──────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  Cloud SQL   │        │MongoDB Atlas │        │ Memorystore  │
│ (PostgreSQL) │        │ (NoSQL Raw)  │        │   (Redis)    │
└──────────────┘        └──────────────┘        └──────────────┘
                                │
                                ▼ (JSON-RPC)
                    ┌───────────────────────┐
                    │ Sepolia Testnet / EVM │
                    │ (ColdChainTracker.sol)│
                    └───────────────────────┘
```

---

## 2. 권장 GCP 구성 요약 (Service Mapping)

| 구분 | GCP 서비스 (Service) | 선택 이유 및 권장 사양 |
| :--- | :--- | :--- |
| **Frontend** | **Cloud Run** (또는 Firebase Hosting) | 서버리스 컨테이너 기반 자동 스케일링 (Vite Nginx 이미지 빌드) |
| **Backend API** | **Cloud Run** | NestJS REST API & WebSocket (Socket.io) 자동 확장성 및 서버리스 운영 |
| **RDBMS** | **Cloud SQL for PostgreSQL** | PostgreSQL v15, 고가용성(HA), 자동 백업 및 보안 연결 |
| **NoSQL** | **MongoDB Atlas** (또는 GCP VM) | 초 단위 센서 데이터 로그 시계열 저장 (GCP Marketplace 또는 Atlas 연동) |
| **Cache & PubSub** | **Memorystore for Redis** | 실시간 온도 경고 캐싱 및 Socket.io 어댑터 세션 상태 관리 |
| **Image Registry** | **Artifact Registry** | Docker 컨테이너 이미지 버전 관리 및 프라이빗 레지스트리 |
| **Secret Mgmt** | **Secret Manager** | 스마트 계약 Private Key, DB 암호, JWT Secret 안전한 주입 |
| **CI/CD** | **Cloud Build** | GitHub 커밋 시 자동 빌드, 테스트 및 Cloud Run 자동 배포 |

---

## 3. 배포 사전 준비 사항 (Prerequisites)

1. **Google Cloud SDK (`gcloud` CLI) 설치 및 로그인**
   ```bash
   gcloud auth login
   gcloud config set project [YOUR_GCP_PROJECT_ID]
   ```
2. **필수 GCP API 서비스 활성화**
   ```bash
   gcloud services enable \
     run.googleapis.com \
     artifactregistry.googleapis.com \
     cloudbuild.googleapis.com \
     sqladmin.googleapis.com \
     secretmanager.googleapis.com \
     redis.googleapis.com
   ```

---

## 4. 단계별 배포 절차 (Step-by-Step Deployment)

### 4.1. Step 1: 데이터베이스 구축

#### A. Cloud SQL (PostgreSQL) 생성
```bash
gcloud sql instances create coldchain-db-instance \
  --database-version=POSTGRES_15 \
  --cpu=2 \
  --memory=7.5GiB \
  --region=asia-northeast3 \
  --root-password="YOUR_DB_STRONG_PASSWORD"

# DB 및 사용자 생성
gcloud sql databases create coldchain_db --instance=coldchain-db-instance
gcloud sql users create postgres --instance=coldchain-db-instance --password="YOUR_DB_STRONG_PASSWORD"
```

#### B. Memorystore (Redis) 생성
```bash
gcloud redis instances create coldchain-redis \
  --size=1 \
  --region=asia-northeast3 \
  --redis-version=redis_7_0
```

---

### 4.2. Step 2: Secret Manager 환경변수 등록

스마트 계약 Private Key 및 데이터베이스 보안 접속 정보를 등록합니다:

```bash
# 1. DB 암호 저장
echo -n "YOUR_DB_STRONG_PASSWORD" | gcloud secrets create DB_PASSWORD --data-file=-

# 2. 블록체인 스마트 계약 관리자 Private Key 저장
echo -n "0xYOUR_PRIVATE_KEY" | gcloud secrets create PRIVATE_KEY --data-file=-

# 3. JWT 비밀키 저장
echo -n "YOUR_JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=-
```

---

### 4.3. Step 3: Docker 이미지 레지스트리 생성

```bash
gcloud artifacts repositories create coldchain-repo \
  --repository-format=docker \
  --location=asia-northeast3 \
  --description="Tuna Cold Chain Docker Repository"
```

---

### 4.4. Step 4: 백엔드 (NestJS) Cloud Run 배포

#### A. 백엔드 Dockerfile 작성 (`backend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### B. 빌드 및 Cloud Run 배포 실행
```bash
# 이미지 빌드 & Artifact Registry 업로드
gcloud builds submit backend/ \
  --tag asia-northeast3-docker.pkg.dev/[YOUR_PROJECT_ID]/coldchain-repo/backend:v1.0.0

# Cloud Run 서비스 배포
gcloud run deploy coldchain-backend \
  --image asia-northeast3-docker.pkg.dev/[YOUR_PROJECT_ID]/coldchain-repo/backend:v1.0.0 \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --port 3000 \
  --add-cloudsql-instances [YOUR_PROJECT_ID]:asia-northeast3:coldchain-db-instance \
  --set-env-vars="NODE_ENV=production,CONTRACT_ADDRESS=0xc4040d7Cdbc6923500A94427DB9c78156d70849A,MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/coldchain" \
  --set-secrets="DB_PASSWORD=DB_PASSWORD:latest,PRIVATE_KEY=PRIVATE_KEY:latest,JWT_SECRET=JWT_SECRET:latest"
```

---

### 4.5. Step 5: 프론트엔드 (React + Vite) Cloud Run 배포

#### A. 프론트엔드 Dockerfile 작성 (`frontend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### B. 빌드 및 배포
```bash
gcloud builds submit frontend/ \
  --config=cloudbuild.yaml \
  --substitutions=_VITE_API_URL="https://coldchain-backend-xxxx-du.a.run.app/api" \
  --tag asia-northeast3-docker.pkg.dev/[YOUR_PROJECT_ID]/coldchain-repo/frontend:v1.0.0

gcloud run deploy coldchain-frontend \
  --image asia-northeast3-docker.pkg.dev/[YOUR_PROJECT_ID]/coldchain-repo/frontend:v1.0.0 \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --port 80
```

---

## 5. CI/CD 자동화 (Cloud Build 연동)

루트 경로의 `cloudbuild.yaml`을 이용해 Main 브랜치 푸시 시 자동 빌드 및 배포를 수행합니다:

```yaml
steps:
  # 1. Backend Build & Push
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'asia-northeast3-docker.pkg.dev/$PROJECT_ID/coldchain-repo/backend:$SHORT_SHA', './backend']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'asia-northeast3-docker.pkg.dev/$PROJECT_ID/coldchain-repo/backend:$SHORT_SHA']

  # 2. Deploy Backend to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'coldchain-backend'
      - '--image=asia-northeast3-docker.pkg.dev/$PROJECT_ID/coldchain-repo/backend:$SHORT_SHA'
      - '--region=asia-northeast3'

  # 3. Frontend Build & Deploy
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'asia-northeast3-docker.pkg.dev/$PROJECT_ID/coldchain-repo/frontend:$SHORT_SHA', './frontend']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'coldchain-frontend'
      - '--image=asia-northeast3-docker.pkg.dev/$PROJECT_ID/coldchain-repo/frontend:$SHORT_SHA'
      - '--region=asia-northeast3'

images:
  - 'asia-northeast3-docker.pkg.dev/$PROJECT_ID/coldchain-repo/backend:$SHORT_SHA'
  - 'asia-northeast3-docker.pkg.dev/$PROJECT_ID/coldchain-repo/frontend:$SHORT_SHA'
```

---

## 6. 모니터링 및 유지관리 (Monitoring & Ops)

1. **Cloud Logging**: `gcloud app logs tail` 또는 Cloud Console에서 Socket.io 텔레메트리 로그 및 온체인 무결성 트랜잭션 수신 이력 실시간 관제.
2. **Cloud Monitoring Alerting**: 백엔드 CPU 사용률 > 80% 또는 WebSocket 에러 수치 급증 시 메일/Slack 경고 발송 설정.
3. **SSL 인증서 및 커스텀 도메인**: Cloud Run Custom Domain Mapping을 통해 HTTPS 자동 적용.
