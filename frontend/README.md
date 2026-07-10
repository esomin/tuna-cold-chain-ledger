# Tuna Cold Chain Ledger - Frontend Application

## 1. Overview
Tuna Cold Chain Ledger의 프론트엔드는 유통망(차량, 선박 등)에서 전송되는 참치의 온도 및 위치 정보의 실시간 모니터링, 임계치 초과 예외 경고, 발주 결재 프로세스를 관리하는 **관리자 대시보드(Admin Dashboard)**와 소비자가 참치 고유 ID의 블록체인 이력을 직관적으로 검증하는 **소비자용 모바일 웹 뷰(Consumer Mobile Web View)**를 담당합니다.

* **운영자/관리자 플로우**: 로그인 ➜ 실시간 이동 경로 추적(Map) ➜ 실시간 보관 온도 모니터링(Chart) ➜ 온도 초과 예외 발생 시 실시간 경고 접수 ➜ 발주 신청 및 승인/반려 단계별 워크플로우 진행.
* **소비자 플로우**: 포장 QR 코드 스캔 ➜ 소비자 모바일 웹 뷰 진입 ➜ DB상 유통 단계 이력 조회 ➜ 온체인(On-chain) 블록체인 트랜잭션 대조 및 무결성 인증 완료 표시 확인.

### Dashboard Layout (대시보드 화면 구성)
관리자 대시보드 UI는 Ant Design 레이아웃을 기반으로 하며 다음과 같이 세 가지 주요 영역으로 구성됩니다.
1. **사이드 내비게이션 바 (Side Navigation)**
   * **SKU 관제**: 개별 참치 일련번호/품목별 실시간 보관 온도 및 운송 위치 감시 화면.
   * **발주 관리 (PO)**: 신선 식품 발주서 작성 및 상신, 결재 진행 상태 추적.
   * **감사 로그 (Audit Logs)**: 유통 체크포인트 기록 및 블록체인 트랜잭션 이력 로그 조회.
2. **실시간 관제 패널 (Live Monitoring Panel)**
   * **실시간 이동 경로 지도 (Live Map)**: 수집된 GPS 위·경도 데이터를 지도 컴포넌트 상에 선으로 매핑하여 실시간 운송 경로 시각화.
   * **온도 추이 실선 그래프 (Live Temperature Chart)**: Recharts 라이브러리를 활용해 실시간 보관 온도 추이를 그리며, 초저온 위험 경계 온도($-55^\circ\text{C}$)를 빨간 점선으로 표시하여 직관적인 관제 제공.
3. **실시간 알림 및 결재 액션 패널 (Real-time Alert & Actions)**
   * **실시간 위험 알림 위젯 (Alert Feed)**: 보관 온도가 임계치($-55^\circ\text{C}$)를 초과하는 즉시 대시보드 우측 상단에 실시간 경고 배너 및 토스트 알림 노출.
   * **결재 의사결정 카드 (Approval Card)**: 사용자 역할(`role`)에 동적으로 반응하여, `OPERATOR`에게는 발주 작성 폼을 노출하고 `MANAGER`에게는 승인/반려 의사결정 버튼을 활성화.

---

## 2. Tech Stack & UI/UX Libraries

| 구분 | 기술 스택 / 라이브러리 | 도입 목적 |
| :--- | :--- | :--- |
| **Core** | React (v19) | 컴포넌트 기반 선언적 UI 렌더링 및 효율적인 상태 동기화 |
| **Build Tool** | Vite, TypeScript | 가볍고 빠른 빌드 속도 및 정적 타입을 통한 코드 안정성 확보 |
| **State Management**| Zustand | 불필요한 리렌더링을 방지하고 보일러플레이트가 없는 가벼운 전역 상태 관리 |
| **UI Component** | Ant Design (v6) | 데이터 중심의 대시보드 구축을 위한 엔터프라이즈급 UI 컴포넌트 라이브러리 |
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
│   └── Charts/             # 실시간 온도 모니터링 및 임계 경보 차트 컴포넌트
├── config/                 # 환경 설정 변수 및 블록체인 ABI 정의
├── store/                  # Zustand 기반 전역 상태 저장소 (useAuthStore 등)
├── pages/                  # 각 라우트에 매핑되는 전체 화면 컴포넌트 (Dashboard, Login, PO 등)
├── routes/                 # 라우팅 테이블 정의 및 RBAC 접근 권한 필터
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
* **[useSocketStore](./src/store/useSocketStore.ts)**: 실시간 IoT 센서 온도 스트리밍 및 한계치 이탈 경고 이벤트를 수신하는 백엔드와의 Socket.io 통신 상태를 관리합니다.

### 라우팅 및 권한 처리 (Routing & Auth Guard)
* **[AppRoutes](./src/routes/AppRoutes.tsx)**: `react-router-dom` 라이브러리를 활용해 클라이언트 사이드 선언적 라우팅을 수행합니다.
* **[ProtectedRoute](./src/routes/ProtectedRoute.tsx)**: 인증 및 역할 인가를 위한 보안 라우팅 가드를 제공합니다.
  * 미인증 사용자는 자동으로 로그인 화면(`/login`)으로 리다이렉트합니다.
  * 역할 리스트(`roles?: string[]`) 인자를 지원하며, 사용자의 권한(`ADMIN`, `OPERATOR`, `MANAGER`)과 대조하여 불일치할 경우 진입을 거부합니다.
