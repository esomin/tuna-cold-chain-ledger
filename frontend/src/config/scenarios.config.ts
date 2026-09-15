export interface ScenarioPreset {
  poNumber: string;
  defaultTemperature: number;
  ambientTemperature: number;
  latitude: number;
  longitude: number;
  description: string;
  timelineEvents: {
    harvestedAt: string;
    processedAt: string;
    inTransitAt: string;
    deliveredAt: string;
  };
}

export const SCENARIO_PRESETS: Record<string, ScenarioPreset> = {
  'PO-2026-SCENARIO-A': {
    poNumber: 'PO-2026-SCENARIO-A',
    defaultTemperature: -58.0,
    ambientTemperature: 22.0,
    latitude: 37.5665,
    longitude: 126.9780,
    description: '완료 시나리오: 서울 최종 수령지',
    timelineEvents: {
      harvestedAt: '09/14 08:00',
      processedAt: '09/14 14:00',
      inTransitAt: '09/15 02:00',
      deliveredAt: '09/15 16:00',
    },
  },
  DEFAULT: {
    poNumber: '',
    defaultTemperature: -56.5,
    ambientTemperature: 22.0,
    latitude: 35.1028,
    longitude: 129.0403,
    description: '신규 등록 배치 (1단계: 어획 완료 실시간 대기)',
    timelineEvents: {
      harvestedAt: '09/16 00:10 (어획)',
      processedAt: '대기 중',
      inTransitAt: '대기 중',
      deliveredAt: '대기 중',
    },
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

