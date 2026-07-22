import React, { useState } from 'react';
import {
  QrCode,
  MapPin,
  Thermometer,
  AlertTriangle
} from 'lucide-react';
import { OrderListPanel } from '../components/OrderListPanel';
import { DistributionTimeline } from '../components/Timeline/DistributionTimeline';
import { LiveMaplibreMap } from '../components/Map/LiveMaplibreMap';
import { useTelemetry } from '../hooks/useTelemetry';

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

const Dashboard: React.FC = () => {
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  // 관심사의 분리를 위해 추상화된 useTelemetry 커스텀 훅 사용
  const {
    telemetry: liveTelemetry,
    alerts,
    clearAlerts,
    simTemperature,
  } = useTelemetry(selectedPo?.poNumber);

  return (
    <div
      className="p-6 -m-6"
      style={{
        backgroundColor: 'var(--theme-night)',
        color: 'var(--theme-cream)'
      }}
    >
      {/* TOP HEADER */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: 'rgba(var(--theme-aqua-rgb), 0.2)' }}
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--theme-cream)' }}>
            <span>Tuna Cold Chain Integrity Control Center</span>
            <span
              className="text-[10px] px-2 py-0.5 rounded font-mono font-normal"
              style={{
                backgroundColor: 'rgba(var(--theme-aqua-rgb), 0.15)',
                color: 'var(--theme-aqua)'
              }}
            >
              v1.0-LIVE
            </span>
          </h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>
            Real-time monitoring from ocean harvesting to mobile consumer integrity verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/verify/${selectedPo ? selectedPo.poNumber : 'PO-2026-SCENARIO-A'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
            style={{
              backgroundColor: 'rgba(var(--theme-aqua-rgb), 0.15)',
              color: 'var(--theme-aqua)'
            }}
          >
            <span>소비자 모바일 검증 뷰어 ↗</span>
          </a>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              color: 'var(--theme-cream)'
            }}
          >
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: '#10B981' }} />
            <span>실시간 블록체인 락업 활성화</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

        {/* ========================================================================= */}
        {/* LEFT COLUMN: 발주/운송 목록 피드 - col-span-3 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div
            className="rounded-xl p-5 shadow-lg"
            style={{
              backgroundColor: 'var(--theme-card-bg)'
            }}
          >
            <OrderListPanel
              selectedPoId={selectedPo ? selectedPo.id : null}
              onSelectPo={(po) => setSelectedPo(po)}
            />
          </div>

          {/* Verification Portal (QR Hover) */}
          <div
            className="rounded-xl p-5 shadow-lg relative group"
            style={{
              backgroundColor: 'var(--theme-card-bg)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5" style={{ color: 'var(--theme-aqua)' }}>
                <QrCode className="w-4 h-4" style={{ color: 'var(--theme-aqua)' }} />
                Verification Portal
              </h2>
              <span className="text-[10px] font-medium" style={{ color: 'var(--theme-aqua)' }}>QR 검증</span>
            </div>
            <div
              className="rounded-lg p-4 text-center flex flex-col items-center justify-center min-h-[140px]"
              style={{
                backgroundColor: 'var(--theme-card-inner-bg)'
              }}
            >
              <QrCode className="w-12 h-12 mb-2" style={{ color: 'var(--theme-aqua)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--theme-cream)' }}>소비자 검증 웹 뷰어 QR</p>
              <p className="text-[9px] mt-1.5 leading-relaxed" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>
                마우스 오버시 모바일 시뮬레이터가 팝업되어 소비자용 블록체인 정품 인증서를 노출합니다.
              </p>
            </div>

            {/* Hover Mobile Simulator Mockup */}
            {selectedPo && (
              <div
                className="absolute left-[102%] top-0 z-50 w-72 rounded-2xl p-4 shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-300"
                style={{
                  backgroundColor: 'var(--theme-card-bg)'
                }}
              >
                <div className="w-12 h-1 rounded-full mx-auto mb-3" style={{ backgroundColor: 'rgba(var(--theme-cream-rgb), 0.2)' }} />
                <h4 className="text-xs font-bold text-center mb-2" style={{ color: 'var(--theme-aqua)' }}>Tuna Chain Cert (Mobile)</h4>
                <div
                  className="rounded-lg p-3 text-[10px] space-y-2"
                  style={{
                    backgroundColor: 'var(--theme-card-inner-bg)'
                  }}
                >
                  <p style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>발주 번호: <span className="font-mono font-bold" style={{ color: 'var(--theme-cream)' }}>{selectedPo.poNumber}</span></p>
                  <p style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>품목명: <span style={{ color: 'var(--theme-cream)' }}>{selectedPo.product.name}</span></p>
                  <p style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>최종 유통상태: <span className="font-bold" style={{ color: 'var(--theme-aqua)' }}>{selectedPo.status}</span></p>
                  <div className="border-t pt-2 flex justify-between items-center" style={{ borderColor: 'rgba(var(--theme-cream-rgb), 0.1)' }}>
                    <span style={{ color: 'rgba(var(--theme-cream-rgb), 0.5)' }}>정품 보증 여부</span>
                    <span className="font-bold" style={{ color: 'var(--theme-aqua)' }}>✓ VERIFIED</span>
                  </div>
                </div>
                <p className="text-[8px] mt-2 text-center" style={{ color: 'rgba(var(--theme-cream-rgb), 0.4)' }}>QR스캔시 브라우저를 통해 직접 접속하실 수 있습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: 실시간 관제 지도 및 온도 추이 - col-span-6 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col gap-6">

          {/* Live Map Panel */}
          <div
            className="rounded-xl p-5 shadow-lg flex flex-col gap-4"
            style={{
              backgroundColor: 'var(--theme-card-bg)'
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.7)' }}>
                <MapPin className="w-4 h-4" style={{ color: 'var(--theme-aqua)' }} />
                Live Monitoring Map
              </h2>
              {selectedPo ? (
                <span className="text-[10px] font-medium flex items-center gap-1 animate-pulse" style={{ color: 'var(--theme-aqua)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-aqua)' }}></span>
                  {selectedPo.poNumber} 경로 렌더링 중
                </span>
              ) : (
                <span className="text-[10px]" style={{ color: 'rgba(var(--theme-cream-rgb), 0.4)' }}>대기 중</span>
              )}
            </div>

            {/* Real MapLibre GL Vector Map */}
            <div
              className="rounded-lg h-[380px] flex flex-col justify-between relative overflow-hidden shrink-0"
              style={{
                backgroundColor: 'var(--theme-card-inner-bg)'
              }}
            >
              {liveTelemetry ? (
                <div className="relative w-full h-[380px]">
                  <LiveMaplibreMap
                    lat={liveTelemetry.latitude}
                    lng={liveTelemetry.longitude}
                    poNumber={selectedPo ? selectedPo.poNumber : undefined}
                  />
                  {/* Top Floating Map HUD */}
                  <div className="absolute top-2 left-2 z-10 text-[11px] px-2.5 py-1 rounded-md shadow-md border flex items-center gap-2" style={{ backgroundColor: 'rgba(24, 25, 26, 0.85)', borderColor: 'rgba(var(--theme-cream-rgb), 0.15)', backdropFilter: 'blur(4px)' }}>
                    <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--theme-aqua)' }} />
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--theme-aqua)' }}>
                      Lat: {liveTelemetry.latitude.toFixed(4)} | Lng: {liveTelemetry.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <MapPin className="w-10 h-10 mx-auto mb-2" style={{ color: 'rgba(var(--theme-cream-rgb), 0.3)' }} />
                  <p className="text-xs" style={{ color: 'rgba(var(--theme-cream-rgb), 0.5)' }}>선택된 발주의 유통 지도가 렌더링됩니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* Temperature Chart Panel */}
          <div
            className="rounded-xl p-5 shadow-lg flex flex-col gap-4"
            style={{
              backgroundColor: 'var(--theme-card-bg)'
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.7)' }}>
                <Thermometer className="w-4 h-4" style={{ color: 'var(--theme-aqua)' }} />
                Real-Time Temperature Trajectory
              </h2>
              <span className="text-[10px]" style={{ color: 'rgba(var(--theme-cream-rgb), 0.5)' }}>Last 24 Hours</span>
            </div>

            <div
              className="rounded-lg p-6 min-h-[200px] flex flex-col justify-center items-center text-center relative overflow-hidden"
              style={{
                backgroundColor: 'var(--theme-card-inner-bg)'
              }}
            >
              {liveTelemetry ? (
                <div className="w-full z-10 flex flex-col items-center">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-extrabold tracking-tight" style={{ color: simTemperature > -55 ? '#f87171' : 'var(--theme-aqua)' }}>
                      {simTemperature.toFixed(1)}°C
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(var(--theme-cream-rgb), 0.6)' }}>
                      {selectedPo?.status === 'COMPLETED' 
                        ? '운송 중 기록 온도 (Latest Value)' 
                        : '현재 보관 온도 (Latest Value)'}
                    </span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: simTemperature > -55 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(var(--theme-aqua-rgb), 0.15)',
                      color: simTemperature > -55 ? '#f87171' : 'var(--theme-aqua)'
                    }}
                  >
                    {simTemperature > -55 ? '⚠️ 이상 고온 경고 상태' : '✓ 정상 온도 범위'}
                  </span>
                </div>
              ) : (
                <div>
                  <Thermometer className="w-10 h-10 mx-auto mb-2" style={{ color: 'rgba(var(--theme-cream-rgb), 0.3)' }} />
                  <p className="text-xs" style={{ color: 'rgba(var(--theme-cream-rgb), 0.5)' }}>온도 모니터링 이력이 여기에 매핑됩니다.</p>
                </div>
              )}
              {/* Fake red threshold line */}
              <div className="absolute left-0 right-0 top-[60%] border-t border-rose-500/40 flex items-center justify-end pr-4 pointer-events-none">
                <span
                  className="text-[8px] text-rose-400 px-1 py-0.5 rounded -mt-2.5 font-medium"
                  style={{ backgroundColor: 'var(--theme-card-bg)' }}
                >
                  임계 안전선 -55°C
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 온체인 감사 타임라인 및 실시간 경고 피드 - col-span-3 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* Quality Alerts Feed */}
          <div
            className="rounded-xl p-5 shadow-lg flex flex-col gap-4"
            style={{
              backgroundColor: 'var(--theme-card-bg)'
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5" style={{ color: 'rgba(var(--theme-cream-rgb), 0.7)' }}>
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                Quality Alerts
              </h2>
              {alerts.length > 0 ? (
                <button
                  onClick={clearAlerts}
                  className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline transition-colors font-medium cursor-pointer"
                >
                  지우기 ({alerts.length})
                </button>
              ) : (
                <span className="text-[10px]" style={{ color: 'rgba(var(--theme-cream-rgb), 0.4)' }}>경고 피드</span>
              )}
            </div>

            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => (
                  <div key={idx} className="bg-rose-950/20 border border-rose-500/20 rounded-lg p-3 text-[10px] flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-rose-500 text-white uppercase font-black">CRITICAL</span>
                      <span>{alert.poNumber} TEMP EXCEEDED</span>
                    </div>
                    <span style={{ color: 'rgba(var(--theme-cream-rgb), 0.7)' }}>{alert.message}</span>
                    <span className="text-[8px] mt-1" style={{ color: 'rgba(var(--theme-cream-rgb), 0.4)' }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs italic" style={{ color: 'rgba(var(--theme-cream-rgb), 0.4)' }}>
                  경고 이벤트 로그 없음
                </div>
              )}
            </div>
          </div>

          {/* Web3 Ledger Timeline */}
          <div
            className="rounded-xl p-5 shadow-lg flex-1"
            style={{
              backgroundColor: 'var(--theme-card-bg)'
            }}
          >
            <DistributionTimeline
              poNumber={selectedPo ? selectedPo.poNumber : null}
              status={selectedPo ? selectedPo.status : null}
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
