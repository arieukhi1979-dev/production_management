import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Cpu,
  ArrowRight,
  TrendingUp,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Search,
  Maximize2,
  RotateCw,
  Plus,
  Info,
  Calendar,
  X,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { MasterOrder, OrderLineAllocation } from '../../types';

interface GanttBlock {
  id: string;
  orderId: string;
  orderNo: string;
  buyer: string;
  style: string;
  category: string;
  lineCode: string; // e.g. 'LINE-01'
  rawLineCode: string; // e.g. 'L01'
  startDay: number; // 1 - 25
  endDay: number; // 1 - 25
  orderQty: number;
  plannedQty: number;
  remainingProduction: number;
  sam: number;
  manpower: number;
  plannedEfficiency: number;
  plannedDates: string;
  leadDays?: number;
  gapAfterDays?: number;
}

// Line code normalizer helpers
const toLineKey = (code: string): string => {
  const match = code.match(/\d+/);
  if (match) {
    const num = match[0].padStart(2, '0');
    return `LINE-${num}`;
  }
  return code.toUpperCase();
};

const toStorageLine = (code: string): string => {
  const match = code.match(/\d+/);
  if (match) {
    const num = match[0].padStart(2, '0');
    return `L${num}`;
  }
  return code.toUpperCase();
};

const detectCategory = (style: string = '', buyer: string = ''): string => {
  const text = `${style} ${buyer}`.toLowerCase();
  if (text.includes('pant') || text.includes('chino') || text.includes('jeans') || text.includes('denim')) {
    return 'Pant';
  }
  if (text.includes('blouse') || text.includes('ladies')) {
    return 'Blouse';
  }
  if (text.includes('polo') || text.includes('hoodie') || text.includes('sport')) {
    return 'Sportswear';
  }
  return 'Shirt';
};

const parseDay = (dateStr?: string, defaultDay: number = 1): number => {
  if (!dateStr) return defaultDay;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      return Math.min(25, day);
    }
  }
  return defaultDay;
};

