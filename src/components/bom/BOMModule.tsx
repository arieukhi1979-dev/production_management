import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Edit3,
  FileDown,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Package,
  ExternalLink,
  Info,
  Save,
  RotateCcw,
  Tag,
  Scissors,
  Check,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { BOMItem, MasterOrder } from '../../types';
import { downloadCSV } from '../../utils/csv';

// Industry standard multi-material templates per garment type
const BOM_TEMPLATES: Record<
  string,
  {
    categoryName: string;
    items: Omit<BOMItem, 'id' | 'styleCode' | 'styleName' | 'requiredQty' | 'inStockQty'>[];
  }
> = {
  Shirt: {
    categoryName: 'Kemeja Casual / Formal',
    items: [
      {
        itemCode: 'FAB-OX-01',
        itemName: '100% Combed Cotton Oxford 80/2',
        category: 'Fabric',
        consumptionPerPc: 1.65,
        unit: 'Yard',
        wastagePct: 3,
        supplier: 'Toray Industries',
        notes: 'Badan depan, belakang & lengan',
      },
      {
        itemCode: 'INT-W02',
        itemName: 'Woven Fusible Interlining 90gsm Soft Collar',
        category: 'Interlining',
        consumptionPerPc: 0.22,
        unit: 'Yard',
        wastagePct: 2,
        supplier: 'Vilene Interlining',
        notes: 'Daun kerah, stand collar & manset',
      },
      {
        itemCode: 'THR-SP-40',
        itemName: 'Spun Polyester Thread 40/2 (Seaming)',
        category: 'Sewing Thread',
        consumptionPerPc: 130,
        unit: 'Meter',
        wastagePct: 5,
        supplier: 'Coats Indo',
        notes: 'Jahitan gabung & stik keliling',
      },
      {
        itemCode: 'THR-SP-20',
        itemName: 'Spun Polyester Thread 20/2 (Topstitch)',
        category: 'Sewing Thread',
        consumptionPerPc: 45,
        unit: 'Meter',
        wastagePct: 5,
        supplier: 'Coats Indo',
        notes: 'Topstitch kerah & placket depan',
      },
      {
        itemCode: 'BTN-PEARL-18',
        itemName: 'Chalk White Pearl Button 18L 4-Hole',
        category: 'Button',
        consumptionPerPc: 9,
        unit: 'Pcs',
        wastagePct: 2,
        supplier: 'YKK Fastening',
        notes: 'Placket depan 7 butir + manset 2 butir',
      },
      {
        itemCode: 'BTN-PEARL-14',
        itemName: 'Chalk White Pearl Button 14L Collar-Down',
        category: 'Button',
        consumptionPerPc: 2,
        unit: 'Pcs',
        wastagePct: 2,
        supplier: 'YKK Fastening',
        notes: 'Ujung daun kerah button-down',
      },
      {
        itemCode: 'LBL-MAIN',
        itemName: 'Woven High-Definition Main Brand Label',
        category: 'Label & Tag',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 1,
        supplier: 'Avery Dennison',
        notes: 'Leher belakang tengah',
      },
      {
        itemCode: 'LBL-CARE',
        itemName: 'Printed Satin Care & Content Label',
        category: 'Label & Tag',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 1,
        supplier: 'Avery Dennison',
        notes: 'Sisi kiri bawah badan',
      },
      {
        itemCode: 'PKG-POLY-12',
        itemName: 'Clear Self-Adhesive Polybag 12x18 inch',
        category: 'Packaging',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 2,
        supplier: 'Panca Budi',
        notes: 'Kemasan satuan per baju',
      },
      {
        itemCode: 'PKG-HT',
        itemName: 'Brand Hangtag FSC Certified + Cotton String',
        category: 'Packaging',
        consumptionPerPc: 1,
        unit: 'Set',
        wastagePct: 1,
        supplier: 'Avery Dennison',
        notes: 'Gantung di lubang kancing ke-2',
      },
      {
        itemCode: 'PKG-CTN',
        itemName: 'Double Wall Master Carton Box 24 pcs',
        category: 'Packaging',
        consumptionPerPc: 0.042,
        unit: 'Pcs',
        wastagePct: 1,
        supplier: 'Surya Rengo',
        notes: 'Packing ekspor 24 pcs/karton',
      },
    ],
  },
  Pant: {
    categoryName: 'Celana Panjang Chino / Denim / Pant',
    items: [
      {
        itemCode: 'FAB-TWL-10',
        itemName: '100% Cotton Twill 10oz Raw Chino',
        category: 'Fabric',
        consumptionPerPc: 1.45,
        unit: 'Yard',
        wastagePct: 3,
        supplier: 'Lucky Textile',
        notes: 'Pola badan depan, belakang & waistband',
      },
      {
        itemCode: 'FAB-TC-PKT',
        itemName: 'TC 65/35 Pocketing Fabric White',
        category: 'Fabric',
        consumptionPerPc: 0.35,
        unit: 'Yard',
        wastagePct: 2,
        supplier: 'Dan Liris',
        notes: 'Kantong samping & kantong bobok belakang',
      },
      {
        itemCode: 'INT-WB-40',
        itemName: 'Non-Woven Waistband Fusible Tape 40mm',
        category: 'Interlining',
        consumptionPerPc: 1.10,
        unit: 'Yard',
        wastagePct: 2,
        supplier: 'Vilene Interlining',
        notes: 'Ban pinggang dalam',
      },
      {
        itemCode: 'ZIP-YKK-M5',
        itemName: 'YKK Metal Zipper Brass #5 Closed 18cm',
        category: 'Zipper',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 1,
        supplier: 'YKK Fastening',
        notes: 'Resleting golbi depan',
      },
      {
        itemCode: 'BTN-WB-24',
        itemName: 'Melamine Waistband Button 24L Antique Horn',
        category: 'Button',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 2,
        supplier: 'YKK Fastening',
        notes: 'Kancing ban pinggang tengah',
      },
      {
        itemCode: 'BTN-PKT-18',
        itemName: 'Melamine Pocket Button 18L Antique Horn',
        category: 'Button',
        consumptionPerPc: 2,
        unit: 'Pcs',
        wastagePct: 2,
        supplier: 'YKK Fastening',
        notes: 'Kancing saku belakang kiri & kanan',
      },
      {
        itemCode: 'THR-CS-20',
        itemName: 'Core Spun Poly 20/3 Heavy Seam Contrast',
        category: 'Sewing Thread',
        consumptionPerPc: 160,
        unit: 'Meter',
        wastagePct: 5,
        supplier: 'Coats Indo',
        notes: 'Jahitan rantai pesak & outseam',
      },
      {
        itemCode: 'THR-SP-40',
        itemName: 'Spun Poly 40/2 Seaming Matching',
        category: 'Sewing Thread',
        consumptionPerPc: 90,
        unit: 'Meter',
        wastagePct: 5,
        supplier: 'Coats Indo',
        notes: 'Perakitan kantong & kelim bawah',
      },
      {
        itemCode: 'LBL-PT-WB',
        itemName: 'Leatherette Waistband Brand Patch',
        category: 'Label & Tag',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 1,
        supplier: 'Avery Dennison',
        notes: 'Pinggang belakang kanan',
      },
      {
        itemCode: 'PKG-PANT-BAG',
        itemName: 'Polybag Pant Gusset 14x24 inch Perforated',
        category: 'Packaging',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 2,
        supplier: 'Panca Budi',
        notes: 'Bungkus lipat celana',
      },
    ],
  },
  Polo: {
    categoryName: 'Polo Shirt / Kaos Rajut / Sportswear',
    items: [
      {
        itemCode: 'FAB-KNIT-PK',
        itemName: 'Recycled Poly-Elastane Pique Knit 220gsm',
        category: 'Fabric',
        consumptionPerPc: 1.35,
        unit: 'Kg',
        wastagePct: 4,
        supplier: 'Eclat Textile',
        notes: 'Badan depan, belakang & lengan polo',
      },
      {
        itemCode: 'RIB-PK',
        itemName: 'Flat Knit Jacquard Rib Collar & Cuff Set',
        category: 'Fabric',
        consumptionPerPc: 1,
        unit: 'Set',
        wastagePct: 2,
        supplier: 'Eclat Textile',
        notes: 'Daun kerah rajut + manset rib',
      },
      {
        itemCode: 'INT-PLK',
        itemName: 'Micro-Dot Lightweight Placket Interlining 45gsm',
        category: 'Interlining',
        consumptionPerPc: 0.12,
        unit: 'Yard',
        wastagePct: 2,
        supplier: 'Vilene Interlining',
        notes: 'Placket kancing dada',
      },
      {
        itemCode: 'BTN-RUB-18',
        itemName: 'Rubberized Matte Finish Button 18L 4-Hole',
        category: 'Button',
        consumptionPerPc: 3,
        unit: 'Pcs',
        wastagePct: 2,
        supplier: 'YKK Fastening',
        notes: 'Placket leher 3 butir',
      },
      {
        itemCode: 'THR-TX-120',
        itemName: 'Textured Poly Thread 120 (Overlock / Looper)',
        category: 'Sewing Thread',
        consumptionPerPc: 190,
        unit: 'Meter',
        wastagePct: 5,
        supplier: 'Coats Indo',
        notes: 'Obras 4 benang sambungan badan',
      },
      {
        itemCode: 'THR-SP-40',
        itemName: 'Spun Poly 40/2 Seaming Matching',
        category: 'Sewing Thread',
        consumptionPerPc: 75,
        unit: 'Meter',
        wastagePct: 5,
        supplier: 'Coats Indo',
        notes: 'Pasang kerah & kelim flatlock',
      },
      {
        itemCode: 'LBL-HT-HEAT',
        itemName: 'Heat Transfer Tagless Neck Label 4-Color',
        category: 'Label & Tag',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 2,
        supplier: 'Avery Dennison',
        notes: 'Press leher dalam belakang',
      },
      {
        itemCode: 'PKG-BIO-BAG',
        itemName: 'Biodegradable D2W Polybag 11x15 inch',
        category: 'Packaging',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 2,
        supplier: 'Panca Budi',
        notes: 'Kemasan individu lipat polo',
      },
      {
        itemCode: 'PKG-HT-CORD',
        itemName: 'Performance Hangtag + Elastic Cord',
        category: 'Packaging',
        consumptionPerPc: 1,
        unit: 'Set',
        wastagePct: 1,
        supplier: 'Avery Dennison',
        notes: 'Gantung di kerah',
      },
    ],
  },
  Blouse: {
    categoryName: 'Ladies Blouse / Top',
    items: [
      {
        itemCode: 'FAB-LIN-100',
        itemName: '100% Linen Slub Woven Fabric 140gsm',
        category: 'Fabric',
        consumptionPerPc: 1.50,
        unit: 'Yard',
        wastagePct: 4,
        supplier: 'Dan Liris',
        notes: 'Badan depan, belakang & lengan blouse',
      },
      {
        itemCode: 'INT-SLK-30',
        itemName: 'Ultra-Soft Silk Interlining 30gsm',
        category: 'Interlining',
        consumptionPerPc: 0.15,
        unit: 'Yard',
        wastagePct: 2,
        supplier: 'Vilene Interlining',
        notes: 'Lapisan leher & belahan depan',
      },
      {
        itemCode: 'BTN-MOP-16',
        itemName: 'Mother of Pearl Natural Shell Button 16L',
        category: 'Button',
        consumptionPerPc: 8,
        unit: 'Pcs',
        wastagePct: 3,
        supplier: 'YKK Fastening',
        notes: 'Placket depan 6 butir + manset 2 butir',
      },
      {
        itemCode: 'THR-SP-50',
        itemName: 'Fine Spun Polyester Thread 50/2 Tone-on-Tone',
        category: 'Sewing Thread',
        consumptionPerPc: 115,
        unit: 'Meter',
        wastagePct: 5,
        supplier: 'Coats Indo',
        notes: 'Jahit halus perakitan & kelim kurva',
      },
      {
        itemCode: 'LBL-STN-MN',
        itemName: 'High-Gloss Woven Satin Main Neck Label',
        category: 'Label & Tag',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 1,
        supplier: 'Avery Dennison',
        notes: 'Leher dalam tengah',
      },
      {
        itemCode: 'PKG-POLY-BL',
        itemName: 'Crystal Clear BOPP Polybag 11x16 inch',
        category: 'Packaging',
        consumptionPerPc: 1,
        unit: 'Pcs',
        wastagePct: 2,
        supplier: 'Panca Budi',
        notes: 'Kemasan rapi lipat blouse',
      },
    ],
  },
};

