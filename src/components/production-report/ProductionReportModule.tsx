import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Clock,
  Users,
  Layers,
  FileDown,
  Search,
  Filter,
  Info,
  Calendar,
  Check,
  Trash2,
  Edit2,
  ExternalLink,
  Package,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { ProductionDailyReport } from '../../types';
import { downloadCSV } from '../../utils/csv';

export const ProductionReportModule: React.FC = () => {
  const { setActiveModule, reports, saveReport, deleteReport, lines, orders, operationBulletins } = usePortal();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [filterShift, setFilterShift] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    line: lines[0]?.code || 'L01',
    orderId: orders[0]?.id || '',
    style: orders[0]?.style || 'UQ-492 Men Oxford Shirt L/S',
    orderNo: orders[0]?.orderNo || 'PO-2026-UQ-0981',
    buyer: orders[0]?.buyer || 'UNIQLO (Fast Retailing)',
    shift: 'Shift 1' as 'Shift 1' | 'Shift 2',
    targetOutput: 800,
    actualOutput: 780,
    smv: 18.5,
    totalOperator: 40,
    totalMesin: 36,
    normalHours: 8,
    otHours: 2,
    defectCount: 8,
    downtimeMinutes: 15,
    supervisor: 'Bambang Sudarmo',
    notes: 'Jalan lancar, lembur mesin untuk kejar target pengiriman',
  });

  // Helper: Find matching Operation Bulletin for a style / order
  const findMatchingOB = (styleName: string, orderNo?: string) => {
    if (!styleName && !orderNo) return null;
    const sName = (styleName || '').toLowerCase().trim();
    const ordStr = (orderNo || '').toLowerCase().trim();

    return (
      operationBulletins.find((ob) => {
        const obCode = (ob.styleCode || '').toLowerCase().trim();
        const obName = (ob.styleName || '').toLowerCase().trim();

        if (obCode && (sName.includes(obCode) || ordStr.includes(obCode))) return true;
        if (obName && (sName.includes(obName) || obName.includes(sName))) return true;
        return false;
      }) || null
    );
  };

  // Currently matched OB in modal
  const currentMatchedOB = useMemo(() => {
    return findMatchingOB(formData.style, formData.orderNo);
  }, [formData.style, formData.orderNo, operationBulletins]);

  // Calculate live preview in modal
  // Total Mesin Shift: totalMesin * ((8 + otHours) / 8) -> jam lembur hanya untuk mesin, bukan operator
  const liveTotalMesinShift = useMemo(() => {
    const tm = Number(formData.totalMesin) || 0;
    const ot = Number(formData.otHours) || 0;
    return Number((tm * ((8 + ot) / 8)).toFixed(2));
  }, [formData.totalMesin, formData.otHours]);

  // Pcs / MC Shift: actualOutput / totalMesinShift
  const livePcsPerMcShift = useMemo(() => {
    const out = Number(formData.actualOutput) || 0;
    if (liveTotalMesinShift <= 0) return 0;
    return Number((out / liveTotalMesinShift).toFixed(1));
  }, [formData.actualOutput, liveTotalMesinShift]);

  // Effisiensi Line: (output * SMV) / (operator * normal jam + jam lembur)
  // Catatan user: "sedangkan total mesin shift adalah total mesin * ((8 + jam lembur) / 8). jm lembur hanya untuk mesin. bukan operator"
  // Maka waktu operator = operator * normalHours * 60 (menit)
  const liveEfficiency = useMemo(() => {
    const out = Number(formData.actualOutput) || 0;
    const smv = Number(formData.smv) || 0;
    const op = Number(formData.totalOperator) || 0;
    const nh = Number(formData.normalHours) || 8;

    const producedMinutes = out * smv;
    const availableMinutes = op * nh * 60;

    if (availableMinutes <= 0) return 0;
    return Number(((producedMinutes / availableMinutes) * 100).toFixed(1));
  }, [formData.actualOutput, formData.smv, formData.totalOperator, formData.normalHours]);

  // Sync when user selects an order from Master Order in modal
  const handleSelectOrder = (selectedOrdId: string) => {
    const ord = orders.find((o) => o.id === selectedOrdId);
    if (!ord) return;

    // Otomatis cari SMV dari Operation Bulletin berdasarkan Style & Order
    const matchedOB = findMatchingOB(ord.style, ord.orderNo);
    let autoSmv = matchedOB ? matchedOB.totalSAM : 21.5;

    // Fallback jika belum spesifik di OB
    if (!matchedOB) {
      const sName = ord.style.toLowerCase();
      if (sName.includes('pant') || sName.includes('chino') || sName.includes('denim') || sName.includes('trail')) {
        autoSmv = 24.84;
      } else if (sName.includes('polo') || sName.includes('knit') || sName.includes('hoodie')) {
        autoSmv = 16.5;
      } else if (sName.includes('blouse')) {
        autoSmv = 19.0;
      } else if (sName.includes('dobby')) {
        autoSmv = 22.0;
      } else if (sName.includes('casual') || sName.includes('woven')) {
        autoSmv = 17.5;
      }
    }

    const assignedLine = ord.linesAssigned?.[0] || ord.line.split(',')[0]?.trim() || 'L01';
    const lineObj = lines.find((l) => l.code === assignedLine);

    setFormData((prev) => ({
      ...prev,
      orderId: ord.id,
      orderNo: ord.orderNo,
      style: ord.style, // Nama Style otomatis dari Master Order
      buyer: ord.buyer,
      smv: autoSmv,     // SMV otomatis dari Operation Bulletin
      line: assignedLine,
      supervisor: lineObj?.sup || prev.supervisor,
    }));
  };

  // KPI Calculations across all reports
  const stats = useMemo(() => {
    const totalActual = reports.reduce((s, r) => s + (r.actualOutput || 0), 0);
    const avgEfficiency =
      reports.length > 0
        ? reports.reduce((s, r) => s + (r.efficiency || 0), 0) / reports.length
        : 0;

    const totalMesinShifts = reports.reduce((s, r) => s + (r.totalMesinShift || 0), 0);
    const avgPcsPerMcShift =
      totalMesinShifts > 0 ? totalActual / totalMesinShifts : 0;

    const totalDefects = reports.reduce((s, r) => s + (r.defectCount || 0), 0);
    const totalDowntime = reports.reduce((s, r) => s + (r.downtimeMinutes || 0), 0);

    return {
      totalActual,
      avgEfficiency: Number(avgEfficiency.toFixed(1)),
      totalMesinShifts: Number(totalMesinShifts.toFixed(1)),
      avgPcsPerMcShift: Number(avgPcsPerMcShift.toFixed(1)),
      totalDefects,
      totalDowntime,
    };
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterLine && r.line !== filterLine) return false;
      if (filterShift && r.shift !== filterShift) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.style.toLowerCase().includes(q) ||
          r.line.toLowerCase().includes(q) ||
          (r.orderNo || '').toLowerCase().includes(q) ||
          r.supervisor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reports, filterLine, filterShift, search]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingReportId(null);
    const firstOrd = orders[0];
    const ob = firstOrd ? findMatchingOB(firstOrd.style, firstOrd.orderNo) : null;
    const initialSmv = ob ? ob.totalSAM : 18.5;

    setFormData({
      date: new Date().toISOString().split('T')[0],
      line: lines[0]?.code || 'L01',
      orderId: firstOrd?.id || '',
      style: firstOrd?.style || 'UQ-492 Men Oxford Shirt L/S',
      orderNo: firstOrd?.orderNo || 'PO-2026-UQ-0981',
      buyer: firstOrd?.buyer || 'UNIQLO (Fast Retailing)',
      shift: 'Shift 1',
      targetOutput: 800,
      actualOutput: 780,
      smv: initialSmv,
      totalOperator: 40,
      totalMesin: 36,
      normalHours: 8,
      otHours: 2,
      defectCount: 8,
      downtimeMinutes: 15,
      supervisor: lines[0]?.sup || 'Bambang Sudarmo',
      notes: 'Jalan lancar, lembur mesin untuk kejar target pengiriman',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (r: ProductionDailyReport) => {
    setEditingReportId(r.id);
    const matchedOrder = orders.find(
      (o) => o.orderNo === r.orderNo || o.style.toLowerCase() === r.style.toLowerCase()
    );
    const ob = findMatchingOB(r.style, r.orderNo);
    setFormData({
      date: r.date,
      line: r.line,
      orderId: matchedOrder ? matchedOrder.id : '',
      style: r.style,
      orderNo: r.orderNo || '',
      buyer: matchedOrder ? matchedOrder.buyer : '',
      shift: r.shift,
      targetOutput: r.targetOutput ?? 0,
      actualOutput: r.actualOutput,
      smv: r.smv || (ob ? ob.totalSAM : 21.5),
      totalOperator: r.totalOperator,
      totalMesin: r.totalMesin,
      normalHours: r.normalHours,
      otHours: r.otHours,
      defectCount: r.defectCount || 0,
      downtimeMinutes: r.downtimeMinutes || 0,
      supervisor: r.supervisor,
      notes: r.notes || '',
    });
    setIsModalOpen(true);
  };

  // Save report (create or update)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const actual = Number(formData.actualOutput) || 0;
    const smv = Number(formData.smv) || 0;
    const op = Number(formData.totalOperator) || 0;
    const nh = Number(formData.normalHours) || 8;
    const ot = Number(formData.otHours) || 0;
    const tm = Number(formData.totalMesin) || 0;

    // Total Mesin Shift: totalMesin * ((8 + jam lembur) / 8) -> lembur mesin
    const totalMesinShift = Number((tm * ((8 + ot) / 8)).toFixed(2));

    // Pcs / MC Shift: actual output / total mesin shift
    const pcsPerMcShift =
      totalMesinShift > 0 ? Number((actual / totalMesinShift).toFixed(1)) : 0;

    // Line Efficiency: (output * smv) / (operator * normal jam * 60) * 100
    // Jam lembur hanya untuk mesin, bukan operator
    const availableMinutes = op * nh * 60;
    const efficiency =
      availableMinutes > 0
        ? Number((((actual * smv) / availableMinutes) * 100).toFixed(1))
        : 0;

    const reportToSave: ProductionDailyReport = {
      id: editingReportId || `rep-${Date.now()}`,
      date: formData.date,
      line: formData.line,
      style: formData.style,
      orderNo: formData.orderNo,
      shift: formData.shift,
      targetOutput: Number(formData.targetOutput) || 0,
      actualOutput: actual,
      smv,
      totalOperator: op,
      totalMesin: tm,
      normalHours: nh,
      otHours: ot,
      totalMesinShift,
      pcsPerMcShift,
      efficiency,
      defectCount: Number(formData.defectCount) || 0,
      downtimeMinutes: Number(formData.downtimeMinutes) || 0,
      supervisor: formData.supervisor,
      notes: formData.notes,
    };

    saveReport(reportToSave);
    setIsModalOpen(false);

    setToastMsg(
      editingReportId
        ? `Laporan harian ${reportToSave.line} (${reportToSave.style}) berhasil diperbarui! Efisiensi: ${reportToSave.efficiency}%, Pcs/MC Shift: ${reportToSave.pcsPerMcShift}`
        : `Laporan harian ${reportToSave.line} (${reportToSave.style}) berhasil disimpan! Efisiensi: ${reportToSave.efficiency}%, Pcs/MC Shift: ${reportToSave.pcsPerMcShift}`
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = filteredReports.map((r) => [
      r.date,
      r.line,
      r.style,
      r.orderNo || '-',
      r.shift,
      Number(r.targetOutput) || 0,
      r.actualOutput,
      r.smv,
      r.totalOperator,
      r.totalMesin,
      r.normalHours,
      r.otHours,
      r.totalMesinShift,
      r.pcsPerMcShift,
      `${r.efficiency}%`,
      r.defectCount || 0,
      r.downtimeMinutes || 0,
      r.supervisor,
      r.notes || '-',
    ]);

    downloadCSV('Laporan_Hasil_Produksi_Efisiensi.csv', [
      [
        'Tanggal',
        'Line',
        'Style Garment',
        'Nomor PO',
        'Shift',
        'Plan Output (pcs)',
        'Actual Output (pcs)',
        'SMV (menit)',
        'Total Operator (orang)',
        'Total Mesin (unit)',
        'Jam Non-Lembur (jam)',
        'Jam Lembur Mesin (jam)',
        'Total Mesin Shift',
        'Pcs / MC Shift',
        'Efisiensi Line (%)',
        'Defect (pcs)',
        'Downtime (menit)',
        'Supervisor',
        'Catatan',
      ],
      ...rows,
    ]);
  };

  // Monitoring manpower harian per line. Jika ada beberapa record/shift,
  // gunakan jumlah operator tertinggi yang dilaporkan pada hari tersebut agar tidak double-count.
  const manpowerMonitoring = useMemo(() => {
    const grouped = new Map<string, { date: string; line: string; used: number; shifts: Set<string>; reports: number }>();
    filteredReports.forEach((r) => {
      const key = `${r.date}__${r.line}`;
      const current = grouped.get(key) || { date: r.date, line: r.line, used: 0, shifts: new Set<string>(), reports: 0 };
      current.used = Math.max(current.used, Number(r.totalOperator) || 0);
      current.shifts.add(r.shift);
      current.reports += 1;
      grouped.set(key, current);
    });
    return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date) || a.line.localeCompare(b.line)).map((row) => {
      const lineMaster = lines.find((l) => l.code === row.line);
      const available = Math.max(0, Number(lineMaster?.manpowerAvailable) || 0);
      return { ...row, available, usedPercent: available > 0 ? (row.used / available) * 100 : null, balance: available - row.used };
    });
  }, [filteredReports, lines]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16 font-sans">
      {/* Header Bar */}
      <div className="bg-slate-950 border-b border-slate-800 py-6 sticky top-14 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setActiveModule('landing')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard Utama</span>
            </button>

            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setActiveModule('master-order')}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Master Order</span>
              </button>
              <button
                onClick={() => setActiveModule('prod-plan')}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                <span>Production Plan →</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-400 text-xs font-mono font-bold mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>MODUL LAPORAN · PRODUCTION REPORT &amp; IE METRICS</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Laporan Hasil Produksi &amp; Efisiensi Line
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Menghitung pencapaian <b>Efisiensi Line</b> berdasar (Output × SMV) / (Operator × Jam Normal)
                serta <b>Pcs / MC Shift</b> dengan jam lembur mesin.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Input Laporan Harian</span>
              </button>
            </div>
          </div>

          {toastMsg && (
            <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* IE Formula Guidance Banner */}
        <div className="bg-slate-800/90 border border-teal-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-teal-400" />
                  Formula Standard Industrial Engineering (IE) Line Produksi:
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-xs text-slate-300 font-mono">
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                  <span className="text-emerald-400 font-bold block mb-0.5">1. Efisiensi Line (%)</span>
                  <code>Effisiensi = (Actual Output × SMV) / (Operator × Jam Normal × 60) × 100%</code>
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                  <span className="text-teal-400 font-bold block mb-0.5">2. Total Mesin Shift &amp; Pcs/MC Shift</span>
                  <code>Mesin Shift = Mesin × ((8 + Lembur) / 8) &nbsp;|&nbsp; Pcs/MC = Output / Mesin Shift</code>
                </div>
              </div>
            </div>

            <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 max-w-sm">
              💡 <b>Catatan Operasional:</b> Jam lembur diperhitungkan khusus untuk jam kerja mesin (mesin shift),
              sedangkan jam operator dihitung berdasar jam kerja normal (non lembur).
            </div>
          </div>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider">Efisiensi Rata-rata</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <strong className="text-3xl font-black font-mono text-emerald-400 block mt-1">
              {stats.avgEfficiency}%
            </strong>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Dihitung dari (Output × SMV) / (Operator × Normal Jam)
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider">Pcs / MC Shift</span>
              <Cpu className="w-4 h-4 text-teal-400" />
            </div>
            <strong className="text-3xl font-black font-mono text-teal-300 block mt-1">
              {stats.avgPcsPerMcShift} <span className="text-xs font-normal text-slate-400">pcs/shift</span>
            </strong>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Produktivitas output per mesin shift berjalan
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider">Total Output Aktual</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <strong className="text-3xl font-black font-mono text-white block mt-1">
              {stats.totalActual.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">pcs</span>
            </strong>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Total hasil garmen jadi dari {reports.length} shift line
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider">Total Mesin Shift</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <strong className="text-3xl font-black font-mono text-purple-300 block mt-1">
              {stats.totalMesinShifts} <span className="text-xs font-normal text-slate-400">mc-shift</span>
            </strong>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Total mesin × ((8 + lembur) / 8)
            </span>
          </div>
        </div>

        {/* Plan versus Actual report */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white">Laporan Plan versus Actual</h3>
              <p className="text-xs text-slate-400 mt-1">Perbandingan target dan hasil aktual berdasarkan data laporan harian yang tersimpan.</p>
            </div>
            <button onClick={() => downloadCSV('Production_Plan_vs_Actual.csv', [['Tanggal','Line','Style','PO','Shift','Plan Output (pcs)','Actual Output (pcs)','Variance (pcs)','Achievement (%)'], ...filteredReports.map(r => { const plan = Number(r.targetOutput) || 0; const actual = Number(r.actualOutput) || 0; return [r.date,r.line,r.style,r.orderNo || '',r.shift,plan,actual,actual-plan,plan > 0 ? `${((actual/plan)*100).toFixed(1)}%` : 'N/A']; })])} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl">
              <FileDown className="w-4 h-4" /> Export Plan vs Actual
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[850px] text-xs">
              <thead><tr className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4">Tanggal</th><th className="py-3 px-4">Line</th><th className="py-3 px-4">Style / PO</th><th className="py-3 px-4 text-right">Plan</th><th className="py-3 px-4 text-right">Actual</th><th className="py-3 px-4 text-right">Variance</th><th className="py-3 px-4 text-right">Achievement</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-700/50">{filteredReports.length === 0 ? <tr><td colSpan={7} className="py-6 text-center text-slate-500">Belum ada data plan versus actual.</td></tr> : filteredReports.map(r => { const plan = Number(r.targetOutput) || 0; const actual = Number(r.actualOutput) || 0; const variance = actual-plan; const achievement = plan > 0 ? actual/plan*100 : 0; return <tr key={`pva-${r.id}`} className="hover:bg-slate-700/30"><td className="py-3 px-4">{r.date}</td><td className="py-3 px-4 font-bold">{r.line}</td><td className="py-3 px-4">{r.style}<div className="text-[10px] text-slate-500">{r.orderNo || ''} · {r.shift}</div></td><td className="py-3 px-4 text-right font-mono text-blue-300">{plan.toLocaleString('id-ID')}</td><td className="py-3 px-4 text-right font-mono font-bold">{actual.toLocaleString('id-ID')}</td><td className={`py-3 px-4 text-right font-mono font-bold ${variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{variance > 0 ? '+' : ''}{variance.toLocaleString('id-ID')}</td><td className={`py-3 px-4 text-right font-mono font-bold ${achievement >= 100 ? 'text-emerald-400' : 'text-amber-300'}`}>{plan > 0 ? `${achievement.toFixed(1)}%` : 'N/A'}</td></tr>; })}</tbody>
            </table>
          </div>
        </div>

        {/* Daily manpower utilization monitoring */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl mt-5">
          <div className="p-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white">Monitoring Pemakaian Manpower per Line per Hari</h3>
              <p className="text-xs text-slate-400 mt-1">Manpower terpakai dibandingkan dengan manpower tersedia per shift yang diset pada Master Line.</p>
            </div>
            <button onClick={() => downloadCSV('Daily_Manpower_Utilization.csv', [['Tanggal','Line','Manpower Terpakai (orang)','Manpower Tersedia per Shift (orang)','Sisa/Kekurangan (orang)','Actual % Used Manpower','Shift Tercatat'], ...manpowerMonitoring.map(r => [r.date,r.line,r.used,r.available,r.balance,r.usedPercent === null ? 'N/A' : `${r.usedPercent.toFixed(1)}%`,Array.from(r.shifts).join(', ')])])} className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl">
              <FileDown className="w-4 h-4" /> Export Manpower Report
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
            <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3"><p className="text-[10px] text-slate-400 uppercase font-bold">Line-Hari Terpantau</p><p className="text-2xl font-black text-white mt-1">{manpowerMonitoring.length}</p></div>
            <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3"><p className="text-[10px] text-slate-400 uppercase font-bold">Rata-rata Actual % Used</p><p className="text-2xl font-black text-teal-300 mt-1">{manpowerMonitoring.filter(r => r.usedPercent !== null).length ? (manpowerMonitoring.filter(r => r.usedPercent !== null).reduce((sum, r) => sum + (r.usedPercent || 0), 0) / manpowerMonitoring.filter(r => r.usedPercent !== null).length).toFixed(1) : 'N/A'}{manpowerMonitoring.some(r => r.usedPercent !== null) ? '%' : ''}</p></div>
            <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3"><p className="text-[10px] text-slate-400 uppercase font-bold">Line Melebihi Manpower</p><p className="text-2xl font-black text-rose-300 mt-1">{manpowerMonitoring.filter(r => r.usedPercent !== null && r.usedPercent > 100).length}</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[780px] text-xs">
              <thead><tr className="bg-slate-900/60 text-slate-400 uppercase text-[10px]"><th className="py-3 px-4">Tanggal</th><th className="py-3 px-4">Line</th><th className="py-3 px-4 text-right">Manpower Terpakai</th><th className="py-3 px-4 text-right">Manpower Tersedia/Shift</th><th className="py-3 px-4 text-right">Sisa / Kekurangan</th><th className="py-3 px-4">Actual % Used Manpower</th><th className="py-3 px-4">Shift</th></tr></thead>
              <tbody className="divide-y divide-slate-700/50">{manpowerMonitoring.length === 0 ? <tr><td colSpan={7} className="py-6 text-center text-slate-500">Belum ada data manpower. Simpan laporan produksi harian dan isi manpower tersedia di Setup → Master Line.</td></tr> : manpowerMonitoring.map((r, i) => <tr key={`${r.date}-${r.line}-${i}`} className="hover:bg-slate-700/30"><td className="py-3 px-4">{r.date}</td><td className="py-3 px-4 font-bold">{r.line}</td><td className="py-3 px-4 text-right font-mono font-bold text-white">{r.used}</td><td className="py-3 px-4 text-right font-mono text-blue-300">{r.available || 'Belum diatur'}</td><td className={`py-3 px-4 text-right font-mono font-bold ${r.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{r.available ? (r.balance > 0 ? '+' : '') + r.balance : 'N/A'}</td><td className="py-3 px-4 min-w-[190px]">{r.usedPercent === null ? <span className="text-amber-300">Atur manpower tersedia</span> : <><div className="flex items-center justify-between mb-1"><span className={`font-black ${r.usedPercent > 100 ? 'text-rose-400' : r.usedPercent >= 90 ? 'text-amber-300' : 'text-teal-300'}`}>{r.usedPercent.toFixed(1)}%</span><span className="text-[10px] text-slate-500">{r.usedPercent > 100 ? 'Over capacity' : r.usedPercent >= 90 ? 'High' : 'Available'}</span></div><div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${r.usedPercent > 100 ? 'bg-rose-500' : r.usedPercent >= 90 ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ width: `${Math.min(r.usedPercent, 100)}%` }} /></div></>}</td><td className="py-3 px-4 text-slate-400">{Array.from(r.shifts).join(', ')}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="px-4 py-3 text-[10px] text-slate-500 border-t border-slate-700">Rumus: Actual % Used Manpower = manpower terpakai ÷ manpower tersedia per shift × 100%. Untuk menghindari hitung ganda, manpower terpakai harian memakai angka operator tertinggi yang dilaporkan pada line tersebut di tanggal yang sama.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari style garment, line (L01, L02), supervisor, nomor PO..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterLine}
              onChange={(e) => setFilterLine(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="">Semua Line Produksi</option>
              {lines.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code} - {l.name}
                </option>
              ))}
            </select>

            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="">Semua Shift</option>
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
            </select>

            <div className="text-xs text-slate-400 font-mono pl-2 border-l border-slate-700">
              Total {filteredReports.length} Laporan
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Data Laporan Hasil Produksi Harian</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-teal-500/20 text-teal-300 font-bold">
                  {filteredReports.length} Baris
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Menampilkan rincian input output, operator, mesin, jam lembur, serta metrik efisiensi line &amp; pcs/mc shift.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px] text-xs">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Line</th>
                  <th className="py-3 px-3">Style &amp; PO</th>
                  <th className="py-3 px-3">Shift</th>
                  <th className="py-3 px-3 text-right font-black text-white bg-slate-900/80">
                    Actual Output
                  </th>
                  <th className="py-3 px-2 text-center">SMV</th>
                  <th className="py-3 px-2 text-center">Operator</th>
                  <th className="py-3 px-2 text-center">Mesin</th>
                  <th className="py-3 px-3 text-center">Jam Kerja</th>
                  <th className="py-3 px-3 text-right font-mono text-purple-300 bg-purple-950/20">
                    Mesin Shift
                  </th>
                  <th className="py-3 px-3 text-right font-mono text-teal-300 bg-teal-950/20">
                    Pcs / MC Shift
                  </th>
                  <th className="py-3 px-3 text-right font-mono text-emerald-400 bg-emerald-950/20">
                    Efisiensi Line
                  </th>
                  <th className="py-3 px-3">Supervisor</th>
                  <th className="py-3 px-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400">
                      <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-300">Belum ada data laporan produksi.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Klik "+ Input Laporan Harian" untuk menambahkan hasil output produksi line.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => {
                    const isHighEff = r.efficiency >= 85;
                    const isMidEff = r.efficiency >= 75;

                    return (
                      <tr key={r.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-300">{r.date}</td>

                        <td className="py-3 px-3 font-mono font-bold text-white">
                          <span className="px-2 py-0.5 bg-slate-700 rounded text-xs">
                            {r.line}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{r.style}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            {r.orderNo && <span>PO: {r.orderNo}</span>}
                            <span className="text-teal-400 font-sans text-[9px] bg-teal-950/60 px-1 py-0.2 rounded border border-teal-500/30">
                              Master Order
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-300">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {r.shift}
                          </span>
                        </td>

                        {/* Actual Output */}
                        <td className="py-3 px-3 text-right font-mono font-black text-white text-sm bg-slate-900/40">
                          {r.actualOutput.toLocaleString('id-ID')}
                        </td>

                        {/* SMV */}
                        <td className="py-3 px-2 text-center font-mono">
                          <div className="font-bold text-slate-200">{r.smv}m</div>
                          <span className="inline-block px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans font-semibold">
                            dari OB
                          </span>
                        </td>

                        {/* Operator */}
                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-200">
                          {r.totalOperator}
                        </td>

                        {/* Mesin */}
                        <td className="py-3 px-2 text-center font-mono text-slate-300">
                          {r.totalMesin}
                        </td>

                        {/* Jam Kerja: Non Lembur + Jam Lembur Mesin */}
                        <td className="py-3 px-3 text-center font-mono text-[11px]">
                          <span className="text-slate-300">{r.normalHours}h norm</span>
                          {r.otHours > 0 ? (
                            <span className="text-amber-400 font-bold ml-1">
                              +{r.otHours}h lembur
                            </span>
                          ) : (
                            <span className="text-slate-500 ml-1">0 OT</span>
                          )}
                        </td>

                        {/* Total Mesin Shift */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-purple-300 bg-purple-950/10">
                          {r.totalMesinShift}
                        </td>

                        {/* Pcs / MC Shift */}
                        <td className="py-3 px-3 text-right font-mono font-black text-teal-300 bg-teal-950/10 text-sm">
                          {r.pcsPerMcShift}
                        </td>

                        {/* Efisiensi Line */}
                        <td className="py-3 px-3 text-right font-mono bg-emerald-950/10">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                              isHighEff
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isMidEff
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {r.efficiency}%
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-300">
                          <div>{r.supervisor}</div>
                          {r.notes && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {r.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="p-1 text-slate-400 hover:text-teal-300 hover:bg-slate-700/80 rounded cursor-pointer transition-colors"
                              title="Edit laporan ini"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus baris laporan produksi line ${r.line} (${r.style})?`)) {
                                  deleteReport(r.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700/80 rounded cursor-pointer transition-colors"
                              title="Hapus laporan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* INPUT REPORT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${
                    editingReportId
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  }`}
                >
                  {editingReportId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingReportId ? 'Edit Laporan Hasil Produksi' : 'Input Laporan Hasil Produksi'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingReportId
                      ? `Mengubah data laporan line ${formData.line} — ${formData.style}`
                      : 'Lengkapi data output, operator, mesin & jam kerja untuk menghitung efisiensi dan pcs/mc shift'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Select Style from Master Order */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Pilih Order PO / Style (Master Order) *</span>
                  <span className="text-[10px] text-teal-400 font-mono">Tersinkron dengan Master Order</span>
                </label>
                <select
                  value={formData.orderId}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-teal-500"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo} — {o.buyer} | {o.style}
                    </option>
                  ))}
                </select>
              </div>

              {/* Explicit Nama Style Berdasarkan Master Order */}
              <div className="p-3 bg-slate-950/70 border border-teal-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Package className="w-3.5 h-3.5 text-teal-400" />
                    <span>Nama Style (Berdasarkan Master Order) *</span>
                  </label>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 font-bold">
                    Master Order
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={formData.style}
                      onChange={(e) => {
                        const val = e.target.value;
                        const ob = findMatchingOB(val, formData.orderNo);
                        setFormData({
                          ...formData,
                          style: val,
                          ...(ob ? { smv: ob.totalSAM } : {}),
                        });
                      }}
                      placeholder="Nama Style Garment..."
                      className="w-full px-3 py-2 bg-slate-900 border border-teal-500/50 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-teal-400"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.buyer || ''}
                      onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                      placeholder="Buyer / Brand"
                      className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-300 text-xs"
                      title="Buyer Style"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Style otomatis diambil dari Master Order terpilih</span>
                  {formData.orderNo && (
                    <span className="font-mono text-teal-400">No PO: {formData.orderNo}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tanggal Produksi *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Line Produksi *
                  </label>
                  <select
                    value={formData.line}
                    onChange={(e) => {
                      const lCode = e.target.value;
                      const lineObj = lines.find((l) => l.code === lCode);
                      setFormData({
                        ...formData,
                        line: lCode,
                        supervisor: lineObj?.sup || formData.supervisor,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    {lines.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.code} - {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5 Main User Inputs */}
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                  Parameter Input Output &amp; Jam Kerja:
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-300 mb-1">
                      Plan Output (pcs) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.targetOutput}
                      onChange={(e) => setFormData({ ...formData, targetOutput: Math.max(0, parseInt(e.target.value || '0', 10)) })}
                      className="w-full px-3 py-2 bg-slate-900 border-2 border-blue-500/60 rounded-xl text-white font-mono font-bold text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-white mb-1">
                      Actual Output (pcs) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.actualOutput}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          actualOutput: Math.max(0, parseInt(e.target.value || '0', 10)),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border-2 border-teal-500/60 rounded-xl text-white font-mono font-bold text-sm"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        SMV / SAM Garment (menit) *
                      </label>
                      {currentMatchedOB && (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Auto dari OB
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={formData.smv}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            smv: parseFloat(e.target.value || '0'),
                          })
                        }
                        className={`w-full px-3 py-2 bg-slate-900 border-2 rounded-xl text-white font-mono font-bold text-sm ${
                          currentMatchedOB ? 'border-emerald-500/70' : 'border-slate-700'
                        }`}
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        menit / pc
                      </span>
                    </div>

                    {/* Operation Bulletin Indicator */}
                    {currentMatchedOB ? (
                      <div className="mt-1.5 p-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-[10px] text-emerald-300 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">
                            OB: <b>{currentMatchedOB.styleCode}</b> ({currentMatchedOB.totalSAM} min)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsModalOpen(false);
                            setActiveModule('ob');
                          }}
                          className="text-[9px] text-emerald-400 hover:underline shrink-0 cursor-pointer flex items-center gap-0.5"
                          title="Buka rincian Operation Bulletin"
                        >
                          <span>Lihat OB</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-400 flex items-center justify-between">
                        <span>SMV manual (belum ada OB)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsModalOpen(false);
                            setActiveModule('ob');
                          }}
                          className="text-[9px] text-blue-400 hover:underline cursor-pointer"
                        >
                          + Buka Modul OB
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-white mb-1">
                      Total Operator Digunakan (orang) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalOperator}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalOperator: Math.max(1, parseInt(e.target.value || '0', 10)),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white mb-1">
                      Total Mesin Digunakan (unit) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalMesin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalMesin: Math.max(1, parseInt(e.target.value || '0', 10)),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Jam Kerja Non Lembur (Normal) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="12"
                        value={formData.normalHours}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            normalHours: parseFloat(e.target.value || '8'),
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">
                        jam/shift
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 mb-1">
                      Jumlah Jam Lembur Mesin *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="8"
                        value={formData.otHours}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            otHours: Math.max(0, parseFloat(e.target.value || '0')),
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-amber-300 font-mono font-bold"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 text-[10px]">
                        jam lembur
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      *Jam lembur hanya untuk mesin, bukan operator
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE SIMULATION BOX OF THE FORMULAS */}
              <div className="p-4 bg-gradient-to-br from-teal-950/40 to-slate-950 rounded-xl border border-teal-500/40">
                <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Hasil Perhitungan Otomatis:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Formula Standard IE</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Mesin Shift</span>
                    <strong className="text-base font-black font-mono text-purple-300">
                      {liveTotalMesinShift}
                    </strong>
                    <span className="text-[9px] text-slate-500 block">
                      {formData.totalMesin} × (({8}+{formData.otHours})/8)
                    </span>
                  </div>

                  <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Pcs / MC Shift</span>
                    <strong className="text-base font-black font-mono text-teal-300">
                      {livePcsPerMcShift}
                    </strong>
                    <span className="text-[9px] text-slate-500 block">
                      {formData.actualOutput} / {liveTotalMesinShift}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Efisiensi Line</span>
                    <strong
                      className={`text-base font-black font-mono ${
                        liveEfficiency >= 85
                          ? 'text-emerald-400'
                          : liveEfficiency >= 75
                          ? 'text-sky-300'
                          : 'text-amber-400'
                      }`}
                    >
                      {liveEfficiency}%
                    </strong>
                    <span className="text-[9px] text-slate-500 block">
                      (Out × SMV) / (Op × Jam × 60)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Shift Kerja
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) =>
                      setFormData({ ...formData, shift: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Shift 1">Shift 1 (Pagi)</option>
                    <option value="Shift 2">Shift 2 (Siang / Malam)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Supervisor Line
                  </label>
                  <input
                    type="text"
                    value={formData.supervisor}
                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Catatan Kendala / Kelancaran Line
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan pergantian jarum, breakdown, atau kelancaran..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-bold rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1.5 text-white ${
                    editingReportId
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-teal-600 hover:bg-teal-500'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{editingReportId ? 'Simpan Perubahan Laporan' : 'Simpan Laporan Harian'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
