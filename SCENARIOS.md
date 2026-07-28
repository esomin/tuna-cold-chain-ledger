# 🐟 스마트 콜드체인 블록체인 검증 시나리오 명세서 (Scenarios Overview)

본 문서는 AI 기반 콜드체인 수요 예측 및 이더리움 블록체인 검증 시스템에서 제공하는 **3가지 핵심 테스트 시나리오(Scenario A, B, C)**의 인풋 데이터 구조, 온체인 검증 데이터 포맷, 비즈니스 상황 케이스를 정리한 기술 명세서입니다.

---

## 📌 전체 시나리오 요약

| 시나리오 ID | 발주 번호 | 품목 | 수량 | 공급사 | 최종 상태 | 비즈니스 상황 | 블록체인 무결성 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **시나리오 A** | `PO-2026-SCENARIO-A` | 참다랑어 (*Bluefin Tuna*) | 100kg | 부산 어항 물류 | `COMPLETED` | 전 유통 단계 정상 완료 | `100% VERIFIED` (정상) |
| **시나리오 B** | `PO-2026-SCENARIO-B` | 눈다랑어 (*Bigeye Tuna*) | 150kg | 인천 수산 가공 | `COMPLETED` | 운송 중 초저온 임계치(-55°C) 이탈 경고 발생 | `WARNING` (온도 이탈 1건) |
| **시나리오 C** | `PO-2026-SCENARIO-C` | 황다랑어 (*Yellowfin Tuna*) | 200kg | 부산 어항 물류 | `IN_TRANSIT` (`PENDING`) | 실시간 운송 차량 이동 중 (라이브 관제) | `IN-PROGRESS` (3단계 진행 중) |

---

## 1. 🔵 시나리오 A: 전 유통 단계 정상 완료 (Success Case)

### 1) 상황 개요 (Context)
- **목적:** 어획부터 최종 매장 입고까지 전 유통 단계(1~4단계)가 콜드체인 초저온 표준 온도(-55°C 이하)를 완벽히 준수하고, 블록체인 위·변조 검증을 100% 통과한 골든 메인 케이스.
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
- **MongoDB / IoT Sensor Logs (`sensor_logs` Collection):**
  ```json
  {
    "poNumber": "PO-2026-SCENARIO-A",
    "temperatureReadings": [-58.5, -58.2, -57.9, -58.0, -58.1],
    "avgTemperature": -58.14,
    "anomalyCount": 0,
    "hasAnomaly": false,
    "status": "NORMAL"
  }
  ```

### 3) 온체인 해시 & 트랜잭션 데이터 포맷 (Blockchain Output Format)
- **Keccak256 원본 조합 공식:** `${poNumber}:${sku}:${quantity}:${status}`  
  ➔ `"PO-2026-SCENARIO-A:TUNA-PREMIUM-001:100:DELIVERED"`
- **계산된 Data Keccak256 Hash:** `0xad2afcb9fca2f0411ff4346eb2972365971e7f00033526cfb15e4d404212a9b6`
- **단계별 트랜잭션 해시 (TxHash List):**
  - `1단계 (HARVESTED)`: `0x16685da1a3f019484b912a76380a911762e841f3918a287bf112a8195a86d29d`
  - `2단계 (PROCESSING)`: `0x293033993e981742a781b9e710263f92b7194681726a8274d618294672618247`
  - `3단계 (IN_TRANSIT)`: `0x78901234567890abcdef1234567890abcdef1234567890abcdef1234567890ab`
  - `4단계 (DELIVERED)`: `0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890a`

---

## 2. 🔴 시나리오 B: 온도 이탈 경고 발생 (Anomaly Warning Case)

### 1) 상황 개요 (Context)
- **목적:** 운송 도중 초저온 임계치(-55°C)를 초과하여 -49.0°C까지 온도가 상승하는 이탈 사고가 발생한 케이스.
- **블록체인 역할:** 오프체인 IoT 센서가 온도 이탈을 실시간 감지하여 블록체인에 영구 기록함으로써, 유통업체가 온도를 조작하거나 은폐할 수 없도록 투명하게 경고를 표출.
- **소비자 전달 메시지:** "콜드체인 초저온 임계치 이탈 감지 (운송 중 주의 필요 -55°C 표준)"

### 2) 백엔드 / DB 인풋 데이터 구조 (Input Data Format)
- **PostgreSQL (`purchase_orders` Table):**
  ```json
  {
    "id": "po-uuid-scenario-b-002",
    "poNumber": "PO-2026-SCENARIO-B",
    "skuId": "TUNA-BIGEYE-002",
    "productName": "눈다랑어 (Bigeye Tuna)",
    "quantity": 150,
    "supplierName": "인천 수산 가공",
    "status": "DELIVERED",
    "createdAt": "2026-07-28T09:30:00.000Z"
  }
  ```
