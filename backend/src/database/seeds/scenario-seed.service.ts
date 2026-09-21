import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PurchaseOrder } from '../../entities/PurchaseOrder';
import { Product } from '../../entities/Product';
import { SensorRawLog } from '../../purchase-orders/schemas/sensor-raw-log.schema';

type Stage = 'HARVESTED' | 'PROCESSING' | 'IN_TRANSIT' | 'DELIVERED';

interface SeedPoint {
  h: number;
  t: number;
  note?: string;
  isFreezing?: boolean;
}

const STAGE_CONFIG: Record<Stage, { targetTemp: number; warningTemp: number }> = {
  HARVESTED: { targetTemp: -55, warningTemp: -45 },
  PROCESSING: { targetTemp: -25, warningTemp: -22 },
  IN_TRANSIT: { targetTemp: -55, warningTemp: -45 },
  DELIVERED: { targetTemp: -55, warningTemp: -45 },
};

const HOUR = 3600 * 1000;
const TOTAL_HOURS = 336;

const coord = (h: number) => ({
  latitude: Number((35.0784 + h * 0.00007).toFixed(4)),
  longitude: Number((129.0069 + h * 0.0001).toFixed(4)),
});

function buildLogsForScenario(
  poNumber: string,
  baseTime: number,
  stageGroups: { stage: Stage; points: SeedPoint[] }[],
) {
  return stageGroups.flatMap(({ stage, points }) =>
    points.map(({ h, t, note, isFreezing }) => ({
      poNumber,
      temperature: t,
      ...coord(h),
      timestamp: new Date(baseTime + h * HOUR),
      stage,
      targetTemp: STAGE_CONFIG[stage].targetTemp,
      warningTemp: STAGE_CONFIG[stage].warningTemp,
      isFreezing: isFreezing ?? false,
      ...(note ? { eventNote: note } : {}),
    })),
  );
}

