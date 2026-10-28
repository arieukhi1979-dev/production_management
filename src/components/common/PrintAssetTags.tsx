import React, { useState, useEffect } from 'react';
import { X, Printer, Filter } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { generateQRCodeDataURL, formatMachineQRData } from '../../utils/qr';
import { Machine } from '../../types';

interface TagWithQR {
  machine: Machine;
  qrUrl: string;
}

export const PrintAssetTags: React.FC = () => {
  const { isPrintAllOpen, setIsPrintAllOpen, machines, machineTypes } = usePortal();
  const [filterType, setFilterType] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [tagList, setTagList] = useState<TagWithQR[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredMachines = machines.filter((m) => {
    if (filterType && m.type !== filterType) return false;
    if (filterLocation && m.location !== filterLocation) return false;
    return true;
  });

  useEffect(() => {
    if (!isPrintAllOpen) return;
    setLoading(true);

    const generateAll = async () => {
      const results: TagWithQR[] = [];
      for (const m of filteredMachines) {
        const qr = await generateQRCodeDataURL(formatMachineQRData(m), 180);
        results.push({ machine: m, qrUrl: qr });
      }
      setTagList(results);
      setLoading(false);
    };

    generateAll();
  }, [isPrintAllOpen, filterType, filterLocation, machines]);

  if (!isPrintAllOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs p-4 sm:p-6 flex flex-col items-center">
      {/* Control Bar (Hidden during printing) */}
      <div className="no-print bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 max-w-4xl w-full shadow-2xl mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <span>🏷️ Cetak Label QR Aset Mesin</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              {filteredMachines.length} Unit
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Format lembar stiker aset siap cetak untuk inventaris mesin di lantai produksi.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none"
            >
              <option value="" className="bg-slate-900">Semua Jenis</option>
              {machineTypes.map((t) => (
                <option key={t.code} value={t.code} className="bg-slate-900">
                  {t.code} - {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            disabled={loading || tagList.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Cetak Sekarang (Print)</span>
          </button>

          <button
            onClick={() => setIsPrintAllOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div
        id="printable-area"
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full text-slate-900 print:shadow-none print:p-0"
      >
        <div className="hidden print:block pb-4 mb-4 border-b border-slate-300">
          <h1 className="text-lg font-black uppercase font-mono tracking-tight">
            PT GARMENT PRODUCTION SUITE — ASSET TAG CATALOG
          </h1>
          <p className="text-xs text-slate-600">
            Total Dicetak: {tagList.length} Unit Mesin · Tanggal: {new Date().toLocaleDateString('id-ID')}
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Menyiapkan lembar QR Code...
          </div>
        ) : tagList.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Tidak ada mesin yang sesuai dengan filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-4">
            {tagList.map(({ machine: m, qrUrl }) => {
              const typeDesc = machineTypes.find((t) => t.code === m.type)?.name;
              return (
                <div
                  key={m.id}
                  className="border-2 border-slate-900 rounded-xl p-3 bg-white text-center flex flex-col justify-between break-inside-avoid shadow-xs"
                >
                  <div className="border-b border-slate-200 pb-1 mb-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block">
                      GARMENT ASSET TAG
                    </span>
                    <strong className="text-base font-black font-mono tracking-wider text-slate-900 block">
                      {m.code}
                    </strong>
                  </div>

                  <div className="my-1 flex justify-center">
                    <img src={qrUrl} alt={m.code} className="w-28 h-28 object-contain" />
                  </div>

                  <div className="text-left text-[10px] space-y-0.5 border-t border-slate-200 pt-1.5 mt-1 text-slate-700">
                    <div className="font-bold text-slate-900 truncate">{m.name}</div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jenis:</span>
                      <span className="font-semibold">{m.type} {typeDesc ? `(${typeDesc})` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Brand / Line:</span>
                      <span className="font-semibold">{m.brand || '-'} · {m.location || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Serial No:</span>
                      <span className="font-mono text-slate-600">{m.serial || '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
