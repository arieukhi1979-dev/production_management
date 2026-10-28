import React from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export const MRPModule: React.FC = () => {
  const { setActiveModule, mrpItems } = usePortal();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      <div className="bg-slate-950 border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setActiveModule('landing')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Utama</span>
          </button>

          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs font-mono font-bold mb-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>MODUL PENGADAAN · MATERIAL REQUIREMENT PLANNING (MRP)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Material Requirement Planning (MRP)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Kalkulasi kebutuhan bersih bahan baku (Gross Reqd vs Current Stock vs On-Order) &amp; status pengadaan.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-white">Status Kebutuhan Bersih Material</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-2.5 px-3">Kode Material</th>
                  <th className="py-2.5 px-3">Nama Material</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Kebutuhan Kotor</th>
                  <th className="py-2.5 px-3 text-right">Stok Fisik</th>
                  <th className="py-2.5 px-3 text-right">Sedang Dipesan (PO)</th>
                  <th className="py-2.5 px-3 text-right">Kebutuhan Bersih (Net)</th>
                  <th className="py-2.5 px-3 text-center">Status MRP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {mrpItems.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-750/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-orange-400">{m.materialCode}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{m.materialName}</td>
                    <td className="py-2.5 px-3 text-slate-400">{m.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      {m.grossRequired.toLocaleString('id-ID')} {m.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {m.currentStock.toLocaleString('id-ID')} {m.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-400">
                      {m.onOrder.toLocaleString('id-ID')} {m.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {m.netRequired > 0 ? (
                        <span className="font-bold text-rose-400">
                          +{m.netRequired.toLocaleString('id-ID')} {m.unit}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">0 (Tercukupi)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.status === 'Cukup'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : m.status === 'Order Needed'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
