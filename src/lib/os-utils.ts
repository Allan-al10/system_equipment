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

const DAY_MS = 24 * 60 * 60 * 1000;

export function isOrderOverdue(order: ServiceOrder, reference = new Date()): boolean {
  if (!order.dueDate || order.deliveredAt || order.status === 'recusado') return false;
  const dueDate = new Date(order.dueDate);
  if (Number.isNaN(dueDate.getTime())) return false;
  dueDate.setHours(23, 59, 59, 999);
  return dueDate.getTime() < reference.getTime();
}

export function overdueDays(order: ServiceOrder, reference = new Date()): number {
  if (!order.dueDate || !isOrderOverdue(order, reference)) return 0;
  const dueDate = new Date(order.dueDate);
  const today = new Date(reference);
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((today.getTime() - dueDate.getTime()) / DAY_MS));
}

export function isOrderPending(order: ServiceOrder, reference = new Date()): boolean {
  return isOrderOverdue(order, reference) || Boolean(order.warrantyPending);
}

export interface PendingSummary {
  overdue: number;
  warranty: number;
  total: number;
}

export function getPendingSummary(orders: ServiceOrder[]): PendingSummary {
  let overdue = 0;
  let warranty = 0;
  let total = 0;
  const reference = new Date();

  for (const order of orders) {
    const isOverdue = isOrderOverdue(order, reference);
    const hasWarrantyPending = Boolean(order.warrantyPending);
    if (isOverdue) overdue += 1;
    if (hasWarrantyPending) warranty += 1;
    if (isOverdue || hasWarrantyPending) total += 1;
  }

  return { overdue, warranty, total };
}

export function orderMatchesQuery(
  order: ServiceOrder,
  query: string,
  reference = new Date(),
): boolean {
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
      order.dueDate ? `prazo ${formatDate(order.dueDate)}` : '',
      isOrderPending(order, reference) ? 'pendencia pendente' : '',
      isOrderOverdue(order, reference) ? 'atrasada atrasado' : '',
      order.warrantyPending ? 'garantia a fazer' : '',
      order.warrantyPendingNote,
      STATUS_META[order.status].label,
    ].join(' '),
  );
  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export const ORDER_FILTERS = [
  { key: 'todas', label: 'Todas', statuses: null, delivered: null, pending: null },
  {
    key: 'pendencias',
    label: 'Pendências',
    statuses: null,
    delivered: null,
    pending: true,
  },
  {
    key: 'orcamento',
    label: 'Orçamento',
    statuses: ['orcamento'] as OSStatus[],
    delivered: null,
    pending: null,
  },
  {
    key: 'orcamento_realizado',
    label: 'Orç. realizado',
    statuses: ['orcamento_realizado'] as OSStatus[],
    delivered: null,
    pending: null,
  },
  {
    key: 'esperando_resposta',
    label: 'Esperando resposta',
    statuses: ['esperando_resposta'] as OSStatus[],
    delivered: null,
    pending: null,
  },
  {
    key: 'autorizado',
    label: 'Autorizado',
    statuses: ['autorizado'] as OSStatus[],
    delivered: null,
    pending: null,
  },
  {
    key: 'pronto',
    label: 'Pronto',
    statuses: ['pronto'] as OSStatus[],
    delivered: false,
    pending: null,
  },
  {
    key: 'recusado',
    label: 'Recusado',
    statuses: ['recusado'] as OSStatus[],
    delivered: null,
    pending: null,
  },
  {
    key: 'entregues',
    label: 'Entregues',
    statuses: ['pronto'] as OSStatus[],
    delivered: true,
    pending: null,
  },
] as const;

export type OrderFilterKey = (typeof ORDER_FILTERS)[number]['key'];

export function filterOrders(
  orders: ServiceOrder[],
  filter: OrderFilterKey,
  query = '',
): ServiceOrder[] {
  const definition = ORDER_FILTERS.find((item) => item.key === filter) ?? ORDER_FILTERS[0];
  const reference = new Date();
  return orders
    .filter((order) => {
      if (definition.statuses && !definition.statuses.includes(order.status)) return false;
      if (definition.delivered === true && !order.deliveredAt) return false;
      if (definition.delivered === false && order.deliveredAt) return false;
      if (definition.pending && !isOrderPending(order, reference)) return false;
      return orderMatchesQuery(order, query, reference);
    })
    .sort((a, b) => {
      if (filter === 'pendencias') {
        const aOverdue = isOrderOverdue(a, reference);
        const bOverdue = isOrderOverdue(b, reference);
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        if (aOverdue && bOverdue) {
          return new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime();
        }
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

export function findRelatedOrders(orders: ServiceOrder[], order: ServiceOrder): ServiceOrder[] {
  const serial = normalizeSerial(order.serial);
  if (serial.length < 3) return [];
  return orders
    .filter((candidate) => candidate.id !== order.id && normalizeSerial(candidate.serial) === serial)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
