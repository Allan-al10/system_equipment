import Ionicons from '@expo/vector-icons/Ionicons';

import type { DefectCategory, OSStatus } from './types';

export type IconName = keyof typeof Ionicons.glyphMap;

export const colors = {
  bg: '#F3F6FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  surfaceMuted: '#EEF2F7',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  primary: '#1D4ED8',
  primaryDark: '#172554',
  primarySoft: '#DBEAFE',
  primaryTint: '#EFF6FF',
  accent: '#0EA5E9',
  accentSoft: '#E0F2FE',
  success: '#15803D',
  successSoft: '#DCFCE7',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  orange: '#C2410C',
  orangeSoft: '#FFEDD5',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  dangerSolid: '#DC2626',
  purple: '#6D28D9',
  purpleSoft: '#EDE9FE',
  teal: '#0F766E',
  tealSoft: '#CCFBF1',
  pink: '#BE185D',
  pinkSoft: '#FCE7F3',
  slate: '#475569',
  slateSoft: '#E2E8F0',
  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.48)',
  shadow: '#0F172A',
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 8,
  },
} as const;

export interface StatusMeta {
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  icon: IconName;
  description: string;
}

export const STATUS_META: Record<OSStatus, StatusMeta> = {
  orcamento: {
    label: 'Orçamento',
    shortLabel: 'Orçamento',
    color: colors.primary,
    bg: colors.primarySoft,
    icon: 'calculator-outline',
    description: 'Equipamento registrado. Prepare o diagnóstico e o orçamento.',
  },
  orcamento_realizado: {
    label: 'Orçamento realizado',
    shortLabel: 'Orç. realizado',
    color: colors.accent,
    bg: colors.accentSoft,
    icon: 'document-text-outline',
    description: 'Peças e serviços orçados. Revise e envie ao cliente.',
  },
  esperando_resposta: {
    label: 'Esperando resposta',
    shortLabel: 'Esperando',
    color: colors.orange,
    bg: colors.orangeSoft,
    icon: 'time-outline',
    description: 'Orçamento enviado. Aguardando a resposta do cliente.',
  },
  autorizado: {
    label: 'Autorizado',
    shortLabel: 'Autorizado',
    color: colors.teal,
    bg: colors.tealSoft,
    icon: 'checkmark-circle-outline',
    description: 'Cliente autorizou o serviço. Reparo liberado.',
  },
  pronto: {
    label: 'Pronto',
    shortLabel: 'Pronto',
    color: colors.success,
    bg: colors.successSoft,
    icon: 'checkmark-done-outline',
    description: 'Serviço concluído. Equipamento pronto para entrega.',
  },
  recusado: {
    label: 'Recusado',
    shortLabel: 'Recusado',
    color: colors.danger,
    bg: colors.dangerSoft,
    icon: 'close-circle-outline',
    description: 'Orçamento recusado pelo cliente.',
  },
};

export const STATUS_FLOW: OSStatus[] = [
  'orcamento',
  'orcamento_realizado',
  'esperando_resposta',
  'autorizado',
  'pronto',
];

export const ALL_STATUSES: OSStatus[] = [...STATUS_FLOW, 'recusado'];

export const NEXT_ACTION_LABEL: Partial<Record<OSStatus, string>> = {
  orcamento_realizado: 'Finalizar orçamento',
  esperando_resposta: 'Enviar ao cliente',
  autorizado: 'Registrar autorização',
  pronto: 'Concluir serviço',
};

export function getNextStatus(status: OSStatus): OSStatus | null {
  const index = STATUS_FLOW.indexOf(status);
  if (index < 0 || index >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1];
}

export interface CategoryMeta {
  color: string;
  bg: string;
  icon: IconName;
}

export const CATEGORY_META: Record<DefectCategory, CategoryMeta> = {
  Energia: { color: colors.warning, bg: colors.warningSoft, icon: 'flash-outline' },
  Impressão: { color: colors.primary, bg: colors.primarySoft, icon: 'print-outline' },
  Scanner: { color: colors.purple, bg: colors.purpleSoft, icon: 'scan-outline' },
  Papel: { color: colors.teal, bg: colors.tealSoft, icon: 'documents-outline' },
  Consumíveis: { color: colors.pink, bg: colors.pinkSoft, icon: 'color-fill-outline' },
  Mecânica: { color: colors.slate, bg: colors.slateSoft, icon: 'cog-outline' },
  Conectividade: { color: colors.accent, bg: colors.accentSoft, icon: 'wifi-outline' },
  Outros: { color: colors.textMuted, bg: colors.surfaceMuted, icon: 'ellipsis-horizontal-circle-outline' },
};