// Helper to extract style code prefix e.g. "1052323" from "1052323 Men Oxford Classic Shirt"
const getStyleCode = (style: string): string => {
  return style.split(' ')[0] || style;
};

export const BOMModule: React.FC = () => {
  const { setActiveModule, bomItems, saveStyleBOM, orders } = usePortal();

  // Active Style selected from Master Orders
  // Default to first order in orders list
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    return orders[0]?.id || '';
  });

  // Current active Master Order
  const activeOrder: MasterOrder | undefined = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0];
  }, [orders, selectedOrderId]);

  // Current style identifier for BOM
  const currentStyleCode = useMemo(() => {
    return activeOrder ? getStyleCode(activeOrder.style) : '1052323';
  }, [activeOrder]);

  const currentStyleName = activeOrder?.style || '1052323 Men Oxford Classic Shirt';
  const currentOrderQty = activeOrder?.quantity || 15000;

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  // Full Multi-Row BOM Sheet Editor Modal
  const [isSheetEditorOpen, setIsSheetEditorOpen] = useState(false);
  const [draftMaterials, setDraftMaterials] = useState<
    (Omit<BOMItem, 'id' | 'styleCode' | 'styleName' | 'requiredQty' | 'inStockQty'> & {
      id?: string;
      inStockQty: number;
    })[]
  >([]);

  // Feedback Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Materials currently attached to this style in BOM database
  const styleBOMItems = useMemo(() => {
    return bomItems.filter((b) => b.styleCode === currentStyleCode);
  }, [bomItems, currentStyleCode]);

  // Filtered materials for table display
  const displayedItems = useMemo(() => {
    return styleBOMItems.filter((item) => {
      if (filterCat && item.category !== filterCat) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.itemName.toLowerCase().includes(q) ||
          item.itemCode.toLowerCase().includes(q) ||
          (item.notes || '').toLowerCase().includes(q) ||
          item.supplier.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [styleBOMItems, filterCat, search]);

  // Calculate total requirements and inventory status
  const summary = useMemo(() => {
    const totalMaterials = styleBOMItems.length;
    let sufficientCount = 0;
    let shortageCount = 0;

    styleBOMItems.forEach((m) => {
      const wastage = m.wastagePct || 0;
      const totalReq = Math.ceil(currentOrderQty * m.consumptionPerPc * (1 + wastage / 100));
      if (m.inStockQty >= totalReq) {
        sufficientCount++;
      } else {
        shortageCount++;
      }
    });

    const readinessPct = totalMaterials > 0 ? Math.round((sufficientCount / totalMaterials) * 100) : 0;

    return {
      totalMaterials,
      sufficientCount,
      shortageCount,
      readinessPct,
    };
  }, [styleBOMItems, currentOrderQty]);

  // Open Full BOM Sheet Editor populated with all current style materials
  const handleOpenSheetEditor = () => {
    if (styleBOMItems.length > 0) {
      setDraftMaterials(
        styleBOMItems.map((m) => ({
          id: m.id,
          itemCode: m.itemCode,
          itemName: m.itemName,
          category: m.category,
          consumptionPerPc: m.consumptionPerPc,
          unit: m.unit,
          wastagePct: m.wastagePct || 0,
          inStockQty: m.inStockQty,
          supplier: m.supplier,
          notes: m.notes || '',
        }))
      );
    } else {
      // If style has no BOM yet, auto-load standard template based on garment type
      loadPresetTemplate(detectGarmentPreset(currentStyleName));
    }
    setIsSheetEditorOpen(true);
  };

  // Helper to detect garment category preset
  const detectGarmentPreset = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('pant') || n.includes('chino') || n.includes('jeans') || n.includes('celana')) {
      return 'Pant';
    }
    if (n.includes('polo') || n.includes('knit') || n.includes('kaos') || n.includes('sport')) {
      return 'Polo';
    }
    if (n.includes('blouse') || n.includes('ladies')) {
      return 'Blouse';
    }
    return 'Shirt';
  };

  // Load a complete multi-material template for this style
  const loadPresetTemplate = (templateKey: string) => {
    const tpl = BOM_TEMPLATES[templateKey] || BOM_TEMPLATES.Shirt;
    const stockMultiplier = currentOrderQty > 0 ? currentOrderQty : 10000;

    const populated = tpl.items.map((it, idx) => {
      const wastage = it.wastagePct || 0;
      const totalNeeded = Math.ceil(stockMultiplier * it.consumptionPerPc * (1 + wastage / 100));
      // Give realistic stock: mostly sufficient, 1 or 2 slight shortage for realistic simulation
      const inStock = idx === 1 ? Math.round(totalNeeded * 0.85) : Math.round(totalNeeded * 1.15);

      return {
        ...it,
        id: `draft-${Date.now()}-${idx}`,
        inStockQty: inStock,
      };
    });

    setDraftMaterials(populated);
  };

  // Add a new material row inside the sheet editor
  const handleAddMaterialRow = () => {
    setDraftMaterials((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}-${prev.length}`,
        itemCode: `MAT-${Math.floor(100 + Math.random() * 900)}`,
        itemName: 'Material Baru',
        category: 'Accessories',
        consumptionPerPc: 1.0,
        unit: 'Pcs',
        wastagePct: 2,
        inStockQty: currentOrderQty,
        supplier: 'Vendor Lokal',
        notes: 'Komponen tambahan',
      },
    ]);
  };

  // Remove a material row inside the sheet editor
  const handleRemoveMaterialRow = (index: number) => {
    setDraftMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  // Update field of a material row
  const handleUpdateRow = (index: number, field: string, value: any) => {
    setDraftMaterials((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // Save the entire BOM Sheet for this style to PortalContext
  const handleSaveFullBOM = () => {
    if (draftMaterials.length === 0) {
      alert('BOM harus memiliki minimal 1 material!');
      return;
    }

    const compiledItems: BOMItem[] = draftMaterials.map((d, idx) => {
      const wastage = Number(d.wastagePct) || 0;
      const cons = Number(d.consumptionPerPc) || 0;
      const reqQty = Math.ceil(currentOrderQty * cons * (1 + wastage / 100));

      return {
        id: d.id && !d.id.startsWith('draft-') ? d.id : `bom-${currentStyleCode}-${idx}-${Date.now()}`,
        styleCode: currentStyleCode,
        styleName: currentStyleName,
        itemCode: d.itemCode.trim(),
        itemName: d.itemName.trim(),
        category: d.category,
        consumptionPerPc: cons,
        unit: d.unit,
        wastagePct: wastage,
        requiredQty: reqQty,
        inStockQty: Number(d.inStockQty) || 0,
        supplier: d.supplier.trim() || 'Vendor Utama',
        notes: d.notes?.trim() || '',
      };
    });

    saveStyleBOM(currentStyleCode, compiledItems);
    setIsSheetEditorOpen(false);

    setToastMsg(
      `Seluruh BOM untuk style "${currentStyleName}" berhasil disimpan (${compiledItems.length} material lengkap)!`
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Export BOM to CSV
  const handleExportCSV = () => {
    const rows: (string | number)[][] = [];

    styleBOMItems.forEach((b, idx) => {
      const wastage = b.wastagePct || 0;
      const totalReq = Math.ceil(currentOrderQty * b.consumptionPerPc * (1 + wastage / 100));
      const shortage = Math.max(0, totalReq - b.inStockQty);
      const status = shortage === 0 ? 'Cukup' : `Kurang ${shortage}`;

      rows.push([
        idx + 1,
        b.category,
        b.itemCode,
        b.itemName,
        b.notes || '-',
        b.consumptionPerPc,
        b.unit,
        `${wastage}%`,
        totalReq,
        b.inStockQty,
        status,
        b.supplier,
      ]);
    });

    downloadCSV(`BOM_${currentStyleCode}_${activeOrder?.orderNo || 'Order'}.csv`, [
      [
        'No',
        'Kategori',
        'Kode Material',
        'Deskripsi Material',
        'Penempatan',
        'Konsumsi/1 Pcs Baju',
        'Satuan',
        'Wastage %',
        `Total Kebutuhan (${currentOrderQty} pcs)`,
        'Stok Gudang',
        'Status Ketersediaan',
        'Supplier',
      ],
      ...rows,
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16 font-sans">
      {/* Header Bar */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-14 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setActiveModule('landing')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard Utama</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveModule('master-order')}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Lihat Master Order</span>
              </button>

              <button
                onClick={() => setActiveModule('prod-plan')}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                <span>Buka Production Plan →</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold mb-1">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>MODUL TEKNIS · BILL OF MATERIALS (BOM) PER STYLE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Bill of Material (BOM) per Style
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                BOM disusun menyeluruh berdasarkan style dalam Master Order. Berisi seluruh kebutuhan
                kain, interlining, benang, kancing, label &amp; kemasan dengan rincian konsumsi per 1 pcs baju.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Export BOM CSV</span>
              </button>

              <button
                onClick={handleOpenSheetEditor}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Seluruh BOM Style Ini</span>
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
        {/* Style Selection Bar directly linked to Master Order */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pilih Style Master Order:
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                  Terhubung ke PO
                </span>
              </div>

              {/* Master Order Style Dropdown */}
              <div className="relative min-w-[320px] sm:min-w-[420px]">
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border-2 border-emerald-500/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-400 shadow-inner"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo} — {o.buyer} | Style: {o.style} ({o.quantity.toLocaleString('id-ID')} pcs)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Garment Profile of Selected Style */}
            {activeOrder && (
              <div className="flex items-center gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Buyer / Pemesan</div>
                  <div className="font-bold text-slate-200">{activeOrder.buyer}</div>
                </div>
                <div className="h-8 w-px bg-slate-700" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Kuantiti Order PO</div>
                  <div className="font-mono font-black text-emerald-400 text-sm">
                    {activeOrder.quantity.toLocaleString('id-ID')} pcs
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-700" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Line Alokasi</div>
                  <div className="font-mono font-bold text-slate-300">{activeOrder.line}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Material BOM</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white font-mono">
              {summary.totalMaterials} <span className="text-xs font-normal text-slate-400">Komponen</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Semua kain, benang, kancing, interlining &amp; aksesoris
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Kesiapan Stok Material</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-blue-400 font-mono">
              {summary.readinessPct}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary.sufficientCount} dari {summary.totalMaterials} material mencukupi PO
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Status Defisit / Shortage</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-black font-mono">
              <span className={summary.shortageCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {summary.shortageCount} <span className="text-xs font-normal">Item</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary.shortageCount > 0 ? 'Perlu PO pembelian via MRP' : 'Semua material aman'}
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Kalkulasi Kebutuhan</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-xs font-mono font-bold text-amber-300">
              Konsumsi/Pcs × Qty PO × (1 + Wastage%)
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Dihitung otomatis untuk {currentOrderQty.toLocaleString('id-ID')} pcs
            </div>
          </div>
        </div>

        {/* Search, Filter & Quick Template Bar */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari material (kain, benang, kancing, interlining, vendor)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              <option value="Fabric">Fabric (Kain)</option>
              <option value="Interlining">Interlining</option>
              <option value="Sewing Thread">Sewing Thread (Benang)</option>
              <option value="Button">Button (Kancing)</option>
              <option value="Zipper">Zipper</option>
              <option value="Label & Tag">Label &amp; Tag</option>
              <option value="Packaging">Packaging</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Template:</span>
            <button
              onClick={() => {
                loadPresetTemplate('Shirt');
                setIsSheetEditorOpen(true);
              }}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Kemeja
            </button>
            <button
              onClick={() => {
                loadPresetTemplate('Pant');
                setIsSheetEditorOpen(true);
              }}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Celana
            </button>
            <button
              onClick={() => {
                loadPresetTemplate('Polo');
                setIsSheetEditorOpen(true);
              }}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Polo/Kaos
            </button>
            <button
              onClick={() => {
                loadPresetTemplate('Blouse');
                setIsSheetEditorOpen(true);
              }}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Blouse
            </button>
          </div>
        </div>

        {/* Complete BOM Table for Selected Style */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Daftar Material Lengkap: {currentStyleName}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 font-bold">
                  {displayedItems.length} Material
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kebutuhan total dihitung dari konsumsi per 1 pcs baju dikalikan kuantiti order PO (
                {currentOrderQty.toLocaleString('id-ID')} pcs).
              </p>
            </div>

            <button
              onClick={handleOpenSheetEditor}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Buka Editor Lembar BOM</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 w-32">Kategori</th>
                  <th className="py-3 px-3">Kode &amp; Nama Material</th>
                  <th className="py-3 px-3">Penempatan / Bagian</th>
                  <th className="py-3 px-3 text-right bg-emerald-950/20 text-emerald-400">
                    Konsumsi / 1 Pcs
                  </th>
                  <th className="py-3 px-2 text-center">Satuan</th>
                  <th className="py-3 px-2 text-center">Wastage</th>
                  <th className="py-3 px-3 text-right font-mono text-white">Total Kebutuhan PO</th>
                  <th className="py-3 px-3 text-right font-mono text-slate-300">Stok Gudang</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-xs">
                {displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-3">
                        <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="font-semibold text-slate-300">
                          BOM untuk style "{currentStyleName}" belum diisi.
                        </p>
                        <p className="text-xs text-slate-500">
                          Klik tombol di bawah untuk membuat seluruh daftar material lengkap dengan
                          konsumsi per 1 pcs baju menggunakan template atau input manual.
                        </p>
                        <button
                          onClick={handleOpenSheetEditor}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Buat Seluruh BOM Style Ini</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item, idx) => {
                    const wastage = item.wastagePct || 0;
                    const totalReq = Math.ceil(
                      currentOrderQty * item.consumptionPerPc * (1 + wastage / 100)
                    );
                    const isShortage = item.inStockQty < totalReq;
                    const shortageDiff = totalReq - item.inStockQty;

                    // Category badge colors
                    const catColors: Record<string, string> = {
                      Fabric: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                      Interlining: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                      'Sewing Thread': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                      Button: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
                      Zipper: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                      'Label & Tag': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                      Packaging: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
                      Accessories: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
                    };

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              catColors[item.category] || 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-mono text-emerald-400 font-bold text-[11px]">
                            {item.itemCode}
                          </div>
                          <div className="font-semibold text-white">{item.itemName}</div>
                        </td>

                        <td className="py-3 px-3 text-slate-300 text-[11px]">
                          {item.notes || '-'}
                        </td>

                        {/* Consumption per 1 pcs garment */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 bg-emerald-950/20 text-sm">
                          {item.consumptionPerPc}
                        </td>

                        <td className="py-3 px-2 text-center text-slate-400 font-mono text-[11px]">
                          {item.unit}
                        </td>

                        <td className="py-3 px-2 text-center text-slate-400 font-mono text-[11px]">
                          {wastage}%
                        </td>

                        {/* Total Requirement for PO */}
                        <td className="py-3 px-3 text-right font-mono font-black text-white text-sm">
                          {totalReq.toLocaleString('id-ID')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {item.inStockQty.toLocaleString('id-ID')}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isShortage ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                              Kurang {shortageDiff.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              Cukup
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {item.supplier}
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

      {/* FULL MULTI-ROW BOM SHEET EDITOR MODAL */}
      {isSheetEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                    EDITOR LEMBAR BOM
                  </span>
                  <span className="text-xs text-slate-400">
                    Style: <b className="text-white">{currentStyleName}</b>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Input &amp; Atur Seluruh Material untuk Style Ini
                </h3>
                <p className="text-xs text-slate-400">
                  Semua komponen baju diedit sekaligus dalam satu lembar kerja, lengkap dengan konsumsi per 1 pcs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSheetEditorOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Template Preset Bar */}
            <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Auto-Generate Template:</span>
                <button
                  type="button"
                  onClick={() => loadPresetTemplate('Shirt')}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-md font-medium cursor-pointer transition-colors"
                >
                  Kemeja (11 Mat)
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetTemplate('Pant')}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-md font-medium cursor-pointer transition-colors"
                >
                  Celana (10 Mat)
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetTemplate('Polo')}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-md font-medium cursor-pointer transition-colors"
                >
                  Polo/Kaos (9 Mat)
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetTemplate('Blouse')}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-md font-medium cursor-pointer transition-colors"
                >
                  Blouse (6 Mat)
                </button>
              </div>

              <div className="text-slate-400 font-mono">
                Qty Order Basis:{' '}
                <span className="font-bold text-emerald-400">
                  {currentOrderQty.toLocaleString('id-ID')} pcs
                </span>
              </div>
            </div>

            {/* Spreadsheet Editor Table Body */}
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                    <th className="py-2 px-2 w-10 text-center">#</th>
                    <th className="py-2 px-2 w-32">Kategori *</th>
                    <th className="py-2 px-2 w-28">Kode *</th>
                    <th className="py-2 px-2">Nama Material *</th>
                    <th className="py-2 px-2">Penempatan / Bagian</th>
                    <th className="py-2 px-2 w-28 bg-emerald-950/30 text-emerald-300">
                      Konsumsi / 1 Pcs *
                    </th>
                    <th className="py-2 px-2 w-20">Satuan *</th>
                    <th className="py-2 px-2 w-20">Wastage %</th>
                    <th className="py-2 px-2 w-28">Stok Gudang</th>
                    <th className="py-2 px-2 w-32">Supplier</th>
                    <th className="py-2 px-2 w-10 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {draftMaterials.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-2 text-center text-slate-500 font-mono">{idx + 1}</td>

                      {/* Category */}
                      <td className="py-2 px-2">
                        <select
                          value={row.category}
                          onChange={(e) => handleUpdateRow(idx, 'category', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Fabric">Fabric</option>
                          <option value="Interlining">Interlining</option>
                          <option value="Sewing Thread">Sewing Thread</option>
                          <option value="Button">Button</option>
                          <option value="Zipper">Zipper</option>
                          <option value="Label & Tag">Label & Tag</option>
                          <option value="Packaging">Packaging</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </td>

                      {/* Material Code */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={row.itemCode}
                          onChange={(e) => handleUpdateRow(idx, 'itemCode', e.target.value)}
                          placeholder="FAB-01"
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Material Name */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={row.itemName}
                          onChange={(e) => handleUpdateRow(idx, 'itemName', e.target.value)}
                          placeholder="Deskripsi Material..."
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Notes / Placement */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={row.notes || ''}
                          onChange={(e) => handleUpdateRow(idx, 'notes', e.target.value)}
                          placeholder="e.g. Kerah, Manset, Placket"
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Consumption per 1 pcs garment */}
                      <td className="py-2 px-2 bg-emerald-950/20">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={row.consumptionPerPc}
                          onChange={(e) =>
                            handleUpdateRow(
                              idx,
                              'consumptionPerPc',
                              parseFloat(e.target.value || '0')
                            )
                          }
                          className="w-full px-2 py-1.5 bg-slate-800 border border-emerald-500/60 rounded text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-400 text-right"
                        />
                      </td>

                      {/* Unit */}
                      <td className="py-2 px-2">
                        <select
                          value={row.unit}
                          onChange={(e) => handleUpdateRow(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Yard">Yard</option>
                          <option value="Meter">Meter</option>
                          <option value="Pcs">Pcs</option>
                          <option value="Set">Set</option>
                          <option value="Kg">Kg</option>
                          <option value="Cone">Cone</option>
                          <option value="Gross">Gross</option>
                          <option value="Roll">Roll</option>
                        </select>
                      </td>

                      {/* Wastage % */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="50"
                          value={row.wastagePct || 0}
                          onChange={(e) =>
                            handleUpdateRow(idx, 'wastagePct', parseFloat(e.target.value || '0'))
                          }
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs text-center focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* In Stock Qty */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={row.inStockQty || 0}
                          onChange={(e) =>
                            handleUpdateRow(idx, 'inStockQty', parseInt(e.target.value || '0', 10))
                          }
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs text-right focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Supplier */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={row.supplier}
                          onChange={(e) => handleUpdateRow(idx, 'supplier', e.target.value)}
                          placeholder="Nama Supplier"
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Delete Row Action */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterialRow(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded cursor-pointer"
                          title="Hapus baris material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleAddMaterialRow}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Baris Material</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-400">
                Total Komponen: <b className="text-white">{draftMaterials.length} item</b>. Seluruh
                data akan tersimpan permanen untuk style ini.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSheetEditorOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveFullBOM}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Seluruh BOM Style</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
