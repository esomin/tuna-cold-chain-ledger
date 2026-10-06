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

// Module-level in-memory cache for SWR (Stale-While-Revalidate)
const latestTelemetryCache = new Map<string, TelemetryData>();
const historyTelemetryCache = new Map<string, TelemetryData[]>();

export const TelemetryService = {
  /**
   * 캐시된 텔레메트리 즉시 반환 (SWR 초기값 제공용)
   */
  getCachedLatest(poNumber: string): TelemetryData | null {
    return latestTelemetryCache.get(poNumber) || null;
  },

  /**
   * 캐시된 히스토리 즉시 반환 (SWR 초기값 제공용)
   */
  getCachedHistory(poNumber: string): TelemetryData[] {
    return historyTelemetryCache.get(poNumber) || [];
  },

  /**
   * MongoDB에서 해당 발주(PO)의 최신 텔레메트리 센서 로그 조회 (SWR)
   */
  async getLatestTelemetry(poNumber: string): Promise<TelemetryData | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-orders/${poNumber}/telemetry/latest`);
      if (response.data) {
        latestTelemetryCache.set(poNumber, response.data);
      }
      return response.data;
    } catch (error) {
      console.warn(`[TelemetryService] MongoDB 쿼리 실패 (${poNumber}), 프리셋 폴백 사용.`);
      return latestTelemetryCache.get(poNumber) || null;
    }
  },

  /**
   * MongoDB에서 해당 발주(PO)의 전체 시계열 텔레메트리 센서 로그 조회 (SWR)
   */
  async getTelemetryHistory(poNumber: string): Promise<TelemetryData[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-orders/${poNumber}/telemetry/history`);
      const data = response.data || [];
      if (Array.isArray(data) && data.length > 0) {
        historyTelemetryCache.set(poNumber, data);
      }
      return data;
    } catch (error) {
      console.warn(`[TelemetryService] 텔레메트리 히스토리 쿼리 실패 (${poNumber})`);
      return historyTelemetryCache.get(poNumber) || [];
    }
  },
};


