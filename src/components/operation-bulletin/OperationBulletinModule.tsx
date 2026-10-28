import React, { useState } from 'react';
import { ArrowLeft, ListOrdered, Plus, Cpu, ArrowRight } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export const OperationBulletinModule: React.FC = () => {
  const { setActiveModule, setTargetSubTab, operationBulletins, machineTypes } = usePortal();
  const [selectedOBId, setSelectedOBId] = useState(operationBulletins[0]?.id || '');

  const currentOB = operationBulletins.find((o) => o.id === selectedOBId) || operationBulletins[0];

  const handleLinkToMachinePlan = () => {
    setTargetSubTab('plan');
    setActiveModule('machine-plan');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Hero Header */}
      <div className="bg-slate-950 border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setActiveModule('landing')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard Utama</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold mb-1">
                <ListOrdered className="w-3.5 h-3.5" />
                <span>MODUL TEKNIK · OPERATION BULLETIN (OB)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Operation Bulletin &amp; SAM Breakdown
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Daftar tahapan operasi jahit garment, jenis mesin yang diperlukan, dan nilai Standard Allowed Minutes (SAM).
              </p>
            </div>

            <button
              onClick={handleLinkToMachinePlan}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
            >
              <Cpu className="w-4 h-4" />
              <span>Alokasikan ke Machine Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Style Selector & Top Metrics */}
        {currentOB && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                  {currentOB.styleCode} · {currentOB.buyer}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">{currentOB.styleName}</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total SAM</span>
                  <strong className="text-base font-black font-mono text-emerald-400">
                    {currentOB.totalSAM} min
                  </strong>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Output</span>
                  <strong className="text-base font-black font-mono text-white">
                    {currentOB.targetPerHour} pcs/jam
                  </strong>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Operator (MP)</span>
                  <strong className="text-base font-black font-mono text-blue-400">
                    {currentOB.manpower} orang
                  </strong>
                </div>
              </div>
            </div>

            {/* Sequence Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                    <th className="py-2.5 px-3">No.</th>
                    <th className="py-2.5 px-3">Deskripsi Operasi Kerja</th>
                    <th className="py-2.5 px-3">Bagian</th>
                    <th className="py-2.5 px-3">Kode Mesin Dibutuhkan</th>
                    <th className="py-2.5 px-3 text-right">SAM (Menit)</th>
                    <th className="py-2.5 px-3 text-right">Target 100% (Pcs/Jam)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {currentOB.steps.map((st) => {
                    const typeInfo = machineTypes.find((t) => t.code === st.machineCode);
                    return (
                      <tr key={st.stepNo} className="hover:bg-slate-750/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                          #{st.stepNo}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {st.operationName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              st.section === 'Prep'
                                ? 'bg-sky-500/20 text-sky-300'
                                : st.section === 'Assembly'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {st.section}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-blue-400 mr-1.5">
                            {st.machineCode}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {typeInfo?.name || 'Sewing Machine'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                          {st.sam.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                          {st.targetPerHour}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
