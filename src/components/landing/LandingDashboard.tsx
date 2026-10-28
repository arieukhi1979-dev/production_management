import React, { useState, useMemo } from 'react';
import {
  Package,
  FileSpreadsheet,
  ListOrdered,
  Settings,
  CalendarDays,
  Cpu,
  TrendingUp,
  RefreshCw,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { ActiveModule } from '../../types';

interface ModuleItem {
  id: ActiveModule;
  title: string;
  iconText: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  description: string;
  highlightNote: string;
  gradientClass: string;
  borderHoverClass: string;
  accentBg: string;
  accentText: string;
  badge?: string;
}

export const LandingDashboard: React.FC = () => {
  const {
    setActiveModule,
    machines,
    plans,
    machineTypes,
    lines,
    orders,
    reports,
  } = usePortal();

  const [searchQuery, setSearchQuery] = useState('');

  // 8 Main Modules definition exactly matching the attached prototype
  const modulesList: ModuleItem[] = [
    {
      id: 'master-order',
      title: 'Master Order',
      iconText: '📦',
      IconComponent: Package,
      description: 'Kelola data order, buyer, style, kuantiti, dan jadwal delivery',
      highlightNote: `${orders.length} Order Aktif · Buyer PO`,
      gradientClass: 'from-pink-500/10 via-slate-800/80 to-slate-900',
      borderHoverClass: 'hover:border-pink-500/60 hover:shadow-pink-500/10',
      accentBg: 'bg-pink-500/15 text-pink-300 border border-pink-500/25',
      accentText: 'text-pink-400',
    },
    {
      id: 'bom',
      title: 'BOM',
      iconText: '📋',
      IconComponent: FileSpreadsheet,
      description: 'Bill of Material kebutuhan kain (fabric), benang, dan trims per style',
      highlightNote: 'Material Specs & Consumption',
      gradientClass: 'from-amber-500/10 via-slate-800/80 to-slate-900',
      borderHoverClass: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
      accentBg: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
      accentText: 'text-amber-400',
    },
    {
      id: 'ob',
      title: 'Operation Bulletin',
      iconText: '📝',
      IconComponent: ListOrdered,
      description: 'Daftar operasi jahit, nilai SAM, target per jam, dan alokasi mesin',
      highlightNote: 'SAM Breakdown & Urutan Proses',
      gradientClass: 'from-emerald-500/10 via-slate-800/80 to-slate-900',
      borderHoverClass: 'hover:border-emerald-500/60 hover:shadow-emerald-500/10',
      accentBg: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
      accentText: 'text-emerald-400',
    },
    {
      id: 'setup',
      title: 'Setup',
      iconText: '⚙️',
      IconComponent: Settings,
      description: 'Master data Jenis Mesin, Line Produksi, Brand, dan Lokasi Lantai',
      highlightNote: `${machineTypes.length} Jenis Mesin · ${lines.length} Line`,
      gradientClass: 'from-purple-500/10 via-slate-800/80 to-slate-900',
      borderHoverClass: 'hover:border-purple-500/60 hover:shadow-purple-500/10',
      accentBg: 'bg-purple-500/15 text-purple-300 border border-purple-500/25',
      accentText: 'text-purple-400',
    },
    {
      id: 'prod-plan',
      title: 'Production Plan',
      iconText: '🗓️',
      IconComponent: CalendarDays,
      description: 'Perencanaan penjadwalan produksi per line jahit dan target harian',
      highlightNote: 'Line Loading & Jadwal Jahit',
      gradientClass: 'from-rose-500/10 via-slate-800/80 to-slate-900',
      borderHoverClass: 'hover:border-rose-500/60 hover:shadow-rose-500/10',
      accentBg: 'bg-rose-500/15 text-rose-300 border border-rose-500/25',
      accentText: 'text-rose-400',
    },
    {
      id: 'machine-plan',
      title: 'Machine Plan',
      iconText: '🛠️',
      IconComponent: Cpu,
      description: 'Database mesin, QR aset, kebutuhan sampai 15 jenis per plan',
      highlightNote: `${machines.length} Unit Mesin · ${plans.length} Plan Aktif`,
      gradientClass: 'from-blue-500/15 via-slate-800/90 to-slate-900',
      borderHoverClass: 'hover:border-blue-500/70 hover:shadow-blue-500/20',
      accentBg: 'bg-blue-500/20 text-blue-300 border border-blue-500/35',
      accentText: 'text-blue-400',
      badge: 'Utama',
    },
    {
      id: 'prod-report',
      title: 'Production Report',
      iconText: '📈',
      IconComponent: TrendingUp,
      description: 'Laporan hasil produksi aktual, pencapaian target, dan efisiensi line',
      highlightNote: `${reports.length} Laporan Line Shift 1`,
      gradientClass: 'from-teal-500/10 via-slate-800/80 to-slate-900',
      borderHoverClass: 'hover:border-teal-500/60 hover:shadow-teal-500/10',
      accentBg: 'bg-teal-500/15 text-teal-300 border border-teal-500/25',
      accentText: 'text-teal-400',
    },
    {
      id: 'mrp',
      title: 'MRP',
      iconText: '🔄',
      IconComponent: RefreshCw,
      description: 'Material Requirement Planning & kalkulasi kebutuhan bersih material',
      highlightNote: 'Net Requirement & Supply Status',
      gradientClass: 'from-orange-500/10 via-slate-800/80 to-slate-900',
      borderHoverClass: 'hover:border-orange-500/60 hover:shadow-orange-500/10',
      accentBg: 'bg-orange-500/15 text-orange-300 border border-orange-500/25',
      accentText: 'text-orange-400',
    },
  ];

  // Filter modules by search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modulesList;
    const q = searchQuery.toLowerCase();
    return modulesList.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.highlightNote.toLowerCase().includes(q)
    );
  }, [searchQuery, modulesList]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Hero Welcome Section */}
      <section className="relative pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-blue-400 font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Garment Manufacturing Execution System</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Hello! Arie Prasetya Wibowo
          </h1>

          <p className="mt-2.5 text-base sm:text-lg text-slate-400 font-medium max-w-2xl mx-auto">
            Welcome to the Production Portal — 8 Main Modules
          </p>
        </div>
      </section>

      {/* 8 Main Modules Grid (Exactly the 8 modules) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full my-auto pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredModules.map((mod) => {
            const Icon = mod.IconComponent;
            return (
              <div
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`group relative flex flex-col justify-between rounded-2xl p-5 bg-gradient-to-b ${mod.gradientClass} border border-slate-700/80 ${mod.borderHoverClass} transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 min-h-[178px]`}
              >
                <div>
                  {/* Top Bar with Icon and Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                      <span>{mod.iconText}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {mod.badge && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 border border-blue-500/35">
                          {mod.badge}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                    <span>{mod.title}</span>
                    <span className="text-slate-400 text-sm group-hover:text-blue-300 font-normal">→</span>
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed italic line-clamp-2">
                    {mod.description}
                  </p>
                </div>

                {/* Bottom Highlight Note */}
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${mod.accentBg}`}>
                    {mod.highlightNote}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                    Buka Modul
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Links & Search (Directly from Prototype) */}
      <section className="bg-slate-900/70 border-t border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 w-full mt-auto">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Quick Links &amp; Search
          </h3>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Master Order, BOM, Machine Plan, Setup..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          {/* Recently Visited */}
          <div className="text-xs text-slate-400 pt-1 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-slate-500">Recently Visited:</span>
            <button
              onClick={() => {
                setActiveModule('machine-plan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
            >
              Machines Plan
            </button>
            <span className="text-slate-600">,</span>
            <button
              onClick={() => {
                setActiveModule('setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
            >
              Setup
            </button>
            <span className="text-slate-600">,</span>
            <button
              onClick={() => {
                setActiveModule('master-order');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
            >
              Master Order
            </button>
            <span className="text-slate-600">,</span>
            <button
              onClick={() => {
                setActiveModule('bom');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
            >
              BOM
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
