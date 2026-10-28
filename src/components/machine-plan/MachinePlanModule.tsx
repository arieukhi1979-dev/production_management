import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Cpu,
  Plus,
  QrCode,
  Printer,
  Download,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  Eye,
  RefreshCw,
  FileDown,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { Machine, MachinePlan, MachinePlanItem } from '../../types';
import { downloadCSV, parseCSV } from '../../utils/csv';
import { generateQRCodeDataURL, formatMachineQRData } from '../../utils/qr';

export const MachinePlanModule: React.FC = () => {
  const {
    setActiveModule,
    targetSubTab,
    setTargetSubTab,
    machines,
    saveMachine,
    deleteMachine,
    importMachinesList,
    plans,
    savePlan,
    deletePlan,
    machineTypes,
    lines,
    brands,
    locations,
    setSelectedMachineForQR,
    setIsPrintAllOpen,
  } = usePortal();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'plan' | 'summary'>('dashboard');

  useEffect(() => {
    if (targetSubTab && ['dashboard', 'master', 'plan', 'summary'].includes(targetSubTab)) {
      setActiveTab(targetSubTab as any);
      setTargetSubTab(undefined);
    }
  }, [targetSubTab, setTargetSubTab]);

  // Machine Form State
  const [machineForm, setMachineForm] = useState({
    id: '',
    code: '',
    name: '',
    type: '',
    brand: '',
    model: '',
    serial: '',
    status: 'Idle' as Machine['status'],
    location: '',
  });
  const [isEditingMachine, setIsEditingMachine] = useState(false);

  // Machine Active QR preview
  const [previewQR, setPreviewQR] = useState<{
    machine: Machine;
    url: string;
  } | null>(null);

  // Machine Filters
  const [machineSearch, setMachineSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Plan Form State (up to 15 items!)
  const [planForm, setPlanForm] = useState({
    id: '',
    start: '',
    end: '',
    line: '',
    style: '',
    note: '',
  });
  const [planRows, setPlanRows] = useState<MachinePlanItem[]>([{ type: '', qty: 1 }]);
  const [isEditingPlan, setIsEditingPlan] = useState(false);

  // Plan Filters
  const [planFrom, setPlanFrom] = useState('');
  const [planTo, setPlanTo] = useState('');
  const [planSearch, setPlanSearch] = useState('');

  // Summary Filters
  const [sumFrom, setSumFrom] = useState('');
  const [sumTo, setSumTo] = useState('');

  // Fleet availability helper
  const getAvailableCount = (typeCode: string) => {
    return machines.filter(
      (m) =>
        m.type.toLowerCase() === typeCode.toLowerCase() &&
        m.status !== 'Broken' &&
        m.status !== 'Maintenance'
    ).length;
  };

  // --- MACHINE HANDLERS ---
  const handleClearMachineForm = () => {
    setMachineForm({
      id: '',
      code: '',
      name: '',
      type: '',
      brand: '',
      model: '',
      serial: '',
      status: 'Idle',
      location: '',
    });
    setIsEditingMachine(false);
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineForm.code.trim() || !machineForm.name.trim() || !machineForm.type) {
      alert('Kode, Nama Mesin, dan Jenis Mesin wajib diisi!');
      return;
    }

    // Check duplicate code if new
    if (
      !isEditingMachine &&
      machines.some((m) => m.code.toLowerCase() === machineForm.code.trim().toLowerCase())
    ) {
      alert(`Kode mesin "${machineForm.code}" sudah ada! Gunakan kode yang unik.`);
      return;
    }

    const saved = saveMachine({
      id: isEditingMachine ? machineForm.id : undefined,
      code: machineForm.code.trim(),
      name: machineForm.name.trim(),
      type: machineForm.type,
      brand: machineForm.brand,
      model: machineForm.model.trim(),
      serial: machineForm.serial.trim(),
      status: machineForm.status,
      location: machineForm.location,
    });

    const qrUrl = await generateQRCodeDataURL(formatMachineQRData(saved), 280);
    setPreviewQR({ machine: saved, url: qrUrl });

    handleClearMachineForm();
  };

  const handleEditMachine = (m: Machine) => {
    setMachineForm({
      id: m.id,
      code: m.code,
      name: m.name,
      type: m.type,
      brand: m.brand,
      model: m.model,
      serial: m.serial,
      status: m.status,
      location: m.location,
    });
    setIsEditingMachine(true);
    setActiveTab('master');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteMachine = (m: Machine) => {
    if (confirm(`Apakah Anda yakin ingin menghapus mesin ${m.code} (${m.name})?`)) {
      deleteMachine(m.id);
      if (previewQR?.machine.id === m.id) setPreviewQR(null);
    }
  };

  const handleShowQR = async (m: Machine) => {
    const qrUrl = await generateQRCodeDataURL(formatMachineQRData(m), 280);
    setPreviewQR({ machine: m, url: qrUrl });
    setSelectedMachineForQR(m);
  };

  // CSV Template
  const handleDownloadTemplate = () => {
    downloadCSV('template_mesin.csv', [
      ['Kode', 'Nama Mesin', 'Jenis', 'Brand', 'Model', 'Serial', 'Status', 'Lokasi'],
      ['SN-0001', 'JUKI DDL-8700', 'SN', 'Juki', 'DDL-8700', 'JK-88231', 'Running', 'L01'],
      ['OB-0001', 'PEGASUS M952', 'OB', 'Pegasus', 'M952-52', 'PG-77102', 'Idle', 'Gudang Mesin'],
    ]);
  };

  // Export CSV Machines
  const handleExportMachines = () => {
    const rows = machines.map((m) => [
      m.code,
      m.name,
      m.type,
      m.brand,
      m.model,
      m.serial,
      m.status,
      m.location,
    ]);
    downloadCSV('database_mesin.csv', [
      ['Kode', 'Nama Mesin', 'Jenis', 'Brand', 'Model', 'Serial', 'Status', 'Lokasi'],
      ...rows,
    ]);
  };

  // Import CSV Machines
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const rows = parseCSV(text);
        if (rows.length < 2) {
          alert('File CSV kosong atau tidak memiliki data.');
          return;
        }

        const norm = (s: string) =>
          s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
        const header = rows[0].map(norm);

        const aliases = {
          code: ['kode', 'kodemesin', 'code'],
          name: ['namamesin', 'name', 'nama'],
          type: ['jenis', 'jenismesin', 'type'],
          brand: ['brand', 'merek', 'merk'],
          model: ['model'],
          serial: ['serial', 'sn', 'serialnumber'],
          status: ['status'],
          location: ['lokasi', 'location', 'line'],
        };

        const ix: Record<string, number> = {};
        for (const [key, aliasList] of Object.entries(aliases)) {
          ix[key] = header.findIndex((h) => aliasList.includes(h));
        }

        if (ix.code < 0 || ix.name < 0 || ix.type < 0) {
          alert('Header CSV wajib berisi kolom: Kode, Nama Mesin, Jenis');
          return;
        }

        const newMachines: Machine[] = [];
        for (const r of rows.slice(1)) {
          const val = (k: string) => (ix[k] >= 0 ? r[ix[k]] || '' : '').trim();
          const code = val('code');
          const name = val('name');
          const type = val('type').toUpperCase();
          if (!code || !name || !type) continue;

          newMachines.push({
            id: `m-${Date.now()}-${Math.random()}`,
            code,
            name,
            type,
            brand: val('brand'),
            model: val('model'),
            serial: val('serial'),
            status: (val('status') as any) || 'Idle',
            location: val('location'),
          });
        }

        const added = importMachinesList(newMachines);
        alert(`Berhasil mengimpor ${added} unit mesin baru.`);
      } catch (err: any) {
        alert('Gagal membaca file CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered Machines
  const filteredMachines = useMemo(() => {
    const q = machineSearch.toLowerCase();
    return machines.filter((m) => {
      if (filterType && m.type !== filterType) return false;
      if (filterLine && m.location !== filterLine) return false;
      if (filterStatus && m.status !== filterStatus) return false;
      if (q) {
        const full = `${m.code} ${m.name} ${m.type} ${m.brand} ${m.model} ${m.serial} ${m.location}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [machines, machineSearch, filterType, filterLine, filterStatus]);

  // --- PLAN HANDLERS (MULTI-JENIS UP TO 15) ---
  const handleAddPlanRow = () => {
    if (planRows.length >= 15) {
      alert('Maksimal 15 jenis mesin per plan telah tercapai!');
      return;
    }
    setPlanRows([...planRows, { type: '', qty: 1 }]);
  };

  const handleRemovePlanRow = (idx: number) => {
    if (planRows.length === 1) {
      alert('Plan harus memiliki minimal 1 jenis mesin.');
      return;
    }
    setPlanRows(planRows.filter((_, i) => i !== idx));
  };

  const handleUpdatePlanRow = (idx: number, field: 'type' | 'qty', value: any) => {
    const copy = [...planRows];
    copy[idx] = { ...copy[idx], [field]: value };
    setPlanRows(copy);
  };

  const handleClearPlanForm = () => {
    setPlanForm({
      id: '',
      start: '',
      end: '',
      line: '',
      style: '',
      note: '',
    });
    setPlanRows([{ type: '', qty: 1 }]);
    setIsEditingPlan(false);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.start || !planForm.end || !planForm.line) {
      alert('Tanggal Mulai, Selesai, dan Line Produksi wajib diisi!');
      return;
    }

    const validRows = planRows.filter((r) => r.type && r.qty > 0);
    if (validRows.length === 0) {
      alert('Mohon isi minimal 1 jenis mesin dengan kuantiti lebih dari 0.');
      return;
    }

    // Check duplicate machine types
    const typesSet = new Set(validRows.map((r) => r.type));
    if (typesSet.size !== validRows.length) {
      alert('Terdapat jenis mesin duplikat dalam daftar. Gabungkan kuantiti untuk jenis yang sama.');
      return;
    }

    savePlan({
      id: isEditingPlan ? planForm.id : undefined,
      start: planForm.start,
      end: planForm.end,
      line: planForm.line,
      style: planForm.style.trim(),
      note: planForm.note.trim(),
      items: validRows,
    });

    alert(
      isEditingPlan
        ? 'Plan kebutuhan mesin berhasil diperbarui!'
        : `Plan berhasil disimpan dengan ${validRows.length} jenis mesin.`
    );
    handleClearPlanForm();
  };

  const handleEditPlan = (p: MachinePlan) => {
    setPlanForm({
      id: p.id,
      start: p.start,
      end: p.end,
      line: p.line,
      style: p.style || '',
      note: p.note || '',
    });
    const items = p.items || [{ type: p.type || '', qty: p.qty || 1 }];
    setPlanRows(items);
    setIsEditingPlan(true);
    setActiveTab('plan');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeletePlan = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus plan ini?')) {
      deletePlan(id);
    }
  };

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    const q = planSearch.toLowerCase();
    return plans.filter((p) => {
      if (planFrom && p.start < planFrom) return false;
      if (planTo && p.end > planTo) return false;
      if (q) {
        const typesStr = (p.items || [{ type: p.type }]).map((it) => it.type).join(' ');
        const full = `${p.line} ${p.style} ${p.note} ${typesStr}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [plans, planFrom, planTo, planSearch]);

  const handleExportPlans = () => {
    const rows: (string | number)[][] = [];
    filteredPlans.forEach((p) => {
      const items = p.items || [{ type: p.type || '', qty: p.qty || 0 }];
      items.forEach((it) => {
        rows.push([p.start, p.end, p.line, p.style, it.type, it.qty, p.note]);
      });
    });

    downloadCSV('plan_kebutuhan_mesin.csv', [
      ['Mulai', 'Selesai', 'Line', 'Buyer/Style', 'Jenis Mesin', 'Qty', 'Catatan'],
      ...rows,
    ]);
  };

  // --- SUMMARY CALCULATIONS ---
  const summaryPlans = useMemo(() => {
    return plans.filter((p) => {
      if (sumFrom && p.start < sumFrom) return false;
      if (sumTo && p.end > sumTo) return false;
      return true;
    });
  }, [plans, sumFrom, sumTo]);

  const summaryByType = useMemo(() => {
    const flat: { type: string; qty: number }[] = [];
    summaryPlans.forEach((p) => {
      const items = p.items || [{ type: p.type || '', qty: p.qty || 0 }];
      items.forEach((it) => flat.push({ type: it.type, qty: it.qty }));
    });

    const types = Array.from(new Set(flat.map((f) => f.type))).filter(Boolean);
    return types
      .map((type) => {
        const items = flat.filter((f) => f.type === type);
        const need = items.reduce((acc, it) => acc + (it.qty || 0), 0);
        const available = getAvailableCount(type);
        const gap = Math.max(0, need - available);
        const typeInfo = machineTypes.find((t) => t.code === type);
        return {
          type,
          name: typeInfo?.name || type,
          count: items.length,
          need,
          available,
          gap,
        };
      })
      .sort((a, b) => b.need - a.need);
  }, [summaryPlans, machines, machineTypes]);

  const handleExportSummary = () => {
    const rows = summaryByType.map((r) => [r.type, r.name, r.count, r.need, r.available, r.gap]);
    downloadCSV('summary_kebutuhan_mesin.csv', [
      ['Kode Jenis', 'Nama Jenis', 'Item Plan', 'Need (Kebutuhan)', 'Tersedia', 'Gap (Defisit)'],
      ...rows,
    ]);
  };

  // Dashboard Overview Table calculation
  const dashboardBalance = useMemo(() => {
    const flat: { type: string; qty: number }[] = [];
    plans.forEach((p) => {
      const items = p.items || [{ type: p.type || '', qty: p.qty || 0 }];
      items.forEach((it) => flat.push({ type: it.type, qty: it.qty }));
    });

    const types = Array.from(new Set(flat.map((f) => f.type))).filter(Boolean);
    return types.map((type) => {
      const items = flat.filter((f) => f.type === type);
      const need = items.reduce((acc, it) => acc + (it.qty || 0), 0);
      const available = getAvailableCount(type);
      const gap = Math.max(0, need - available);
      const typeInfo = machineTypes.find((t) => t.code === type);
      return {
        type,
        name: typeInfo?.name || type,
        count: items.length,
        need,
        available,
        gap,
      };
    });
  }, [plans, machines, machineTypes]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Breadcrumb & Hero */}
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
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-mono font-bold mb-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>MODUL UTAMA · MACHINE PLAN</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Machine Plan &amp; Asset Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Database mesin, QR identitas aset, dan perencanaan kebutuhan hingga 15 jenis per plan.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('plan');
                  handleClearPlanForm();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ Plan Baru (15 Jenis)</span>
              </button>
              <button
                onClick={() => setIsPrintAllOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <span>Print Semua QR</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-slate-800 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Overview &amp; Stat</span>
            </button>
            <button
              onClick={() => setActiveTab('master')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'master'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Database Mesin &amp; QR Code</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80">
                {machines.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'plan'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Plan Kebutuhan Mesin</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80">
                {plans.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Summary Periode</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 4 Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Aset Mesin
                </span>
                <strong className="text-3xl font-black font-mono text-white block mt-1">
                  {machines.length.toLocaleString('id-ID')}
                </strong>
                <span className="text-xs text-emerald-400 mt-1 block">
                  {machines.filter((m) => m.status === 'Running').length} Siap Beroperasi
                </span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Jenis Mesin Terdaftar
                </span>
                <strong className="text-3xl font-black font-mono text-white block mt-1">
                  {machineTypes.length.toLocaleString('id-ID')}
                </strong>
                <span className="text-xs text-slate-400 mt-1 block">Standard Industri Garmen</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Rencana Kebutuhan
                </span>
                <strong className="text-3xl font-black font-mono text-white block mt-1">
                  {plans.length.toLocaleString('id-ID')}
                </strong>
                <span className="text-xs text-blue-400 mt-1 block">Aktif di Lantai Jahit</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Unit Kebutuhan
                </span>
                <strong className="text-3xl font-black font-mono text-white block mt-1">
                  {plans
                    .reduce((acc, p) => {
                      const items = p.items || [{ qty: p.qty || 0 }];
                      return acc + items.reduce((s, it) => s + (it.qty || 0), 0);
                    }, 0)
                    .toLocaleString('id-ID')}
                </strong>
                <span className="text-xs text-slate-400 mt-1 block">Kumulatif semua plan</span>
              </div>
            </div>

            {/* Overview Table */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-white mb-1">
                Keseimbangan Need vs Ketersediaan Armada
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Tinjauan komprehensif alokasi jenis mesin di pabrik.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Jenis Mesin</th>
                      <th className="py-2.5 px-3">Item Plan Terlibat</th>
                      <th className="py-2.5 px-3 text-right">Kebutuhan (Need)</th>
                      <th className="py-2.5 px-3 text-right">Armada Siap Pakai</th>
                      <th className="py-2.5 px-3 text-right">Defisit / Gap</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {dashboardBalance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Belum ada plan kebutuhan mesin. Klik tab &quot;Plan Kebutuhan Mesin&quot; untuk menambahkan.
                        </td>
                      </tr>
                    ) : (
                      dashboardBalance.map((r) => (
                        <tr key={r.type} className="hover:bg-slate-750/50">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            <span className="font-mono text-blue-400 font-bold mr-1.5">{r.type}</span>
                            <span>{r.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{r.count} plan</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {r.need.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {r.available.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {r.gap > 0 ? (
                              <span className="font-bold text-rose-400">-{r.gap}</span>
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {r.gap > 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Defisit
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Cukup
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATABASE MESIN & QR CODE */}
        {activeTab === 'master' && (
          <div className="space-y-6">
            {/* Form Box */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-400" />
                  <span>{isEditingMachine ? 'Edit Data Mesin' : 'Tambah Mesin Baru + Generate QR'}</span>
                </h3>
                {isEditingMachine && (
                  <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                    Mode Edit: {machineForm.code}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveMachine}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kode Mesin *
                    </label>
                    <input
                      type="text"
                      value={machineForm.code}
                      onChange={(e) => setMachineForm({ ...machineForm, code: e.target.value.toUpperCase() })}
                      placeholder="Contoh: SN-0001"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nama Mesin *
                    </label>
                    <input
                      type="text"
                      value={machineForm.name}
                      onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                      placeholder="Contoh: JUKI DDL-8700"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Jenis Mesin *
                    </label>
                    <select
                      value={machineForm.type}
                      onChange={(e) => setMachineForm({ ...machineForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Pilih Jenis Mesin</option>
                      {machineTypes.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.code} - {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Brand / Merek
                    </label>
                    <select
                      value={machineForm.brand}
                      onChange={(e) => setMachineForm({ ...machineForm, brand: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Pilih Brand</option>
                      {brands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Model Mesin
                    </label>
                    <input
                      type="text"
                      value={machineForm.model}
                      onChange={(e) => setMachineForm({ ...machineForm, model: e.target.value })}
                      placeholder="Contoh: DDL-8700-7"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nomor Seri (Serial No)
                    </label>
                    <input
                      type="text"
                      value={machineForm.serial}
                      onChange={(e) => setMachineForm({ ...machineForm, serial: e.target.value })}
                      placeholder="Contoh: JK-88231"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Status Operasional
                    </label>
                    <select
                      value={machineForm.status}
                      onChange={(e) => setMachineForm({ ...machineForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Running">Running (Aktif Jahit)</option>
                      <option value="Idle">Idle (Siap Pakai / Standby)</option>
                      <option value="Maintenance">Maintenance (Servis Berkala)</option>
                      <option value="Broken">Broken (Rusak / Perlu Suku Cadang)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Line / Lokasi Penempatan
                    </label>
                    <select
                      value={machineForm.location}
                      onChange={(e) => setMachineForm({ ...machineForm, location: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Pilih Line / Lokasi</option>
                      <optgroup label="Production Lines">
                        {lines.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.code} - {l.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Gudang &amp; Area Lain">
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-700/80">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    {isEditingMachine ? 'Update Mesin + Re-generate QR' : 'Simpan Mesin + Generate QR'}
                  </button>

                  {isEditingMachine && (
                    <button
                      type="button"
                      onClick={handleClearMachineForm}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Batal Edit
                    </button>
                  )}

                  <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Template CSV</span>
                  </button>

                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import CSV</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleImportFile}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleExportMachines}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrintAllOpen(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 ml-auto"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Print Semua QR</span>
                  </button>
                </div>
              </form>

              {/* QR Preview Area if generated */}
              {previewQR && (
                <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-blue-500/30 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
                  <div className="bg-white p-2 rounded-xl">
                    <img
                      src={previewQR.url}
                      alt={previewQR.machine.code}
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left text-xs space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-mono text-base font-black text-white">
                        {previewQR.machine.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                        QR Ready
                      </span>
                    </div>
                    <div className="text-slate-200 font-bold">{previewQR.machine.name}</div>
                    <div className="text-slate-400">
                      {previewQR.machine.type} · {previewQR.machine.brand} · Loc: {previewQR.machine.location || '-'}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                      <button
                        onClick={() => setSelectedMachineForQR(previewQR.machine)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Lihat Full &amp; Cetak
                      </button>
                      <button
                        onClick={() => setPreviewQR(null)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        Tutup Preview
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Machines Table with Filters */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={machineSearch}
                    onChange={(e) => setMachineSearch(e.target.value)}
                    placeholder="Cari kode, nama, jenis, model, serial..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">Semua Jenis</option>
                  {machineTypes.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.code} - {t.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterLine}
                  onChange={(e) => setFilterLine(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">Semua Line / Lokasi</option>
                  {lines.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.code}
                    </option>
                  ))}
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">Semua Status</option>
                  <option value="Running">Running</option>
                  <option value="Idle">Idle</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Broken">Broken</option>
                </select>

                <div className="text-xs text-slate-400 font-mono">
                  Menampilkan {filteredMachines.length} / {machines.length}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Mesin</th>
                      <th className="py-2.5 px-3">Jenis</th>
                      <th className="py-2.5 px-3">Brand / Model</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Lokasi / Line</th>
                      <th className="py-2.5 px-3 text-center">QR Code</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {filteredMachines.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          Tidak ada data mesin yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredMachines.map((m) => {
                        const typeInfo = machineTypes.find((t) => t.code === m.type);
                        return (
                          <tr key={m.id} className="hover:bg-slate-750/50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                              {m.code}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-200">
                              {m.name}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-slate-300 font-semibold">{m.type}</span>
                              <span className="text-[10px] text-slate-400 ml-1">
                                ({typeInfo?.name || 'Sewing'})
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {m.brand} {m.model ? `· ${m.model}` : ''}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  m.status === 'Running'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : m.status === 'Idle'
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                    : m.status === 'Maintenance'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 font-medium">
                              {m.location || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleShowQR(m)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-blue-600 text-slate-200 hover:text-white text-[11px] font-semibold transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>QR</span>
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleEditMachine(m)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                  title="Edit Mesin"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMachine(m)}
                                  className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                                  title="Hapus Mesin"
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
        )}

        {/* TAB 3: PLAN KEBUTUHAN MESIN (UP TO 15 JENIS) */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            {/* Form Plan */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>
                      {isEditingPlan ? `Edit Plan — ${planForm.line}` : 'Tambah Plan Kebutuhan Mesin'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Satu plan dapat mencakup hingga 15 jenis mesin sesuai breakdown Operation Bulletin style.
                  </p>
                </div>
                {isEditingPlan && (
                  <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                    Mode Edit: {planForm.line}
                  </span>
                )}
              </div>

              <form onSubmit={handleSavePlan}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      value={planForm.start}
                      onChange={(e) => setPlanForm({ ...planForm, start: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tanggal Selesai *
                    </label>
                    <input
                      type="date"
                      value={planForm.end}
                      onChange={(e) => setPlanForm({ ...planForm, end: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Line Produksi *
                    </label>
                    <select
                      value={planForm.line}
                      onChange={(e) => setPlanForm({ ...planForm, line: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none font-semibold"
                      required
                    >
                      <option value="">Pilih Line Jahit</option>
                      {lines
                        .filter((l) => l.stat === 'Active')
                        .map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.code} - {l.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Buyer / Style Garment
                    </label>
                    <input
                      type="text"
                      value={planForm.style}
                      onChange={(e) => setPlanForm({ ...planForm, style: e.target.value })}
                      placeholder="Contoh: UNIQLO - Oxford Shirt"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Catatan Perencanaan / Keterangan Khusus
                    </label>
                    <input
                      type="text"
                      value={planForm.note}
                      onChange={(e) => setPlanForm({ ...planForm, note: e.target.value })}
                      placeholder="Contoh: Perlu Single Needle presisi kerah & jarum ganda paralel."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Multi-machine Rows (Max 15) */}
                <div className="mt-5 p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Daftar Kebutuhan Jenis Mesin</span>
                        <span className="font-mono text-blue-400">
                          ({planRows.length}/15 Jenis)
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tentukan setiap jenis mesin jahit / cutting / finishing yang diperlukan beserta jumlah unitnya.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddPlanRow}
                        disabled={planRows.length >= 15}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Jenis</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanRows([{ type: '', qty: 1 }])}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    {planRows.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-slate-800/60 p-2 rounded-xl border border-slate-700/60"
                      >
                        <div className="col-span-1 text-center font-mono text-xs font-bold text-slate-400">
                          #{idx + 1}
                        </div>
                        <div className="col-span-7 sm:col-span-8">
                          <select
                            value={row.type}
                            onChange={(e) => handleUpdatePlanRow(idx, 'type', e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none font-medium"
                            required
                          >
                            <option value="">Pilih Jenis Mesin</option>
                            {machineTypes.map((t) => (
                              <option key={t.code} value={t.code}>
                                {t.code} - {t.name} ({t.cat})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              value={row.qty}
                              onChange={(e) =>
                                handleUpdatePlanRow(idx, 'qty', parseInt(e.target.value || '1'))
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono text-center focus:outline-none"
                              required
                            />
                            <span className="text-[11px] text-slate-400 hidden sm:inline">unit</span>
                          </div>
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemovePlanRow(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus baris jenis ini"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 pt-1 px-1">
                    <span>
                      Total Akumulasi:{' '}
                      <strong className="text-white font-mono">
                        {planRows.reduce((acc, r) => acc + (r.qty || 0), 0)} unit mesin
                      </strong>
                    </span>
                    <span>Batas maksimal: 15 jenis per order plan</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                  >
                    {isEditingPlan ? 'Update Plan' : 'Simpan Plan Kebutuhan Mesin'}
                  </button>

                  {isEditingPlan && (
                    <button
                      type="button"
                      onClick={handleClearPlanForm}
                      className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Batal Edit
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleExportPlans}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 ml-auto"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Export CSV Plan</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Plans Table with Filters */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="text-slate-400">Dari:</span>
                  <input
                    type="date"
                    value={planFrom}
                    onChange={(e) => setPlanFrom(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="text-slate-400">Sampai:</span>
                  <input
                    type="date"
                    value={planTo}
                    onChange={(e) => setPlanTo(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={planSearch}
                    onChange={(e) => setPlanSearch(e.target.value)}
                    placeholder="Cari line, style, buyer, atau jenis mesin..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  {filteredPlans.length} Plan Ditemukan
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Periode</th>
                      <th className="py-2.5 px-3">Line</th>
                      <th className="py-2.5 px-3">Buyer &amp; Style</th>
                      <th className="py-2.5 px-3">Kebutuhan Mesin (Multi-Jenis)</th>
                      <th className="py-2.5 px-3">Catatan</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {filteredPlans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Belum ada plan kebutuhan mesin pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      filteredPlans.map((p) => {
                        const items = p.items || [{ type: p.type || '', qty: p.qty || 0 }];
                        const totalUnits = items.reduce((s, it) => s + (it.qty || 0), 0);

                        return (
                          <tr key={p.id} className="hover:bg-slate-750/50 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                              <div>{p.start}</div>
                              <div className="text-[10px] text-slate-500">s/d {p.end}</div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-white">
                              {p.line}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-200">
                              {p.style || '-'}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1 max-w-lg">
                                {items.map((it, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 border border-slate-700 text-slate-200"
                                  >
                                    <span className="font-mono text-blue-400 font-bold">{it.type}</span>
                                    <span className="text-slate-400">:</span>
                                    <span className="font-mono font-bold text-white">{it.qty}</span>
                                  </span>
                                ))}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                                Total: {items.length} jenis mesin · {totalUnits} unit
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                              {p.note || '-'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleEditPlan(p)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                  title="Edit Plan"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePlan(p.id)}
                                  className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                                  title="Hapus Plan"
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
        )}

        {/* TAB 4: SUMMARY PERIODE */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Filter and Top Stats */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="text-slate-400">Dari:</span>
                    <input
                      type="date"
                      value={sumFrom}
                      onChange={(e) => setSumFrom(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="text-slate-400">Sampai:</span>
                    <input
                      type="date"
                      value={sumTo}
                      onChange={(e) => setSumTo(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleExportSummary}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export Ringkasan CSV</span>
                </button>
              </div>

              {/* 4 Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Jumlah Plan
                  </span>
                  <strong className="text-2xl font-black font-mono text-white block mt-0.5">
                    {summaryPlans.length}
                  </strong>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Unit Kebutuhan
                  </span>
                  <strong className="text-2xl font-black font-mono text-white block mt-0.5">
                    {summaryByType.reduce((s, r) => s + r.need, 0)}
                  </strong>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Jenis Mesin Berbeda
                  </span>
                  <strong className="text-2xl font-black font-mono text-blue-400 block mt-0.5">
                    {summaryByType.length}
                  </strong>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Jenis Mesin Defisit (Gap)
                  </span>
                  <strong className="text-2xl font-black font-mono text-rose-400 block mt-0.5">
                    {summaryByType.filter((r) => r.gap > 0).length}
                  </strong>
                </div>
              </div>
            </div>

            {/* Summary by Type Table */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-white">Ringkasan per Jenis Mesin</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Jenis</th>
                      <th className="py-2.5 px-3">Plan Item</th>
                      <th className="py-2.5 px-3 text-right">Need (Kebutuhan)</th>
                      <th className="py-2.5 px-3 text-right">Armada Tersedia</th>
                      <th className="py-2.5 px-3 text-right">Gap (Defisit)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {summaryByType.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          Tidak ada data kebutuhan mesin dalam rentang tanggal yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      summaryByType.map((r) => (
                        <tr key={r.type} className="hover:bg-slate-750/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                            {r.type}
                          </td>
                          <td className="py-2.5 px-3 text-slate-200 font-medium">
                            {r.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {r.count} baris plan
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {r.need}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {r.available}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {r.gap > 0 ? (
                              <span className="font-bold text-rose-400">-{r.gap}</span>
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {r.gap > 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Perlu Review
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Cukup
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Plan Breakdown */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-white">Rincian Alokasi Plan</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Periode</th>
                      <th className="py-2.5 px-3">Line</th>
                      <th className="py-2.5 px-3">Buyer / Style</th>
                      <th className="py-2.5 px-3">Jenis Mesin</th>
                      <th className="py-2.5 px-3 text-right">Kuantiti</th>
                      <th className="py-2.5 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {summaryPlans.flatMap((p) => {
                      const items = p.items || [{ type: p.type || '', qty: p.qty || 0 }];
                      return items.map((it, idx) => (
                        <tr key={`${p.id}-${idx}`} className="hover:bg-slate-750/50">
                          <td className="py-2 px-3 font-mono text-slate-400">
                            {p.start} s/d {p.end}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-white">{p.line}</td>
                          <td className="py-2 px-3 text-slate-300">{p.style || '-'}</td>
                          <td className="py-2 px-3">
                            <span className="font-mono text-blue-400 font-bold">{it.type}</span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({machineTypes.find((t) => t.code === it.type)?.name || ''})
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white">
                            {it.qty} unit
                          </td>
                          <td className="py-2 px-3 text-slate-400 max-w-xs truncate">
                            {p.note || '-'}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
