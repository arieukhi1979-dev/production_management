import React, { useState } from 'react';
import {
  ArrowLeft,
  Package,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Split,
  Palette,
  Trash2,
  Edit2,
  Layers,
  FileDown,
  AlertCircle,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { MasterOrder, OrderColorBreakdown, OrderLineAllocation } from '../../types';
import { downloadCSV } from '../../utils/csv';

export const MasterOrderModule: React.FC = () => {
  const { setActiveModule, orders, saveOrder, deleteOrder, lines, setTargetSubTab } = usePortal();
  const [search, setSearch] = useState('');
  const [filterBuyer, setFilterBuyer] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    orderNo: '',
    buyer: '',
    style: '',
    description: '',
    quantity: 15000,
    startDate: new Date().toISOString().split('T')[0],
    targetDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    line: 'L01',
    status: 'In Production' as MasterOrder['status'],
    unitPrice: 15.0,
  });

  // Colors breakdown list
  const [colors, setColors] = useState<OrderColorBreakdown[]>([
    { color: 'Bright White', qty: 6000 },
    { color: 'Navy Blue', qty: 5000 },
    { color: 'Pure Black', qty: 4000 },
  ]);

  // Multi-line split allocation
  const [isSplitLine, setIsSplitLine] = useState(true);
  const [lineAllocations, setLineAllocations] = useState<OrderLineAllocation[]>([
    { lineCode: 'L01', qty: 8500, dailyTarget: 500 },
    { lineCode: 'L02', qty: 6500, dailyTarget: 400 },
  ]);

  // Calculation helpers
  const totalColorQty = colors.reduce((s, c) => s + (Number(c.qty) || 0), 0);
  const totalLineAllocQty = lineAllocations.reduce((s, l) => s + (Number(l.qty) || 0), 0);

  // Sync color sum to total order qty
  const handleSyncFromColors = () => {
    setFormData((prev) => ({ ...prev, quantity: totalColorQty }));
  };

  // Evenly distribute order quantity across assigned lines
  const handleEvenlyDistributeLines = () => {
    if (lineAllocations.length === 0) return;
    const each = Math.floor(formData.quantity / lineAllocations.length);
    const remainder = formData.quantity - each * lineAllocations.length;

    setLineAllocations(
      lineAllocations.map((la, idx) => ({
        ...la,
        qty: idx === 0 ? each + remainder : each,
      }))
    );
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingOrderId(null);
    setFormData({
      orderNo: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      buyer: '',
      style: '',
      description: '',
      quantity: 15000,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      line: 'L01',
      status: 'Planned',
      unitPrice: 15.0,
    });
    setColors([
      { color: 'White', qty: 7500 },
      { color: 'Navy', qty: 7500 },
    ]);
    setIsSplitLine(true);
    setLineAllocations([
      { lineCode: 'L01', qty: 8000, dailyTarget: 500 },
      { lineCode: 'L02', qty: 7000, dailyTarget: 450 },
    ]);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (o: MasterOrder) => {
    setEditingOrderId(o.id);
    setFormData({
      orderNo: o.orderNo,
      buyer: o.buyer,
      style: o.style,
      description: o.description,
      quantity: o.quantity,
      startDate: o.startDate,
      targetDate: o.targetDate,
      line: o.line,
      status: o.status,
      unitPrice: o.unitPrice || 15.0,
    });

    if (o.colors && o.colors.length > 0) {
      setColors(o.colors);
    } else {
      setColors([{ color: 'Standard Color', qty: o.quantity }]);
    }

    if (o.lineAllocations && o.lineAllocations.length > 0) {
      setIsSplitLine(true);
      setLineAllocations(o.lineAllocations);
    } else if (o.linesAssigned && o.linesAssigned.length > 0) {
      setIsSplitLine(true);
      const splitQty = Math.floor(o.quantity / o.linesAssigned.length);
      setLineAllocations(
        o.linesAssigned.map((lc) => ({ lineCode: lc, qty: splitQty, dailyTarget: 450 }))
      );
    } else {
      setIsSplitLine(false);
      setLineAllocations([{ lineCode: o.line || 'L01', qty: o.quantity, dailyTarget: 500 }]);
    }

    setIsModalOpen(true);
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNo.trim() || !formData.buyer.trim() || !formData.style.trim()) {
      alert('Nomor Order PO, Buyer, dan Style wajib diisi!');
      return;
    }

    // Filter valid colors
    const validColors = colors.filter((c) => c.color.trim() && c.qty > 0);

    // Filter valid line allocations
    let validLines = isSplitLine
      ? lineAllocations.filter((l) => l.lineCode && l.qty > 0)
      : [{ lineCode: formData.line, qty: formData.quantity, dailyTarget: 500 }];

    if (validLines.length === 0) {
      validLines = [{ lineCode: formData.line || 'L01', qty: formData.quantity, dailyTarget: 500 }];
    }

    const assignedLinesStr = validLines.map((l) => l.lineCode).join(', ');

    const newOrder: MasterOrder = {
      id: editingOrderId || `ord-${Date.now()}`,
      orderNo: formData.orderNo.trim(),
      buyer: formData.buyer.trim(),
      style: formData.style.trim(),
      description: formData.description.trim(),
      quantity: Number(formData.quantity) || totalColorQty || 1000,
      startDate: formData.startDate,
      targetDate: formData.targetDate,
      line: assignedLinesStr,
      linesAssigned: validLines.map((l) => l.lineCode),
      lineAllocations: validLines,
      colors: validColors.length > 0 ? validColors : undefined,
      status: formData.status,
      unitPrice: Number(formData.unitPrice) || 0,
    };

    saveOrder(newOrder);
    setIsModalOpen(false);
    alert(
      editingOrderId
        ? `Order ${newOrder.orderNo} berhasil diperbarui!`
        : `Order ${newOrder.orderNo} berhasil ditambahkan!`
    );
  };

  const handleDelete = (id: string, orderNo: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus order ${orderNo}?`)) {
      deleteOrder(id);
    }
  };

  const handleLinkToMachinePlan = (o: MasterOrder) => {
    setTargetSubTab('plan');
    setActiveModule('machine-plan');
  };

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [];
    orders.forEach((o) => {
      const colorsStr = (o.colors || []).map((c) => `${c.color}: ${c.qty}`).join(' | ');
      const linesStr = (o.lineAllocations || []).map((l) => `${l.lineCode} (${l.qty})`).join(' | ');
      rows.push([
        o.orderNo,
        o.buyer,
        o.style,
        o.quantity,
        colorsStr || '-',
        linesStr || o.line,
        o.startDate,
        o.targetDate,
        o.status,
      ]);
    });

    downloadCSV('master_orders.csv', [
      ['Nomor PO', 'Buyer', 'Style', 'Total Qty', 'Detail Warna', 'Line Alokasi', 'Mulai', 'Target Selesai', 'Status'],
      ...rows,
    ]);
  };

  // Filtered orders
  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    if (filterBuyer && o.buyer !== filterBuyer) return false;
    return (
      o.orderNo.toLowerCase().includes(q) ||
      o.buyer.toLowerCase().includes(q) ||
      o.style.toLowerCase().includes(q) ||
      o.line.toLowerCase().includes(q)
    );
  });

  const buyersList = Array.from(new Set(orders.map((o) => o.buyer)));

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
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono font-bold mb-1">
                <Package className="w-3.5 h-3.5" />
                <span>MODUL KOMERSIAL · MASTER ORDER</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Master Order &amp; Buyer PO
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Kelola data pesanan Buyer, rincian warna (color breakdown), dan alokasi split line produksi untuk order berkuantiti besar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModule('prod-plan')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Buka Production Plan →</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ Input Order Baru</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor PO, buyer (Uniqlo, Nike), style, warna, line..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterBuyer}
              onChange={(e) => setFilterBuyer(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="">Semua Buyer</option>
              {buyersList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <div className="text-xs text-slate-400 font-mono pl-2 border-l border-slate-700">
              Total {filtered.length} Pesanan Aktif
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-2.5 px-3">Nomor PO</th>
                  <th className="py-2.5 px-3">Buyer &amp; Style</th>
                  <th className="py-2.5 px-3 text-right">Total Kuantiti</th>
                  <th className="py-2.5 px-3">Rincian Warna &amp; Qty</th>
                  <th className="py-2.5 px-3">Alokasi Line Produksi</th>
                  <th className="py-2.5 px-3">Periode Delivery</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filtered.map((o) => {
                  const hasMultipleLines = (o.lineAllocations && o.lineAllocations.length > 1) || (o.linesAssigned && o.linesAssigned.length > 1);

                  return (
                    <tr key={o.id} className="hover:bg-slate-750/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                        {o.orderNo}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{o.buyer}</div>
                        <div className="font-semibold text-slate-200 mt-0.5">{o.style}</div>
                        {o.description && (
                          <div className="text-[11px] text-slate-400 italic line-clamp-1">
                            {o.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-black text-white text-sm">
                        {o.quantity.toLocaleString('id-ID')}
                        <span className="text-[10px] text-slate-400 font-normal block">pcs</span>
                      </td>

                      {/* Detail Warna */}
                      <td className="py-3 px-3 max-w-xs">
                        {o.colors && o.colors.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {o.colors.map((c, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px]"
                              >
                                <span className="font-medium text-slate-200">{c.color}</span>
                                <span className="text-slate-500">:</span>
                                <span className="font-mono font-bold text-amber-300">
                                  {c.qty.toLocaleString('id-ID')}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Standar / Belum dirinci</span>
                        )}
                      </td>

                      {/* Line Alokasi (Multi-Line Split Support with Line-Specific Dates) */}
                      <td className="py-3 px-3">
                        {o.lineAllocations && o.lineAllocations.length > 0 ? (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1.5">
                              {o.lineAllocations.map((la, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex flex-col px-2 py-1 rounded-md bg-indigo-950/70 border border-indigo-700/50 text-[11px]"
                                >
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <span className="font-bold text-indigo-300">
                                      {la.lineCode}
                                    </span>
                                    <span className="text-slate-400">·</span>
                                    <span className="font-semibold text-slate-200">
                                      {la.qty.toLocaleString('id-ID')} pcs
                                    </span>
                                  </div>
                                  {la.startDate && (
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      📅 {la.startDate.slice(5)} s/d {la.targetDate?.slice(5)}
                                    </div>
                                  )}
                                </span>
                              ))}
                            </div>
                            {hasMultipleLines && (
                              <div className="text-[10px] text-indigo-300 font-medium flex items-center gap-1">
                                <Split className="w-3 h-3" />
                                <span>Split jalan di {o.lineAllocations.length} line (tanggal per line)</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-indigo-400">{o.line}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                        <div>{o.startDate}</div>
                        <div className="text-[10px] text-slate-500">s/d {o.targetDate}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {o.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleLinkToMachinePlan(o)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white text-[11px] font-semibold transition-colors"
                            title="Alokasikan Kebutuhan Mesin untuk Order Ini"
                          >
                            <span>Mesin</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(o)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Edit Order"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(o.id, o.orderNo)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                            title="Hapus Order"
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

      {/* Input / Edit Order Modal with Color Breakdown & Multi-Line Split */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingOrderId ? `Edit Order PO — ${formData.orderNo}` : 'Input Master Order Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
              {/* Row 1: PO No & Buyer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nomor PO Order *
                  </label>
                  <input
                    type="text"
                    value={formData.orderNo}
                    onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                    placeholder="PO-2026-..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Buyer Global *
                  </label>
                  <input
                    type="text"
                    value={formData.buyer}
                    onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                    placeholder="Contoh: UNIQLO, NIKE, LEVI'S, H&M..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Style & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Style Garment *
                  </label>
                  <input
                    type="text"
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    placeholder="UQ-492 Men Oxford Long Sleeve Shirt..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Deskripsi Produk / Kain
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Cotton Oxford 100%, button-down collar..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Total Quantity & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Kuantiti (Pcs) *
                    </label>
                    {totalColorQty > 0 && totalColorQty !== formData.quantity && (
                      <button
                        type="button"
                        onClick={handleSyncFromColors}
                        className="text-[9px] text-amber-400 hover:underline font-bold"
                        title="Klik untuk menyamakan dengan jumlah rincian warna"
                      >
                        = Sync ({totalColorQty.toLocaleString('id-ID')})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Mulai Jahit
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Target Ex-Factory / Selesai
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* ========================================================= */}
              {/* SECTION 1: DETAIL WARNA & KUANTITI (Color Breakdown) */}
              {/* ========================================================= */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-pink-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Rincian Warna &amp; Kuantiti (Color Breakdown)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Tambahkan warna style dan kuantiti per masing-masing warna.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setColors([...colors, { color: '', qty: 1000 }])}
                    className="px-2.5 py-1 rounded-lg bg-pink-600/30 hover:bg-pink-600 text-pink-200 hover:text-white border border-pink-500/40 text-[11px] font-bold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Tambah Warna</span>
                  </button>
                </div>

                <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {colors.map((c, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-900/90 p-2 rounded-lg border border-slate-800"
                    >
                      <div className="col-span-6 sm:col-span-7">
                        <input
                          type="text"
                          value={c.color}
                          onChange={(e) => {
                            const copy = [...colors];
                            copy[idx].color = e.target.value;
                            setColors(copy);
                          }}
                          placeholder="Nama Warna (Contoh: White, Navy, Black...)"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                          required
                        />
                      </div>
                      <div className="col-span-5 sm:col-span-4 flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          value={c.qty}
                          onChange={(e) => {
                            const copy = [...colors];
                            copy[idx].qty = Number(e.target.value) || 0;
                            setColors(copy);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center text-xs focus:outline-none"
                          required
                        />
                        <span className="text-[10px] text-slate-400">pcs</span>
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (colors.length === 1) return alert('Minimal 1 warna!');
                            setColors(colors.filter((_, i) => i !== idx));
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400"
                          title="Hapus Warna"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800">
                  <span>
                    Total Warna:{' '}
                    <strong className="text-white font-mono">
                      {totalColorQty.toLocaleString('id-ID')} pcs
                    </strong>{' '}
                    ({colors.length} varian)
                  </span>
                  {totalColorQty !== formData.quantity && (
                    <button
                      type="button"
                      onClick={handleSyncFromColors}
                      className="text-amber-400 hover:underline font-semibold"
                    >
                      Samakan Total PO dengan Warna
                    </button>
                  )}
                </div>
              </div>

              {/* ========================================================= */}
              {/* SECTION 2: MULTI-LINE SPLIT ALLOCATION */}
              {/* ========================================================= */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Split className="w-4 h-4 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Alokasi Line Produksi (Split Multi-Line)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Untuk order berkuantiti besar, pecah pengerjaan ke 2 line atau lebih.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSplitLine}
                        onChange={(e) => {
                          setIsSplitLine(e.target.checked);
                          if (e.target.checked && lineAllocations.length === 0) {
                            setLineAllocations([
                              { lineCode: 'L01', qty: Math.ceil(formData.quantity / 2), dailyTarget: 500 },
                              { lineCode: 'L02', qty: Math.floor(formData.quantity / 2), dailyTarget: 500 },
                            ]);
                          }
                        }}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Pecah Multi-Line</span>
                    </label>

                    {isSplitLine && (
                      <button
                        type="button"
                        onClick={handleEvenlyDistributeLines}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-indigo-300 font-semibold border border-slate-700"
                        title="Bagi rata kuantiti ke semua line yang dipilih"
                      >
                        Bagi Rata
                      </button>
                    )}
                  </div>
                </div>

                {isSplitLine ? (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span className="col-span-3">Line</span>
                      <span className="col-span-3">Kuantiti (Pcs)</span>
                      <span className="col-span-3">Tgl Mulai Line</span>
                      <span className="col-span-2">Tgl Selesai</span>
                      <span className="col-span-1 text-right">Aksi</span>
                    </div>

                    {lineAllocations.map((la, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-slate-900/90 p-2 rounded-lg border border-slate-800"
                      >
                        <div className="col-span-3">
                          <select
                            value={la.lineCode}
                            onChange={(e) => {
                              const copy = [...lineAllocations];
                              copy[idx].lineCode = e.target.value;
                              setLineAllocations(copy);
                            }}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none"
                            required
                          >
                            <option value="">Pilih Line</option>
                            {lines.map((l) => (
                              <option key={l.code} value={l.code}>
                                {l.code} - {l.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-3 flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={la.qty}
                            onChange={(e) => {
                              const copy = [...lineAllocations];
                              copy[idx].qty = Number(e.target.value) || 0;
                              setLineAllocations(copy);
                            }}
                            placeholder="Kuantiti"
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center text-xs focus:outline-none"
                            required
                          />
                          <span className="text-[10px] text-slate-400">pcs</span>
                        </div>

                        <div className="col-span-3">
                          <input
                            type="date"
                            value={la.startDate || formData.startDate}
                            onChange={(e) => {
                              const copy = [...lineAllocations];
                              copy[idx].startDate = e.target.value;
                              setLineAllocations(copy);
                            }}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-[11px] focus:outline-none"
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="date"
                            value={la.targetDate || formData.targetDate}
                            onChange={(e) => {
                              const copy = [...lineAllocations];
                              copy[idx].targetDate = e.target.value;
                              setLineAllocations(copy);
                            }}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-[11px] focus:outline-none"
                            required
                          />
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (lineAllocations.length === 1) return alert('Minimal 1 line!');
                              setLineAllocations(lineAllocations.filter((_, i) => i !== idx));
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400"
                            title="Hapus Line"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setLineAllocations([
                            ...lineAllocations,
                            {
                              lineCode: `L0${Math.min(10, lineAllocations.length + 1)}`,
                              qty: 5000,
                              startDate: formData.startDate,
                              targetDate: formData.targetDate,
                              dailyTarget: 500,
                            },
                          ])
                        }
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Tambah Line Split</span>
                      </button>

                      <div className="text-[11px] font-mono">
                        <span className="text-slate-400">Total Dialokasikan: </span>
                        <strong
                          className={
                            totalLineAllocQty === formData.quantity
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }
                        >
                          {totalLineAllocQty.toLocaleString('id-ID')} / {formData.quantity.toLocaleString('id-ID')} pcs
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Pilih Line Produksi Tunggal
                    </label>
                    <select
                      value={formData.line}
                      onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none"
                    >
                      {lines.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.code} - {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Status Order
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    <option value="Planned">Planned (Terencana)</option>
                    <option value="In Production">In Production (Sedang Jahit)</option>
                    <option value="Quality Check">Quality Check (Pemeriksaan)</option>
                    <option value="Completed">Completed (Selesai)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    FOB Unit Price ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
                >
                  {editingOrderId ? 'Update Master Order' : 'Simpan Master Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
