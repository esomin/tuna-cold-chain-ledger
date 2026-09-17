import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/coldchain';

const SensorRawLogSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, index: true },
    temperature: { type: Number, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: 'sensor_raw_logs', timestamps: true }
);

const SensorRawLog = mongoose.model('SensorRawLog', SensorRawLogSchema);

async function seedMongo() {
  console.log(`[Mongo Seed] Connecting to ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);

  const mockLogs = [
    {
      poNumber: 'PO-2026-SCENARIO-A',
      temperature: -58.2,
      latitude: 35.0784,
      longitude: 129.0069,
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      poNumber: 'PO-2026-SCENARIO-A',
      temperature: -57.8,
      latitude: 35.0812,
      longitude: 129.0125,
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      poNumber: 'PO-2026-SCENARIO-A',
      temperature: -58.5,
      latitude: 35.0855,
      longitude: 129.0198,
      timestamp: new Date(),
    },
    {
      poNumber: 'PO-20260916-6842',
      temperature: -56.4,
      latitude: 35.9892,
      longitude: 129.5541,
      timestamp: new Date(),
    }
  ];

  await SensorRawLog.deleteMany({});
  const inserted = await SensorRawLog.insertMany(mockLogs);
  console.log(`[Mongo Seed] Successfully inserted ${inserted.length} initial telemetry sensor logs!`);

  await mongoose.disconnect();
  process.exit(0);
}

seedMongo().catch((err) => {
  console.error('[Mongo Seed Error]', err);
  process.exit(1);
});
