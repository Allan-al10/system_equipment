import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AppData,
  BudgetItem,
  DefectCategory,
  DefectEntry,
  HistoryEvent,
  OSStatus,
  ServiceOrder,
  Settings,
} from './types';
import { DEFECT_CATEGORIES } from './types';
import { createInitialData, DEFAULT_SETTINGS } from './seed';
import { uid } from './format';

const STORAGE_KEY = '@tecprint/app-data/v1';

const VALID_STATUSES: OSStatus[] = [
  'orcamento',
  'orcamento_realizado',
  'esperando_resposta',
  'autorizado',
  'pronto',
  'recusado',
];

const LEGACY_STATUS_MAP: Record<string, OSStatus> = {
  recebida: 'orcamento',
  em_analise: 'orcamento',
  aguardando_aprovacao: 'esperando_resposta',
  aprovada: 'autorizado',
  em_reparo: 'autorizado',
  concluida: 'pronto',
  entregue: 'pronto',
  cancelada: 'recusado',
};

function normalizeStatus(value: unknown): OSStatus {
  if (typeof value !== 'string') return 'orcamento';
  if (VALID_STATUSES.includes(value as OSStatus)) return value as OSStatus;
  return LEGACY_STATUS_MAP[value] ?? 'orcamento';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asIsoString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())) return value;
  return fallback;
}

function asOptionalIso(value: unknown): string | undefined {
  if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())) return value;
  return undefined;
}

function normalizeBudgetItem(value: unknown): BudgetItem | null {
  if (!isRecord(value)) return null;
  const description = asString(value.description).trim();
  if (!description) return null;
  return {
    id: asString(value.id) || uid('item_'),
    kind: value.kind === 'servico' ? 'servico' : 'peca',
    description,
    quantity: Math.max(1, asNumber(value.quantity, 1)),
    unitPrice: Math.max(0, asNumber(value.unitPrice, 0)),
  };
}

function normalizeHistoryEvent(value: unknown): HistoryEvent | null {
  if (!isRecord(value)) return null;
  const title = asString(value.title).trim();
  if (!title) return null;
  const detail = asString(value.detail).trim();
  return {
    id: asString(value.id) || uid('h_'),
    at: asIsoString(value.at, new Date().toISOString()),
    title,
    detail: detail || undefined,
  };
}

function normalizeOrder(value: unknown): ServiceOrder | null {
  if (!isRecord(value)) return null;

  const createdAt = asIsoString(value.createdAt, new Date().toISOString());
  const clientName = asString(value.clientName).trim();
  const brand = asString(value.brand).trim();
  const model = asString(value.model).trim();
  const number = asString(value.number).trim();

  if (!clientName && !brand && !model && !number) return null;

  const status = normalizeStatus(value.status);

  const accessories = Array.isArray(value.accessories)
    ? value.accessories.filter((item): item is string => typeof item === 'string')
    : [];

  const budgetItems = Array.isArray(value.budgetItems)
    ? value.budgetItems
        .map(normalizeBudgetItem)
        .filter((item): item is BudgetItem => item !== null)
    : [];

  const history = Array.isArray(value.history)
    ? value.history
        .map(normalizeHistoryEvent)
        .filter((event): event is HistoryEvent => event !== null)
    : [];

  return {
    id: asString(value.id) || uid('os_'),
    number: number || `OS-${new Date(createdAt).getFullYear()}-0000`,
    createdAt,
    updatedAt: asIsoString(value.updatedAt, createdAt),
    status,
    clientName,
    clientPhone: asString(value.clientPhone),
    brand,
    model,
    serial: asString(value.serial),
    accessories,
    reportedDefect: asString(value.reportedDefect),
    diagnosis: asString(value.diagnosis),
    budgetItems,
    budgetNotes: asString(value.budgetNotes),
    servicePerformed: asString(value.servicePerformed),
    internalNotes: asString(value.internalNotes),
    warrantyDays: Math.max(0, Math.round(asNumber(value.warrantyDays, 90))),
    dueDate: asOptionalIso(value.dueDate),
    warrantyPending: value.warrantyPending === true,
    warrantyPendingNote: asString(value.warrantyPendingNote),
    approvedAt: asOptionalIso(value.approvedAt),
    completedAt: asOptionalIso(value.completedAt),
    deliveredAt: asOptionalIso(value.deliveredAt),
    canceledAt: asOptionalIso(value.canceledAt),
    history,
  };
}

function normalizeDefect(value: unknown): DefectEntry | null {
  if (!isRecord(value)) return null;
  const title = asString(value.title).trim();
  if (!title) return null;

  const createdAt = asIsoString(value.createdAt, new Date().toISOString());
  const category = DEFECT_CATEGORIES.includes(value.category as DefectCategory)
    ? (value.category as DefectCategory)
    : 'Outros';

  return {
    id: asString(value.id) || uid('def_'),
    title,
    category,
    symptoms: asString(value.symptoms),
    causes: asString(value.causes),
    solution: asString(value.solution),
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    createdAt,
    updatedAt: asIsoString(value.updatedAt, createdAt),
  };
}

function normalizeSettings(value: unknown): Settings {
  const source = isRecord(value) ? value : {};
  return {
    technicianName: asString(source.technicianName),
    companyName: asString(source.companyName),
    phone: asString(source.phone),
    defaultWarrantyDays: Math.max(
      0,
      Math.round(asNumber(source.defaultWarrantyDays, DEFAULT_SETTINGS.defaultWarrantyDays)),
    ),
    defaultDeadlineDays: Math.max(
      0,
      Math.min(
        365,
        Math.round(asNumber(source.defaultDeadlineDays, DEFAULT_SETTINGS.defaultDeadlineDays)),
      ),
    ),
  };
}

export function normalizeAppData(value: unknown): AppData {
  const source = isRecord(value) ? value : {};

  return {
    version: 1,
    orders: Array.isArray(source.orders)
      ? source.orders.map(normalizeOrder).filter((order): order is ServiceOrder => order !== null)
      : [],
    defects: Array.isArray(source.defects)
      ? source.defects.map(normalizeDefect).filter((defect): defect is DefectEntry => defect !== null)
      : [],
    settings: normalizeSettings(source.settings),
  };
}

export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialData();
    return normalizeAppData(JSON.parse(raw));
  } catch (error) {
    console.warn('Não foi possível carregar os dados do TecPrint.', error);
    return createInitialData();
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function clearStoredAppData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
