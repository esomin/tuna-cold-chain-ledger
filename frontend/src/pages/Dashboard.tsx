import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusCircle, 
  ListTodo, 
  QrCode, 
  MapPin, 
  Thermometer, 
  Sliders, 
  AlertTriangle, 
  ShieldCheck 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 p-6 -m-6">
      {/* Upper header summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Tuna Cold Chain Ledger <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-normal">Control Center</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            실시간 재고 모니터링 및 수요 예측 대시보드
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-slate-300">사용자: <strong className="text-white font-medium">{user?.name || '관리자'}</strong> ({user?.role || 'ADMIN'})</span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: 발주/운송 목록 (PO / Shipment List) - col-span-3 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Panel 1: 신규 발주 등록 */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                Register Purchase Order
              </h2>
              <span className="text-[10px] text-cyan-400 font-medium">신규 발주</span>
            </div>
            <div className="border border-dashed border-slate-800 rounded-lg p-4 bg-slate-950/40 text-center min-h-[140px] flex flex-col items-center justify-center">
              <PlusCircle className="w-6 h-6 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium">신규 발주 등록 양식 영역</p>
              <p className="text-[10px] text-slate-500 mt-1">품목명, 수량 입력 및 차량 매핑</p>
            </div>
          </div>

          {/* Panel 2: 운송 목록 피드 */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-cyan-400" />
                Shipment Feed
              </h2>
              <span className="text-[10px] text-cyan-400 font-medium">운송 목록</span>
            </div>
            <div className="flex-1 border border-slate-900 rounded-lg p-4 bg-slate-950/20 min-h-[220px] flex flex-col justify-center items-center text-center">
              <ListTodo className="w-6 h-6 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium">운송 목록 피드 영역</p>
              <p className="text-[10px] text-slate-500 mt-1">Active PO 리스트 및 상태 정보</p>
            </div>
          </div>

          {/* Panel 3: 모바일 QR 검증 */}
          <div className="bg-[#0f172a]/80 border border-cyan-500/20 rounded-xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.05)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-cyan-400" />
                Verification Portal
              </h2>
              <span className="text-[10px] text-cyan-400 font-medium">QR 검증</span>
            </div>
            <div className="border border-cyan-500/10 rounded-lg p-4 bg-cyan-950/5 text-center flex flex-col items-center justify-center min-h-[120px]">
              <QrCode className="w-10 h-10 text-cyan-400/80 mb-2" />
              <p className="text-xs text-cyan-300/90 font-medium">모바일 QR 검증 영역</p>
              <p className="text-[10px] text-cyan-500/80 mt-1">마우스 오버시 모바일 데모 팝업 활성화</p>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: 실시간 모니터링 (Map & Temperature) - col-span-6 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Panel 4: 실시간 이동 경로 지도 */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Live Monitoring Map
              </h2>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                실시간 연동중
              </span>
            </div>
            <div className="flex-1 border border-slate-900 rounded-lg p-6 bg-slate-950/40 min-h-[300px] flex flex-col justify-center items-center text-center">
              <MapPin className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium">실시간 이동 경로 지도 영역</p>
              <p className="text-[10px] text-slate-500 mt-1">GPS 기반 실시간 이동 선 및 차량 지리 정보 표시</p>
            </div>
          </div>

          {/* Panel 5: 온도 추이 그래프 */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                Real-Time Temperature Trajectory
              </h2>
              <span className="text-[10px] text-slate-400">Last 24 Hours</span>
            </div>
            <div className="border border-slate-900 rounded-lg p-6 bg-slate-950/40 min-h-[220px] flex flex-col justify-center items-center text-center relative overflow-hidden">
              <Thermometer className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium">온도 추이 그래프 영역</p>
              <p className="text-[10px] text-slate-500 mt-1">초저온 임계 안전선(-55°C) 및 변동 추이 모니터링</p>
              {/* Fake red threshold line */}
              <div className="absolute left-0 right-0 top-1/2 border-t border-rose-500/40 flex items-center justify-end pr-4">
                <span className="text-[9px] text-rose-400 bg-[#080d1a] px-1 py-0.5 rounded -mt-2.5 font-medium border border-rose-500/20">임계선 -55°C</span>
              </div>
            </div>
          </div>

          {/* Panel 6: IoT 시뮬레이터 */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                IoT Simulator Controls
              </h2>
              <span className="text-[10px] text-cyan-400 font-medium">센서 제어</span>
            </div>
            <div className="border border-slate-900 rounded-lg p-4 bg-slate-950/30 flex flex-col justify-center items-center text-center">
              <Sliders className="w-5 h-5 text-slate-600 mb-1" />
              <p className="text-xs text-slate-400 font-medium">IoT 시뮬레이터 슬라이더 제어판</p>
              <p className="text-[10px] text-slate-500 mt-1">온도 모의 변조 조작 및 알림 발생 테스트 피처</p>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 온체인 원장기록 (Web3 Ledger) - col-span-3 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Panel 7: 실시간 위험 알림 */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                Quality Alerts
              </h2>
              <span className="text-[10px] text-rose-400 font-medium">경고 피드</span>
            </div>
            
            {/* Dark theme alerts styling from the reference design */}
            <div className="flex flex-col gap-3">
              {/* Critical alert */}
              <div className="bg-rose-950/20 border border-rose-500/20 rounded-lg p-3 text-xs flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-rose-500 text-white uppercase font-black">CRITICAL</span>
                  <span>Temperature Deviation</span>
                </div>
                <span className="text-slate-400 text-[10px]">(TC-1004) - Above -55°C</span>
                <span className="text-slate-500 text-[9px] mt-1">Dec 15 14:30</span>
              </div>
              
              {/* Warning alert */}
              <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3 text-xs flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500 text-slate-950 uppercase font-black">WARNING</span>
                  <span>Battery Low</span>
                </div>
                <span className="text-slate-400 text-[10px]">(Sensor B-012)</span>
                <span className="text-slate-500 text-[9px] mt-1">Dec 15 14:12</span>
              </div>
            </div>
          </div>

          {/* Panel 8: Web3 Committer */}
          <div className="bg-[#0f172a]/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Web3 Committer
              </h2>
              <span className="text-[10px] text-cyan-400 font-medium">온체인 기록</span>
            </div>
            <div className="flex-1 border border-slate-900 rounded-lg p-4 bg-slate-950/20 min-h-[220px] flex flex-col justify-center items-center text-center">
              <ShieldCheck className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Web3 Committer 원장 영역</p>
              <p className="text-[10px] text-slate-500 mt-1">트랜잭션 블록 해시 로그 및 암호학적 무결성 검증 내역</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
