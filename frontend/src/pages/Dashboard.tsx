import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  MapPin, 
  Thermometer, 
  Sliders, 
  AlertTriangle 
} from 'lucide-react';
import { OrderListPanel } from '../components/OrderListPanel';
import { DistributionTimeline } from '../components/Timeline/DistributionTimeline';
import { io } from 'socket.io-client';

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

interface TelemetryData {
  poNumber: string;
  temperature: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface AlertData {
  poNumber: string;
  temperature: number;
  message: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<TelemetryData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [simTemperature, setSimTemperature] = useState<number>(-58); // 기본값 -58도
  const [socket, setSocket] = useState<any>(null);

  // 웹소켓 연결 수립
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('live_telemetry', (data: TelemetryData) => {
      // 현재 선택된 발주 건에 한해 실시간 수신 매핑
      if (selectedPo && data.poNumber === selectedPo.poNumber) {
        setLiveTelemetry(data);
      }
    });

    newSocket.on('temperature_alert', (data: AlertData) => {
      setAlerts((prev) => [data, ...prev].slice(0, 5)); // 최근 5개 유지
    });

    return () => {
      newSocket.disconnect();
    };
  }, [selectedPo]);

  // 선택된 발주 시나리오에 따른 맵/차트 초기값 바인딩
  useEffect(() => {
    if (!selectedPo) return;

    if (selectedPo.poNumber === 'PO-2026-SCENARIO-A') {
      // 완료 시나리오: 고정 위치와 정상 온도 매핑
      setLiveTelemetry({
        poNumber: selectedPo.poNumber,
        temperature: -57.5,
        latitude: 37.5665,
        longitude: 126.9780,
        timestamp: new Date().toISOString(),
      });
      setSimTemperature(-57.5);
    } else if (selectedPo.poNumber === 'PO-2026-SCENARIO-B') {
      // 위험 이탈 시나리오: 고온 경고 데이터 강제 바인딩
      setLiveTelemetry({
        poNumber: selectedPo.poNumber,
        temperature: -52.0,
        latitude: 35.1796,
        longitude: 129.0756,
        timestamp: new Date().toISOString(),
      });
      setSimTemperature(-52.0);
    } else {
      // 라이브 시나리오: 초기 센서 대기 상태
      setLiveTelemetry(null);
      setSimTemperature(-58);
    }
  }, [selectedPo]);

  // IoT 온도 시뮬레이터 조작 시 가상 센서 패킷 쏴주기
  const handleSimulateTemperature = (newTemp: number) => {
    setSimTemperature(newTemp);
    if (!selectedPo || !socket) return;

    const mockGps = {
      'PO-2026-SCENARIO-A': { lat: 37.5665, lng: 126.9780 },
      'PO-2026-SCENARIO-B': { lat: 35.1796, lng: 129.0756 },
      'PO-2026-SCENARIO-C': { lat: 36.5, lng: 127.8 }
    };
    const gps = mockGps[selectedPo.poNumber as keyof typeof mockGps] || { lat: 37.5, lng: 127.5 };

    // 소켓으로 실시간 텔레메트리 전송
    socket.emit('send_telemetry', {
      poNumber: selectedPo.poNumber,
      temperature: newTemp,
      latitude: gps.lat,
      longitude: gps.lng,
    });
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 p-6 -m-6">
      {/* Upper header summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Tuna Cold Chain Ledger <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-normal">Control Center</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            참치 초저온 유통망 블록체인 위·변조 방지 원본 증명 및 관제 포털
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-slate-300">운영 권한: <strong className="text-white font-medium">로지스틱스 운영자 (Operator)</strong></span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: 발주/운송 목록 피드 - col-span-3 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg">
            <OrderListPanel 
              selectedPoId={selectedPo ? selectedPo.id : null}
              onSelectPo={(po) => setSelectedPo(po)}
            />
          </div>

          {/* Verification Portal (QR Hover) */}
          <div className="bg-[#0f172a]/80 border border-cyan-500/20 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)] relative group">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-cyan-400" />
                Verification Portal
              </h2>
              <span className="text-[10px] text-cyan-400 font-medium">QR 검증</span>
            </div>
            <div className="border border-cyan-500/10 rounded-lg p-4 bg-cyan-950/5 text-center flex flex-col items-center justify-center min-h-[140px]">
              <QrCode className="w-12 h-12 text-cyan-400/80 mb-2" />
              <p className="text-xs text-cyan-300 font-medium">소비자 검증 웹 뷰어 QR</p>
              <p className="text-[9px] text-cyan-500/80 mt-1.5 leading-relaxed">
                마우스 오버시 모바일 시뮬레이터가 팝업되어 소비자용 블록체인 정품 인증서를 노출합니다.
              </p>
            </div>
            
            {/* Hover Mobile Simulator Mockup */}
            {selectedPo && (
              <div className="absolute left-[102%] top-0 z-50 w-72 bg-slate-950 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-300">
                <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-3" />
                <h4 className="text-xs font-bold text-center text-cyan-400 mb-2">Tuna Chain Cert (Mobile)</h4>
                <div className="bg-slate-900 rounded-lg p-3 text-[10px] space-y-2 border border-slate-800">
                  <p className="text-slate-400">발주 번호: <span className="text-slate-200 font-mono font-bold">{selectedPo.poNumber}</span></p>
                  <p className="text-slate-400">품목명: <span className="text-slate-200">{selectedPo.product.name}</span></p>
                  <p className="text-slate-400">최종 유통상태: <span className="text-emerald-400 font-bold">{selectedPo.status}</span></p>
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                    <span className="text-slate-500">정품 보증 여부</span>
                    <span className="text-emerald-400 font-bold">✓ VERIFIED</span>
                  </div>
                </div>
                <p className="text-[8px] text-slate-500 mt-2 text-center">QR스캔시 브라우저를 통해 직접 접속하실 수 있습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: 실시간 관제 지도 및 온도 추이 - col-span-6 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Live Map Panel */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Live Monitoring Map
              </h2>
              {selectedPo ? (
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {selectedPo.poNumber} 경로 렌더링 중
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">대기 중</span>
              )}
            </div>
            
            {/* Interactive Vector / Mock map representation */}
            <div className="flex-1 border border-slate-900 rounded-lg p-6 bg-slate-950/40 min-h-[300px] flex flex-col justify-center items-center relative overflow-hidden">
              {liveTelemetry ? (
                <div className="w-full h-full flex flex-col justify-between items-center text-center py-8 z-10">
                  <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400 animate-bounce">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">현재 차량 실시간 GPS 좌표</p>
                    <p className="font-mono text-xs text-blue-400 mt-1">
                      Lat: {liveTelemetry.latitude.toFixed(4)} | Lng: {liveTelemetry.longitude.toFixed(4)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">부산항 출발 ➜ 허브센터 물류 이동 루트</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">선택된 발주의 유통 지도가 렌더링됩니다.</p>
                </div>
              )}
              {/* Decorative map grids */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>
          </div>

          {/* Temperature Chart Panel */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                Real-Time Temperature Trajectory
              </h2>
              <span className="text-[10px] text-slate-400">Last 24 Hours</span>
            </div>
            
            <div className="border border-slate-900 rounded-lg p-6 bg-slate-950/40 min-h-[200px] flex flex-col justify-center items-center text-center relative overflow-hidden">
              {liveTelemetry ? (
                <div className="w-full z-10 flex flex-col items-center">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-4xl font-extrabold tracking-tight ${simTemperature > -55 ? 'text-rose-400' : 'text-cyan-400'}`}>
                      {simTemperature.toFixed(1)}°C
                    </span>
                    <span className="text-xs text-slate-400">현재 보관 온도</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    simTemperature > -55 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  }`}>
                    {simTemperature > -55 ? '⚠️ 이상 고온 경고 상태' : '✓ 정상 온도 범위'}
                  </span>
                </div>
              ) : (
                <div>
                  <Thermometer className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">온도 모니터링 이력이 여기에 매핑됩니다.</p>
                </div>
              )}
              {/* Fake red threshold line */}
              <div className="absolute left-0 right-0 top-[60%] border-t border-rose-500/40 flex items-center justify-end pr-4 pointer-events-none">
                <span className="text-[8px] text-rose-400 bg-[#080d1a] px-1 py-0.5 rounded -mt-2.5 font-medium border border-rose-500/20">임계 안전선 -55°C</span>
              </div>
            </div>
          </div>

          {/* IoT Simulator Controls */}
          {selectedPo && (
            <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  IoT Simulator Controls
                </h2>
                <span className="text-[10px] text-cyan-400 font-medium">가상 온도 조절 슬라이더</span>
              </div>
              <div className="border border-slate-900 rounded-lg p-5 bg-slate-950/30 flex flex-col gap-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>최저 (-60°C)</span>
                  <span className="font-bold text-white">설정값: {simTemperature}°C</span>
                  <span>최고 (-45°C)</span>
                </div>
                <input 
                  type="range" 
                  min="-60" 
                  max="-45" 
                  value={simTemperature}
                  onChange={(e) => handleSimulateTemperature(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <p className="text-[9px] text-slate-500 leading-normal text-center mt-1">
                  슬라이더를 조작해 온도를 **-55°C 초과**로 올리면 웹소켓을 통해 실시간으로 경고(Alert) 피드가 발행됩니다.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 온체인 감사 타임라인 및 실시간 경고 피드 - col-span-3 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Quality Alerts Feed */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                Quality Alerts
              </h2>
              <span className="text-[10px] text-rose-400 font-medium">경고 피드</span>
            </div>
            
            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => (
                  <div key={idx} className="bg-rose-950/20 border border-rose-500/20 rounded-lg p-3 text-[10px] flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-rose-500 text-white uppercase font-black">CRITICAL</span>
                      <span>{alert.poNumber} TEMP EXCEEDED</span>
                    </div>
                    <span className="text-slate-400">{alert.message}</span>
                    <span className="text-slate-500 text-[8px] mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 italic">
                  경고 이벤트 로그 없음
                </div>
              )}
            </div>
          </div>

          {/* Web3 Ledger Timeline */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex-1">
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
