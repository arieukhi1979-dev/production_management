import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { MachineType, ProductionLine } from '../../types';

export const SetupModule: React.FC = () => {
  const {
    setActiveModule,
    targetSubTab,
    setTargetSubTab,
    machineTypes,
    saveMachineType,
    deleteMachineType,
    seedDefaultTypes,
    lines,
    saveLine,
    deleteLine,
    seedDefaultLines,
    brands,
    addBrand,
    deleteBrand,
    locations,
    addLocation,
    deleteLocation,
    machines,
  } = usePortal();

  const [activeTab, setActiveTab] = useState<'jenis' | 'line' | 'brand' | 'lokasi'>('jenis');

  useEffect(() => {
    if (targetSubTab && ['jenis', 'line', 'brand', 'lokasi'].includes(targetSubTab)) {
      setActiveTab(targetSubTab as any);
      setTargetSubTab(undefined);
    }
  }, [targetSubTab, setTargetSubTab]);

  // Jenis Form State
  const [editingJenisCode, setEditingJenisCode] = useState<string | null>(null);
  const [jenisForm, setJenisForm] = useState<MachineType>({
    code: '',
    name: '',
    cat: 'Sewing',
    desc: '',
  });

  // Line Form State
  const [editingLineCode, setEditingLineCode] = useState<string | null>(null);
  const [lineForm, setLineForm] = useState<ProductionLine>({
    code: '',
    name: '',
    cap: 800,
    manpowerAvailable: 40,
    sup: '',
    loc: 'Sewing Floor 1',
    stat: 'Active',
  });

  // Brand and Location input
  const [newBrandName, setNewBrandName] = useState('');
  const [newLocName, setNewLocName] = useState('');

  // Jenis Handlers
  const handleClearJenis = () => {
    setEditingJenisCode(null);
    setJenisForm({ code: '', name: '', cat: 'Sewing', desc: '' });
  };

  const handleSaveJenis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenisForm.code.trim() || !jenisForm.name.trim()) {
      alert('Kode dan Nama Jenis Mesin wajib diisi!');
      return;
    }

    const ok = saveMachineType(
      {
        ...jenisForm,
        code: jenisForm.code.trim().toUpperCase(),
        name: jenisForm.name.trim(),
        desc: jenisForm.desc.trim(),
      },
      editingJenisCode || undefined
    );

    if (!ok) {
      alert(`Kode "${jenisForm.code}" sudah ada!`);
      return;
    }

    handleClearJenis();
  };

  const handleEditJenis = (jt: MachineType) => {
    setEditingJenisCode(jt.code);
    setJenisForm({ ...jt });
  };

  const handleDeleteJenis = (code: string) => {
    if (confirm(`Hapus jenis mesin ${code}?`)) {
      deleteMachineType(code);
      if (editingJenisCode === code) handleClearJenis();
    }
  };

  // Line Handlers
  const handleClearLine = () => {
    setEditingLineCode(null);
    setLineForm({
      code: '',
      name: '',
      cap: 800,
      manpowerAvailable: 40,
      sup: '',
      loc: locations[0] || 'Sewing Floor 1',
      stat: 'Active',
    });
  };

  const handleSaveLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineForm.code.trim() || !lineForm.name.trim()) {
      alert('Kode dan Nama Line wajib diisi!');
      return;
    }

    const ok = saveLine(
      {
        ...lineForm,
        code: lineForm.code.trim().toUpperCase(),
        name: lineForm.name.trim(),
        sup: lineForm.sup.trim(),
        cap: Number(lineForm.cap) || 0,
      },
      editingLineCode || undefined
    );

    if (!ok) {
      alert(`Kode line "${lineForm.code}" sudah ada!`);
      return;
    }

    handleClearLine();
  };

  const handleEditLine = (ln: ProductionLine) => {
    setEditingLineCode(ln.code);
    setLineForm({ ...ln });
  };

  const handleDeleteLine = (code: string) => {
    if (confirm(`Hapus line ${code}?`)) {
      deleteLine(code);
      if (editingLineCode === code) handleClearLine();
    }
  };

  // Brand Handlers
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const ok = addBrand(newBrandName.trim());
    if (!ok) alert('Brand sudah ada atau tidak valid!');
    else setNewBrandName('');
  };

  // Location Handlers
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;
    const ok = addLocation(newLocName.trim());
    if (!ok) alert('Lokasi sudah ada atau tidak valid!');
    else setNewLocName('');
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
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-mono font-bold mb-1">
                <Settings className="w-3.5 h-3.5" />
                <span>MODUL MASTER · SETUP SISTEM</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Setup Master Data
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Kelola database master Jenis Mesin, Line Produksi, Brand, dan Lokasi Lantai Pabrik.
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-slate-800 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('jenis')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'jenis'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Jenis Mesin</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80">
                {machineTypes.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('line')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'line'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Line Produksi</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80">
                {lines.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('brand')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'brand'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Brand Mesin</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80">
                {brands.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('lokasi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'lokasi'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Lokasi Pabrik</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80">
                {locations.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* TAB 1: JENIS MESIN */}
        {activeTab === 'jenis' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>{editingJenisCode ? `Edit Jenis Mesin (${editingJenisCode})` : 'Tambah Jenis Mesin Baru'}</span>
                </h3>
              </div>

              <form onSubmit={handleSaveJenis}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kode Jenis *
                    </label>
                    <input
                      type="text"
                      value={jenisForm.code}
                      onChange={(e) => setJenisForm({ ...jenisForm, code: e.target.value.toUpperCase() })}
                      placeholder="SN, DN, OB, BT, BH..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-purple-500 focus:outline-none"
                      disabled={!!editingJenisCode}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nama Lengkap Jenis *
                    </label>
                    <input
                      type="text"
                      value={jenisForm.name}
                      onChange={(e) => setJenisForm({ ...jenisForm, name: e.target.value })}
                      placeholder="Single Needle Lockstitch..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kategori Operasi
                    </label>
                    <select
                      value={jenisForm.cat}
                      onChange={(e) => setJenisForm({ ...jenisForm, cat: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Sewing">Sewing (Penjahitan)</option>
                      <option value="Cutting">Cutting (Pemotongan)</option>
                      <option value="Finishing">Finishing (Penyelesaian/Setrika)</option>
                      <option value="Embro">Embro (Bordir)</option>
                      <option value="Other">Other (Pendukung)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Deskripsi / Keterangan
                    </label>
                    <input
                      type="text"
                      value={jenisForm.desc}
                      onChange={(e) => setJenisForm({ ...jenisForm, desc: e.target.value })}
                      placeholder="Keterangan fungsi mesin..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    {editingJenisCode ? 'Update Jenis' : 'Simpan Jenis Mesin'}
                  </button>

                  {editingJenisCode && (
                    <button
                      type="button"
                      onClick={handleClearJenis}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Batal
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={seedDefaultTypes}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors ml-auto flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Default 15 Jenis Garmen</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Jenis Table */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-white">Daftar Jenis Mesin Terdaftar</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Jenis</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Deskripsi</th>
                      <th className="py-2.5 px-3 text-center">Unit Mesin di Pabrik</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {machineTypes.map((jt) => {
                      const count = machines.filter(
                        (m) => m.type.toUpperCase() === jt.code.toUpperCase()
                      ).length;

                      return (
                        <tr key={jt.code} className="hover:bg-slate-750/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-400">
                            {jt.code}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">{jt.name}</td>
                          <td className="py-2.5 px-3 text-slate-300">{jt.cat}</td>
                          <td className="py-2.5 px-3 text-slate-400">{jt.desc || '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 font-bold text-slate-200">
                              {count} unit
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditJenis(jt)}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteJenis(jt.code)}
                                className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LINE PRODUKSI */}
        {activeTab === 'line' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{editingLineCode ? `Edit Line (${editingLineCode})` : 'Tambah Line Produksi Baru'}</span>
                </h3>
              </div>

              <form onSubmit={handleSaveLine}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kode Line *
                    </label>
                    <input
                      type="text"
                      value={lineForm.code}
                      onChange={(e) => setLineForm({ ...lineForm, code: e.target.value.toUpperCase() })}
                      placeholder="L01, L02, L03..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-purple-500 focus:outline-none"
                      disabled={!!editingLineCode}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nama Line *
                    </label>
                    <input
                      type="text"
                      value={lineForm.name}
                      onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })}
                      placeholder="Line 01 - Kemeja Casual..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kapasitas Target (Pcs/Hari)
                    </label>
                    <input
                      type="number"
                      value={lineForm.cap}
                      onChange={(e) => setLineForm({ ...lineForm, cap: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Manpower Tersedia per Shift (orang)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lineForm.manpowerAvailable ?? 40}
                      onChange={(e) => setLineForm({ ...lineForm, manpowerAvailable: Math.max(0, Number(e.target.value)) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Dipakai sebagai pembanding % pemakaian manpower di Production Report.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Supervisor Line
                    </label>
                    <input
                      type="text"
                      value={lineForm.sup}
                      onChange={(e) => setLineForm({ ...lineForm, sup: e.target.value })}
                      placeholder="Nama Supervisor..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Lokasi Lantai
                    </label>
                    <select
                      value={lineForm.loc}
                      onChange={(e) => setLineForm({ ...lineForm, loc: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Status Operasional
                    </label>
                    <select
                      value={lineForm.stat}
                      onChange={(e) => setLineForm({ ...lineForm, stat: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Active">Active (Beroperasi)</option>
                      <option value="Inactive">Inactive (Libur/Tutup)</option>
                      <option value="Maintenance">Maintenance (Penataan Line)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    {editingLineCode ? 'Update Line' : 'Simpan Line Produksi'}
                  </button>

                  {editingLineCode && (
                    <button
                      type="button"
                      onClick={handleClearLine}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Batal
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={seedDefaultLines}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors ml-auto flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Default Line L01 - L10</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Line Table */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-white">Daftar Line Produksi</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Line</th>
                      <th className="py-2.5 px-3 text-right">Kapasitas (pcs/hari)</th>
                      <th className="py-2.5 px-3">Supervisor</th>
                      <th className="py-2.5 px-3">Lokasi Lantai</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {lines.map((l) => (
                      <tr key={l.code} className="hover:bg-slate-750/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-400">
                          {l.code}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">{l.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                          {l.cap.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{l.sup || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-400">{l.loc || '-'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              l.stat === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {l.stat}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditLine(l)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLine(l.code)}
                              className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BRAND */}
        {activeTab === 'brand' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm max-w-xl">
              <h3 className="text-base font-bold text-white mb-3">Tambah Brand Mesin</h3>
              <form onSubmit={handleAddBrand} className="flex gap-2">
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Nama Brand Mesin (Contoh: Juki, Brother...)"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Tambah Brand
                </button>
              </form>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-3 max-w-2xl">
              <h3 className="text-base font-bold text-white">Daftar Brand Mesin</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Nama Brand</th>
                      <th className="py-2.5 px-3 text-center">Jumlah Mesin di Pabrik</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {brands.map((b) => {
                      const count = machines.filter(
                        (m) => m.brand.toLowerCase() === b.toLowerCase()
                      ).length;
                      return (
                        <tr key={b} className="hover:bg-slate-750/50">
                          <td className="py-2.5 px-3 font-semibold text-white">{b}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                              {count} unit
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Hapus brand ${b}?`)) deleteBrand(b);
                              }}
                              className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LOKASI */}
        {activeTab === 'lokasi' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm max-w-xl">
              <h3 className="text-base font-bold text-white mb-3">Tambah Lokasi Lantai Pabrik</h3>
              <form onSubmit={handleAddLocation} className="flex gap-2">
                <input
                  type="text"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="Nama Lokasi (Contoh: Sewing Floor 1, Gudang Mesin...)"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Tambah Lokasi
                </button>
              </form>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-3 max-w-2xl">
              <h3 className="text-base font-bold text-white">Daftar Lokasi Lantai Pabrik</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Nama Lokasi</th>
                      <th className="py-2.5 px-3 text-center">Unit Mesin Berada di Sini</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {locations.map((loc) => {
                      const count = machines.filter((m) => m.location === loc).length;
                      return (
                        <tr key={loc} className="hover:bg-slate-750/50">
                          <td className="py-2.5 px-3 font-semibold text-white">{loc}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                              {count} unit
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Hapus lokasi ${loc}?`)) deleteLocation(loc);
                              }}
                              className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
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
