# Tuna Cold Chain Ledger - Frontend Application (Operator Control Center)

## 1. Overview
Tuna Cold Chain Ledger의 프론트엔드는 신선 상품의 안전 유통을 책임지는 **운영자(Operator) 중심의 단일 종합 관제 대시보드(Single Control Center Dashboard)**입니다. 

기존의 복잡한 결재 프로세스와 다수의 화면 이동을 지양하고, 하나의 와이드 대시보드 화면 내에서 발주 등록, GPS 차량 추적, 실시간 온도 감시, IoT 환경 조작 시뮬레이션, 그리고 최종 블록체인 온체인 원장 기록까지 유기적으로 관람 및 조작할 수 있도록 아키텍처를 슬림하게 통합 구축하였습니다.

* **운영자 통합 시나리오**: 로그인 ➜ 발주 등록 및 배송 시작 ➜ 실시간 지도(Live Map) & 온도 그래프(Chart) 관제 ➜ 통합 온도 슬라이더 조작(가상 IoT 온도 조절) ➜ 한계치($-55^\circ\text{C}$) 이탈 시 실시간 위험 경고 접수 ➜ Ethers.js 기반 체크포인트 온체인 해시 기록 발행 및 스마트 계약 원장 확인.
* **소비자 흐름 체험 (Interactive Preview)**: 별도의 모바일 디바이스나 URL 접속 없이, 대시보드 내부의 [QR코드]에 마우스를 오버(Hover)하면 툴팁 팝업 형태로 소비자용 모바일 무결성 검증 웹 뷰가 로컬 구동되어, 대시보드 내 실시간 상황이 소비자 화면에 즉각 반영되는 모습을 교차 시각화합니다.

---

### Dashboard Layout (대시보드 화면 구성)
대시보드 UI는 shadcn/ui 레이아웃을 기반으로 하며 다음과 같이 단일 뷰 내 세 가지 주요 통제 패널로 구성됩니다.

```
+-----------------------------------------------------------------------------------+
|                     Tuna Cold Chain Ledger - Control Center                       |
+-------------------+-------------------------------------------+-------------------+
|  1. 발주/운송 목록    |    2. 실시간 모니터링 (Map & Temp)        |  3. 온체인 원장기록      |
|  (PO/Shipment List)|    (Live Map & Temperature Chart)     |  (Web3 Committer)    |
+-------------------+-------------------------------------------+-------------------+
|                   |                                        |                      |
|  [신규 발주 등록] |  +----------------------------------------+   |  [Alert Feed]    |
|  - 품목, 수량 입력|  | 실시간 이동 경로 지도 (Live Map)            |  |  - 실시간 위험알림    |
|  - 운송 차량 매핑 |  | - GPS 기반 실시간 이동 선 표시               |  |  - 임계치 초과경고    |
|                   |  +-------------------------------------+  |                   |
|  [운송 목록 피드]    |                                           |  -----------------|
|  - PO-202607-001  |  +-------------------------------------+  |                   |
|  - PO-202607-002  |  | 온도 추이 그래프 (Temp Chart)          |  |  [Web3 Committer] |
|  - PO-202607-003  |  | - 실시간 온도 추이 렌더링                |  |  - 온체인 해시기록    |
|                   |  | - 위험 임계 온도선 표시 (-55°C)          |  |  - 가비지/위변조     |
|  [QR코드 마우스   |  +----------------------------------------+  |    체크 마일스톤    |
|   오버시 모바일   |  [IoT 시뮬레이터 온도 조절 슬라이더]              |  |  - 최근 트랜잭션    |
|   체험용 팝업]    |  Min <- [-60°C] ----------- [Slider] ->Max|  |    로그 출력        |
|                   |                                           |                   |
+-------------------+-------------------------------------------+-------------------+
```

---

## 2. Tech Stack & UI/UX Libraries

| 구분 | 기술 스택 / 라이브러리 | 도입 목적 |
| :--- | :--- | :--- |
| **Core** | React (v19) | 컴포넌트 기반 선언적 UI 렌더링 및 효율적인 상태 동기화 |
| **Build Tool** | Vite, TypeScript | 가볍고 빠른 빌드 속도 및 정적 타입을 통한 코드 안정성 확보 |
| **State Management**| Zustand | 불필요한 리렌더링을 방지하고 보일러플레이트가 없는 가벼운 전역 상태 관리 |
| **UI Component** | shadcn/ui | Radix UI Primitives 및 Tailwind CSS 기반의 스타일링 가능하고 접근성 높은 UI 컴포넌트 라이브러리 |
| **Data Visualization** | Recharts | 초저온 임계선(-55°C) 및 실시간 온도 변동 폭을 표현하는 차트 렌더링 |
| **Web3 Interface** | Ethers.js | 백엔드를 거치지 않고 블록체인 스마트 계약 데이터를 직접 쿼리하여 무결성 교차 검증 |
| **HTTP Client** | Axios | NestJS 백엔드 API와의 통신 및 인터셉터를 통한 인증 토큰 관리 |

