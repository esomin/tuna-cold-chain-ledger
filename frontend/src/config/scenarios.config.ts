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
    defaultTemperature: -58.0,
    latitude: 37.5665,
    longitude: 126.9780,
    description: '완료 시나리오: 서울 최종 수령지',
  },
  DEFAULT: {
    poNumber: '',
    defaultTemperature: -56.5,
    latitude: 35.1028,
    longitude: 129.0403,
    description: '기본 라이브 운송 위치 (부산항)',
  },
};

export const getPresetByPoNumber = (poNumber?: string): ScenarioPreset => {
  if (!poNumber) return SCENARIO_PRESETS.DEFAULT;
  const preset = SCENARIO_PRESETS[poNumber];
  if (preset) return preset;
  
  return {
    ...SCENARIO_PRESETS.DEFAULT,
    poNumber,
  };
};

