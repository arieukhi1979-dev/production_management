import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  Machine,
  MachineType,
  ProductionLine,
  MachinePlan,
  MasterOrder,
  OperationBulletin,
  BOMItem,
  ProductionDailyReport,
  MRPItem,
  ActiveModule,
} from '../types';
import {
  initialMachineTypes,
  initialLines,
  initialBrands,
  initialLocations,
  initialMachines,
  initialPlans,
  initialOrders,
  initialOB,
  initialBOM,
  initialReports,
  initialMRP,
} from '../data/initialData';

interface PortalContextType {
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  targetSubTab?: string;
  setTargetSubTab: (tab: string | undefined) => void;

  machines: Machine[];
  saveMachine: (machine: Omit<Machine, 'id'> & { id?: string }) => Machine;
  deleteMachine: (id: string) => void;
  importMachinesList: (newMachines: Machine[]) => number;

  plans: MachinePlan[];
  savePlan: (plan: Omit<MachinePlan, 'id'> & { id?: string }) => void;
  deletePlan: (id: string) => void;

  machineTypes: MachineType[];
  saveMachineType: (item: MachineType, oldCode?: string) => boolean;
  deleteMachineType: (code: string) => void;
  seedDefaultTypes: () => void;

  lines: ProductionLine[];
  saveLine: (item: ProductionLine, oldCode?: string) => boolean;
  deleteLine: (code: string) => void;
  seedDefaultLines: () => void;

  brands: string[];
  addBrand: (brand: string) => boolean;
  deleteBrand: (brand: string) => void;

  locations: string[];
  addLocation: (loc: string) => boolean;
  deleteLocation: (loc: string) => void;

  orders: MasterOrder[];
  saveOrder: (order: MasterOrder) => void;
  deleteOrder: (id: string) => void;

  operationBulletins: OperationBulletin[];
  saveOB: (ob: OperationBulletin) => void;

  bomItems: BOMItem[];
  saveBOMItem: (item: BOMItem) => void;
  deleteBOMItem: (id: string) => void;
  saveStyleBOM: (styleCode: string, items: BOMItem[]) => void;

  reports: ProductionDailyReport[];
  saveReport: (rep: ProductionDailyReport) => void;
  deleteReport: (id: string) => void;

  mrpItems: MRPItem[];

  // Global modals
  selectedMachineForQR: Machine | null;
  setSelectedMachineForQR: (m: Machine | null) => void;
  isQRScannerOpen: boolean;
  setIsQRScannerOpen: (open: boolean) => void;
  isPrintAllOpen: boolean;
  setIsPrintAllOpen: (open: boolean) => void;

