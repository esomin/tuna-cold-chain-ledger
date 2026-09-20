import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ReferenceArea,
  CartesianGrid
} from 'recharts';
import {
  QrCode,
  MapPin,
  Thermometer,
  Waves,
  ShieldCheck,
  Boxes,
  Activity,
  Radio,
  BookOpenCheck,
  Compass,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { OrderListPanel } from '../components/OrderListPanel';
import { DistributionTimeline } from '../components/Timeline/DistributionTimeline';
import { LiveMaplibreMap } from '../components/Map/LiveMaplibreMap';
import { useTelemetry } from '../hooks/useTelemetry';
import { OrderCreateModal } from '../components/OrderCreateModal';
import { fetchFleets } from '../services/fleet.service';
import type { Fleet } from '../services/fleet.service';



interface PurchaseOrder {
  id: string;
  poNumber: string;
  quantity: number;
  status: string;
  supplierName: string;
  notes: string;
  product: {
    sku: string;
    name: string;
  };
}

// Custom Tooltip for Recharts Telemetry Chart
const RechartsCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const chamber = payload.find((p: any) => p.dataKey === 'chamberTemp');
    const ambient = payload.find((p: any) => p.dataKey === 'ambientTemp');
    return (
      <div className="bg-slate-900/95 border border-cyan-500/40 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-2xl text-xs font-sans">
        <p className="font-bold text-slate-200 mb-1.5 border-b border-white/10 pb-1">
          {label}
        </p>
        {chamber && chamber.value !== undefined && chamber.value !== null && (
          <p className="text-cyan-300 font-mono flex items-center justify-between gap-4 py-0.5">
            <span className="text-slate-400 font-sans">실측 온도:</span>
            <strong className="text-cyan-300 font-bold">
              {typeof chamber.value === 'number' ? `${chamber.value.toFixed(1)}°C` : `${chamber.value}°C`}
            </strong>
          </p>
        )}
        {ambient && ambient.value !== undefined && ambient.value !== null && (
          <p className="text-emerald-400 font-mono flex items-center justify-between gap-4 py-0.5">
            <span className="text-slate-400 font-sans">외기 환경:</span>
            <strong className="text-emerald-300 font-bold">
              +{typeof ambient.value === 'number' ? `${ambient.value.toFixed(1)}°C` : `${ambient.value}°C`}
            </strong>
          </p>
        )}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('72h');
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchFleets().then((data) => {
      if (data && data.length > 0) {
        setFleets(data);
      }
    });
  }, []);

  const displayFleet = useMemo(() => {
    if (!selectedPo || !selectedPo.supplierName) {
      return null;
    }

    const matched = fleets.find(
      (f) =>
        f.koName === selectedPo.supplierName ||
        selectedPo.supplierName.includes(f.koName) ||
        f.koName.includes(selectedPo.supplierName) ||
        f.code === selectedPo.supplierName
    );

    if (matched) {
      return {
        ...matched,
        latitude: matched.latitude ?? 35.0784,
        longitude: matched.longitude ?? 129.0069,
      };
    }

    if (fleets.length > 0) {
      const key = selectedPo.poNumber || selectedPo.id || selectedPo.supplierName;
      const charSum = key.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const fb = fleets[charSum % fleets.length];
      return {
        ...fb,
        koName: selectedPo.supplierName || fb.koName,
        latitude: fb.latitude ?? 35.0784,
        longitude: fb.longitude ?? 129.0069,
      };
    }

    return {
      code: 'FL',
      name: selectedPo.supplierName,
      koName: selectedPo.supplierName,
      homePort: '미지정 부두',
      latitude: 35.0784,
      longitude: 129.0069,
    };
  }, [selectedPo, fleets]);


  const isPoCompleted = selectedPo?.status === 'COMPLETED' || selectedPo?.status === 'DELIVERED';

  const {
    telemetry: liveTelemetry,
    telemetryHistory,
    alerts,
    clearAlerts,
    simTemperature,
    preset,
    refetchTelemetry,
    connectionStatus,
    lastUpdated,
  } = useTelemetry(
    selectedPo?.poNumber,
    displayFleet ? {
      latitude: displayFleet.latitude,
      longitude: displayFleet.longitude,
    } : undefined,
    isPoCompleted
  );

  const isDisconnected = connectionStatus === 'disconnected' || Boolean(backendError);

  // '입고 완료' (COMPLETED / DELIVERED) 시 '72시간 추이' 탭만 고정, 이전 진행 단계(어획, 가공, 운송)는 '실시간 스트림' 고정
  useEffect(() => {
    if (selectedPo) {
      if (selectedPo.status === 'COMPLETED' || selectedPo.status === 'DELIVERED') {
        setSelectedTimeRange('72h');
      } else {
        setSelectedTimeRange('Live Feed');
      }
    }
  }, [selectedPo]);

  const baseChamberTemp = preset?.defaultTemperature || -56.5;
  const currentChamberTemp = simTemperature !== undefined ? simTemperature : baseChamberTemp;

  // Recharts Dynamic Data derived from MongoDB telemetryHistory, filter tab ('Live Feed' vs '72h') & selected PO Preset
  const chartData = useMemo(() => {
    if (!selectedPo || isDisconnected) return [];

    const isLive = selectedTimeRange === 'Live Feed' || selectedTimeRange === 'Live Stream';

    if (telemetryHistory && telemetryHistory.length > 0) {
      const validItems = telemetryHistory.filter((item: any) => {
        const temp = item?.chamberTemp ?? item?.temperature;
        return typeof temp === 'number' && !isNaN(temp);
      });

      if (validItems.length === 0) return [];

      const targetItems = isLive ? validItems.slice(-10) : validItems;
      const minTime = targetItems[0]?.timestamp ? new Date(targetItems[0].timestamp).getTime() : Date.now();
      const maxTime = targetItems[targetItems.length - 1]?.timestamp ? new Date(targetItems[targetItems.length - 1].timestamp).getTime() : minTime + 336 * 3600 * 1000;
      const totalSpan = maxTime - minTime || 1;

      const mapped = targetItems.map((item: any, index: number) => {
        const rawTemp = item?.chamberTemp ?? item?.temperature;
        const tempVal = typeof rawTemp === 'number' && !isNaN(rawTemp) ? rawTemp : currentChamberTemp;
        let timeLabel = '';
        if (isLive) {
          const d = item?.timestamp ? new Date(item.timestamp) : new Date();
          timeLabel = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        } else {
          const itemTime = item?.timestamp ? new Date(item.timestamp).getTime() : minTime + (index / targetItems.length) * totalSpan;
          const elapsedDays = Math.floor((itemTime - minTime) / (24 * 3600 * 1000)) + 1;
          timeLabel = String(elapsedDays);
        }
        return {
          time: timeLabel,      // human-readable label (for tooltip)
          rawIndex: index,       // numeric x-axis key
          chamberTemp: Number(tempVal.toFixed(1)),
          isPin: index === targetItems.length - 1,
          timestamp: item?.timestamp || null,
          stage: item?.stage || 'HARVESTED',
          targetTemp: typeof item?.targetTemp === 'number' ? item.targetTemp : -55,
          warningTemp: typeof item?.warningTemp === 'number' ? item.warningTemp : -45,
        };
      });

      return mapped;
    }

    return [];
  }, [selectedTimeRange, currentChamberTemp, selectedPo, telemetryHistory, isDisconnected]);

  // 4개 공정 단계별 동적 X축 배경 영역(ReferenceArea) 계산 로직 (방식 B)
  // rawIndex(숫자) 기반으로 x1/x2를 설정 → ReferenceArea가 XAxis와 정확히 매핑됨
  const stageRanges = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    const isLive = selectedTimeRange === 'Live Feed' || selectedTimeRange === 'Live Stream';
    if (isLive) return [];

    const validPoints = chartData.filter(
      (d): d is typeof chartData[0] & { chamberTemp: number } =>
        typeof d.chamberTemp === 'number' && !isNaN(d.chamberTemp)
    );
    if (validPoints.length === 0) return [];

    const STAGE_LABELS: Record<string, { name: string; fill: string; textFill: string }> = {
      HARVESTED: { name: '1. Harvested', fill: '#5495f1ff', textFill: '#f1f5f9' },  // slate-400
      PROCESSING: { name: '2. Processing', fill: '#5495f1ff', textFill: '#f1f5f9' },
      IN_TRANSIT: { name: '3. In Transit', fill: '#5495f1ff', textFill: '#f1f5f9' },
      DELIVERED: { name: '4. Delivered', fill: '#5495f1ff', textFill: '#f1f5f9' },
    };

    const DEFAULT_CONFIG = STAGE_LABELS.HARVESTED;

    const ranges: { stage: string; name: string; x1: number; x2: number; fill: string; textFill: string }[] = [];
    let currentStage = validPoints[0]?.stage || 'HARVESTED';
    let x1 = validPoints[0]?.rawIndex ?? 0;

    for (let i = 1; i < validPoints.length; i++) {
      const st = validPoints[i]?.stage || 'HARVESTED';
      if (st !== currentStage) {
        const cfg = STAGE_LABELS[currentStage] || DEFAULT_CONFIG;
        ranges.push({ stage: currentStage, name: cfg.name, x1, x2: validPoints[i - 1]?.rawIndex ?? i - 1, fill: cfg.fill, textFill: cfg.textFill });
        currentStage = st;
        x1 = validPoints[i]?.rawIndex ?? i;
      }
    }
    const finalCfg = STAGE_LABELS[currentStage] || DEFAULT_CONFIG;
    ranges.push({
      stage: currentStage,
      name: finalCfg.name,
      x1,
      x2: validPoints[validPoints.length - 1]?.rawIndex ?? validPoints.length - 1,
      fill: finalCfg.fill,
      textFill: finalCfg.textFill,
    });

    return ranges;
  }, [chartData, selectedTimeRange]);

  const tempStats = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { anomalyCount: 0, complianceRate: 100, isStable: true };
    }
    const validPoints = chartData.filter((d): d is typeof chartData[0] & { chamberTemp: number } => typeof d.chamberTemp === 'number' && !isNaN(d.chamberTemp));
    if (validPoints.length === 0) {
      return { anomalyCount: 0, complianceRate: 100, isStable: true };
    }
    const anomalies = validPoints.filter(d => d.chamberTemp > (typeof d.warningTemp === 'number' ? d.warningTemp : -45));
    const count = anomalies.length;
    const complianceRate = Number((((validPoints.length - count) / validPoints.length) * 100).toFixed(1));
    return {
      anomalyCount: count,
      complianceRate,
      isStable: count === 0 && (simTemperature === undefined || simTemperature <= -45.0),
    };
  }, [chartData, simTemperature]);

  const activePinItem = useMemo(() => {
    const validPoints = chartData.filter((d): d is typeof chartData[0] & { chamberTemp: number } => typeof d.chamberTemp === 'number' && !isNaN(d.chamberTemp));
    if (validPoints.length === 0) return null;
    const pinned = validPoints.find(d => d.isPin);
    return pinned || validPoints[validPoints.length - 1];
  }, [chartData]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSensorSync = async () => {
    if (isDisconnected) return;
    setIsSyncing(true);
    try {
      await refetchTelemetry();
    } catch (e) {
      console.error('Failed to refetch telemetry:', e);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 600);
    }
  };

  return (
    <div className="p-4 sm:p-7 lg:p-8 flex flex-col gap-6 text-slate-100">
      {/* Top Disconnection Banner */}
      {isDisconnected && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-digital shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="font-semibold">서버 연결 끊김 · 재연결 시도 중…</span>
          </div>
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 shrink-0">마지막 갱신: {lastUpdated}</span>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & SUMMARY METRIC PILLS (Matching Mockup Header) */}
      {/* ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Tuna Cold Chain</span>
              <span className="text-sky-400 font-normal text-lg sm:text-xl">Dashboard</span>
            </h1>
            {connectionStatus === 'disconnected' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                v1.0-OFFLINE
              </span>
            ) : connectionStatus === 'connecting' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                v1.0-CONNECTING
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                v1.0-LIVE
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time Telemetry & On-Chain Integrity Tracking for Cryogenic Logistics
          </p>
        </div>

        {/* Top Summary Stat Capsule */}
        <div className="flex flex-wrap items-center gap-1 mt-4">
          <div className="glass-pill px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg w-[220px] shrink-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-semibold text-slate-400 truncate">{t('dashboard.metrics.totalMonitoring')}</p>
              <p className="text-sm font-bold text-white truncate">
                <span className="font-mono">
                  {selectedPo && !isDisconnected ? `${selectedPo.quantity.toLocaleString()} kg` : '-- kg'}
                </span>{' '}
                <span className="text-[10px] text-sky-300 font-normal font-sans">
                  / {selectedPo && !isDisconnected ? t('dashboard.metrics.batchCount') : '--'}
                </span>
              </p>
            </div>
          </div>

          <div className="glass-pill px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg w-[220px] shrink-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
              <Thermometer className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-semibold text-slate-400 truncate">{t('dashboard.metrics.targetTemp')}</p>
              <p className="text-sm font-bold text-cyan-300 truncate">
                <span className="font-mono">-55.0°C</span> <span className="text-[10px] text-slate-400 font-normal font-sans">{t('dashboard.metrics.safetyStandard')}</span>
              </p>
            </div>
          </div>
        </div>
      </div >

      {/* ========================================================================= */}
      {/* 2. MAIN TWO-COLUMN DASHBOARD GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ========================================================================= */}
        {/* LEFT / CENTER COLUMN (8 of 12 Cols) */}
        {/* ========================================================================= */}
        <div className="xl:col-span-8 flex flex-col gap-6">

          {/* 2.1 TWO-PANEL ROW: Orders Feed & Live Map */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Panel 1: Left: Orders Feed (5 cols) */}
            <div className="md:col-span-5 glass-card rounded-3xl p-5 flex flex-col">
              <OrderListPanel
                selectedPoId={selectedPo ? selectedPo.id : null}
                onSelectPo={(po) => setSelectedPo(po)}
                isLoading={isInitialLoading}
                onErrorChange={(err) => setBackendError(err)}
                connectionStatus={connectionStatus}
              />
            </div>

            {/* Panel 2: Right: Live Map (7 cols) */}
            <div className={`md:col-span-7 glass-card rounded-3xl p-5 flex flex-col gap-4 transition-opacity ${isDisconnected ? 'opacity-80' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white tracking-wider">{t('dashboard.map.title')}</h3>
                </div>
                {isInitialLoading ? (
                  <div className="h-3.5 w-20 bg-slate-800 rounded animate-pulse" />
                ) : selectedPo ? (
                  <span className="text-[10px] font-semibold text-sky-300 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    {selectedPo.poNumber}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">대기 중</span>
                )}
              </div>

              {/* Map Container */}
              <div className="rounded-2xl overflow-hidden border border-white/10 relative flex-1 min-h-[360px] h-full shadow-inner">
                {isInitialLoading ? (
                  <div className="w-full h-full bg-slate-900/60 flex flex-col items-center justify-center gap-3 p-6 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                      <Compass className="w-6 h-6 text-slate-700 animate-spin-slow" />
                    </div>
                    <div className="h-4 w-40 bg-slate-800 rounded" />
                    <div className="h-3 w-56 bg-slate-800/60 rounded" />
                  </div>
                ) : isDisconnected ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 text-rose-300 font-digital">
                    <AlertTriangle className="w-10 h-10 text-rose-400 mb-2" />
                    <p className="text-xs font-bold mb-1">Backend Server Disconnected</p>
                    <p className="text-[11px] text-slate-400">Unable to receive real-time GPS telemetry.</p>
                  </div>
                ) : liveTelemetry ? (
                  <div className="relative w-full h-full">
                    <LiveMaplibreMap
                      lat={liveTelemetry.latitude}
                      lng={liveTelemetry.longitude}
                      poNumber={selectedPo ? selectedPo.poNumber : undefined}
                    />
                    {/* Floating HUD */}
                    <div className="absolute top-3 left-3 z-10 text-[11px] px-3.5 py-1.5 rounded-xl bg-white/50 border border-sky-400/40 backdrop-blur-md shadow-lg shadow-slate-900/15 flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
                      <span className="font-mono text-xs font-bold text-slate-800 tracking-wide">
                        GPS {liveTelemetry.latitude.toFixed(4)}°N, {liveTelemetry.longitude.toFixed(4)}°E
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950/40">
                    <Compass className="w-10 h-10 text-slate-500 mb-2 animate-spin-slow" />
                    <p className="text-xs text-slate-300 font-medium">선택된 발주/운송 건의 실시간 GPS 관제가 표시됩니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel 3: 2.2 TELEMETRY STATISTIC & TEMPERATURE TRAJECTORY GRAPH */}
          <div className={`glass-card rounded-3xl p-5 relative overflow-hidden flex flex-col gap-3.5 transition-opacity ${isDisconnected ? 'opacity-80' : ''}`}>
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-base font-bold text-white tracking-wide">{t('dashboard.telemetryTitle')}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('dashboard.labels.sensorRules')}
                </p>
              </div>

              {/* Range filter pill */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs self-start sm:self-auto">
                {[
                  { label: t('dashboard.labels.liveFeed'), key: 'Live Feed' },
                  { label: t('dashboard.labels.72hTrend'), key: '72h' }
                ].map((item) => {
                  const isCompleted = selectedPo?.status === 'COMPLETED' || selectedPo?.status === 'DELIVERED';
                  const isDisabled = item.key === 'Live Feed' && isCompleted;
                  const isActive = selectedTimeRange === item.key || (item.key === '72h' && (selectedTimeRange === '72h' || selectedTimeRange === '24h'));

                  return (
                    <button
                      key={item.key}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setSelectedTimeRange(item.key)}
                      className={`px-3.5 py-1 rounded-lg text-xs font-medium transition-all ${isDisabled
                        ? 'opacity-40 cursor-not-allowed text-slate-500 line-through'
                        : isActive
                          ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/30'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trajectory Highlights & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/10 pb-2.5 z-10">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                  <span>{t('dashboard.labels.realtimeDetected')} <strong className="text-white font-mono">{isDisconnected || !selectedPo || simTemperature === undefined ? '--' : `${simTemperature.toFixed(1)}°C`}</strong></span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>{t('dashboard.labels.safetyThreshold')}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>{t('dashboard.labels.warningThreshold')}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 shadow-sm ${tempStats.isStable
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${tempStats.isStable ? 'bg-emerald-400 animate-ping' : 'bg-rose-400 animate-pulse'}`} />
                  {tempStats.isStable ? t('dashboard.labels.stable') : t('dashboard.labels.anomaliesCount', { count: tempStats.anomalyCount })}
                </span>
              </div>
            </div>

            {/* Recharts Glowing Telemetry Spline Chart / Skeleton */}
            <div className="w-full h-44 sm:h-48 z-10 pt-1 -mx-2">
              {isInitialLoading ? (
                <div className="w-full h-full bg-slate-900/40 rounded-2xl flex flex-col justify-end p-4 gap-3 animate-pulse border border-white/5">
                  <div className="flex justify-between items-end h-28 gap-2">
                    {[40, 65, 30, 80, 50, 90, 75, 60, 85, 45].map((h, i) => (
                      <div key={i} className="w-full bg-slate-800/60 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="h-3 w-full bg-slate-800/40 rounded" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 text-slate-400 text-xs font-digital rounded-2xl border border-white/5 gap-2">
                  <Activity className="w-8 h-8 text-slate-600 mb-1 animate-pulse" />
                  <p className="font-semibold text-slate-300">{t('dashboard.labels.noTelemetryData')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      {/* Cyan Glow Gradient */}
                      <linearGradient id="cyanLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                      </linearGradient>

                      {/* Cyan Area Fill - Lighter Opacity */}
                      <linearGradient id="cyanAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.07" />
                        <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Dynamic Stage Background Areas (방식 B) - rawIndex 숫자 기반 매핑 */}
                    {stageRanges.map((rng, idx) => (
                      <ReferenceArea
                        key={`stage-bg-${idx}-${rng.stage}`}
                        yAxisId="left"
                        x1={rng.x1}
                        x2={rng.x2}
                        y1={-65}
                        y2={-15}
                        fill={rng.fill}
                        fillOpacity={0.15}
                        stroke={rng.fill}
                        strokeOpacity={0.4}
                        strokeDasharray="3 3"
                        label={{
                          value: rng.name,
                          position: 'insideTop',
                          fill: rng.textFill,
                          fontSize: 10,
                          fontWeight: 700,
                          dy: 6,
                        }}
                      />
                    ))}

                    {/* Horizontal Auxiliary Grid Lines (보조선) */}
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.12} vertical={false} />

                    <XAxis
                      dataKey="rawIndex"
                      type="number"
                      domain={[0, chartData.length - 1]}
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff', opacity: 0.12 }}
                      dy={5}
                      tickFormatter={(val: number) => {
                        // rawIndex → 해당 포인트의 day 레이블 반환 (중복 제거)
                        const pt = chartData[val];
                        return pt?.time ?? '';
                      }}
                      ticks={(() => {
                        // 고유 day 레이블이 바뀌는 첫 번째 rawIndex만 tick으로 표시
                        const seen = new Set<string>();
                        const result: number[] = [];
                        chartData.forEach((pt) => {
                          if (pt.time && !seen.has(pt.time)) {
                            seen.add(pt.time);
                            result.push(pt.rawIndex);
                          }
                        });
                        return result;
                      })()}
                    />

                    <YAxis
                      yAxisId="left"
                      hide={false}
                      domain={[-65, -15]}
                      ticks={[-60, -55, -50, -45, -35, -25, -20]}
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff', opacity: 0.12 }}
                      unit="°C"
                      dx={-4}
                    />

                    <Tooltip content={<RechartsCustomTooltip />} />

                    {/* Safety Threshold Line (-55°C) */}
                    <ReferenceLine
                      yAxisId="left"
                      y={-55}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      strokeWidth={1.2}
                      strokeOpacity={0.85}
                      label={{
                        value: '-55°C',
                        position: 'insideBottomLeft',
                        fill: '#f43f5e',
                        fontSize: 10,
                        fontWeight: 600,
                        dy: 12,
                        dx: 0
                      }}
                    />

                    {/* Warning Threshold Line (-45°C) */}
                    <ReferenceLine
                      yAxisId="left"
                      y={-45}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth={1.2}
                      strokeOpacity={0.85}
                      label={{
                        value: '-45°C',
                        position: 'insideTopLeft',
                        fill: '#f59e0b',
                        fontSize: 10,
                        fontWeight: 600,
                        dy: -12,
                        dx: 0
                      }}
                    />

                    {/* Processing Target Line (-25°C) */}
                    <ReferenceLine
                      yAxisId="left"
                      y={-25}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      strokeWidth={1.2}
                      strokeOpacity={0.85}
                      label={{
                        value: '-25°C',
                        position: 'insideBottomLeft',
                        fill: '#f43f5e',
                        fontSize: 10,
                        fontWeight: 600,
                        dy: 12,
                        dx: 0
                      }}
                    />

                    {/* Processing Warning Line (-22°C) */}
                    <ReferenceLine
                      yAxisId="left"
                      y={-22}
                      stroke="#fb923c"
                      strokeDasharray="4 4"
                      strokeWidth={1.2}
                      strokeOpacity={0.8}
                      label={{
                        value: '-22°C',
                        position: 'insideTopLeft',
                        fill: '#fb923c',
                        fontSize: 10,
                        fontWeight: 600,
                        dy: -12,
                        dx: 0
                      }}
                    />

                    {/* Primary Neon Cyan Smooth Curve (Chamber Internal Temp) */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="chamberTemp"
                      stroke="url(#cyanLineGrad)"
                      strokeWidth={3.5}
                      dot={false}
                      activeDot={{ r: 6, fill: '#00f0ff', stroke: '#030e1a', strokeWidth: 2 }}
                      isAnimationActive={true}
                    />

                    {/* Active Telemetry Pin Badge Dot */}
                    {activePinItem && activePinItem.chamberTemp !== null && (
                      <ReferenceDot
                        key={`pin-${activePinItem.rawIndex}-${activePinItem.chamberTemp}`}
                        yAxisId="left"
                        x={activePinItem.rawIndex}
                        y={activePinItem.chamberTemp}
                        r={0}
                        shape={(props: any) => {
                          const { cx, cy } = props;
                          if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) return <g />;
                          return (
                            <g transform={`translate(${cx}, ${cy})`}>
                              <circle r="7" fill="#00f0ff" opacity="0.4" className="animate-ping" />
                              <circle r="4.5" fill="#030e1a" stroke="#00f0ff" strokeWidth="2.5" />
                              <g transform="translate(0, -23)">
                                <rect x="-35" y="-12" width="70" height="20" rx="5" fill="#020914" stroke="#00f0ff" strokeWidth="1.2" />
                                <text x="0" y="1" textAnchor="middle" fill="#00f0ff" fontSize="10" fontWeight="bold" fontFamily="Pretendard, sans-serif">
                                  {`${(activePinItem.chamberTemp as number).toFixed(1)}°C`}
                                </text>
                              </g>
                            </g>
                          );
                        }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 3개의 지표 카드 (Indicator Cards 1~3) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Indicator Card 1: Cold Chain Health */}
            <div className={`glass-card rounded-2xl p-4 flex items-center justify-between transition-opacity ${isDisconnected ? 'opacity-60' : ''}`}>
              {isInitialLoading ? (
                <div className="w-full flex items-center justify-between animate-pulse">
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-slate-800 rounded" />
                    <div className="h-7 w-20 bg-slate-800 rounded-md" />
                    <div className="h-2.5 w-28 bg-slate-800/60 rounded" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-slate-800" />
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400">{t('dashboard.metrics.freshnessIndex')}</p>
                    <p className="text-2xl font-black text-white font-mono mt-1">{isDisconnected ? '--' : '99.8%'}</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">{isDisconnected ? t('dashboard.labels.needConnection') : t('dashboard.metrics.premiumQuality')}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 flex items-center justify-center font-bold text-xs text-emerald-300">
                    {isDisconnected ? '--' : 'A+'}
                  </div>
                </>
              )}
            </div>

            {/* Indicator Card 2: On-chain Verification Lock */}
            <div className={`glass-card rounded-2xl p-4 flex items-center justify-between transition-opacity ${isDisconnected ? 'opacity-60' : ''}`}>
              {isInitialLoading ? (
                <div className="w-full flex items-center justify-between animate-pulse">
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-slate-800 rounded" />
                    <div className="h-7 w-16 bg-slate-800 rounded-md" />
                    <div className="h-2.5 w-20 bg-slate-800/60 rounded" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-slate-800" />
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400">{t('dashboard.metrics.smartContractLock')}</p>
                    <p className="text-2xl font-black text-white font-mono mt-1">{isDisconnected ? '--' : '100%'}</p>
                    <p className="text-[10px] text-cyan-300 mt-0.5">{isDisconnected ? t('dashboard.labels.needConnection') : 'Keccak256 SHA-3'}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 flex items-center justify-center font-bold text-xs text-cyan-300">
                    {isDisconnected ? '--' : 'L1'}
                  </div>
                </>
              )}
            </div>

            {/* Indicator Card 3: Target Temp Compliance */}
            <div className={`glass-card rounded-2xl p-4 flex items-center justify-between transition-opacity ${isDisconnected ? 'opacity-60' : ''}`}>
              {isInitialLoading ? (
                <div className="w-full flex items-center justify-between animate-pulse">
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-slate-800 rounded" />
                    <div className="h-7 w-20 bg-slate-800 rounded-md" />
                    <div className="h-2.5 w-16 bg-slate-800/60 rounded" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-slate-800" />
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400">{t('dashboard.metrics.complianceRate')}</p>
                    <p className="text-2xl font-black text-white font-mono mt-1">{isDisconnected ? '--' : '< -55°C'}</p>
                    <p className="text-[10px] text-sky-400 mt-0.5">
                      {isDisconnected ? t('dashboard.labels.needConnection') : tempStats.anomalyCount > 0 ? t('dashboard.labels.anomalyCount', { count: tempStats.anomalyCount }) : t('dashboard.labels.anomalyZero')}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-sky-500/20 border-t-sky-400 flex items-center justify-center font-bold text-xs text-sky-300">
                    {isDisconnected ? '--' : `${tempStats.complianceRate}%`}
                  </div>
                </>
              )}
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (4 of 12 Cols) */}
        {/* ========================================================================= */}
        <div className="xl:col-span-4 flex flex-col gap-6">

          {/* Panel 4: 3.1 OPERATOR PROFILE & BATCH DIGITAL TWIN CARD (MARITIME INTEGRITY NFT) */}
          <div className={`glass-card rounded-3xl p-5 flex flex-col gap-4 transition-opacity ${isDisconnected ? 'opacity-80' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white tracking-wider">{t('dashboard.fleetInfo.title')}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAlerts}
                  title="알림 통지"
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors relative"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {alerts.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>
              </div>
            </div>

            {/* User Details / Skeleton */}
            {isInitialLoading ? (
              <div className="flex items-center gap-3.5 w-full animate-pulse">
                <div className="w-13 h-13 rounded-2xl bg-slate-800 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                  <div className="h-3 w-44 bg-slate-800/60 rounded" />
                </div>
              </div>
            ) : displayFleet ? (
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-300 p-[2px] shadow-lg shadow-sky-500/20">
                      <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center font-black text-base text-cyan-300 font-mono">
                        {displayFleet.code.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${isDisconnected ? 'bg-amber-500' : 'bg-emerald-400'}`} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{displayFleet.koName}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs">
                      <span className="text-slate-400">{displayFleet.name}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-cyan-300/90 font-digital flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{t('dashboard.metrics.homePort')}: {displayFleet.homePort}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 text-center text-slate-400 text-xs font-digital glass-card-inner rounded-2xl border border-white/5 min-h-[52px]">
                <p className="font-semibold text-slate-400">{t('dashboard.labels.noFleetSelected')}</p>
              </div>
            )}

            {/* 3.2 HOLOGRAPHIC MARITIME LEDGER SMART CARD */}
            {isInitialLoading ? (
              <div className="rounded-2xl p-5 bg-slate-900/60 border border-white/10 h-48 flex flex-col justify-between animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="h-3 w-28 bg-slate-800 rounded" />
                    <div className="h-5 w-40 bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-slate-800 rounded" />
                </div>
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="flex justify-between items-end border-t border-white/10 pt-2">
                  <div className="h-4 w-24 bg-slate-800 rounded" />
                  <div className="h-4 w-16 bg-slate-800 rounded" />
                </div>
              </div>
            ) : selectedPo ? (
              <div className="rounded-2xl p-5 ocean-card-gradient text-white flex flex-col justify-between h-48 relative overflow-hidden border border-cyan-300/30 shadow-2xl">
                {/* Card Watermark */}
                <Waves className="absolute right-3 top-3 w-28 h-28 text-white/10 pointer-events-none" />

                <div className="flex justify-between items-start z-10">
                  <div>
                    <p className="text-[10px] font-mono tracking-widest uppercase text-cyan-200">MARITIME INTEGRITY NFT</p>
                    <p className="text-base font-extrabold tracking-tight mt-0.5">{selectedPo.product?.name || t('dashboard.labels.tunaProduct')}</p>
                  </div>
                  <span className="text-sm font-black italic tracking-wider text-cyan-200">TUNA CHAIN</span>
                </div>

                <div className="z-10 flex items-center gap-3">
                  {/* Realistic Credit Card IC Chip (Rounded Rectangular) */}
                  <div className="w-10 h-7 rounded-[7px] bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border border-amber-200/80 shadow-inner relative overflow-hidden flex flex-col justify-between p-0.5 shrink-0">
                  </div>
                  <span className="font-mono text-xs tracking-wider text-slate-200">
                    {selectedPo.poNumber}
                  </span>
                </div>

                <div className="flex justify-between items-end z-10 pt-2 border-t border-white/15">
                  <div>
                    <p className="text-[9px] uppercase text-cyan-200">{t('dashboard.metrics.safeBaseTemp')}</p>
                    <p className="text-xs font-bold font-mono">-55.0°C ULTRA COLD</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-cyan-200 text-right">{t('dashboard.metrics.totalBatchWeight')}</p>
                    <p className="text-sm font-black font-mono text-right">{selectedPo.quantity} kg</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-5 bg-slate-900/40 text-slate-400 flex flex-col items-center justify-center gap-2 h-48 border border-white/10 text-xs font-digital">
                <Boxes className="w-8 h-8 text-slate-600 mb-1" />
                <p className="font-semibold text-slate-300">{t('dashboard.labels.noOrderSelected')}</p>
              </div>
            )}

            {/* 3 CONTEXT ACTION SQUIRCLE BUTTONS */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
              <button
                onClick={handleSensorSync}
                disabled={isDisconnected || !selectedPo}
                title={isDisconnected ? t('dashboard.labels.needServerConnection') : !selectedPo ? t('dashboard.labels.needOrderSelected') : ''}
                className={`flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl border transition-all group ${isDisconnected || !selectedPo
                  ? 'bg-slate-800/40 border-slate-700/40 text-slate-500 opacity-60 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 hover:border-sky-400/50 hover:bg-sky-500/15 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                  }`}
              >
                <Radio className={`w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform ${isSyncing ? 'animate-spin text-sky-200' : ''}`} />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white font-digital">{isSyncing ? t('dashboard.labels.syncing') : t('dashboard.labels.sensorSync')}</span>
              </button>

              {isDisconnected || !selectedPo ? (
                <button
                  disabled
                  title={isDisconnected ? t('dashboard.labels.needServerConnection') : t('dashboard.labels.needOrderSelected')}
                  className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-slate-500 opacity-60 cursor-not-allowed select-none"
                >
                  <BookOpenCheck className="w-6 h-6 text-slate-500" />
                  <span className="text-xs font-semibold font-digital">{t('dashboard.labels.blockchainVerify')}</span>
                </button>
              ) : (
                <Link
                  to={`/blockchain-ledger?search=${selectedPo.poNumber}`}
                  className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-400/50 hover:bg-sky-500/15 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all group"
                >
                  <BookOpenCheck className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white font-digital">{t('dashboard.labels.blockchainVerify')}</span>
                </Link>
              )}

              {isDisconnected || !selectedPo ? (
                <button
                  disabled
                  title={isDisconnected ? t('dashboard.labels.needServerConnection') : t('dashboard.labels.needOrderSelected')}
                  className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-slate-500 opacity-60 cursor-not-allowed select-none"
                >
                  <QrCode className="w-6 h-6 text-slate-500" />
                  <span className="text-xs font-semibold font-digital">{t('dashboard.labels.qrVerify')}</span>
                </button>
              ) : (
                <a
                  href={`/verify/${selectedPo.poNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-400/50 hover:bg-sky-500/15 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all group"
                >
                  <QrCode className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white font-digital">{t('dashboard.labels.qrVerify')}</span>
                </a>
              )}
            </div>

          </div>

          {/* Panel 5: 3.3 ON-CHAIN TIMELINE & ALERTS */}
          <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('dashboard.timeline.title')}</span>
              </h3>
            </div>

            <DistributionTimeline
              poNumber={selectedPo ? selectedPo.poNumber : null}
              status={selectedPo ? selectedPo.status : null}
              isLoading={isInitialLoading}
              isBackendError={isDisconnected}
            />
          </div>

        </div>

      </div>

      {/* New Transport Registration Modal */}
      <OrderCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderCreated={(newOrder) => {
          setSelectedPo(newOrder);
        }}
      />
    </div >
  );
};
export default Dashboard;

