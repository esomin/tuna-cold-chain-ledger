import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/coldchain';

// ── 단계 타입을 명시적으로 정의 (STAGE_CONFIG, points 배열, stageGroups에서 재사용)
type Stage = 'HARVESTED' | 'PROCESSING' | 'IN_TRANSIT' | 'DELIVERED';

interface StageThreshold {
  targetTemp: number;
  warningTemp: number;
}

const STAGE_CONFIG: Record<Stage, StageThreshold> = {
  HARVESTED: { targetTemp: -55, warningTemp: -45 },
  PROCESSING: { targetTemp: -25, warningTemp: -22 },
  IN_TRANSIT: { targetTemp: -55, warningTemp: -45 },
  DELIVERED: { targetTemp: -55, warningTemp: -45 },
};

interface SeedPoint {
  h: number;
  t: number;
  note?: string;
  isFreezing?: boolean;
}

const SensorRawLogSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, index: true },
    temperature: { type: Number, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    eventNote: { type: String, required: false },
    stage: {
      type: String,
      required: true,
      enum: ['HARVESTED', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED'],
      index: true,
    },
    targetTemp: { type: Number, required: true },
    warningTemp: { type: Number, required: true },
    isFreezing: { type: Boolean, default: false },
  },
  { collection: 'sensor_raw_logs', timestamps: true }
);

const SensorRawLog = mongoose.model('SensorRawLog', SensorRawLogSchema);

const HOUR = 3600 * 1000;
const TOTAL_HOURS = 336;

const coord = (h: number) => ({
  latitude: Number((35.0784 + h * 0.00007).toFixed(4)),
  longitude: Number((129.0069 + h * 0.0001).toFixed(4)),
});

// ── 공통 변환 헬퍼: 시나리오별 stageGroups를 받아 DB insert용 로그 배열로 변환
function buildLogsForScenario(
  poNumber: string,
  baseTime: number,
  stageGroups: { stage: Stage; points: SeedPoint[] }[]
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
    }))
  );
}

