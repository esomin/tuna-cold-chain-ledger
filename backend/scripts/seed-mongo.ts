import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/coldchain';

const SensorRawLogSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, index: true },
    temperature: { type: Number, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    eventNote: { type: String, required: false },
  },
  { collection: 'sensor_raw_logs', timestamps: true }
);

const SensorRawLog = mongoose.model('SensorRawLog', SensorRawLogSchema);

async function seedMongo() {
  console.log(`[Mongo Seed] Connecting to ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);

  const now = Date.now();
  const HOUR = 3600 * 1000;
  const TOTAL_HOURS = 336; // 14일
  const baseTime = now - TOTAL_HOURS * HOUR; // 336시간(14일) 전 기준

  // 좌표는 기존 로직 유지: 시간 진행에 따라 약간씩 drift
  const coord = (h: number) => ({
    latitude: Number((35.0784 + h * 0.00007).toFixed(4)),
    longitude: Number((129.0069 + h * 0.0001).toFixed(4)),
  });

  const poNumber = 'PO-2026-SCENARIO-A';

  // ── Stage 1: 어획 및 선내 초저온 보관 (0h ~ 228h, 9.5일, 전체의 68%)
  // 급속동결 램프다운(0~6h)만 촘촘히, 이후엔 24시간(1일) 간격으로 안정구간 표집
  const harvested = [
    { h: 0, t: -10.0, note: '어획 완료' },
    { h: 3, t: -35.0 },
    { h: 6, t: -57.5, note: '선내 급속동결 완료' },
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

  // ── Stage 2: 초저온 가공 (228h ~ 252h, 1일, 전체의 7%)
  // 2시간 간격, "가공 중 노출" 이벤트 포함
  const processing = [
    { h: 228, t: -57.0 },
    { h: 230, t: -52.0 },
    { h: 232, t: -48.5 },
    { h: 234, t: -46.0, note: '가공 중 노출 (Processing Exposure)' },
    { h: 236, t: -47.5 },
    { h: 238, t: -50.0 },
    { h: 240, t: -52.5 },
    { h: 242, t: -54.5 },
    { h: 244, t: -55.5 },
    { h: 246, t: -56.0 },
    { h: 248, t: -56.5 },
    { h: 250, t: -57.0 },
    { h: 252, t: -57.2 },
  ];

  // ── Stage 3: 초저온 운송 (252h ~ 324h, 3일, 전체의 21%)
  // 3시간 간격 (가장 촘촘), "도어 개폐" 이벤트 포함
  const transit = [
    { h: 255, t: -55.2 }, { h: 258, t: -54.8 }, { h: 261, t: -55.3 },
    { h: 264, t: -54.9 }, { h: 267, t: -55.4 }, { h: 270, t: -54.7 },
    { h: 273, t: -55.5 }, { h: 276, t: -54.6 }, { h: 279, t: -55.2 },
    { h: 282, t: -54.8 }, { h: 285, t: -55.1 }, { h: 288, t: -52.0 },
    { h: 291, t: -46.0, note: '도어 개폐 (Door Open Event)' },
    { h: 294, t: -49.5 }, { h: 297, t: -52.5 }, { h: 300, t: -54.0 },
    { h: 303, t: -54.8 }, { h: 306, t: -55.0 }, { h: 309, t: -54.7 },
    { h: 312, t: -55.2 }, { h: 315, t: -54.9 }, { h: 318, t: -55.3 },
    { h: 321, t: -54.8 }, { h: 324, t: -55.0 },
  ];

  // ── Stage 4: 입고 및 검수 (326h ~ 336h, 0.5일, 전체의 4%)
  // 2시간 간격, "입고 검수 완료" 이벤트 포함
  const delivered = [
    { h: 326, t: -57.0 },
    { h: 328, t: -58.0 },
    { h: 330, t: -58.5 },
    { h: 332, t: -59.0, note: '입고 검수 완료 (Inspection Passed)' },
    { h: 334, t: -59.1 },
    { h: 336, t: -59.2 },
  ];

  const allPoints = [...harvested, ...processing, ...transit, ...delivered];

  const mockLogs = allPoints.map(({ h, t, note }) => ({
    poNumber,
    temperature: t,
    ...coord(h),
    timestamp: new Date(baseTime + h * HOUR),
    ...(note ? { eventNote: note } : {}),
  }));

  // 기타 레거시 PO 샘플 (기존과 동일)
  mockLogs.push({
    poNumber: 'PO-20260916-6842',
    temperature: -56.4,
    latitude: 35.9892,
    longitude: 129.5541,
    timestamp: new Date(),
  });

  await SensorRawLog.deleteMany({});
  const inserted = await SensorRawLog.insertMany(mockLogs);
  console.log(`[Mongo Seed] Successfully inserted ${inserted.length} 14-day(336h) telemetry sensor logs!`);

  await mongoose.disconnect();
  process.exit(0);
}

seedMongo().catch((err) => {
  console.error('[Mongo Seed Error]', err);
  process.exit(1);
});