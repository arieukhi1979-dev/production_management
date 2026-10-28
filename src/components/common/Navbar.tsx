import React, { useState, useEffect } from 'react';
import {
  Factory,
  QrCode,
  Layers,
  Settings,
  Cpu,
  Home,
  Clock,
  Sparkles,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { ActiveModule } from '../../types';

export const Navbar: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    machines,
    lines,
    setIsQRScannerOpen,
    setIsPrintAllOpen,
    resetToDemoData,
  } = usePortal();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeLinesCount = lines.filter((l) => l.stat === 'Active').length;
  const runningMachinesCount = machines.filter((m) => m.status === 'Running').length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Home */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveModule('landing')}
              className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-white text-base font-mono">
                    PROD·PORTAL
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Garment ERP
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>Plant Arie P. Wibowo</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-emerald-400 font-medium">Shift 1 (07:00 - 15:30)</span>
                </div>
              </div>
            </button>

            {/* Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setActiveModule('landing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'landing'
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveModule('machine-plan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'machine-plan'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Machine Plan</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-200">
                  {machines.length}
                </span>
              </button>

              <button
                onClick={() => setActiveModule('setup')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'setup'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-purple-400" />
                <span>Master Setup</span>
              </button>

              {/* Other modules dropdown or quick nav */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Modul Lainnya</span>
                  <span className="text-[10px] text-slate-400">▾</span>
                </button>
                <div className="absolute left-0 mt-1 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 hidden group-hover:block group-focus-within:block z-50">
                  <button
                    onClick={() => setActiveModule('master-order')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>📦 Master Order</span>
                    <span className="text-[10px] text-slate-400">PO & Buyer</span>
                  </button>
                  <button
                    onClick={() => setActiveModule('ob')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>📝 Operation Bulletin</span>
                    <span className="text-[10px] text-slate-400">SAM & Breakdown</span>
                  </button>
                  <button
                    onClick={() => setActiveModule('bom')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>📋 Bill of Material (BOM)</span>
                    <span className="text-[10px] text-slate-400">Fabric & Trims</span>
                  </button>
                  <button
                    onClick={() => setActiveModule('prod-plan')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>🗓️ Production Plan</span>
                    <span className="text-[10px] text-slate-400">Jadwal Line</span>
                  </button>
                  <button
                    onClick={() => setActiveModule('prod-report')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>📈 Production Report</span>
                    <span className="text-[10px] text-slate-400">Output & Efisiensi</span>
                  </button>
                  <button
                    onClick={() => setActiveModule('mrp')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>🔄 MRP System</span>
                    <span className="text-[10px] text-slate-400">Kebutuhan Material</span>
                  </button>
                </div>
              </div>
            </nav>
          </div>

          {/* Right Section: Plant Status, QR Quick scan, User profile */}
          <div className="flex items-center gap-3">
            {/* Live Telemetry Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400">Line Aktif:</span>
              <strong className="text-white font-mono">{activeLinesCount}/{lines.length}</strong>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Running:</span>
              <strong className="text-emerald-400 font-mono">{runningMachinesCount} unit</strong>
              <span className="text-slate-600">|</span>
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="font-mono text-slate-300">{currentTime || '--:--:--'}</span>
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => setIsQRScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
              title="Scan QR Code Mesin"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            <button
              onClick={() => setIsPrintAllOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              title="Print Semua QR Tag Aset"
            >
              <span>🏷️ Print All QR</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-inner">
                AP
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  Arie Prasetya Wibowo
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  PPC &amp; Plant Manager
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
