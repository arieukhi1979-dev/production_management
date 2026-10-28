import React, { useState } from 'react';
import { X, Search, QrCode, CheckCircle2, ArrowRight } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export const QRScannerModal: React.FC = () => {
  const {
    isQRScannerOpen,
    setIsQRScannerOpen,
    machines,
    setSelectedMachineForQR,
    setActiveModule,
  } = usePortal();

  const [inputCode, setInputCode] = useState('');
  const [scannedResult, setScannedResult] = useState<(typeof machines)[0] | null>(null);
  const [notFound, setNotFound] = useState(false);

  if (!isQRScannerOpen) return null;

  const handleScanLookup = (query: string) => {
    const q = query.trim();
    if (!q) return;

    // Check if query is formatted like 'CODE|NAME|TYPE' or just 'CODE'
    let targetCode = q;
    if (q.includes('|')) {
      targetCode = q.split('|')[0].trim();
    }

    const match = machines.find(
      (m) =>
        m.code.toLowerCase() === targetCode.toLowerCase() ||
        m.serial.toLowerCase() === targetCode.toLowerCase() ||
        m.name.toLowerCase().includes(targetCode.toLowerCase())
    );

    if (match) {
      setScannedResult(match);
      setNotFound(false);
    } else {
      setScannedResult(null);
      setNotFound(true);
    }
  };

  const handleViewDetails = (m: (typeof machines)[0]) => {
    setIsQRScannerOpen(false);
    setSelectedMachineForQR(m);
    setActiveModule('machine-plan');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">QR &amp; Barcode Asset Reader</h3>
              <p className="text-xs text-slate-400">Pindai atau masukkan kode aset mesin pabrik</p>
            </div>
          </div>
          <button
            onClick={() => setIsQRScannerOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Input Kode / String QR Scanner
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    if (notFound) setNotFound(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanLookup(inputCode)}
                  placeholder="Contoh: SN-0001 atau paste hasil scan QR..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  autoFocus
                />
              </div>
              <button
                onClick={() => handleScanLookup(inputCode)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Cari Aset
              </button>
            </div>
          </div>

          {/* Quick Select Buttons for demo */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Simulasi Cepat (Klik untuk Scan):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {machines.slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setInputCode(m.code);
                    handleScanLookup(m.code);
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors"
                >
                  {m.code}
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          {scannedResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                      Aset Teridentifikasi
                    </span>
                    <h4 className="font-mono text-base font-black text-slate-900">
                      {scannedResult.code} · {scannedResult.name}
                    </h4>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                    scannedResult.status === 'Running'
                      ? 'bg-emerald-200 text-emerald-800'
                      : scannedResult.status === 'Idle'
                      ? 'bg-sky-200 text-sky-800'
                      : 'bg-amber-200 text-amber-800'
                  }`}
                >
                  {scannedResult.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white/70 p-2.5 rounded-lg border border-emerald-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Jenis:</span>
                  <span className="font-medium text-slate-800">{scannedResult.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Brand / Model:</span>
                  <span className="font-medium text-slate-800">
                    {scannedResult.brand} {scannedResult.model}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Serial No:</span>
                  <span className="font-mono text-slate-800">{scannedResult.serial || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Lokasi / Line:</span>
                  <span className="font-medium text-slate-800">{scannedResult.location || '-'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => handleViewDetails(scannedResult)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <span>Buka di Machine Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {notFound && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center">
              Mesin dengan kode &quot;{inputCode}&quot; tidak ditemukan dalam database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
