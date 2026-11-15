import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

import type { OrderRecord } from '@/lib/records';
import { getRecordKindLabel } from '@/lib/records';
import { colors, radius, shadows } from '@/lib/theme';
import { formatCurrency, formatDate } from '@/lib/format';
import { orderTotal } from '@/lib/os-utils';
import { Tag } from './ui';

export function RecordCard({ record }: { record: OrderRecord }) {
  const { order, kind, at } = record;
  const finalized = kind === 'finalizado';
  const delivered = Boolean(order.deliveredAt);
  const total = orderTotal(order);
  const description =
    order.servicePerformed.trim() ||
    order.reportedDefect.trim() ||
    (finalized ? 'Serviço concluído' : 'Orçamento não aprovado');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${getRecordKindLabel(kind)}: ${order.number}`}
      onPress={() => router.push({ pathname: '/registro/[id]', params: { id: order.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <View style={styles.numberRow}>
            <Text style={styles.number}>{order.number}</Text>
            <Tag
              label={getRecordKindLabel(kind)}
              color={finalized ? colors.success : colors.danger}
              backgroundColor={finalized ? colors.successSoft : colors.dangerSoft}
            />
          </View>
          <Text style={styles.date}>
            {finalized ? 'Finalizada' : 'Cancelada'} em {formatDate(at)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.borderStrong} />
      </View>

      <Text style={styles.printer} numberOfLines={1}>
        {`${order.brand} ${order.model}`.trim() || 'Impressora não informada'}
      </Text>

      <Text style={styles.client} numberOfLines={1}>
        {order.clientName || 'Cliente não informado'}
        {order.serial ? `  •  S/N ${order.serial}` : ''}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.descriptionWrap}>
          <Ionicons
            name={finalized ? 'construct-outline' : 'close-circle-outline'}
            size={14}
            color={colors.textMuted}
          />
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        </View>
        {total > 0 ? <Text style={styles.total}>{formatCurrency(total)}</Text> : null}
      </View>

      {finalized || order.warrantyPending ? (
        <View style={styles.tagsRow}>
          {finalized ? (
            <Tag
              label={delivered ? 'Entregue ao cliente' : 'Aguardando entrega'}
              color={delivered ? colors.slate : colors.warning}
              backgroundColor={delivered ? colors.slateSoft : colors.warningSoft}
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
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    marginTop: 3,
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
  descriptionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  description: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
  },
  total: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
});
