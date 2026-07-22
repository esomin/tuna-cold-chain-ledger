export interface ScenarioPreset {
  poNumber: string;
  defaultTemperature: number;
  latitude: number;
  longitude: number;
  description: string;
}

export const SCENARIO_PRESETS: Record<string, ScenarioPreset> = {
  'PO-2026-SCENARIO-A': {
    poNumber: 'PO-2026-SCENARIO-A',
    defaultTemperature: -57.5,
    latitude: 37.5665,
    longitude: 126.9780,
    description: '완료 시나리오: 서울 최종 수령지',
  },
  'PO-2026-SCENARIO-B': {
    poNumber: 'PO-2026-SCENARIO-B',
    defaultTemperature: -52.0,
    latitude: 35.1796,
    longitude: 129.0756,
    description: '과거 운송 이탈 건: 운송 중 -52°C 고온 이탈 기록',
  },
  DEFAULT: {
    poNumber: 'PO-2026-SCENARIO-C',
    defaultTemperature: -58.0,
    latitude: 36.5000,
    longitude: 127.8000,
    description: '라이브 운송 시나리오: 대전 이동 허브',
  },
};

export const getPresetByPoNumber = (poNumber?: string): ScenarioPreset => {
  if (!poNumber) return SCENARIO_PRESETS.DEFAULT;
  return SCENARIO_PRESETS[poNumber] || SCENARIO_PRESETS.DEFAULT;
};
