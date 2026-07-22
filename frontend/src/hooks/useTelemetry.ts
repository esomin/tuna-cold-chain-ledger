import { useState, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getPresetByPoNumber } from '../config/scenarios.config';
import { TelemetryService, type TelemetryData, type AlertData } from '../services/telemetryService';

export const useTelemetry = (selectedPoNumber?: string) => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [simTemperature, setSimTemperature] = useState<number>(-58);
  const [socket, setSocket] = useState<Socket | null>(null);

  // 1. 선택된 PO 변경 시 텔레메트리 초기화 (REST API 조회를 시도하고 실패 시 프리셋 폴백)
  useEffect(() => {
    if (!selectedPoNumber) return;

    let isMounted = true;
    const loadInitialData = async () => {
      const dbData = await TelemetryService.getLatestTelemetry(selectedPoNumber);
      if (!isMounted) return;

      if (dbData) {
        setTelemetry(dbData);
        setSimTemperature(dbData.temperature);
      } else {
        const preset = getPresetByPoNumber(selectedPoNumber);
        setTelemetry({
          poNumber: selectedPoNumber,
          temperature: preset.defaultTemperature,
          latitude: preset.latitude,
          longitude: preset.longitude,
          timestamp: new Date().toISOString(),
        });
        setSimTemperature(preset.defaultTemperature);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [selectedPoNumber]);

  // 2. 웹소켓 연결 및 실시간 텔레메트리 / 알림 수신
  useEffect(() => {
    // 발주 선택 변경 시 이전 경고 피드 비우기
    setAlerts([]);

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:3000';

    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('live_telemetry', (data: TelemetryData) => {
      if (selectedPoNumber && data.poNumber === selectedPoNumber) {
        setTelemetry(data);
        setSimTemperature(data.temperature);
      }
    });

    newSocket.on('temperature_alert', (data: AlertData) => {
      // 현재 선택된 발주건에 관한 경고일 경우에만 피드에 수신 추가
      if (selectedPoNumber && data.poNumber === selectedPoNumber) {
        setAlerts((prev) => [data, ...prev].slice(0, 5));
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [selectedPoNumber]);

  // 3. IoT 가상 센서 패킷 송신 시뮬레이션
  const handleSimulateTemperature = (newTemp: number) => {
    setSimTemperature(newTemp);
    if (!selectedPoNumber || !socket) return;

    const preset = getPresetByPoNumber(selectedPoNumber);
    const mockGps = {
      'PO-2026-SCENARIO-A': { lat: 37.5665, lng: 126.9780 },
      'PO-2026-SCENARIO-B': { lat: 35.1796, lng: 129.0756 },
      'PO-2026-SCENARIO-C': { lat: 36.5, lng: 127.8 },
    }[selectedPoNumber] || { lat: preset.latitude, lng: preset.longitude };

    socket.emit('send_telemetry', {
      poNumber: selectedPoNumber,
      temperature: newTemp,
      latitude: mockGps.lat,
      longitude: mockGps.lng,
    });
  };

  // 4. 경고 피드 초기화/삭제 핸들러
  const clearAlerts = () => {
    setAlerts([]);
  };

  return {
    telemetry,
    alerts,
    clearAlerts,
    simTemperature,
    handleSimulateTemperature,
  };
};
