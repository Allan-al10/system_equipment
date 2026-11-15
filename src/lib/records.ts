import type { ServiceOrder } from './types';
import { orderMatchesQuery } from './os-utils';

export type RecordKind = 'finalizado' | 'cancelado';
export type RecordFilterKey = 'todos' | 'finalizados' | 'cancelados';

export interface OrderRecord {
  order: ServiceOrder;
  kind: RecordKind;
  at: string;
}

export interface RecordSummary {
  total: number;
  finalized: number;
  canceled: number;
}

export function getRecordKind(order: ServiceOrder): RecordKind | null {
  if (order.status === 'recusado') return 'cancelado';
  if (order.status === 'pronto') return 'finalizado';
  return null;
}

export function getRecordKindLabel(kind: RecordKind): string {
  return kind === 'finalizado' ? 'Finalizada' : 'Cancelada';
}

function recordDateForKind(order: ServiceOrder, kind: RecordKind): string {
  if (kind === 'cancelado') return order.canceledAt ?? order.updatedAt;
  return order.completedAt ?? order.deliveredAt ?? order.updatedAt;
}

export function getRecordDate(order: ServiceOrder): string | null {
  const kind = getRecordKind(order);
  return kind ? recordDateForKind(order, kind) : null;
}

export function getOrderRecord(order: ServiceOrder): OrderRecord | null {
  const kind = getRecordKind(order);
  if (!kind) return null;
  return { order, kind, at: recordDateForKind(order, kind) };
}

export function getOrderRecords(orders: ServiceOrder[]): OrderRecord[] {
  return orders
    .map(getOrderRecord)
    .filter((record): record is OrderRecord => record !== null)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function getRecordSummary(records: OrderRecord[]): RecordSummary {
  let finalized = 0;
  let canceled = 0;

  for (const record of records) {
    if (record.kind === 'finalizado') finalized += 1;
    else canceled += 1;
  }

  return { total: records.length, finalized, canceled };
}

export function filterRecords(
  records: OrderRecord[],
  filter: RecordFilterKey,
  query: string,
): OrderRecord[] {
  return records.filter((record) => {
    if (filter === 'finalizados' && record.kind !== 'finalizado') return false;
    if (filter === 'cancelados' && record.kind !== 'cancelado') return false;
    return orderMatchesQuery(record.order, query);
  });
}
