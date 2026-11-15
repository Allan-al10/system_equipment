import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

import type { ServiceOrder } from '@/lib/types';
import { colors, radius, shadows } from '@/lib/theme';
import { formatCurrency, formatDate } from '@/lib/format';
import { isOrderOverdue, orderTotal, overdueDays } from '@/lib/os-utils';
import { StatusBadge, Tag } from './ui';

export function OrderCard({ order }: { order: ServiceOrder }) {
  const total = orderTotal(order);
  const overdue = isOrderOverdue(order);
  const lateDays = overdue ? overdueDays(order) : 0;
  const hasPending = overdue || order.warrantyPending;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/os/[id]', params: { id: order.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={styles.number}>{order.number}</Text>
          <Text style={styles.date}>
            Atualizada em {formatDate(order.updatedAt)}
            {order.dueDate && !order.deliveredAt
              ? ` • Prazo ${formatDate(order.dueDate)}`
              : ''}
          </Text>
        </View>
        <StatusBadge status={order.status} compact />
      </View>

      <Text style={styles.printer} numberOfLines={1}>
        {`${order.brand} ${order.model}`.trim() || 'Impressora não informada'}
      </Text>

      <Text style={styles.client} numberOfLines={1}>
        {order.clientName || 'Cliente não informado'}
        {order.serial ? `  •  S/N ${order.serial}` : ''}
      </Text>

      {hasPending ? (
        <View style={styles.pendingRow}>
          {overdue ? (
            <Tag
              label={lateDays > 0 ? `Atrasada há ${lateDays}d` : 'Atrasada'}
              color={colors.danger}
              backgroundColor={colors.dangerSoft}
            />
          ) : null}
          {order.warrantyPending ? (
            <Tag
              label="Garantia a fazer"
              color={colors.purple}
              backgroundColor={colors.purpleSoft}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.bottomRow}>
        <View style={styles.defectWrap}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.defect} numberOfLines={1}>
            {order.reportedDefect || 'Sem anotações do cliente'}
          </Text>
        </View>
        {order.deliveredAt ? (
          <Tag label="Entregue" color={colors.slate} backgroundColor={colors.slateSoft} />
        ) : null}
        {total > 0 ? <Text style={styles.total}>{formatCurrency(total)}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    ...shadows.card,
  },
  pressed: { opacity: 0.86 },
  flex: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  number: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  date: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  printer: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 10,
    letterSpacing: -0.2,
  },
  client: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 3,
  },
  pendingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  defectWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  defect: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
  },
  total: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
});