  // Global search query
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  resetToDemoData: () => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
    return parsed;
  } catch (err) {
    console.warn(`Error loading localStorage key "${key}":`, err);
    return defaultValue;
  }
}

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('landing');
  const [targetSubTab, setTargetSubTab] = useState<string | undefined>(undefined);

  const [machines, setMachines] = useState<Machine[]>(() =>
    loadFromStorage('stitch_machines_v2', initialMachines)
  );

  const [plans, setPlans] = useState<MachinePlan[]>(() =>
    loadFromStorage('stitch_plans_v2', initialPlans)
  );

  const [machineTypes, setMachineTypes] = useState<MachineType[]>(() =>
    loadFromStorage('setup_jenis_v2', initialMachineTypes)
  );

  const [lines, setLines] = useState<ProductionLine[]>(() =>
    loadFromStorage('setup_lines_v2', initialLines)
  );

  const [brands, setBrands] = useState<string[]>(() =>
    loadFromStorage('setup_brands_v2', initialBrands)
  );

  const [locations, setLocations] = useState<string[]>(() =>
    loadFromStorage('setup_lokasi_v2', initialLocations)
  );

  const [orders, setOrders] = useState<MasterOrder[]>(() => {
    const loaded = loadFromStorage<MasterOrder[]>('stitch_orders_v2', initialOrders);
    const existingIds = new Set(loaded.map((o) => o.id));
    const merged = [...loaded];
    for (const d of initialOrders) {
      if (!existingIds.has(d.id)) {
        merged.push(d);
      }
    }
    return merged;
  });

  const [operationBulletins, setOperationBulletins] = useState<OperationBulletin[]>(() => {
    const loaded = loadFromStorage<OperationBulletin[]>('stitch_ob_v2', initialOB);
    const existingIds = new Set(loaded.map((o) => o.id));
    const merged = [...loaded];
    for (const d of initialOB) {
      if (!existingIds.has(d.id)) {
        merged.push(d);
      }
    }
    return merged;
  });

  const [bomItems, setBomItems] = useState<BOMItem[]>(() =>
    loadFromStorage('stitch_bom_v2', initialBOM)
  );

  const [reports, setReports] = useState<ProductionDailyReport[]>(() =>
    loadFromStorage('stitch_reports_v2', initialReports)
  );

  const [mrpItems, setMrpItems] = useState<MRPItem[]>(() =>
    loadFromStorage('stitch_mrp_v2', initialMRP)
  );

  // Modals state
  const [selectedMachineForQR, setSelectedMachineForQR] = useState<Machine | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [cloudLoaded, setCloudLoaded] = useState(!isSupabaseConfigured);
  const [cloudStatus, setCloudStatus] = useState<'local' | 'loading' | 'connected' | 'error'>(isSupabaseConfigured ? 'loading' : 'local');

  // Load shared application state from Supabase once before enabling cloud writes.
  useEffect(() => {
    let cancelled = false;
    const loadCloudState = async () => {
      if (!supabase) return;
      setCloudStatus('loading');
      const { data, error } = await supabase.from('production_portal_state').select('data').eq('id', 'shared').maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('Supabase load failed:', error.message);
        setCloudStatus('error');
        setCloudLoaded(true);
        return;
      }
      if (data?.data) {
        const d = data.data as Record<string, unknown>;
        if (Array.isArray(d.machines)) setMachines(d.machines as Machine[]);
        if (Array.isArray(d.plans)) setPlans(d.plans as MachinePlan[]);
        if (Array.isArray(d.machineTypes)) setMachineTypes(d.machineTypes as MachineType[]);
        if (Array.isArray(d.lines)) setLines(d.lines as ProductionLine[]);
        if (Array.isArray(d.brands)) setBrands(d.brands as string[]);
        if (Array.isArray(d.locations)) setLocations(d.locations as string[]);
        if (Array.isArray(d.orders)) setOrders(d.orders as MasterOrder[]);
        if (Array.isArray(d.operationBulletins)) setOperationBulletins(d.operationBulletins as OperationBulletin[]);
        if (Array.isArray(d.bomItems)) setBomItems(d.bomItems as BOMItem[]);
        if (Array.isArray(d.reports)) setReports(d.reports as ProductionDailyReport[]);
        if (Array.isArray(d.mrpItems)) setMrpItems(d.mrpItems as MRPItem[]);
      }
      setCloudStatus('connected');
      setCloudLoaded(true);
    };
    void loadCloudState();
    return () => { cancelled = true; };
  }, []);

  // Sync all business data to one shared JSONB record. localStorage remains as a browser fallback/cache.
  useEffect(() => {
    if (!supabase || !cloudLoaded || cloudStatus === 'error') return;
    const timer = window.setTimeout(async () => {
      const payload = { machines, plans, machineTypes, lines, brands, locations, orders, operationBulletins, bomItems, reports, mrpItems };
      const { error } = await supabase!.from('production_portal_state').upsert({ id: 'shared', data: payload, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (error) {
        console.error('Supabase save failed:', error.message);
        setCloudStatus('error');
      } else {
        setCloudStatus('connected');
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [cloudLoaded, cloudStatus, machines, plans, machineTypes, lines, brands, locations, orders, operationBulletins, bomItems, reports, mrpItems]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('stitch_machines_v2', JSON.stringify(machines));
  }, [machines]);

  useEffect(() => {
    localStorage.setItem('stitch_plans_v2', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('setup_jenis_v2', JSON.stringify(machineTypes));
  }, [machineTypes]);

  useEffect(() => {
    localStorage.setItem('setup_lines_v2', JSON.stringify(lines));
  }, [lines]);

  useEffect(() => {
    localStorage.setItem('setup_brands_v2', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('setup_lokasi_v2', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('stitch_orders_v2', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('stitch_ob_v2', JSON.stringify(operationBulletins));
  }, [operationBulletins]);

  useEffect(() => {
    localStorage.setItem('stitch_bom_v2', JSON.stringify(bomItems));
  }, [bomItems]);

  useEffect(() => {
    localStorage.setItem('stitch_reports_v2', JSON.stringify(reports));
  }, [reports]);

  // Machine actions
  const saveMachine = (machineData: Omit<Machine, 'id'> & { id?: string }) => {
    if (machineData.id) {
      const updated: Machine = {
        id: machineData.id,
        code: machineData.code,
        name: machineData.name,
        type: machineData.type,
        brand: machineData.brand,
        model: machineData.model,
        serial: machineData.serial,
        status: machineData.status,
        location: machineData.location,
        purchaseDate: machineData.purchaseDate,
        notes: machineData.notes,
      };
      setMachines((prev) => prev.map((m) => (m.id === machineData.id ? updated : m)));
      return updated;
    } else {
      const newMachine: Machine = {
        ...machineData,
        id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };
      setMachines((prev) => [newMachine, ...prev]);
      return newMachine;
    }
  };

  const deleteMachine = (id: string) => {
    setMachines((prev) => prev.filter((m) => m.id !== id));
  };

  const importMachinesList = (newMachines: Machine[]): number => {
    const existingCodes = new Set(machines.map((m) => m.code.toLowerCase()));
    const validToAdd: Machine[] = [];

    newMachines.forEach((m) => {
      if (!existingCodes.has(m.code.toLowerCase())) {
        existingCodes.add(m.code.toLowerCase());
        validToAdd.push(m);
      }
    });

    if (validToAdd.length > 0) {
      setMachines((prev) => [...validToAdd, ...prev]);
    }
    return validToAdd.length;
  };

  // Plan actions
  const savePlan = (planData: Omit<MachinePlan, 'id'> & { id?: string }) => {
    const totalQty = planData.items.reduce((sum, item) => sum + (item.qty || 0), 0);
    const primaryType = planData.items[0]?.type || '';

    if (planData.id) {
      const updatedPlan: MachinePlan = {
        ...planData,
        id: planData.id,
        type: primaryType,
        qty: totalQty,
      };
      setPlans((prev) => prev.map((p) => (p.id === planData.id ? updatedPlan : p)));
    } else {
      const newPlan: MachinePlan = {
        ...planData,
        id: `plan-${Date.now()}`,
        type: primaryType,
        qty: totalQty,
      };
      setPlans((prev) => [newPlan, ...prev]);
    }
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  // Setup actions
  const saveMachineType = (item: MachineType, oldCode?: string): boolean => {
    if (oldCode) {
      setMachineTypes((prev) => prev.map((t) => (t.code === oldCode ? item : t)));
      return true;
    } else {
      if (machineTypes.some((t) => t.code.toUpperCase() === item.code.toUpperCase())) {
        return false;
      }
      setMachineTypes((prev) => [...prev, item]);
      return true;
    }
  };

  const deleteMachineType = (code: string) => {
    setMachineTypes((prev) => prev.filter((t) => t.code !== code));
  };

  const seedDefaultTypes = () => {
    const existing = new Set(machineTypes.map((t) => t.code));
    const toAdd = initialMachineTypes.filter((t) => !existing.has(t.code));
    setMachineTypes((prev) => [...prev, ...toAdd]);
  };

  const saveLine = (item: ProductionLine, oldCode?: string): boolean => {
    if (oldCode) {
      setLines((prev) => prev.map((l) => (l.code === oldCode ? item : l)));
      return true;
    } else {
      if (lines.some((l) => l.code.toUpperCase() === item.code.toUpperCase())) {
        return false;
      }
      setLines((prev) => [...prev, item]);
      return true;
    }
  };

  const deleteLine = (code: string) => {
    setLines((prev) => prev.filter((l) => l.code !== code));
  };

  const seedDefaultLines = () => {
    const existing = new Set(lines.map((l) => l.code));
    const toAdd = initialLines.filter((l) => !existing.has(l.code));
    setLines((prev) => [...prev, ...toAdd]);
  };

  const addBrand = (brandName: string): boolean => {
    const trimmed = brandName.trim();
    if (!trimmed) return false;
    if (brands.some((b) => b.toLowerCase() === trimmed.toLowerCase())) return false;
    setBrands((prev) => [...prev, trimmed]);
    return true;
  };

  const deleteBrand = (brandName: string) => {
    setBrands((prev) => prev.filter((b) => b !== brandName));
  };

  const addLocation = (locName: string): boolean => {
    const trimmed = locName.trim();
    if (!trimmed) return false;
    if (locations.some((l) => l.toLowerCase() === trimmed.toLowerCase())) return false;
    setLocations((prev) => [...prev, trimmed]);
    return true;
  };

  const deleteLocation = (locName: string) => {
    setLocations((prev) => prev.filter((l) => l !== locName));
  };

  // Orders
  const saveOrder = (order: MasterOrder) => {
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === order.id);
      if (exists) return prev.map((o) => (o.id === order.id ? order : o));
      return [order, ...prev];
    });
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // OB
  const saveOB = (ob: OperationBulletin) => {
    setOperationBulletins((prev) => {
      const exists = prev.some((o) => o.id === ob.id);
      if (exists) return prev.map((o) => (o.id === ob.id ? ob : o));
      return [ob, ...prev];
    });
  };

  // BOM
  const saveBOMItem = (item: BOMItem) => {
    setBomItems((prev) => {
      const exists = prev.some((b) => b.id === item.id);
      if (exists) return prev.map((b) => (b.id === item.id ? item : b));
      return [item, ...prev];
    });
  };

  const deleteBOMItem = (id: string) => {
    setBomItems((prev) => prev.filter((b) => b.id !== id));
  };

  const saveStyleBOM = (styleCode: string, items: BOMItem[]) => {
    setBomItems((prev) => {
      const filtered = prev.filter((b) => b.styleCode !== styleCode);
      return [...filtered, ...items];
    });
  };

  // Report
  const saveReport = (rep: ProductionDailyReport) => {
    setReports((prev) => {
      const exists = prev.some((r) => r.id === rep.id);
      if (exists) return prev.map((r) => (r.id === rep.id ? rep : r));
      return [rep, ...prev];
    });
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const resetToDemoData = () => {
    setMachines(initialMachines);
    setPlans(initialPlans);
    setMachineTypes(initialMachineTypes);
    setLines(initialLines);
    setBrands(initialBrands);
    setLocations(initialLocations);
    setOrders(initialOrders);
    setOperationBulletins(initialOB);
    setBomItems(initialBOM);
    setReports(initialReports);
    setMrpItems(initialMRP);
  };

  return (
    <PortalContext.Provider
      value={{
        activeModule,
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
        orders,
        saveOrder,
        deleteOrder,
        operationBulletins,
        saveOB,
        bomItems,
        saveBOMItem,
        deleteBOMItem,
        saveStyleBOM,
        reports,
        saveReport,
        deleteReport,
        mrpItems,
        selectedMachineForQR,
        setSelectedMachineForQR,
        isQRScannerOpen,
        setIsQRScannerOpen,
        isPrintAllOpen,
        setIsPrintAllOpen,
        globalSearch,
        setGlobalSearch,
        resetToDemoData,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = (): PortalContextType => {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used within PortalProvider');
  return ctx;
};
