import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
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
  Bell
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
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('72h');
  const [fleets, setFleets] = useState<Fleet[]>([]);

  useEffect(() => {
    fetchFleets().then((data) => {
      if (data && data.length > 0) {
        setFleets(data);
      }
    });
  }, []);

  const displayFleet = useMemo(() => {
    const defaultFleet = {
      code: 'PC7',
      name: 'Pacific Ocean Fleet No. 7',
      koName: '남태평양 원양선단 1팀',
      homePort: '부산항 감천항만',
      latitude: 35.0784,
      longitude: 129.0069,
    };

    if (!selectedPo || !selectedPo.supplierName) {
      return defaultFleet;
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

    // Fallback list cycling through Busan, Incheon, Pohang for legacy or un-seeded PO entries
    const fallbackList = fleets.length > 0 ? fleets : [
      { code: 'PC7', name: 'Pacific Ocean Fleet No. 7', koName: '남태평양 원양선단 1팀', homePort: '부산항 감천항만', latitude: 35.0784, longitude: 129.0069 },
      { code: 'PF12', name: 'Pacific Ocean Fleet No. 12', koName: '태평양 원양선단 2팀', homePort: '인천항 제3부두', latitude: 37.4645, longitude: 126.6173 },
      { code: 'NP3', name: 'North Pacific Ocean Fleet No. 3', koName: '북서태평양 원양선단 3팀', homePort: '포항 구룡포항', latitude: 35.9892, longitude: 129.5541 },
    ];
    const key = selectedPo.poNumber || selectedPo.id || selectedPo.supplierName;
    const charSum = key.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const fb = fallbackList[charSum % fallbackList.length];

    return {
      ...fb,
      koName: selectedPo.supplierName || fb.koName,
      latitude: fb.latitude ?? 35.0784,
      longitude: fb.longitude ?? 129.0069,
    };
  }, [selectedPo, fleets]);



  // 관심사의 분리를 위해 추상화된 useTelemetry 커스텀 훅 사용
  const isPoCompleted = selectedPo?.status === 'COMPLETED' || selectedPo?.status === 'DELIVERED';

  const {
    telemetry: liveTelemetry,
    telemetryHistory,
    alerts,
    clearAlerts,
    simTemperature,
    preset,
    refetchTelemetry,
  } = useTelemetry(
    selectedPo?.poNumber,
    {
      latitude: displayFleet.latitude,
      longitude: displayFleet.longitude,
    },
    isPoCompleted
  );


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
    const isLive = selectedTimeRange === 'Live Feed' || selectedTimeRange === 'Live Stream';

    if (isLive) {
      // '실시간 스트림' 필터버튼 선택 시: IoT 가상 센서(simulate-iot.ts / socket.io)에서 전송되는 실시간 패킷을 차트에 즉시 연동
      if (telemetryHistory && telemetryHistory.length > 0) {
        const validLiveItems = telemetryHistory.filter((item: any) => {
          const temp = item?.chamberTemp ?? item?.temperature;
          return typeof temp === 'number' && !isNaN(temp);
        });
        const liveItems = validLiveItems.slice(-10);

        const mappedLive = liveItems.map((item: any, index: number) => {
          const rawTemp = item?.chamberTemp ?? item?.temperature;
          const tempVal = typeof rawTemp === 'number' && !isNaN(rawTemp) ? rawTemp : currentChamberTemp;
          let timeStr = item?.time;
          if (!timeStr) {
            const d = item?.timestamp ? new Date(item.timestamp) : new Date();
            timeStr = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          }
          return {
            time: timeStr,
            chamberTemp: Number(tempVal.toFixed(1)),
            isPin: index === liveItems.length - 1,
          };
        });

        return [...mappedLive, { time: '', chamberTemp: null }];
      }

      const nowStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
      return [
        { time: '-60분', chamberTemp: Number((baseChamberTemp - 0.4).toFixed(1)) },
        { time: '-45분', chamberTemp: Number((baseChamberTemp - 1.8).toFixed(1)) },
        { time: '-30분', chamberTemp: Number((baseChamberTemp + 2.2).toFixed(1)) },
        { time: '-15분', chamberTemp: Number((currentChamberTemp).toFixed(1)) },
        { time: `현재 (${nowStr})`, chamberTemp: Number((currentChamberTemp - 0.5).toFixed(1)), isPin: true },
        { time: '', chamberTemp: null }
      ];
    }

    // SCENARIO 발주건 72시간 추이 시계열 데이터 연동 (DB 수신 데이터 1:1 직접 사용)
    if (selectedPo?.poNumber.includes('SCENARIO') && telemetryHistory && telemetryHistory.length > 0) {
      const minTime = telemetryHistory[0]?.timestamp ? new Date(telemetryHistory[0].timestamp).getTime() : 0;

      const mapped72h = telemetryHistory.map((item: any, index: number) => {
        const rawTemp = item?.chamberTemp ?? item?.temperature;
        const tempVal = typeof rawTemp === 'number' && !isNaN(rawTemp) ? rawTemp : baseChamberTemp;

        let timeStr = item?.time;
        if (item?.timestamp) {
          const elapsedHours = Math.round((new Date(item.timestamp).getTime() - minTime) / (3600 * 1000));
          timeStr = `${elapsedHours}h`;
        }

        return {
          time: timeStr,
          chamberTemp: Number(tempVal.toFixed(1)),
          isPin: item?.isPin ?? (index === telemetryHistory.length - 1),
        };
      });

      return [...mapped72h, { time: '', chamberTemp: null }];
    }

    return [
      { time: '0h', chamberTemp: -10.0 },
      { time: '12h', chamberTemp: -58.2 },
      { time: '24h', chamberTemp: -57.0 },
      { time: '29h', chamberTemp: -36.5 },
      { time: '33h', chamberTemp: -56.2 },
      { time: '50h', chamberTemp: -45.0 },
      { time: '63h', chamberTemp: -52.2 },
      { time: '68h', chamberTemp: -51.5, isPin: true },
      { time: '72h', chamberTemp: -52.0 },
      { time: '', chamberTemp: null }
    ];
  }, [selectedTimeRange, baseChamberTemp, currentChamberTemp, selectedPo, telemetryHistory]);

  const activePinItem = useMemo(() => {
    const validPoints = chartData.filter(d => typeof d.chamberTemp === 'number' && !isNaN(d.chamberTemp));
    if (validPoints.length === 0) return null;
    const pinned = validPoints.find(d => d.isPin);
    return pinned || validPoints[validPoints.length - 1];
  }, [chartData]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSensorSync = async () => {
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              v1.0-LIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time Telemetry & On-Chain Integrity Tracking for Cryogenic Logistics
          </p>
        </div>

        {/* Top Summary Stat Capsule */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="glass-pill px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">총 모니터링 물량</p>
              <p className="text-sm font-bold text-white"><span className="font-mono">1,480 kg</span> <span className="text-[10px] text-sky-300 font-normal font-sans">/ 12 배치</span></p>
            </div>
          </div>

          <div className="glass-pill px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">목표 초저온</p>
              <p className="text-sm font-bold text-cyan-300"><span className="font-mono">-55.0°C</span> <span className="text-[10px] text-slate-400 font-normal font-sans">안전 표준</span></p>
            </div>
          </div>
        </div>
      </div>

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

            {/* Left: Orders Feed (5 cols) */}
            <div className="md:col-span-5 glass-card rounded-3xl p-5 flex flex-col">
              <OrderListPanel
                selectedPoId={selectedPo ? selectedPo.id : null}
                onSelectPo={(po) => setSelectedPo(po)}
              />
            </div>

            {/* Right: Live Map (7 cols) */}
            <div className="md:col-span-7 glass-card rounded-3xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live GPS Tracking</h3>
                </div>
                {selectedPo ? (
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
                {liveTelemetry ? (
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

          {/* 2.2 TELEMETRY STATISTIC & TEMPERATURE TRAJECTORY GRAPH (Inspired by mockup's Statistic card) */}
          <div className="glass-card rounded-3xl p-5 relative overflow-hidden flex flex-col gap-3.5">
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-base font-bold text-white tracking-wide uppercase">Cold Chain Temp Track</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  초저온 보관 규정 준수 센서 실시간 가동 현황 (-55°C 기준)
                </p>
              </div>

              {/* Range filter pill */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs self-start sm:self-auto">
                {[
                  { label: '실시간 스트림', key: 'Live Feed' },
                  { label: '72시간 추이', key: '72h' }
                ].map((item) => {
                  const isCompleted = selectedPo?.status === 'COMPLETED' || selectedPo?.status === 'DELIVERED';
                  const isDisabled = item.key === 'Live Feed' && isCompleted;
                  const isActive = selectedTimeRange === item.key || (item.key === '72h' && (selectedTimeRange === '72h' || selectedTimeRange === '24h'));

                  return (
                    <button
                      key={item.key}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setSelectedTimeRange(item.key)}
                      title={isDisabled ? '입고 완료 상태에서는 72시간 전체 추이만 제공됩니다' : ''}
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
                  <span>실시간 감지: <strong className="text-white font-mono">{simTemperature ? `${simTemperature.toFixed(1)}°C` : '-57.4°C'}</strong></span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>안전 임계치 (-55°C)</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>경고 임계치 (-45°C)</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {simTemperature > -45 ? 'TEMP ANOMALY DETECTED' : '✓ 100% CRYOGENIC STABLE'}
                </span>
              </div>
            </div>

            {/* Recharts Glowing Telemetry Spline Chart - Focused Chamber Trajectory */}
            <div className="w-full h-44 sm:h-48 z-10 pt-1 -mx-2">
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

                  {/* Horizontal Auxiliary Grid Lines (보조선) */}
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.12} vertical={false} />

                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#ffffff', opacity: 0.12 }}
                    dy={5}
                  />

                  <YAxis
                    yAxisId="left"
                    hide={true}
                    domain={[-60, -40]}
                  />

                  <Tooltip content={<RechartsCustomTooltip />} />

                  {/* Auxiliary Guide Reference Lines (추가 보조선) */}
                  <ReferenceLine yAxisId="left" y={-50} stroke="#ffffff" strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.12} />
                  <ReferenceLine yAxisId="left" y={-58} stroke="#ffffff" strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.08} />

                  {/* Safety Threshold Line (-55°C Limit) */}
                  <ReferenceLine
                    yAxisId="left"
                    y={-55}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.2}
                    strokeOpacity={0.7}
                    label={{
                      value: '-55°C',
                      position: 'insideBottomLeft',
                      fill: '#f43f5e',
                      fontSize: 10,
                      fontWeight: 600,
                      dy: 12,
                      dx: 10
                    }}
                  />

                  {/* Warning Threshold Line (-45°C Limit) */}
                  <ReferenceLine
                    yAxisId="left"
                    y={-45}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.2}
                    strokeOpacity={0.8}
                    label={{
                      value: '-45°C',
                      position: 'insideTopLeft',
                      fill: '#f59e0b',
                      fontSize: 10,
                      fontWeight: 600,
                      dy: -12,
                      dx: 10
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
                  {activePinItem && (
                    <ReferenceDot
                      key={`pin-${activePinItem.time}-${activePinItem.chamberTemp}`}
                      yAxisId="left"
                      x={activePinItem.time}
                      y={activePinItem.chamberTemp}
                      r={0}
                      isFront={true}
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
                                {`${activePinItem.chamberTemp.toFixed(1)}°C`}
                              </text>
                            </g>
                          </g>
                        );
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2.3 BOTTOM ROW: Goals / Compliance Rings (Inspired by reference bottom goals & target) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Card 1: Cold Chain Health */}
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400">신선도 지수</p>
                <p className="text-2xl font-black text-white font-mono mt-1">99.8%</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">✓ 최고 등급 프리미엄 참다랑어</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 flex items-center justify-center font-bold text-xs text-emerald-300">
                A+
              </div>
            </div>

            {/* Card 2: On-chain Verification Lock */}
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400">스마트 컨트랙트 잠금</p>
                <p className="text-2xl font-black text-white font-mono mt-1">100%</p>
                <p className="text-[10px] text-cyan-300 mt-0.5">Keccak256 SHA-3</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 flex items-center justify-center font-bold text-xs text-cyan-300">
                L1
              </div>
            </div>

            {/* Card 3: Target Temp Compliance (Circular ring like mockup) */}
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400">초저온 규격 준수율</p>
                <p className="text-2xl font-black text-white font-mono mt-1">&lt; -55°C</p>
                <p className="text-[10px] text-sky-400 mt-0.5">온도 이탈 0건</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-sky-500/20 border-t-sky-400 flex items-center justify-center font-bold text-xs text-sky-300">
                100%
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (4 of 12 Cols) */}
        {/* ========================================================================= */}
        <div className="xl:col-span-4 flex flex-col gap-6">

          {/* 3.1 OPERATOR PROFILE & BATCH DIGITAL TWIN CARD (MARITIME INTEGRITY NFT) */}
          <div className="glass-card rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fishing Fleet Info</h3>
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

            {/* User Details */}
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-300 p-[2px] shadow-lg shadow-sky-500/20">
                    <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center font-black text-base text-cyan-300 font-mono">
                      {displayFleet.code.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{displayFleet.koName}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs">
                    <span className="text-slate-400">{displayFleet.name}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-cyan-300/90 font-digital flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>출항지: {displayFleet.homePort}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>



            {/* 3.2 HOLOGRAPHIC MARITIME LEDGER SMART CARD (Pristine Credit Card Design) */}
            <div className="rounded-2xl p-5 ocean-card-gradient text-white flex flex-col justify-between h-48 relative overflow-hidden border border-cyan-300/30 shadow-2xl">
              {/* Card Watermark */}
              <Waves className="absolute right-3 top-3 w-28 h-28 text-white/10 pointer-events-none" />

              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-[10px] font-mono tracking-widest uppercase text-cyan-200">MARITIME INTEGRITY NFT</p>
                  <p className="text-base font-extrabold tracking-tight mt-0.5">{selectedPo ? selectedPo.product.name : 'Pacific Bluefin Tuna'}</p>
                </div>
                <span className="text-sm font-black italic tracking-wider text-cyan-200">TUNA CHAIN</span>
              </div>

              <div className="z-10 flex items-center gap-3">
                <div className="w-9 h-6 rounded-md bg-amber-400/80 border border-amber-200/60 shadow-sm" />
                <span className="font-mono text-xs tracking-wider text-slate-200">
                  {selectedPo ? selectedPo.poNumber : 'PO-2026-SCENARIO-A'}
                </span>
              </div>

              <div className="flex justify-between items-end z-10 pt-2 border-t border-white/15">
                <div>
                  <p className="text-[9px] uppercase text-cyan-200">안전 기준 온도</p>
                  <p className="text-xs font-bold font-mono">-55.0°C ULTRA COLD</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-cyan-200 text-right">배치 총 중량</p>
                  <p className="text-sm font-black font-mono text-right">{selectedPo ? `${selectedPo.quantity} kg` : '150 kg'}</p>
                </div>
              </div>
            </div>

            {/* 3 CONTEXT ACTION SQUIRCLE BUTTONS (Ordered: Sensor Sync -> Ledger View -> QR Verification) */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
              <button
                onClick={handleSensorSync}
                className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-400/50 hover:bg-sky-500/15 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all group"
              >
                <Radio className={`w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform ${isSyncing ? 'animate-spin text-sky-200' : ''}`} />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white font-digital">{isSyncing ? '동기화중...' : 'Sensor 동기화'}</span>
              </button>

              <Link
                to={`/blockchain-ledger?search=${selectedPo ? selectedPo.poNumber : ''}`}
                className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-400/50 hover:bg-sky-500/15 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all group"
              >
                <BookOpenCheck className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white font-digital">Blockchain 검증</span>
              </Link>

              <a
                href={`/verify/${selectedPo ? selectedPo.poNumber : 'PO-2026-SCENARIO-A'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-400/50 hover:bg-sky-500/15 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all group"
              >
                <QrCode className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white font-digital">QR 검증</span>
              </a>
            </div>

          </div>

          {/* 3.3 ON-CHAIN TIMELINE & ALERTS */}
          <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>On-Chain Supply Timeline</span>
              </h3>
            </div>

            <DistributionTimeline
              poNumber={selectedPo ? selectedPo.poNumber : 'PO-2026-SCENARIO-A'}
              status={selectedPo ? selectedPo.status : 'COMPLETED'}
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
    </div>
  );
};

export default Dashboard;

