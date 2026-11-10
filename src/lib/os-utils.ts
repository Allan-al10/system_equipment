import type { BudgetItem, OSStatus, ServiceOrder } from './types';
import { STATUS_META } from './theme';
import { addDays, formatDate, normalizeText } from './format';

export function itemTotal(item: BudgetItem): number {
  return Math.round(item.quantity * item.unitPrice * 100) / 100;
}

export function orderTotal(order: ServiceOrder): number {
  return Math.round(order.budgetItems.reduce((total, item) => total + itemTotal(item), 0) * 100) / 100;
}

export function nextOSNumber(orders: ServiceOrder[]): string {
  const year = new Date().getFullYear();
  const prefix = `OS-${year}-`;
  const highest = orders.reduce((max, order) => {
    if (!order.number.startsWith(prefix)) return max;
    const sequence = Number.parseInt(order.number.slice(prefix.length), 10);
    return Number.isNaN(sequence) ? max : Math.max(max, sequence);
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, '0')}`;
}

export function normalizeSerial(serial: string): string {
  return serial.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function getWarrantyEnd(order: ServiceOrder): string | null {
  if (!order.warrantyDays || order.warrantyDays <= 0) return null;
  if (!order.deliveredAt) return null;
  return addDays(order.deliveredAt, order.warrantyDays);
}

export function isWarrantyActive(order: ServiceOrder): boolean {
  const end = getWarrantyEnd(order);
  if (!end) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(end).getTime() >= today.getTime();
}

export function warrantyLabel(order: ServiceOrder): string {
  if (!order.warrantyDays || order.warrantyDays <= 0) return 'Sem garantia';
  const end = getWarrantyEnd(order);
  if (!end) return 'Garantia começa na entrega';
  const active = isWarrantyActive(order);
  return `${active ? 'Garantia ativa até' : 'Garantia encerrada em'} ${formatDate(end)}`;
}

export function orderMatchesQuery(order: ServiceOrder, query: string): boolean {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;
  const haystack = normalizeText(
    [
      order.number,
      order.clientName,
      order.clientPhone,
      order.brand,
      order.model,
      order.serial,
      order.reportedDefect,
      order.diagnosis,
      order.servicePerformed,
      order.budgetNotes,
      order.internalNotes,
      STATUS_META[order.status].label,
    ].join(' '),
  );
  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export const ORDER_FILTERS = [
  { key: 'todas', label: 'Todas', statuses: null },
  {
    key: 'andamento',
    label: 'Em andamento',
    statuses: ['recebida', 'em_analise', 'aprovada', 'em_reparo'] as OSStatus[],
  },
  { key: 'aguardando', label: 'Aguardando', statuses: ['aguardando_aprovacao'] as OSStatus[] },
  { key: 'prontas', label: 'Prontas', statuses: ['concluida'] as OSStatus[] },
  { key: 'entregues', label: 'Entregues', statuses: ['entregue'] as OSStatus[] },
  { key: 'canceladas', label: 'Canceladas', statuses: ['cancelada'] as OSStatus[] },
] as const;

export type OrderFilterKey = (typeof ORDER_FILTERS)[number]['key'];

export function filterOrders(
  orders: ServiceOrder[],
  filter: OrderFilterKey,
  query = '',
): ServiceOrder[] {
  const definition = ORDER_FILTERS.find((item) => item.key === filter) ?? ORDER_FILTERS[0];
  return orders
    .filter((order) => {
      if (definition.statuses && !definition.statuses.includes(order.status)) return false;
      return orderMatchesQuery(order, query);
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function findRelatedOrders(orders: ServiceOrder[], order: ServiceOrder): ServiceOrder[] {
  const serial = normalizeSerial(order.serial);
  if (serial.length < 3) return [];
  return orders
    .filter((candidate) => candidate.id !== order.id && normalizeSerial(candidate.serial) === serial)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