- **MongoDB / IoT Sensor Logs (`sensor_logs` Collection):**
  ```json
  {
    "poNumber": "PO-2026-SCENARIO-B",
    "temperatureReadings": [-57.5, -49.0, -52.0, -58.1],
    "latestTemp": -49.0,
    "anomalyCount": 1,
    "hasAnomaly": true,
    "anomalyDetails": [
      {
        "timestamp": "2026-07-28T11:15:00.000Z",
        "recordedTemp": -49.0,
        "threshold": -55.0,
        "message": "ColdChain Ultra-Low Temp Violation (-49.0°C > -55.0°C)"
      }
    ]
  }
  ```

### 3) 온체인 해시 & 트랜잭션 데이터 포맷 (Blockchain Output Format)
- **Keccak256 원본 조합 공식:** `"PO-2026-SCENARIO-B:TUNA-BIGEYE-002:150:DELIVERED"`
- **계산된 Data Keccak256 Hash:** `0x98f7118d63012ccc2451f282eaa3867c0a5198528f26a4f9bc531066c2b3b592`
- **단계별 트랜잭션 해시 (TxHash List):**
  - `1단계 (HARVESTED)`: `0x451f282eaa3867c0a5198528f26a4f9bc531066c2b3b59298f7118d63012ccc2`
  - `2단계 (PROCESSING)`: `0xef5678901234567890abcdef1234567890abcdef1234567890abcdef12345678`
  - `3단계 (IN_TRANSIT)`: `0x90abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678` (온도 경고 이벤트 트랜잭션 포함)
  - `4단계 (DELIVERED)`: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

---

## 3. 🟡 시나리오 C: 실시간 운송 관제 진행 중 (Live In-Transit Case)

### 1) 상황 개요 (Context)
- **목적:** 현재 냉동 탑차가 도로 위를 이동 중인 실시간 라이브 스트리밍 관제 케이스.
- **특징:** 1단계(어획)와 2단계(가공) 온체인 등록은 완료되었으며, 3단계(운송 중) 트랜잭션이 활성화된 상태. 4단계(매장 입고)는 아직 미완료.
- **소비자 전달 메시지:** "실시간 위치/온도 스트리밍 관제 중 (현재 3단계 진행 중)"

### 2) 백엔드 / DB 인풋 데이터 구조 (Input Data Format)
- **PostgreSQL (`purchase_orders` Table):**
  ```json
  {
    "id": "po-uuid-scenario-c-003",
    "poNumber": "PO-2026-SCENARIO-C",
    "skuId": "TUNA-YELLOWFIN-003",
    "productName": "황다랑어 (Yellowfin Tuna)",
    "quantity": 200,
    "supplierName": "부산 어항 물류",
    "status": "IN_TRANSIT",
    "createdAt": "2026-07-28T10:00:00.000Z"
  }
  ```
- **MongoDB / Real-Time Telemetry Logs (`telemetry_stream` Collection):**
  ```json
  {
    "poNumber": "PO-2026-SCENARIO-C",
    "vehicleId": "부산-88바-1234",
    "currentLocation": {
      "latitude": 35.1795543,
      "longitude": 129.0756416,
      "locationName": "남해고속도로 경남 김해 구간"
    },
    "currentTemp": -58.2,
    "targetTemp": -58.0,
    "status": "STREAMING_ACTIVE"
  }
  ```

### 3) 온체인 해시 & 트랜잭션 데이터 포맷 (Blockchain Output Format)
- **Keccak256 원본 조합 공식:** `"PO-2026-SCENARIO-C:TUNA-YELLOWFIN-003:200:IN_TRANSIT"`
- **계산된 Data Keccak256 Hash:** `0x7118d63012ccc2451f282eaa3867c0a5198528f26a4f9bc531066c2b3b59298f`
- **단계별 트랜잭션 해시 (TxHash List):**
  - `1단계 (HARVESTED)`: `0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab`
  - `2단계 (PROCESSING)`: `0xcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890cd`
  - `3단계 (IN_TRANSIT)`: `0xef011234567890abcdef1234567890abcdef1234567890abcdef1234567890ef` (최신 활성 트랜잭션)
  - `4단계 (DELIVERED)`: `null` (*미완료 - 입고 대기 중*)

---

## ⚙️ 스마트 계약 및 네트워크 공통 명세 (Common Web3 Config)

- **배포 스마트 계약 주소 (`CONTRACT_ADDRESS`):** `0xc4040d7Cdbc6923500A94427DB9c78156d70849A`
- **배포 이더리움 네트워크:** Sepolia Testnet (`Chain ID: 11155111`)
- **이더스캔 탐색기 링크:**  
  - 스마트 계약 메인 장부: `https://sepolia.etherscan.io/address/0xc4040d7Cdbc6923500A94427DB9c78156d70849A`
  - 트랜잭션 영수증 예시: `https://sepolia.etherscan.io/tx/{txHash}`
