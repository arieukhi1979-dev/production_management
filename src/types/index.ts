export type MachineStatus = 'Running' | 'Idle' | 'Maintenance' | 'Broken';

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  serial: string;
  status: MachineStatus;
  location: string;
  purchaseDate?: string;
  notes?: string;
}

export interface MachineType {
  code: string;
  name: string;
  cat: 'Sewing' | 'Cutting' | 'Finishing' | 'Embro' | 'Other';
  desc: string;
}

export interface ProductionLine {
  code: string;
  name: string;
  cap: number;
  manpowerAvailable?: number; // Jumlah manpower tersedia per shift
  sup: string;
  loc: string;
  stat: 'Active' | 'Inactive' | 'Maintenance';
}

export interface MachinePlanItem {
  type: string;
  qty: number;
}

export interface MachinePlan {
  id: string;
  start: string;
  end: string;
  line: string;
  style: string;
  note: string;
  items: MachinePlanItem[];
  type?: string;
  qty?: number;
}

export interface OrderColorBreakdown {
  color: string;
  qty: number;
}

export interface OrderLineAllocation {
  lineCode: string;
  qty: number;
  startDate?: string;
  targetDate?: string;
  dailyTarget?: number;
}

export interface MasterOrder {
  id: string;
  orderNo: string;
  buyer: string;
  style: string;
  description: string;
  quantity: number;
  startDate: string;
  targetDate: string;
  line: string;
  linesAssigned?: string[];
  lineAllocations?: OrderLineAllocation[];
  colors?: OrderColorBreakdown[];
  status: 'Draft' | 'Planned' | 'In Production' | 'Quality Check' | 'Completed';
  unitPrice?: number;
}

export interface OperationStep {
  stepNo: number;
  operationName: string;
  machineCode: string;
  sam: number;
  targetPerHour: number;
  section: 'Prep' | 'Assembly' | 'Finishing';
}

export interface OperationBulletin {
  id: string;
  styleCode: string;
  styleName: string;
  buyer: string;
  targetPerHour: number;
  totalSAM: number;
  manpower: number;
  steps: OperationStep[];
}

export interface BOMItem {
  id: string;
  styleCode: string;
  styleName?: string;
  itemCode: string;
  itemName: string;
  category: 'Fabric' | 'Sewing Thread' | 'Interlining' | 'Button' | 'Zipper' | 'Label & Tag' | 'Packaging' | 'Accessories';
  consumptionPerPc: number;
  unit: string;
  requiredQty: number;
  inStockQty: number;
  wastagePct?: number;
  supplier: string;
  notes?: string;
}

export interface ProductionDailyReport {
  id: string;
  date: string;
  line: string;
  style: string;
  orderNo?: string;
  shift: 'Shift 1' | 'Shift 2';
  targetOutput?: number;
  actualOutput: number; // Actual Output pcs
  smv: number; // Standard Minute Value (SMV / SAM in minutes)
  totalOperator: number; // Total Operator yang digunakan
  totalMesin: number; // Total Mesin yang digunakan
  normalHours: number; // Jam kerja non lembur (jam, e.g. 8)
  otHours: number; // Jumlah jam lembur (hanya untuk mesin)
  totalMesinShift: number; // Total Mesin * ((8 + otHours) / 8)
  pcsPerMcShift: number; // Actual Output / Total Mesin Shift
  efficiency: number; // Effisiensi Line % = (Actual Output * SMV) / (Operator * Normal Hours * 60) * 100
  defectCount?: number;
  downtimeMinutes?: number;
  supervisor: string;
  notes?: string;
}

export interface MRPItem {
  id: string;
  materialCode: string;
  materialName: string;
  category: string;
  unit: string;
  grossRequired: number;
  currentStock: number;
  onOrder: number;
  netRequired: number;
  status: 'Cukup' | 'Order Needed' | 'Critical Shortage';
}

export type ActiveModule =
  | 'landing'
  | 'machine-plan'
  | 'setup'
  | 'master-order'
  | 'bom'
  | 'ob'
  | 'prod-plan'
  | 'prod-report'
  | 'mrp';
