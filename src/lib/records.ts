import type { ServiceOrder } from './types';
import { orderMatchesQuery } from './os-utils';

export type RecordKind = 'finalizado' | 'cancelado';
export type RecordFilterKey = 'todos' | 'entregues' | 'aguardando' | 'cancelados';

export interface OrderRecord {
  order: ServiceOrder;
  kind: RecordKind;
  delivered: boolean;
  at: string;
}

export interface RecordSummary {
  total: number;
  delivered: number;
  awaitingDelivery: number;
  canceled: number;
}

export function getRecordKind(order: ServiceOrder): RecordKind | null {
  if (order.status === 'recusado') return 'cancelado';
  if (order.status === 'pronto') return 'finalizado';
  return null;
}

export function getRecordLabel(record: OrderRecord): string {
  if (record.kind === 'cancelado') return 'Cancelada';
  return record.delivered ? 'Entregue' : 'Aguardando entrega';
}

function recordDateForKind(order: ServiceOrder, kind: RecordKind): string {
  if (kind === 'cancelado') return order.canceledAt ?? order.updatedAt;
  return order.deliveredAt ?? order.completedAt ?? order.updatedAt;
}

export function getRecordDate(order: ServiceOrder): string | null {
  const kind = getRecordKind(order);
  return kind ? recordDateForKind(order, kind) : null;
}

export function getOrderRecord(order: ServiceOrder): OrderRecord | null {
  const kind = getRecordKind(order);
  if (!kind) return null;

  return {
    order,
    kind,
    delivered: kind === 'finalizado' && Boolean(order.deliveredAt),
    at: recordDateForKind(order, kind),
  };
}

export function getOrderRecords(orders: ServiceOrder[]): OrderRecord[] {
  return orders
    .map(getOrderRecord)
    .filter((record): record is OrderRecord => record !== null)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function getRecordSummary(records: OrderRecord[]): RecordSummary {
  let delivered = 0;
  let awaitingDelivery = 0;
  let canceled = 0;

  for (const record of records) {
    if (record.kind === 'cancelado') {
      canceled += 1;
    } else if (record.delivered) {
      delivered += 1;
    } else {
      awaitingDelivery += 1;
    }
  }

  return {
    total: records.length,
    delivered,
    awaitingDelivery,
    canceled,
  };
}

export function filterRecords(
  records: OrderRecord[],
  filter: RecordFilterKey,
  query: string,
): OrderRecord[] {
  return records.filter((record) => {
    if (filter === 'entregues' && !record.delivered) return false;
    if (filter === 'aguardando' && (record.kind !== 'finalizado' || record.delivered)) {
      return false;
    }
    if (filter === 'cancelados' && record.kind !== 'cancelado') return false;
    return orderMatchesQuery(record.order, query);
  });
}

export function isRecordFilterKey(value: string | undefined): value is RecordFilterKey {
  return (
    value === 'todos' ||
    value === 'entregues' ||
    value === 'aguardando' ||
    value === 'cancelados'
  );
}
