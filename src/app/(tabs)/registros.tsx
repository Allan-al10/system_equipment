import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';

import { useData } from '@/lib/data-context';
import { colors, radius } from '@/lib/theme';
import type { IconName } from '@/lib/theme';
import {
  filterRecords,
  getOrderRecords,
  getRecordSummary,
  isRecordFilterKey,
  type RecordFilterKey,
} from '@/lib/records';
import { RecordCard } from '@/components/RecordCard';
import { Chip, EmptyState, ScreenHeader, SearchBar } from '@/components/ui';

const RECORD_FILTERS: {
  key: RecordFilterKey;
  label: string;
  color: string;
  selectedBackgroundColor: string;
}[] = [
  { key: 'todos', label: 'Todos', color: colors.primary, selectedBackgroundColor: colors.primary },
  {
    key: 'entregues',
    label: 'Entregues',
    color: colors.teal,
    selectedBackgroundColor: colors.teal,
  },
  {
    key: 'aguardando',
    label: 'Aguardando entrega',
    color: colors.warning,
    selectedBackgroundColor: colors.warning,
  },
  {
    key: 'cancelados',
    label: 'Cancelados',
    color: colors.danger,
    selectedBackgroundColor: colors.danger,
  },
];

export default function RecordsScreen() {
  const { orders } = useData();
  const params = useLocalSearchParams<{ filter?: string }>();
  const filter: RecordFilterKey = isRecordFilterKey(params.filter) ? params.filter : 'todos';
  const [query, setQuery] = useState('');

  const setFilter = (next: RecordFilterKey) => {
    router.setParams({ filter: next });
  };

  const records = useMemo(() => getOrderRecords(orders), [orders]);
  const summary = useMemo(() => getRecordSummary(records), [records]);
  const filtered = useMemo(
    () => filterRecords(records, filter, query),
    [records, filter, query],
  );

  const hasFilters = filter !== 'todos' || query.trim().length > 0;
  const queryActive = query.trim().length > 0;

  const clearFilters = () => {
    setQuery('');
    setFilter('todos');
  };

  const countForFilter = (key: RecordFilterKey): number => {
    if (key === 'entregues') return summary.delivered;
    if (key === 'aguardando') return summary.awaitingDelivery;
    if (key === 'cancelados') return summary.canceled;
    return summary.total;
  };

  let emptyIcon: IconName = 'search-outline';
  let emptyTitle = 'Nenhum registro encontrado';
  let emptyDescription = 'Tente outro termo de busca ou remova os filtros aplicados.';
  let emptyActionLabel: string | undefined = hasFilters ? 'Limpar filtros' : undefined;
  let emptyAction: (() => void) | undefined = hasFilters ? clearFilters : undefined;

  if (records.length === 0) {
    emptyIcon = 'archive-outline';
    emptyTitle = 'Nenhum registro ainda';
    emptyDescription =
      'Quando uma OS pronta for entregue ou uma OS for cancelada, o registro completo do serviço aparecerá aqui.';
    emptyActionLabel = 'Ver ordens';
    emptyAction = () => router.push('/ordens');
  } else if (!queryActive && filter === 'entregues') {
    emptyIcon = 'bag-check-outline';
    emptyTitle = 'Nenhum equipamento entregue ainda';
    emptyDescription =
      'Ao registrar a entrega de uma OS pronta, o serviço aparecerá aqui para consultas em retornos e garantias.';
    emptyActionLabel = 'Ver ordens';
    emptyAction = () => router.push('/ordens');
  } else if (!queryActive && filter === 'aguardando') {
    emptyIcon = 'time-outline';
    emptyTitle = 'Nenhum equipamento aguardando entrega';
    emptyDescription =
      'OS prontas aparecem aqui até a entrega ser registrada. Depois, passam para o grupo Entregues.';
    emptyActionLabel = 'Ver prontas';
    emptyAction = () => router.push({ pathname: '/ordens', params: { filter: 'pronto' } });
  } else if (!queryActive && filter === 'cancelados') {
    emptyIcon = 'close-circle-outline';
    emptyTitle = 'Nenhum cancelamento registrado';
    emptyDescription =
      'OS recusadas aparecem aqui com o registro completo do orçamento e do equipamento.';
    emptyActionLabel = 'Ver ordens';
    emptyAction = () => router.push('/ordens');
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Registros"
        subtitle={
          records.length === 0
            ? 'Nenhum registro ainda'
            : `${filtered.length} de ${records.length} ${
                records.length === 1 ? 'registro' : 'registros'
              }`
        }
      />

      <View style={styles.controls}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Cliente, equipamento, nº de série ou serviço..."
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {RECORD_FILTERS.map((item) => (
            <Chip
              key={item.key}
              label={`${item.label} (${countForFilter(item.key)})`}
              color={item.color}
              selected={filter === item.key}
              selectedBackgroundColor={item.selectedBackgroundColor}
              onPress={() => setFilter(item.key)}
            />
          ))}
        </ScrollView>
        {filter === 'entregues' ? (
          <View style={styles.deliveredBanner}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
            <Text style={styles.deliveredBannerText}>
              Serviços entregues guardados para consulta. Busque pelo nº de série para localizar
              retornos e garantias.
            </Text>
          </View>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(record) => record.order.id}
        renderItem={({ item }) => <RecordCard record={item} />}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={emptyAction}
          />
        }
        ListFooterComponent={
          filtered.length > 0 ? (
            <Text style={styles.footerText}>
              {filtered.length === 1
                ? '1 registro exibido'
                : `${filtered.length} registros exibidos`}
            </Text>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  controls: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 10,
  },
  filterRow: {
    gap: 8,
    paddingRight: 16,
  },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deliveredBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 30,
    gap: 12,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11.5,
    marginTop: 6,
    marginBottom: 8,
  },
});
