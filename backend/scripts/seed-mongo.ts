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
  DELIVERED: { targetTemp: -55, warningTemp: -50 },
};

// ── 시간(h)-온도(t) 포인트 타입. note는 있을 수도 없을 수도 있어서 optional(?)
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

async function seedMongo() {
  console.log(`[Mongo Seed] Connecting to ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);

  const now = Date.now();
  const HOUR = 3600 * 1000;
  const TOTAL_HOURS = 336;
  const baseTime = now - TOTAL_HOURS * HOUR;

  // 파라미터 h에 타입 명시
  const coord = (h: number) => ({
    latitude: Number((35.0784 + h * 0.00007).toFixed(4)),
    longitude: Number((129.0069 + h * 0.0001).toFixed(4)),
  });

  const poNumber = 'PO-2026-SCENARIO-A';

  // 각 배열에 SeedPoint[] 타입 명시
  const harvested: SeedPoint[] = [
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

  const processing: SeedPoint[] = [
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

  const transit: SeedPoint[] = [
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

  const delivered: SeedPoint[] = [
    { h: 326, t: -57.0 },
    { h: 328, t: -58.0 },
    { h: 330, t: -58.5 },
    { h: 332, t: -59.0, note: '입고 검수 완료 (Inspection Passed)' },
    { h: 334, t: -59.1 },
    { h: 336, t: -59.2 },
  ];

  // stage 필드에 Stage 타입 명시 → STAGE_CONFIG[stage] 인덱싱 시 에러 사라짐
  const stageGroups: { stage: Stage; points: SeedPoint[] }[] = [
    { stage: 'HARVESTED', points: harvested },
    { stage: 'PROCESSING', points: processing },
    { stage: 'IN_TRANSIT', points: transit },
    { stage: 'DELIVERED', points: delivered },
  ];

  const mockLogs = stageGroups.flatMap(({ stage, points }) =>
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

  await SensorRawLog.deleteMany({});
  const inserted = await SensorRawLog.insertMany(mockLogs);
  console.log(`[Mongo Seed] Successfully inserted ${inserted.length} 14-day(336h) telemetry sensor logs (no-anomaly scenario)!`);

  await mongoose.disconnect();
  process.exit(0);
}

seedMongo().catch((err) => {
  console.error('[Mongo Seed Error]', err);
  process.exit(1);
});