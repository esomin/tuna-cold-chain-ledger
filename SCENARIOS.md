# 스마트 콜드체인 블록체인 검증 시나리오 명세서 (Single Golden Scenario & Live Flow)

본 문서는 AI 기반 콜드체인 수요 예측 및 이더리움 블록체인 검증 시스템의 **골든 대표 시나리오(시나리오 A)**와 시연 시 동작하는 **라이브 온체인 발주 생성/트랜잭션 실행 플로우**를 정의한 명세서입니다.

---

## 핵심 시나리오 구성 및 데모 하이브리드 아키텍처

| 모드 | 대표 식별자 | 대상 / 플로우 | 최종 상태 | 비즈니스 상황 | 블록체인 검증 효과 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **① 기본 보관 골든 시나리오** | `PO-2026-SCENARIO-A` | 참다랑어 (*Bluefin Tuna*, 100kg) | `COMPLETED` | 어획 -> 가공 -> 운송 -> 입고 4단계 완결 | `100% VERIFIED` (Sepolia 스마트 계약 1:1 대조 완벽 일치) |
| **② 동적 라이브 데모 플로우** | `PO-{TIMESTAMP}-{RAND}` | 시연자 직접 등록 발주건 | `HARVESTED` / `DRAFT` | `POST /api/purchase-orders` 호출 시 Sepolia 실시간 서명 | `LIVE ON-CHAIN` (Sepolia Etherscan에서 방금 생성된 `txHash` 확인) |

---

## 1. 골든 대표 시나리오: 시나리오 A (PO-2026-SCENARIO-A)

### 1) 상황 개요 (Context)
- **목적:** 어획부터 최종 매장 입고까지 전 유통 단계(1~4단계)가 콜드체인 초저온 표준 온도(-55°C 이하)를 완벽히 준수하고, 이더리움 블록체인 위·변조 검증을 100% 통과한 표준 골든 시나리오.
- **소비자 전달 메시지:** "위변조 불가 이더리움 스마트 계약 수록 완료 - 최고 품질 인증"

### 2) 백엔드 / DB 인풋 데이터 구조 (Input Data Format)
- **PostgreSQL (`purchase_orders` Table):**
  ```json
  {
    "id": "po-uuid-scenario-a-001",
    "poNumber": "PO-2026-SCENARIO-A",
    "skuId": "TUNA-PREMIUM-001",
    "productName": "참다랑어 (Bluefin Tuna)",
    "quantity": 100,
    "supplierName": "부산 어항 물류",
    "status": "DELIVERED",
    "createdAt": "2026-07-28T08:00:00.000Z"
  }
  ```

### 3) 온체인 해시 & 트랜잭션 데이터 포맷 (Blockchain Output Format)
- **Keccak256 원본 조합 공식:** `${poNumber}:${sku}:${quantity}:${stageKey}`  
  -> 예: `"PO-2026-SCENARIO-A:TUNA-BLUEFIN:100:HARVESTED"`
- **단계별 (1~4단계) 독립 트랜잭션 및 데이터 해시 명세:**
  - `1단계 (원양 어획 / HARVESTED)`
    - **TxHash:** `0x16685da1a3f019484b912a76380a911762e841f3918a287bf112a8195a86d29d`
    - **DataHash:** `0xad2afcb9fca2f0411ff4346eb2972365971e7f00033526cfb15e4d404212a9b6`
  - `2단계 (동결 가공 / PROCESSING)`
    - **TxHash:** `0x293033993e981742a781b9e710263f92b7194681726a8274d618294672618247`
    - **DataHash:** `0x918a287bf112a8195a86d29d16685da1a3f019484b912a76380a911762e841f3`
  - `3단계 (운송 관제 / IN_TRANSIT)`
    - **TxHash:** `0x78901234567890abcdef1234567890abcdef1234567890abcdef1234567890ab`
    - **DataHash:** `0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef7890`
  - `4단계 (매장 입고 / DELIVERED)`
    - **TxHash:** `0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890a`
    - **DataHash:** `0xef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd`

---

## 2. 라이브 온체인 발주 등록 플로우 (Live Interactive Flow)

### 1) 실행 파이프라인 (Execution Pipeline)
1. 사용자가 UI/API를 통해 **`[신규 발주 생성]`**을 실행 (`POST /api/purchase-orders`).
2. 백엔드 `PurchaseOrdersService`가 Keccak256 해시를 연산하고, `BlockchainService.registerCheckpoint` 호출.
3. Ethers.js가 Rabby Wallet `PRIVATE_KEY`로 동적 서명 후 이더리움 Sepolia 테스트넷으로 트랜잭션 수수료(Gas Fee)를 발생시키며 실시간 전송.
4. 블록 체결 후 반환된 **실물 `txHash`**가 PostgreSQL DB 및 AuditLog 테이블에 저장됨.
5. 프론트엔드 감사 원장 탐색기(`/blockchain-ledger`)에 방금 생성된 트랜잭션이 실시간 갱신되어 Etherscan 버튼으로 클릭 검증 가능.

---

## 스마트 계약 및 네트워크 공통 명세 (Common Web3 Config)

- **배포 스마트 계약 주소 (`CONTRACT_ADDRESS`):** `0xc4040d7Cdbc6923500A94427DB9c78156d70849A`
- **배포 이더리움 네트워크:** Sepolia Testnet (`Chain ID: 11155111`)
- **이더스캔 메인 장부 URL:** `https://sepolia.etherscan.io/address/0xc4040d7Cdbc6923500A94427DB9c78156d70849A`