---

## 3. Project Structure

```
src/
├── assets/                 # 이미지, 로고, 스타일 및 정적 자원
├── components/             # 여러 화면에서 공유되는 재사용 가능한 UI 컴포넌트
│   ├── Layout/             # 네비게이션 바, 사이드바, 헤더 등 공통 레이아웃
│   ├── Map/                # 실시간 GPS 위치 및 경로 매핑 지도 컴포넌트
│   ├── Charts/             # 실시간 온도 모니터링 및 임계 경보 차트 컴포넌트
│   └── MobileMockup/       # QR 코드 오버헤드 마우스 호버용 모바일 폰 시뮬레이터 팝업
├── config/                 # 환경 설정 변수 및 블록체인 ABI 정의
├── store/                  # Zustand 기반 전역 상태 저장소 (useAuthStore, useSocketStore 등)
├── pages/                  # 각 라우트에 매핑되는 화면 컴포넌트 (Dashboard, Login)
├── routes/                 # 라우팅 테이블 정의 및 기본 보호 가드
├── services/               # 백엔드 API 통신 및 Web3 스마트 계약 인터페이스 함수군
├── App.css                 # 글로벌 공통 CSS 스타일 정의
├── App.tsx                 # 최상위 컴포넌트 및 기본 테마 정의
└── main.tsx                # React DOM 렌더링 및 진입점
```

---

## 4. Environment Variables
로컬 개발 및 프로덕션 환경 구동을 위해 루트 디렉토리에 `.env` 파일을 생성하고 아래 변수들을 설정해야 합니다.

* **`VITE_API_URL`**: NestJS 백엔드 서버의 REST API 베이스 엔드포인트 URL (예: `http://localhost:3000/api`)
* **`VITE_BLOCKCHAIN_NODE_URL`**: Hardhat 로컬 블록체인 노드의 RPC 엔드포인트 URL (예: `http://localhost:8545`)
* **`VITE_CONTRACT_ADDRESS`**: 온체인 해시 대조 검증을 위해 배포된 `ColdChainTracker` 스마트 계약의 주소
* **`VITE_USE_MOCK`**: 서버 미연결 정적 호스팅(Vercel 등) 감상용 모킹 기능 가동 여부 (`true` / `false`)

---

## 5. Getting Started

### Development Server (개발 서버 실행)
```bash
# 의존성 패키지 설치
npm install

# 환경 설정 파일 복사 및 세팅
cp .env.example .env

# 로컬 개발 서버 기동 (Vite)
npm run dev
```

### Build & Production (빌드 및 운영 준비)
```bash
# 프로덕션 번들 빌드
npm run build

# 로컬 빌드 결과물 미리보기
npm run preview
```

### Linting & Formatting
```bash
# ESLint를 통한 코드 품질 검증 및 스타일 검사
npm run lint
```

---

## 6. State Management & Routing Policy

### 전역 상태 관리 (State Management)
* **Zustand**: 가볍고 유연하며 보일러플레이트가 없는 상태 관리를 위해 Zustand를 사용합니다.
* **[useAuthStore](./src/store/useAuthStore.ts)**: 사용자의 로그인 인증 상태(`isAuthenticated`), 사용자 정보(`user`), JWT 세션 및 로딩 상태를 관리하고 로컬 스토리지와 동기화합니다.
* **[useSocketStore](./src/store/useSocketStore.ts)**: 실시간 IoT 센서 온도 스트리밍 및 한계치 이탈 경고 이벤트를 수신하는 백엔드와의 Socket.io 통신 상태를 관리합니다. `VITE_USE_MOCK=true`일 경우, 내장된 `setInterval` 타이머를 가동해 센서 및 위치 데이터를 가상 스트리밍 상태로 동적 업데이트합니다.

### 라우팅 및 권한 처리 (Routing & Auth Guard)
* **[AppRoutes](./src/routes/AppRoutes.tsx)**: 단일 페이지 종합 제어 구조를 지원하기 위해 라우팅 뎁스를 최소화하고, `/` (종합 관제 대시보드)와 `/login` (데모 로그인) 두 가지 화면을 관리합니다.
* **[ProtectedRoute](./src/routes/ProtectedRoute.tsx)**: 인증 및 역할 인가를 위한 보안 라우팅 가드를 제공합니다.
  * 미인증 사용자는 자동으로 로그인 화면(`/login`)으로 리다이렉트합니다.
  * 포트폴리오 감상자를 위해 로그인 화면 하단에 `[Operator 데모 계정으로 자동 로그인]` 숏컷 버튼을 제공해 즉시 대시보드로 진입할 수 있도록 돕습니다.
