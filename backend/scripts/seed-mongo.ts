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
  const baseTime = now - 72 * HOUR; // 72시간 전 기준

  const mockLogs = [
    // Stage 1: 어획 및 선내 보관 (0h ~ 24h)
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -10.0, latitude: 35.0784, longitude: 129.0069, timestamp: new Date(baseTime + 0 * HOUR), eventNote: '어획 완료' },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -35.0, latitude: 35.0790, longitude: 129.0080, timestamp: new Date(baseTime + 3 * HOUR) },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -57.5, latitude: 35.0800, longitude: 129.0100, timestamp: new Date(baseTime + 6 * HOUR) },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -58.2, latitude: 35.0812, longitude: 129.0125, timestamp: new Date(baseTime + 12 * HOUR) },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -57.8, latitude: 35.0825, longitude: 129.0150, timestamp: new Date(baseTime + 18 * HOUR) },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -57.0, latitude: 35.0838, longitude: 129.0175, timestamp: new Date(baseTime + 24 * HOUR) },

    // Stage 2: 초저온 가공 (24h ~ 33h) - 가공 중 노출 피크 포함
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -48.0, latitude: 35.0845, longitude: 129.0185, timestamp: new Date(baseTime + 27 * HOUR) },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -36.5, latitude: 35.0855, longitude: 129.0198, timestamp: new Date(baseTime + 29 * HOUR), eventNote: '가공 중 노출 (Processing Exposure)' },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -46.0, latitude: 35.0865, longitude: 129.0210, timestamp: new Date(baseTime + 31 * HOUR) },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -56.2, latitude: 35.0875, longitude: 129.0225, timestamp: new Date(baseTime + 33 * HOUR) },

    // Stage 3: 초저온 운송 (33h ~ 63h) - 도어 개폐 피크 포함
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -55.0, latitude: 35.0888, longitude: 129.0240, timestamp: new Date(baseTime + 42 * HOUR) },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -54.8, latitude: 35.0895, longitude: 129.0250, timestamp: new Date(baseTime + 48 * HOUR) },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -45.0, latitude: 35.0905, longitude: 129.0265, timestamp: new Date(baseTime + 50 * HOUR), eventNote: '도어 개폐 (Door Open Event)' },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -52.5, latitude: 35.0915, longitude: 129.0280, timestamp: new Date(baseTime + 52 * HOUR) },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -53.0, latitude: 35.0925, longitude: 129.0295, timestamp: new Date(baseTime + 60 * HOUR) },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -52.2, latitude: 35.0935, longitude: 129.0310, timestamp: new Date(baseTime + 63 * HOUR) },

    // Stage 4: 입고 및 검수 (63h ~ 72h) - 검수 완료 포함
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -51.5, latitude: 35.0945, longitude: 129.0325, timestamp: new Date(baseTime + 68 * HOUR), eventNote: '입고 검수 완료 (Inspection Passed)' },
    { poNumber: 'PO-2026-SCENARIO-A', temperature: -52.0, latitude: 35.0955, longitude: 129.0340, timestamp: new Date(baseTime + 72 * HOUR) },

    // 기타 레거시 PO 샘플
    { poNumber: 'PO-20260916-6842', temperature: -56.4, latitude: 35.9892, longitude: 129.5541, timestamp: new Date() }
  ];

  await SensorRawLog.deleteMany({});
  const inserted = await SensorRawLog.insertMany(mockLogs);
  console.log(`[Mongo Seed] Successfully inserted ${inserted.length} 72-hour telemetry sensor logs!`);

  await mongoose.disconnect();
  process.exit(0);
}

seedMongo().catch((err) => {
  console.error('[Mongo Seed Error]', err);
  process.exit(1);
});

