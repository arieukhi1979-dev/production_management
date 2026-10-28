import React, { useEffect, useState } from 'react';
import { X, Printer, Download, Copy, Check, Cpu } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { formatMachineQRData, generateQRCodeDataURL } from '../../utils/qr';

export const QRModal: React.FC = () => {
  const { selectedMachineForQR, setSelectedMachineForQR, machineTypes } = usePortal();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const m = selectedMachineForQR;

  useEffect(() => {
    if (m) {
      const dataStr = formatMachineQRData(m);
      generateQRCodeDataURL(dataStr, 350).then(setQrUrl);
    } else {
      setQrUrl('');
    }
  }, [m]);

  if (!m) return null;

  const typeInfo = machineTypes.find((t) => t.code === m.type);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Tag - ${m.code}</title>
          <style>
            @page { size: auto; margin: 8mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 12px; background: #fff; }
            .tag {
              border: 2px solid #000;
              border-radius: 8px;
              padding: 12px;
              width: 320px;
              text-align: center;
              margin: 0 auto;
            }
            .title { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #333; margin-bottom: 6px; }
            .code { font-size: 22px; font-weight: 900; margin: 4px 0; font-family: monospace; letter-spacing: 1px; }
            .name { font-size: 13px; font-weight: 700; color: #111; margin-bottom: 4px; }
            .details { font-size: 11px; color: #444; border-top: 1px dashed #ccc; padding-top: 6px; margin-top: 6px; text-align: left; }
            .details table { width: 100%; font-size: 11px; }
            .details td { padding: 2px 0; }
            img { width: 170px; height: 170px; display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="tag">
            <div class="title">GARMENT PRODUCTION ASSET TAG</div>
            <img src="${qrUrl}" alt="QR Code" />
            <div class="code">${m.code}</div>
            <div class="name">${m.name}</div>
            <div class="details">
              <table>
                <tr><td><strong>Jenis:</strong></td><td>${m.type} (${typeInfo?.name || '-'})</td></tr>
                <tr><td><strong>Brand/Model:</strong></td><td>${m.brand || '-'} / ${m.model || '-'}</td></tr>
                <tr><td><strong>Serial No:</strong></td><td>${m.serial || '-'}</td></tr>
                <tr><td><strong>Lokasi/Line:</strong></td><td>${m.location || '-'}</td></tr>
                <tr><td><strong>Status:</strong></td><td>${m.status}</td></tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_${m.code}_${m.name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleCopyData = () => {
    const dataStr = formatMachineQRData(m);
    navigator.clipboard.writeText(dataStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">QR Identitas Aset Mesin</h3>
              <p className="text-xs text-slate-400 font-mono">{m.code}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedMachineForQR(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-4">
          <div className="inline-block p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 shadow-inner">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`QR Code ${m.code}`}
                className="w-48 h-48 mx-auto rounded-lg object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                Generating QR...
              </div>
            )}
          </div>

          <div>
            <div className="text-xl font-black font-mono tracking-wider text-slate-900">
              {m.code}
            </div>
            <div className="text-sm font-bold text-slate-800">{m.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {m.brand} {m.model && `· Model ${m.model}`} {m.serial && `· S/N: ${m.serial}`}
            </div>
          </div>

          {/* Quick Specs Table */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-left text-xs grid grid-cols-2 gap-2 text-slate-600">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Jenis Mesin</span>
              <span className="font-semibold text-slate-800">
                {m.type} - {typeInfo?.name || 'Sewing'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lokasi / Line</span>
              <span className="font-semibold text-slate-800">{m.location || 'Belum di-assign'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Operasional</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                  m.status === 'Running'
                    ? 'bg-emerald-100 text-emerald-800'
                    : m.status === 'Idle'
                    ? 'bg-sky-100 text-sky-800'
                    : m.status === 'Maintenance'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {m.status}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Kategori</span>
              <span className="font-semibold text-slate-800">{typeInfo?.cat || 'Sewing Floor'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Print Label</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-blue-200" />
              <span>Unduh PNG</span>
            </button>
            <button
              onClick={handleCopyData}
              className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Salin Data String QR"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
