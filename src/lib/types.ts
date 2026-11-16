export const DEFECT_CATEGORIES = [
  'Energia',
  'Impressão',
  'Scanner',
  'Papel',
  'Consumíveis',
  'Mecânica',
  'Conectividade',
  'Outros',
] as const;

export type DefectCategory = (typeof DEFECT_CATEGORIES)[number];

export type OSStatus =
  | 'orcamento'
  | 'orcamento_realizado'
  | 'esperando_resposta'
  | 'autorizado'
  | 'pronto'
  | 'recusado';

export type BudgetItemKind = 'peca' | 'servico';

export interface BudgetItem {
  id: string;
  kind: BudgetItemKind;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface HistoryEvent {
  id: string;
  at: string;
  title: string;
  detail?: string;
}

export interface ServiceOrder {
  id: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  status: OSStatus;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  brand: string;
  model: string;
  serial: string;
  accessories: string[];
  reportedDefect: string;
  diagnosis: string;
  budgetItems: BudgetItem[];
  budgetNotes: string;
  servicePerformed: string;
  internalNotes: string;
  warrantyDays: number;
  dueDate?: string;
  warrantyPending: boolean;
  warrantyPendingNote: string;
  approvedAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
  history: HistoryEvent[];
}

export type OrderPatch = Partial<
  Pick<
    ServiceOrder,
    | 'status'
    | 'clientName'
    | 'clientPhone'
    | 'clientAddress'
    | 'brand'
    | 'model'
    | 'serial'
    | 'accessories'
    | 'reportedDefect'
    | 'diagnosis'
    | 'budgetNotes'
    | 'servicePerformed'
    | 'internalNotes'
    | 'warrantyDays'
    | 'dueDate'
    | 'warrantyPending'
    | 'warrantyPendingNote'
    | 'approvedAt'
    | 'completedAt'
    | 'deliveredAt'
    | 'canceledAt'
  >
>;

export interface NewOrderInput {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  brand: string;
  model: string;
  serial: string;
  accessories: string[];
  reportedDefect: string;
  internalNotes: string;
  servicePerformed: string;
}

export interface DefectEntry {
  id: string;
  title: string;
  category: DefectCategory;
  symptoms: string;
  causes: string;
  solution: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type DefectInput = Pick<
  DefectEntry,
  'title' | 'category' | 'symptoms' | 'causes' | 'solution' | 'tags'
>;

export interface Settings {
  technicianName: string;
  companyName: string;
  phone: string;
  defaultWarrantyDays: number;
  defaultDeadlineDays: number;
}

export interface AppData {
  version: 1;
  orders: ServiceOrder[];
  defects: DefectEntry[];
  settings: Settings;
}

export interface BackupPayload {
  app: 'TecInfo';
  version: 1;
  exportedAt: string;
  data: AppData;
}
