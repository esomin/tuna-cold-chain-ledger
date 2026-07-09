# Tuna Cold Chain Ledger Phase 2 Overview: AI 기반 재고·수요 예측 시스템

## 1. 개요 (Overview)
Phase 2는 Phase 1에서 구축된 실시간 콜드체인(IoT 센서 데이터) 및 유통 체크포인트 데이터를 기반으로 **머신러닝 엔진(XGBoost, LightGBM)**과 **ETL 파이프라인**을 연동하는 고도화 단계입니다.
유통망 전반에서 수집된 초저온 온도 데이터($-60^\circ\text{C}$ 기준 온도 이탈 빈도 및 누적 이탈 시간)와 과거 발주/재고 이력을 결합하여, 유동적인 수요를 예측하고 신선도 저하에 따른 재고 폐기 리스크를 사전에 계산해 비즈니스 손실을 최소화하는 것을 목적으로 합니다.

---

## 2. 주요 기능 (Key Features)
* **ETL 데이터 파이프라인 구축**
  * MongoDB에 누적된 대용량 실시간 IoT 센서 시계열 로그와 PostgreSQL의 발주/재고/반품 마스터 데이터를 정기적으로 추출(Extract)합니다.
  * 데이터를 정제하고 조인하여 ML 모델 학습 및 추론에 최적화된 Mart 테이블 및 피처(Feature) 테이블 구조로 자동 변환(Transform) 및 적재(Load)합니다.
* **AI 기반 수요 및 폐기 리스크 예측**
  * **수요 예측**: XGBoost와 LightGBM 알고리즘을 활용해 향후 7일, 14일, 30일 간의 품목별 수요를 다각도로 예측합니다.
  * **폐기 리스크 예측**: 이동/보관 과정 중 온도 임계치($-55^\circ\text{C}$)를 이탈한 누적 시간 및 빈도를 바탕으로 제품의 신선도 감쇠율을 계산하고, 폐기 혹은 변질 반품으로 이어질 리스크를 사전 경고합니다.
* **설명 가능한 AI (XAI) 시각화**
  * SHAP(SHapley Additive exPlanations) 모델을 적용해 AI의 예측 결과에 각 피처(예: 요일, 가격 변동, 보관 온도 이탈률, 프로모션 여부 등)가 기여한 영향도를 계산합니다.
  * 분석 결과를 관리자 대시보드에 직관적으로 시각화하여 예측치에 대한 신뢰성과 비즈니스 의사결정의 근거를 제공합니다.

---

## 3. 기술 스택 (Tech Stack)

| 영역 (Area) | 기술 스택 (Tech Stack) | 역할 및 상세 |
| :--- | :--- | :--- |
| **ETL Engine** | Python (v3.10) | 대용량 데이터 전처리 및 정기 데이터 변환 파이프라인 수행 엔진 |
| **ETL Engine** | SQLAlchemy | Python 스크립트와 PostgreSQL/MongoDB 간 데이터 액세스를 위한 ORM 라이브러리 |
| **ML Engine** | scikit-learn | 데이터 스케일링, 인코딩, 평가 매트릭스 산출 등 데이터 전처리 및 분석 기반 도구 |
| **ML Engine** | XGBoost | 정형 데이터를 기반으로 한 고성능 수요 예측 그레이디언트 부스팅 모델 |
| **ML Engine** | LightGBM | 대용량 학습에 유리한 속도 중심의 부스팅 알고리즘으로 수요 및 폐기 위험 모델링 |
| **XAI Tool** | SHAP | ML 모델 예측 값의 Feature 기여도를 추출해 시각화 데이터로 변환 |

---

## 4. 데이터 흐름도 (Data Flow)

```
[Raw Data Sources]
  - PostgreSQL (발주/주문/재고 상태)
  - MongoDB (IoT 센서 실시간 로그)
          |
          v (Extraction)
+-----------------------------+
|    Python ETL Pipeline      |
|  - Data Cleansing           |
|  - Feature Engineering      |
+-----------------------------+
          |
          v (Loading)
[PostgreSQL Mart Tables]
  - sku_daily_stats / sku_features (피처 마트)
          |
          v (Inference / Training)
+-----------------------------+
|       ML Models             |
|  - XGBoost / LightGBM       |
|  - SHAP Explainer           |
+-----------------------------+
          |
          v (Output)
[PostgreSQL Prediction Tables]
  - predictions (수요 예측 결과)
  - decay_risks (폐기 위험율 결과)
          |
          v (API Fetch)
[React Admin Dashboard] (SHAP 피처 기여도 및 예측치 시각화)
```
