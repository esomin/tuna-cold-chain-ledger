import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface TelemetryData {
  poNumber: string;
  temperature: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface AlertData {
  poNumber: string;
  temperature: number;
  message: string;
  timestamp: string;
}

export const TelemetryService = {
  /**
   * MongoDB에서 해당 발주(PO)의 최신 텔레메트리 센서 로그 조회
   */
  async getLatestTelemetry(poNumber: string): Promise<TelemetryData | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-orders/${poNumber}/telemetry/latest`);
      return response.data;
    } catch (error) {
      console.warn(`[TelemetryService] MongoDB 쿼리 실패 (${poNumber}), 프리셋 폴백 사용.`);
      return null;
    }
  },

  /**
   * MongoDB에서 해당 발주(PO)의 전체 시계열 텔레메트리 센서 로그 조회
   */
  async getTelemetryHistory(poNumber: string): Promise<TelemetryData[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-orders/${poNumber}/telemetry/history`);
      return response.data || [];
    } catch (error) {
      console.warn(`[TelemetryService] 텔레메트리 히스토리 쿼리 실패 (${poNumber})`);
      return [];
    }
  },
};