async function seedMongo() {
  console.log(`[Mongo Seed] Connecting to ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);

  const now = Date.now();
  const baseTime = now - TOTAL_HOURS * HOUR;

  // ═══════════════════════════════════════════════
  // 시나리오 A: 이탈 0건 (정상 운영 기준선)
  // ═══════════════════════════════════════════════
  const poNumberA = 'PO-2026-SCENARIO-A';

  const harvestedA: SeedPoint[] = [
    { h: 0, t: -10.0, note: '어획 완료 (선내 급속동결 시작)', isFreezing: true },
    { h: 3, t: -35.0, note: '급속동결 진행 중 (Freezing Pulldown)', isFreezing: true },
    { h: 6, t: -57.5, note: '선내 급속동결 완료 (-57.5°C)' },
    { h: 24, t: -58.2 },
    { h: 48, t: -57.8 },
    { h: 72, t: -58.0 },
    { h: 96, t: -57.5 },
    { h: 120, t: -58.3 },
    { h: 144, t: -57.9 },
    { h: 168, t: -58.1 },
    { h: 192, t: -57.6 },
    { h: 216, t: -57.9 },
  ];

  const processingA: SeedPoint[] = [
    { h: 228, t: -56.0 },
    { h: 230, t: -40.0 },
    { h: 232, t: -28.0 },
    { h: 234, t: -25.5, note: '가공 작업 진행 (Processing Handling)' },
    { h: 236, t: -24.0 },
    { h: 238, t: -23.5 },
    { h: 240, t: -24.8 },
    { h: 242, t: -25.2 },
    { h: 244, t: -24.5 },
    { h: 246, t: -23.8 },
    { h: 248, t: -24.6 },
    { h: 250, t: -25.0 },
    { h: 252, t: -25.0 },
  ];

  const transitA: SeedPoint[] = [
    { h: 255, t: -53.0, note: '컨테이너 상차 (Loading)' },
    { h: 258, t: -56.8 },
    { h: 261, t: -52.5 },
    { h: 264, t: -57.2 },
    { h: 267, t: -53.8 },
    { h: 270, t: -55.9 },
    { h: 273, t: -46.5, note: '도어 개폐 (Door Open Event)' },
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
    { h: 309, t: -52.6, note: '컨테이너 하차 대비 (Unloading Prep)' },
    { h: 312, t: -57.4 },
    { h: 315, t: -53.9 },
    { h: 318, t: -55.8 },
    { h: 321, t: -54.2 },
    { h: 324, t: -55.0 },
  ];

  const deliveredA: SeedPoint[] = [
    { h: 326, t: -57.0 },
    { h: 328, t: -58.0 },
    { h: 330, t: -58.5 },
    { h: 332, t: -59.0, note: '입고 검수 완료 (Inspection Passed)' },
    { h: 334, t: -59.1 },
    { h: 336, t: -59.2 },
  ];

  const stageGroupsA: { stage: Stage; points: SeedPoint[] }[] = [
    { stage: 'HARVESTED', points: harvestedA },
    { stage: 'PROCESSING', points: processingA },
    { stage: 'IN_TRANSIT', points: transitA },
    { stage: 'DELIVERED', points: deliveredA },
  ];

  // ═══════════════════════════════════════════════
  // 시나리오 B: 이탈 총 4건 (0 / 1 / 2 / 1 배분)
  // ═══════════════════════════════════════════════
  const poNumberB = 'PO-2026-SCENARIO-B';

  // HARVESTED: 0건 — A와 동일하게 안정 구간 유지
  const harvestedB: SeedPoint[] = [
    { h: 0, t: -9.5, note: '어획 완료 (선내 급속동결 시작)', isFreezing: true },
    { h: 3, t: -36.0, note: '급속동결 진행 중 (Freezing Pulldown)', isFreezing: true },
    { h: 6, t: -57.8, note: '선내 급속동결 완료 (-57.8°C)' },
    { h: 24, t: -58.0 },
    { h: 48, t: -57.6 },
    { h: 72, t: -58.2 },
    { h: 96, t: -57.9 },
    { h: 120, t: -58.1 },
    { h: 144, t: -57.7 },
    { h: 168, t: -58.3 },
    { h: 192, t: -57.8 },
    { h: 216, t: -58.0 },
  ];

  // PROCESSING: 1건 — 단발성 이탈
  const processingB: SeedPoint[] = [
    { h: 228, t: -56.5 },
    { h: 230, t: -41.0 },
    { h: 232, t: -27.5 },
    { h: 234, t: -18.0, note: 'Processing Temp Excursion (Safety Threshold Exceeded)' }, // Incident 1
    { h: 236, t: -23.2 },
    { h: 238, t: -24.5 },
    { h: 240, t: -25.0 },
    { h: 242, t: -24.6 },
    { h: 244, t: -23.9 },
    { h: 246, t: -24.8 },
    { h: 248, t: -25.1 },
    { h: 250, t: -24.7 },
    { h: 252, t: -25.0 },
  ];

  // IN_TRANSIT: 2건 — ① 도어 개폐(단발성) ② 냉동유닛 이상(지속형, 3포인트 연속 초과)
  const transitB: SeedPoint[] = [
    { h: 255, t: -53.5, note: 'Container Loading' },
    { h: 258, t: -56.2 },
    { h: 261, t: -54.0 },
    { h: 264, t: -57.0 },
    { h: 267, t: -53.2 },
    { h: 270, t: -55.6 },
    { h: 273, t: -42.0, note: 'Door Open Event (Threshold Exceeded)' }, // Incident 2
    { h: 276, t: -54.8 },
    { h: 279, t: -56.0 },
    { h: 282, t: -53.6 },
    { h: 285, t: -57.1 },
    { h: 288, t: -54.3 },
    { h: 291, t: -55.7 },
    { h: 294, t: -53.9 },
    { h: 297, t: -40.0, note: 'Cooling Unit Malfunction (Excursion Started)' }, // Incident 3 start
    { h: 300, t: -38.5, note: 'Cooling Unit Malfunction (Peak Excursion)' }, // Incident 3 ongoing
    { h: 303, t: -41.5, note: 'Cooling Unit Malfunction Recovering' }, // Incident 3 recovery
    { h: 306, t: -50.0 },
    { h: 309, t: -54.5, note: 'Unloading Preparation' },
    { h: 312, t: -57.3 },
    { h: 315, t: -53.8 },
    { h: 318, t: -55.9 },
    { h: 321, t: -54.1 },
    { h: 324, t: -55.0 },
  ];

  // DELIVERED: 1건 — 하역 과정 중 안전임계치(-45°C) 초과 이탈
  const deliveredB: SeedPoint[] = [
    { h: 326, t: -56.5 },
    { h: 328, t: -57.5 },
    { h: 330, t: -42.5, note: 'Delivery Handling Excursion (Threshold Exceeded)' }, // Incident 4
    { h: 332, t: -58.0, note: 'Delivery Inspection Passed' },
    { h: 334, t: -59.0 },
    { h: 336, t: -59.2 },
  ];

  const stageGroupsB: { stage: Stage; points: SeedPoint[] }[] = [
    { stage: 'HARVESTED', points: harvestedB },
    { stage: 'PROCESSING', points: processingB },
    { stage: 'IN_TRANSIT', points: transitB },
    { stage: 'DELIVERED', points: deliveredB },
  ];

  // ── 두 시나리오 로그 합쳐서 일괄 insert
  const mockLogsA = buildLogsForScenario(poNumberA, baseTime, stageGroupsA);
  const mockLogsB = buildLogsForScenario(poNumberB, baseTime, stageGroupsB);
  const mockLogs = [...mockLogsA, ...mockLogsB];

  await SensorRawLog.deleteMany({});
  const inserted = await SensorRawLog.insertMany(mockLogs);
  console.log(
    `[Mongo Seed] Successfully inserted ${inserted.length} logs — ` +
    `Scenario A (${mockLogsA.length}, 0 excursions) + Scenario B (${mockLogsB.length}, 4 excursions: 0/1/2/1)!`
  );

  await mongoose.disconnect();
  process.exit(0);
}

seedMongo().catch((err) => {
  console.error('[Mongo Seed Error]', err);
  process.exit(1);
});