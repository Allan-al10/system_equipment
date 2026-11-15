import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import type { DefectEntry, ServiceOrder, Settings } from './types';
import { STATUS_META } from './theme';
import { formatCurrency, formatDate } from './format';
import { getWarrantyEnd, itemTotal, orderTotal } from './os-utils';

export type ShareResult = 'shared' | 'copied' | 'cancelled';

interface WebShareNavigator {
  share?: (data: { title?: string; text?: string }) => Promise<void>;
}

export async function shareText(message: string, title: string): Promise<ShareResult> {
  if (Platform.OS === 'web') {
    const nav =
      typeof globalThis !== 'undefined'
        ? (globalThis as { navigator?: WebShareNavigator }).navigator
        : undefined;

    if (nav?.share) {
      try {
        await nav.share({ title, text: message });
        return 'shared';
      } catch (error) {
        if ((error as Error).name === 'AbortError') return 'cancelled';
      }
    }

    await Clipboard.setStringAsync(message);
    return 'copied';
  }

  try {
    const result = await Share.share({ message, title });
    return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
  } catch {
    await Clipboard.setStringAsync(message);
    return 'copied';
  }
}

export function buildOrderSummary(order: ServiceOrder, settings: Settings): string {
  const header = settings.companyName.trim() || 'TecPrint';
  const lines: string[] = [];

  lines.push(`*${header}*`);
  lines.push(`*OS ${order.number}* — ${STATUS_META[order.status].label}`);
  lines.push(`Entrada: ${formatDate(order.createdAt)}`);
  if (order.dueDate) lines.push(`Prazo de entrega: ${formatDate(order.dueDate)}`);

  if (settings.technicianName.trim()) {
    lines.push(`Técnico: ${settings.technicianName.trim()}`);
  }

  lines.push('');
  lines.push('*Cliente*');
  lines.push(order.clientName || 'Não informado');
  if (order.clientPhone.trim()) lines.push(order.clientPhone.trim());

  lines.push('');
  lines.push('*Equipamento*');
  lines.push(`${order.brand} ${order.model}`.trim() || 'Não informado');
  if (order.serial.trim()) lines.push(`Nº de série: ${order.serial.trim()}`);
  if (order.accessories.length) lines.push(`Acessórios: ${order.accessories.join(', ')}`);

  if (order.reportedDefect.trim()) {
    lines.push('');
    lines.push('*Anotações do cliente*');
    lines.push(order.reportedDefect.trim());
  }

  if (order.diagnosis.trim()) {
    lines.push('');
    lines.push('*Diagnóstico técnico*');
    lines.push(order.diagnosis.trim());
  }

  if (order.budgetItems.length) {
    lines.push('');
    lines.push('*Orçamento*');
    order.budgetItems.forEach((item) => {
      lines.push(
        `• ${item.kind === 'peca' ? 'Peça' : 'Serviço'} — ${item.description} (${item.quantity}x) — ${formatCurrency(itemTotal(item))}`,
      );
    });
    lines.push(`*Total: ${formatCurrency(orderTotal(order))}*`);
    if (order.budgetNotes.trim()) lines.push(`Obs.: ${order.budgetNotes.trim()}`);
  }

  if (order.servicePerformed.trim()) {
    lines.push('');
    lines.push('*Soluções*');
    lines.push(order.servicePerformed.trim());
  }

  lines.push('');
  if (order.warrantyDays > 0) {
    const end = getWarrantyEnd(order);
    lines.push(
      `*Garantia:* ${order.warrantyDays} dias${end ? ` (até ${formatDate(end)})` : ' a partir da entrega'}`,
    );
  } else {
    lines.push('*Garantia:* sem garantia');
  }

  lines.push('');
  lines.push('_Registro gerado pelo TecPrint_');

  return lines.join('\n');
}

export function buildBudgetText(order: ServiceOrder, settings: Settings): string {
  const header = settings.companyName.trim() || 'TecPrint';
  const lines: string[] = [];

  lines.push(`*${header}*`);
  lines.push(`*Orçamento — OS ${order.number}*`);
  lines.push(`Data: ${formatDate(new Date().toISOString())}`);
  lines.push('');
  lines.push(`*Cliente:* ${order.clientName || 'Não informado'}`);
  lines.push(`*Equipamento:* ${`${order.brand} ${order.model}`.trim() || 'Não informado'}`);
  if (order.serial.trim()) lines.push(`*Nº de série:* ${order.serial.trim()}`);
  if (order.reportedDefect.trim()) {
    lines.push('');
    lines.push(`*Anotações do cliente:* ${order.reportedDefect.trim()}`);
  }

  lines.push('');
  lines.push('*Itens do orçamento*');
  order.budgetItems.forEach((item) => {
    lines.push(
      `• ${item.kind === 'peca' ? 'Peça' : 'Serviço'}: ${item.description} — ${item.quantity}x ${formatCurrency(item.unitPrice)} = ${formatCurrency(itemTotal(item))}`,
    );
  });
  lines.push('');
  lines.push(`*Total: ${formatCurrency(orderTotal(order))}*`);

  if (order.budgetNotes.trim()) {
    lines.push('');
    lines.push(`Obs.: ${order.budgetNotes.trim()}`);
  }

  lines.push('');
  lines.push('Responda esta mensagem para aprovar o orçamento.');
  lines.push('_Orçamento gerado pelo TecPrint_');

  return lines.join('\n');
}

export function buildDefectText(defect: DefectEntry): string {
  const lines: string[] = [];
  lines.push(`*${defect.title}*`);
  lines.push(`Categoria: ${defect.category}`);
  if (defect.symptoms.trim()) {
    lines.push('');
    lines.push('*Sintomas*');
    lines.push(defect.symptoms.trim());
  }
  if (defect.causes.trim()) {
    lines.push('');
    lines.push('*Causas comuns*');
    lines.push(defect.causes.trim());
  }
  if (defect.solution.trim()) {
    lines.push('');
    lines.push('*Como resolver*');
    lines.push(defect.solution.trim());
  }
  if (defect.tags.length) {
    lines.push('');
    lines.push(`Tags: ${defect.tags.join(', ')}`);
  }
  lines.push('');
  lines.push('_Consulta do TecPrint_');
  return lines.join('\n');
}