@Injectable()
export class ScenarioSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScenarioSeedService.name);

  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectModel(SensorRawLog.name)
    private readonly sensorLogModel: Model<SensorRawLog>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAllScenarios();
  }

  async seedAllScenarios() {
    try {
      await this.seedPostgresScenarios();
      await this.seedMongoScenarios();
    } catch (err: any) {
      this.logger.warn(`Failed to complete seedAllScenarios: ${err?.message || err}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. PostgreSQL 시나리오 A & B 시딩
  // ─────────────────────────────────────────────────────────────
  private async seedPostgresScenarios() {
    // 0. Ensure standard naming columns exist safely in active DB
    try {
      await this.productRepository.query(`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ko VARCHAR(255);
        ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
        ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_name_ko VARCHAR(255);
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name_en') THEN
                UPDATE products SET name = name_en WHERE (name IS NULL OR name = '') AND name_en IS NOT NULL;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'supplier_name_en') THEN
                UPDATE purchase_orders SET supplier_name = supplier_name_en WHERE (supplier_name IS NULL OR supplier_name = '') AND supplier_name_en IS NOT NULL;
            END IF;
        END $$;
        UPDATE products SET name = 'Pacific Bluefin Tuna Loin (Frozen)', name_ko = '참다랑어 로인 (냉동)' WHERE sku = 'TUNA-BLUEFIN';
        UPDATE products SET name = 'Bigeye Tuna Loin (Frozen)', name_ko = '눈다랑어 로인 (냉동)' WHERE sku = 'TUNA-BIGEYE';
        UPDATE products SET name = 'Yellowfin Tuna Loin (Frozen)', name_ko = '황다랑어 로인 (냉동)' WHERE sku = 'TUNA-YELLOWFIN';
        UPDATE purchase_orders SET supplier_name = 'Busan Harbor Logistics', supplier_name_ko = '부산 어항 물류' WHERE po_number = 'PO-2026-SCENARIO-A' OR supplier_name_ko LIKE '%부산%';
        UPDATE purchase_orders SET supplier_name = 'Tongyeong Deep-Sea Fishery', supplier_name_ko = '통영 원양 수산' WHERE po_number = 'PO-2026-SCENARIO-B' OR supplier_name_ko LIKE '%통영%';
      `);
    } catch (e: any) {
      this.logger.debug(`Schema check note: ${e?.message || e}`);
    }

    // 상품(참다랑어) 존재 확인 및 등록
    let product = await this.productRepository.findOne({ where: { sku: 'TUNA-BLUEFIN' } });
    if (!product) {
      const newProduct = new Product();
      newProduct.sku = 'TUNA-BLUEFIN';
      newProduct.name = 'Pacific Bluefin Tuna Loin (Frozen)';
      newProduct.nameKo = '참다랑어 로인 (냉동)';
      newProduct.category = 'Premium';
      newProduct.price = 85000;
      product = await this.productRepository.save(newProduct);
      this.logger.log('Seeded Product: TUNA-BLUEFIN');
    } else if (!product.name || !product.nameKo) {
      product.name = 'Pacific Bluefin Tuna Loin (Frozen)';
      product.nameKo = '참다랑어 로인 (냉동)';
      await this.productRepository.save(product);
    }

    // 시나리오 A (골든 대표 시나리오 - 정상 완료)
    const poA = await this.poRepository.findOne({ where: { poNumber: 'PO-2026-SCENARIO-A' } });
    if (!poA) {
      const newPoA = new PurchaseOrder();
      newPoA.poNumber = 'PO-2026-SCENARIO-A';
      newPoA.quantity = 100;
      newPoA.status = 'COMPLETED';
      newPoA.supplierName = 'Busan Harbor Logistics';
      newPoA.supplierNameKo = '부산 어항 물류';
      newPoA.notes = '시나리오 A: 전 유통 단계 정상 완료 (블록체인 무결성 검증 통과)';
      if (product) newPoA.product = product;
      await this.poRepository.save(newPoA);
      this.logger.log('Synchronized PO-2026-SCENARIO-A into PostgreSQL database.');
    } else {
      let updated = false;
      if (poA.status !== 'COMPLETED') {
        poA.status = 'COMPLETED';
        updated = true;
      }
      if (!poA.supplierName || !poA.supplierNameKo) {
        poA.supplierName = 'Busan Harbor Logistics';
        poA.supplierNameKo = '부산 어항 물류';
        updated = true;
      }
      if (updated) await this.poRepository.save(poA);
    }

    // 시나리오 B (온도 이탈 4건 발생 시나리오)
    const poB = await this.poRepository.findOne({ where: { poNumber: 'PO-2026-SCENARIO-B' } });
    if (!poB) {
      const newPoB = new PurchaseOrder();
      newPoB.poNumber = 'PO-2026-SCENARIO-B';
      newPoB.quantity = 80;
      newPoB.status = 'DELIVERED';
      newPoB.supplierName = 'Tongyeong Deep-Sea Fishery';
      newPoB.supplierNameKo = '통영 원양 수산';
      newPoB.notes = '시나리오 B: 단계별 온도 이탈 4건 발생 건 (H:0 / P:1 / T:2 / D:1)';
      if (product) newPoB.product = product;
      await this.poRepository.save(newPoB);
      this.logger.log('Synchronized PO-2026-SCENARIO-B into PostgreSQL database.');
    } else {
      let updated = false;
      if (poB.status !== 'DELIVERED') {
        poB.status = 'DELIVERED';
        updated = true;
      }
      if (!poB.supplierName || !poB.supplierNameKo) {
        poB.supplierName = 'Tongyeong Deep-Sea Fishery';
        poB.supplierNameKo = '통영 원양 수산';
        updated = true;
      }
      if (updated) await this.poRepository.save(poB);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. MongoDB 텔레메트리 시계열 데이터 시딩 (시나리오 A & B)
  // ─────────────────────────────────────────────────────────────
  private async seedMongoScenarios() {
    if (!this.sensorLogModel) return;

    const now = Date.now();
    const baseTime = now - TOTAL_HOURS * HOUR;

    // ── 시나리오 A: 이탈 0건 (안정적인 골든 시나리오) ──
    const countA = await this.sensorLogModel.countDocuments({ poNumber: 'PO-2026-SCENARIO-A' }).exec();
    if (countA === 0) {
      const stageGroupsA: { stage: Stage; points: SeedPoint[] }[] = [
        {
          stage: 'HARVESTED',
          points: [
            { h: 0, t: -10.0, note: 'Blast Freezing Pulldown Initiated (Target: -55°C)', isFreezing: true },
            { h: 3, t: -35.0, note: 'Blast Freezing Pulldown in Progress', isFreezing: true },
            { h: 6, t: -57.5, note: 'Deep-Freeze Target Achieved (-57.5°C)' },
            { h: 24, t: -58.2 },
            { h: 48, t: -57.8 },
            { h: 72, t: -58.0 },
            { h: 96, t: -57.5 },
            { h: 120, t: -58.3 },
            { h: 144, t: -57.9 },
            { h: 168, t: -58.1 },
            { h: 192, t: -57.6 },
            { h: 216, t: -57.9 },
          ],
        },
        {
          stage: 'PROCESSING',
          points: [
            { h: 228, t: -56.0 },
            { h: 230, t: -40.0 },
            { h: 232, t: -28.0 },
            { h: 234, t: -25.5, note: 'Processing Line Ingress (Normal Operation)' },
            { h: 236, t: -24.0 },
            { h: 238, t: -23.5 },
            { h: 240, t: -24.8 },
            { h: 242, t: -25.2 },
            { h: 244, t: -24.5 },
            { h: 246, t: -23.8 },
            { h: 248, t: -24.6 },
            { h: 250, t: -25.0 },
            { h: 252, t: -25.0 },
          ],
        },
        {
          stage: 'IN_TRANSIT',
          points: [
            { h: 255, t: -53.0, note: 'Reefer Container Loading Confirmed' },
            { h: 258, t: -56.8 },
            { h: 261, t: -52.5 },
            { h: 264, t: -57.2 },
            { h: 267, t: -53.8 },
            { h: 270, t: -55.9 },
            { h: 273, t: -46.5, note: 'Door Open Event Detected (Normal Threshold)' },
            { h: 276, t: -50.2 },
            { h: 279, t: -56.5 },
            { h: 282, t: -53.0 },
            { h: 285, t: -57.5 },
            { h: 288, t: -52.8 },
            { h: 291, t: -56.0 },
            { h: 294, t: -53.5 },
            { h: 297, t: -47.0 },
            { h: 300, t: -57.0 },
            { h: 303, t: -53.2 },
            { h: 306, t: -56.3 },
            { h: 309, t: -52.6, note: 'Reefer Container Discharge Initiated' },
            { h: 312, t: -57.4 },
            { h: 315, t: -53.9 },
            { h: 318, t: -55.8 },
            { h: 321, t: -54.2 },
            { h: 324, t: -55.0 },
          ],
        },
        {
          stage: 'DELIVERED',
          points: [
            { h: 326, t: -57.0 },
            { h: 328, t: -58.0 },
            { h: 330, t: -58.5 },
            { h: 332, t: -59.0, note: 'Warehouse Intake Inspection Passed (HACCP Compliant)' },
            { h: 334, t: -59.1 },
            { h: 336, t: -59.2 },
          ],
        },
      ];

      const logsA = buildLogsForScenario('PO-2026-SCENARIO-A', baseTime, stageGroupsA);
      await this.sensorLogModel.insertMany(logsA);
      this.logger.log('Seeded MongoDB telemetry records for PO-2026-SCENARIO-A (Golden Scenario: 0 Excursions).');
    }

    // ── 시나리오 B: 이탈 총 4건 발생 시나리오 (0 / 1 / 2 / 1) ──
    const countB = await this.sensorLogModel.countDocuments({ poNumber: 'PO-2026-SCENARIO-B' }).exec();
    if (countB === 0) {
      const stageGroupsB: { stage: Stage; points: SeedPoint[] }[] = [
        {
          stage: 'HARVESTED',
          points: [
            { h: 0, t: -9.5, note: 'Blast Freezing Pulldown Initiated (Target: -55°C)', isFreezing: true },
            { h: 3, t: -36.0, note: 'Blast Freezing Pulldown in Progress', isFreezing: true },
            { h: 6, t: -57.8, note: 'Deep-Freeze Target Achieved (-57.8°C)' },
            { h: 24, t: -58.0 },
            { h: 48, t: -57.6 },
            { h: 72, t: -58.2 },
            { h: 96, t: -57.9 },
            { h: 120, t: -58.1 },
            { h: 144, t: -57.7 },
            { h: 168, t: -58.3 },
            { h: 192, t: -57.8 },
            { h: 216, t: -58.0 },
          ],
        },
        {
          stage: 'PROCESSING',
          points: [
            { h: 228, t: -56.5 },
            { h: 230, t: -41.0 },
            { h: 232, t: -27.5 },
            { h: 234, t: -18.0, note: 'Processing Temp Excursion (Threshold Exceeded)' },
            { h: 236, t: -23.2 },
            { h: 238, t: -24.5 },
            { h: 240, t: -25.0 },
            { h: 242, t: -24.6 },
            { h: 244, t: -23.9 },
            { h: 246, t: -24.8 },
            { h: 248, t: -25.1 },
            { h: 250, t: -24.7 },
            { h: 252, t: -25.0 },
          ],
        },
        {
          stage: 'IN_TRANSIT',
          points: [
            { h: 255, t: -53.5, note: 'Reefer Container Loading Confirmed' },
            { h: 258, t: -56.2 },
            { h: 261, t: -54.0 },
            { h: 264, t: -57.0 },
            { h: 267, t: -53.2 },
            { h: 270, t: -55.6 },
            { h: 273, t: -42.0, note: 'Door Open Event Detected' },
            { h: 276, t: -54.8 },
            { h: 279, t: -56.0 },
            { h: 282, t: -53.6 },
            { h: 285, t: -57.1 },
            { h: 288, t: -54.3 },
            { h: 291, t: -55.7 },
            { h: 294, t: -53.9 },
            { h: 297, t: -40.0, note: 'Cooling Unit Malfunction Detected (Excursion Started)' },
            { h: 300, t: -38.5, note: 'Cooling Unit Malfunction Ongoing (Peak Excursion: -38.5°C)' },
            { h: 303, t: -41.5, note: 'Cooling Unit Malfunction (Recovery in Progress)' },
            { h: 306, t: -50.0 },
            { h: 309, t: -54.5, note: 'Reefer Container Discharge Initiated' },
            { h: 312, t: -57.3 },
            { h: 315, t: -53.8 },
            { h: 318, t: -55.9 },
            { h: 321, t: -54.1 },
            { h: 324, t: -55.0 },
          ],
        },
        {
          stage: 'DELIVERED',
          points: [
            { h: 326, t: -56.5 },
            { h: 328, t: -57.5 },
            { h: 330, t: -42.5, note: 'Delivery Handling Excursion (Threshold Exceeded)' },
            { h: 332, t: -58.0, note: 'Warehouse Intake Inspection Passed (HACCP Compliant)' },
            { h: 334, t: -59.0 },
            { h: 336, t: -59.2 },
          ],
        },
      ];

      const logsB = buildLogsForScenario('PO-2026-SCENARIO-B', baseTime, stageGroupsB);
      await this.sensorLogModel.insertMany(logsB);
      this.logger.log('Seeded MongoDB telemetry records for PO-2026-SCENARIO-B (4 Excursions).');
    }
  }
}