const formatDateIndo = (dateStr?: string): string => {
  if (!dateStr) return '01-10-2026';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export const ProductionPlanModule: React.FC = () => {
  const { setActiveModule, setTargetSubTab, lines, orders, saveOrder } = usePortal();

  // Navigation controls
  const [navigateBy, setNavigateBy] = useState('Bimonthly');
  const [selectedMonth, setSelectedMonth] = useState('Oct 2026 - Nov 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('Anggun - Anggun');

  // Tooltip / Modal state for Order Details
  const [selectedBlock, setSelectedBlock] = useState<GanttBlock | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<GanttBlock | null>(null);
  const [isAssignLoadOpen, setIsAssignLoadOpen] = useState(false);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Assign Load Form State
  const [assignOrderId, setAssignOrderId] = useState<string>(orders[0]?.id || '');
  const [assignLineCode, setAssignLineCode] = useState<string>(lines[0]?.code || 'L01');
  const [assignQty, setAssignQty] = useState<number>(5000);
  const [assignStartDate, setAssignStartDate] = useState<string>('2026-10-01');
  const [assignTargetDate, setAssignTargetDate] = useState<string>('2026-10-15');

  // Month days setup: October 2026
  // 1 Oct 2026 was Thursday (TH)
  const dayNames = ['TH', 'FR', 'SA', 'SU', 'MO', 'TU', 'WE'];
  const daysInMonth = Array.from({ length: 25 }, (_, i) => {
    const dayNum = i + 1;
    const dayName = dayNames[i % 7];
    return { dayNum, dayName };
  });

  // Dynamic Line List derived from lines in PortalContext
  const lineList = useMemo(() => {
    if (!lines || lines.length === 0) {
      return [
        { code: 'LINE-01', rawCode: 'L01', type: 'SHIRT LINE', stat: 'Active', cap: 32000 },
        { code: 'LINE-02', rawCode: 'L02', type: 'SHIRT LINE', stat: 'Active', cap: 28000 },
        { code: 'LINE-03', rawCode: 'L03', type: 'SHIRT LINE', stat: 'Active', cap: 35000 },
        { code: 'LINE-04', rawCode: 'L04', type: 'SHIRT LINE', stat: 'Active', cap: 30000 },
        { code: 'LINE-05', rawCode: 'L05', type: 'PANT LINE', stat: 'Active', cap: 26000 },
        { code: 'LINE-06', rawCode: 'L06', type: 'PANT LINE', stat: 'Active', cap: 27000 },
      ];
    }

    return lines.map((l) => {
      const type =
        l.name.toLowerCase().includes('pant') ||
        l.name.toLowerCase().includes('celana') ||
        l.name.toLowerCase().includes('denim')
          ? 'PANT LINE'
          : l.name.toLowerCase().includes('blouse')
          ? 'BLOUSE LINE'
          : l.name.toLowerCase().includes('sport') || l.name.toLowerCase().includes('polo')
          ? 'ACTIVEWEAR LINE'
          : 'SHIRT LINE';

      return {
        code: toLineKey(l.code),
        rawCode: l.code,
        type,
        stat: l.stat || 'Active',
        cap: (l.cap || 800) * 26, // monthly capacity in pieces
      };
    });
  }, [lines]);

  // Synchronize Production Plan Gantt Schedule directly from Master Orders & allocations
  const scheduleData = useMemo(() => {
    const lineBlocksMap: Record<string, GanttBlock[]> = {};

    // Initialize container for each line in lineList
    lineList.forEach((l) => {
      lineBlocksMap[l.code] = [];
    });

    // Populate blocks from all orders
    orders.forEach((order) => {
      const category = detectCategory(order.style, order.buyer);

      // If order has explicit multi-line allocations
      if (order.lineAllocations && order.lineAllocations.length > 0) {
        order.lineAllocations.forEach((alloc, allocIdx) => {
          const lKey = toLineKey(alloc.lineCode);
          if (!lineBlocksMap[lKey]) {
            lineBlocksMap[lKey] = [];
          }

          const sDay = parseDay(alloc.startDate || order.startDate, 1);
          const eDay = Math.max(sDay, parseDay(alloc.targetDate || order.targetDate, sDay + 6));
          const plannedQty = alloc.qty || order.quantity;
          const remainingProduction = Math.round(plannedQty * 0.72);

          lineBlocksMap[lKey].push({
            id: `${order.id}-alloc-${allocIdx}`,
            orderId: order.id,
            orderNo: order.orderNo,
            buyer: order.buyer,
            style: order.style,
            category,
            lineCode: lKey,
            rawLineCode: alloc.lineCode,
            startDay: sDay,
            endDay: eDay,
            orderQty: order.quantity,
            plannedQty,
            remainingProduction,
            sam: category === 'Pant' ? 24.84 : 21.5,
            manpower: category === 'Pant' ? 53 : 48,
            plannedEfficiency: 67.22,
            plannedDates: `${formatDateIndo(alloc.startDate || order.startDate)} To ${formatDateIndo(
              alloc.targetDate || order.targetDate
            )}`,
          });
        });
      } else {
        // Fallback to order's single line or comma-separated lines
        const targetLines = order.linesAssigned?.length
          ? order.linesAssigned
          : order.line
          ? order.line.split(',').map((s) => s.trim())
          : ['L01'];

        targetLines.forEach((rawL, idx) => {
          const lKey = toLineKey(rawL);
          if (!lineBlocksMap[lKey]) {
            lineBlocksMap[lKey] = [];
          }

          const sDay = parseDay(order.startDate, 1);
          const eDay = Math.max(sDay, parseDay(order.targetDate, sDay + 8));
          const plannedQty = Math.round(order.quantity / targetLines.length);
          const remainingProduction = Math.round(plannedQty * 0.72);

          lineBlocksMap[lKey].push({
            id: `${order.id}-line-${idx}`,
            orderId: order.id,
            orderNo: order.orderNo,
            buyer: order.buyer,
            style: order.style,
            category,
            lineCode: lKey,
            rawLineCode: rawL,
            startDay: sDay,
            endDay: eDay,
            orderQty: order.quantity,
            plannedQty,
            remainingProduction,
            sam: category === 'Pant' ? 24.84 : 21.5,
            manpower: category === 'Pant' ? 53 : 48,
            plannedEfficiency: 67.22,
            plannedDates: `${formatDateIndo(order.startDate)} To ${formatDateIndo(order.targetDate)}`,
          });
        });
      }
    });

    // Process each line's blocks: Sort, compute leadDays, and calculate gaps
    Object.keys(lineBlocksMap).forEach((lineKey) => {
      const blocks = lineBlocksMap[lineKey];
      blocks.sort((a, b) => a.startDay - b.startDay);

      // Calculate leadDays for the first block if it starts after day 1
      if (blocks.length > 0 && blocks[0].startDay > 1) {
        blocks[0].leadDays = -(blocks[0].startDay - 1);
      }

      // Calculate changeover/gap buffer between consecutive blocks
      for (let i = 0; i < blocks.length - 1; i++) {
        const current = blocks[i];
        const next = blocks[i + 1];
        const gap = next.startDay - current.endDay;
        if (gap > 0) {
          current.gapAfterDays = gap;
        }
      }
    });

    return lineBlocksMap;
  }, [orders, lineList]);

  // Total Capacity Calculation
  const { totalPlannedPieces, totalFactoryCapacity } = useMemo(() => {
    let planned = 0;
    orders.forEach((o) => {
      if (o.lineAllocations && o.lineAllocations.length > 0) {
        planned += o.lineAllocations.reduce((acc, a) => acc + (a.qty || 0), 0);
      } else {
        planned += o.quantity || 0;
      }
    });

    const factoryCap = lineList.reduce((acc, l) => acc + l.cap, 0);

    return {
      totalPlannedPieces: planned,
      totalFactoryCapacity: factoryCap,
    };
  }, [orders, lineList]);

  // Handle Assign Load to Order
  const handleSaveAssignLoad = () => {
    if (!assignOrderId) return;
    const orderToUpdate = orders.find((o) => o.id === assignOrderId);
    if (!orderToUpdate) return;

    const existingAllocations = [...(orderToUpdate.lineAllocations || [])];
    const targetIdx = existingAllocations.findIndex(
      (a) => toStorageLine(a.lineCode) === toStorageLine(assignLineCode)
    );

    const newAlloc: OrderLineAllocation = {
      lineCode: toStorageLine(assignLineCode),
      qty: assignQty,
      startDate: assignStartDate,
      targetDate: assignTargetDate,
      dailyTarget: Math.round(assignQty / 12),
    };

    if (targetIdx >= 0) {
      existingAllocations[targetIdx] = newAlloc;
    } else {
      existingAllocations.push(newAlloc);
    }

    const assignedLines = Array.from(new Set(existingAllocations.map((a) => a.lineCode)));

    const updatedOrder: MasterOrder = {
      ...orderToUpdate,
      linesAssigned: assignedLines,
      line: assignedLines.join(', '),
      lineAllocations: existingAllocations,
    };

    saveOrder(updatedOrder);

    setIsAssignLoadOpen(false);
    setSuccessToast(
      `Order ${orderToUpdate.orderNo} berhasil dimuatkan ke ${toLineKey(assignLineCode)}!`
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Sync selected order in Assign Load modal to auto-populate defaults
  const handleSelectOrderForAssign = (orderId: string) => {
    setAssignOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      setAssignQty(ord.quantity);
      if (ord.startDate) setAssignStartDate(ord.startDate);
      if (ord.targetDate) setAssignTargetDate(ord.targetDate);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16 font-sans">
      {/* Top Application Header matching exact Planning UI */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-[1700px] mx-auto">
          {/* Breadcrumb / Back to Portal */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setActiveModule('landing')}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal Dashboard</span>
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveModule('master-order')}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Master Order</span>
              </button>

              <button
                onClick={() => {
                  setTargetSubTab('plan');
                  setActiveModule('machine-plan');
                }}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Link with Machine Plan (15 Jenis)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Planning</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Diagram batang Gantt tersinkronisasi langsung dengan Master Order & Alokasi Multi-Line
              </p>
            </div>

            {successToast && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successToast}</span>
              </div>
            )}
          </div>

          {/* Controls Bar from screenshot */}
          <div className="flex flex-wrap items-end justify-between gap-4 mt-3">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Navigate By */}
              <div>
                <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                  Navigate By
                </label>
                <select
                  value={navigateBy}
                  onChange={(e) => setNavigateBy(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  <option value="Bimonthly">Bimonthly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>

              {/* Select Months with arrows */}
              <div>
                <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                  Select Months
                </label>
                <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedMonth('Sep 2026 - Oct 2026')}
                    className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="px-4 py-1.5 text-xs font-bold text-slate-800 min-w-[150px] text-center font-mono">
                    {selectedMonth}
                  </div>
                  <button
                    onClick={() => setSelectedMonth('Nov 2026 - Dec 2026')}
                    className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div>
                <label className="block text-[11px] opacity-0 mb-1">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search order, style, buyer..."
                    className="w-64 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Blue Action Buttons from screenshot */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAssignLoadOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Assign Load
              </button>
              <button
                onClick={() => setIsCapacityModalOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Capacity
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Gantt Planning Canvas matching the screenshot */}
      <div className="max-w-[1700px] mx-auto px-6 mt-4">
        <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1400px]">
              {/* Header Row */}
              <div className="flex border-b border-slate-300 bg-slate-50 text-xs">
                {/* Left Sidebar Header */}
                <div className="w-64 p-3 border-r border-slate-300 bg-slate-100 flex flex-col justify-between shrink-0">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                      Lines
                    </span>
                    <button
                      onClick={() => setIsCapacityModalOpen(true)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Lihat Rincian Kapasitas"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Capacity:{' '}
                    <span className="font-semibold text-slate-700">
                      {totalPlannedPieces.toLocaleString('id-ID')} /{' '}
                      {totalFactoryCapacity.toLocaleString('id-ID')}
                    </span>{' '}
                    pieces
                  </div>

                  {/* Dropdown in header */}
                  <div className="mt-1.5">
                    <select
                      value={unitFilter}
                      onChange={(e) => setUnitFilter(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                    >
                      <option value="Anggun - Anggun">Anggun - Anggun</option>
                      <option value="Plant 01 - Main">Plant 01 - Main Sewing</option>
                      <option value="Plant 02 - Export">Plant 02 - Export Unit</option>
                    </select>
                  </div>
                </div>

                {/* Right Calendar Timeline Header */}
                <div className="flex-1">
                  {/* Month Banner */}
                  <div className="px-4 py-1.5 text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-300 bg-white">
                    OCTOBER 2026
                  </div>

                  {/* Day of Week + Day Number */}
                  <div className="grid grid-cols-[repeat(25,minmax(0,1fr))] border-b border-slate-200 divide-x divide-slate-200 text-center text-[10px] font-mono">
                    {daysInMonth.map(({ dayNum, dayName }) => {
                      const isSunday = dayName === 'SU';
                      return (
                        <div
                          key={dayNum}
                          className={`py-1 ${
                            isSunday ? 'bg-rose-50/70 text-rose-700 font-bold' : 'text-slate-600'
                          }`}
                        >
                          <div className="font-bold text-[9px]">{dayName}</div>
                          <div className="text-xs font-bold text-slate-900">{dayNum}</div>
                          <div className="text-[8px] text-slate-400">↔</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rows for each Line */}
              <div className="divide-y divide-slate-200">
                {lineList.map((line) => {
                  const blocks = scheduleData[line.code] || [];

                  return (
                    <div
                      key={line.code}
                      className="flex min-h-[82px] hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Left Line Label Box */}
                      <div className="w-64 p-3 border-r border-slate-300 bg-white flex flex-col justify-between shrink-0 relative">
                        {/* Green accent indicator on left */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-600" />

                        <div className="pl-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-slate-900 font-mono tracking-tight">
                              {line.code}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <button
                                onClick={() => {
                                  setAssignLineCode(line.rawCode);
                                  setIsAssignLoadOpen(true);
                                }}
                                className="hover:text-emerald-700 p-0.5 cursor-pointer"
                                title="Muatkan order ke line ini"
                              >
                                <RotateCw className="w-3 h-3 text-emerald-600" />
                              </button>
                              <button
                                onClick={() => {
                                  setAssignLineCode(line.rawCode);
                                  setIsAssignLoadOpen(true);
                                }}
                                className="hover:text-slate-700 p-0.5 cursor-pointer"
                                title="Pengaturan alokasi line"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                            {line.type}
                          </div>
                        </div>

                        <div className="pl-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1">
                          <span className="font-mono">
                            {blocks.reduce((acc, b) => acc + b.plannedQty, 0).toLocaleString('id-ID')} pcs
                          </span>
                          <Maximize2
                            onClick={() => setIsCapacityModalOpen(true)}
                            className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-700"
                          />
                        </div>
                      </div>

                      {/* Right Timeline Canvas with Order Bars */}
                      <div className="flex-1 relative bg-white flex items-center p-2 overflow-hidden">
                        {/* Background column guides */}
                        <div className="absolute inset-0 grid grid-cols-[repeat(25,minmax(0,1fr))] divide-x divide-slate-100 pointer-events-none opacity-80" />

                        {/* Order Bar Blocks */}
                        <div className="relative w-full h-14 flex items-center gap-1.5">
                          {blocks.length === 0 ? (
                            <div className="text-[11px] text-slate-300 italic pl-2 select-none">
                              Belum ada alokasi order pada line ini. Klik 'Assign Load' untuk menambahkan.
                            </div>
                          ) : (
                            blocks.map((b) => {
                              // Calculate column span percentages
                              const totalDays = 25;
                              const widthPct = ((b.endDay - b.startDay + 1) / totalDays) * 100;

                              const isMatch =
                                !searchQuery ||
                                b.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                b.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                b.buyer.toLowerCase().includes(searchQuery.toLowerCase());

                              return (
                                <React.Fragment key={b.id}>
                                  {/* Lead indicator badge on left if exists */}
                                  {b.leadDays !== undefined && (
                                    <div
                                      className="px-2 py-1.5 rounded-lg bg-blue-100 border border-blue-300 text-blue-700 text-xs font-black font-mono shadow-2xs shrink-0 cursor-pointer"
                                      title={`Lead Days: ${b.leadDays}`}
                                    >
                                      {b.leadDays}
                                    </div>
                                  )}

                                  {/* Main Order Schedule Bar */}
                                  <div
                                    onClick={() => setSelectedBlock(b)}
                                    onMouseEnter={() => setHoveredBlock(b)}
                                    onMouseLeave={() => setHoveredBlock(null)}
                                    style={{
                                      width: `${Math.max(16, widthPct)}%`,
                                      opacity: isMatch ? 1 : 0.35,
                                    }}
                                    className={`group relative h-12 rounded-lg border shadow-2xs p-2 flex flex-col justify-between cursor-pointer transition-all shrink-0 hover:z-20 hover:scale-[1.01] ${
                                      isMatch
                                        ? 'bg-sky-100/95 hover:bg-sky-200/95 border-sky-300'
                                        : 'bg-slate-100 border-slate-200'
                                    }`}
                                  >
                                    {/* Bar Header with icons */}
                                    <div className="flex items-center justify-between text-[11px] leading-tight">
                                      <span className="font-bold text-slate-900 truncate pr-1">
                                        {b.orderNo}
                                      </span>
                                      <div className="flex items-center gap-1 text-slate-500 shrink-0">
                                        <TrendingUp className="w-3 h-3 text-slate-600" />
                                        <MoreVertical className="w-3 h-3 text-slate-400" />
                                      </div>
                                    </div>

                                    {/* Bar Subtitle */}
                                    <div className="text-[10px] text-slate-600 truncate flex items-center justify-between">
                                      <span className="truncate">
                                        Buyer: {b.buyer} | Category: {b.category}
                                      </span>
                                      <span className="text-slate-500 text-[10px] ml-1">↑</span>
                                    </div>
                                  </div>

                                  {/* Gap Buffer Block in Coral/Pink if exists */}
                                  {b.gapAfterDays !== undefined && (
                                    <div
                                      className="w-10 h-12 rounded-lg bg-rose-200/80 border border-rose-300 text-rose-800 font-bold font-mono text-xs flex items-center justify-center shrink-0 shadow-2xs"
                                      title={`Gap / Changeover Buffer: ${b.gapAfterDays} hari`}
                                    >
                                      {b.gapAfterDays}
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tooltip / Popover matching exact screenshot when hovering or clicking an order block */}
      {(hoveredBlock || selectedBlock) && (
        <div
          className={`fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-300 p-4 max-w-sm w-full animate-in fade-in ${
            selectedBlock
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              : 'bottom-6 right-6'
          }`}
        >
          {(() => {
            const blk = selectedBlock || hoveredBlock!;
            return (
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Order Details</h4>
                    <span className="text-[10px] font-mono text-blue-600 font-bold">
                      {blk.lineCode}
                    </span>
                  </div>
                  {selectedBlock && (
                    <button
                      onClick={() => setSelectedBlock(null)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Style:</span>
                    <span className="font-mono text-slate-800 font-semibold">{blk.style}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Buyer:</span>
                    <span className="text-slate-800">{blk.buyer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Order Qty:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {blk.orderQty.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Planned Qty:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {blk.plannedQty.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Remaining Production:</span>
                    <span className="font-mono text-slate-700">
                      {blk.remainingProduction.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">SAM:</span>
                    <span className="font-mono text-slate-800">{blk.sam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Manpower:</span>
                    <span className="font-mono text-slate-800">{blk.manpower}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Planned Efficiency:</span>
                    <span className="font-mono text-slate-800">{blk.plannedEfficiency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Planned Dates:</span>
                    <span className="font-mono text-slate-800 font-semibold">{blk.plannedDates}</span>
                  </div>
                </div>

                {selectedBlock && (
                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedBlock(null);
                        setActiveModule('master-order');
                      }}
                      className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Edit di Master Order</span>
                    </button>
                    <button
                      onClick={() => setSelectedBlock(null)}
                      className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Assign Load Modal connected directly to PortalContext Master Orders */}
      {isAssignLoadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Load to Line</h3>
                <p className="text-xs text-slate-500">
                  Sinkronisasi langsung dengan Master Order dan jadwal Gantt line
                </p>
              </div>
              <button
                onClick={() => setIsAssignLoadOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Order PO (Master Order) *
                </label>
                <select
                  value={assignOrderId}
                  onChange={(e) => handleSelectOrderForAssign(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo} — {o.buyer} ({o.quantity.toLocaleString('id-ID')} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Target Line Produksi *
                  </label>
                  <select
                    value={assignLineCode}
                    onChange={(e) => setAssignLineCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  >
                    {lineList.map((l) => (
                      <option key={l.code} value={l.rawCode}>
                        {l.code} - {l.type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kuantiti Muat (Pieces) *
                  </label>
                  <input
                    type="number"
                    value={assignQty}
                    onChange={(e) => setAssignQty(Math.max(1, parseInt(e.target.value || '0', 10)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Mulai Line *
                  </label>
                  <input
                    type="date"
                    value={assignStartDate}
                    onChange={(e) => setAssignStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Selesai Line *
                  </label>
                  <input
                    type="date"
                    value={assignTargetDate}
                    onChange={(e) => setAssignTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-[11px]">
                💡 <b>Sinkronisasi Otomatis:</b> Alokasi ini akan langsung memperbarui data alokasi line
                di Master Order dan memunculkan blok bar Gantt pada <b>{toLineKey(assignLineCode)}</b>.
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsAssignLoadOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAssignLoad}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Simpan Penjadwalan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capacity Breakdown Modal */}
      {isCapacityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Line Capacity Overview</h3>
                <p className="text-xs text-slate-500">
                  Total Factory Planned: {totalPlannedPieces.toLocaleString('id-ID')} /{' '}
                  {totalFactoryCapacity.toLocaleString('id-ID')} pieces
                </p>
              </div>
              <button
                onClick={() => setIsCapacityModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {lineList.map((l) => {
                const lineBlocks = scheduleData[l.code] || [];
                const lineLoad = lineBlocks.reduce((acc, b) => acc + b.plannedQty, 0);
                const utilPct = l.cap > 0 ? Math.min(100, Math.round((lineLoad / l.cap) * 100)) : 0;

                return (
                  <div
                    key={l.code}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col gap-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{l.code}</span>
                        <span className="text-slate-500 ml-2">({l.type})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-blue-700">
                          {lineLoad.toLocaleString('id-ID')}
                        </span>
                        <span className="text-slate-400"> / </span>
                        <span className="font-mono text-slate-600">
                          {l.cap.toLocaleString('id-ID')} pcs/bln
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          utilPct > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${utilPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsCapacityModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
