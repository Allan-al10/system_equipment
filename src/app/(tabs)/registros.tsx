import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useData } from '@/lib/data-context';
import { colors } from '@/lib/theme';
import {
  filterRecords,
  getOrderRecords,
  getRecordSummary,
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
    key: 'finalizados',
    label: 'Finalizados',
    color: colors.success,
    selectedBackgroundColor: colors.success,
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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RecordFilterKey>('todos');

  const records = useMemo(() => getOrderRecords(orders), [orders]);
  const summary = useMemo(() => getRecordSummary(records), [records]);
  const filtered = useMemo(
    () => filterRecords(records, filter, query),
    [records, filter, query],
  );

  const hasFilters = filter !== 'todos' || query.trim().length > 0;

  const clearFilters = () => {
    setFilter('todos');
    setQuery('');
  };

  const countForFilter = (key: RecordFilterKey): number => {
    if (key === 'finalizados') return summary.finalized;
    if (key === 'cancelados') return summary.canceled;
    return summary.total;
  };

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
          placeholder="Cliente, equipamento, OS ou serviço..."
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
            icon={records.length === 0 ? 'archive-outline' : 'search-outline'}
            title={
              records.length === 0 ? 'Nenhum registro ainda' : 'Nenhum registro encontrado'
            }
            description={
              records.length === 0
                ? 'Quando uma OS for finalizada ou cancelada, o registro completo do equipamento aparecerá aqui.'
                : 'Tente outro termo de busca ou remova os filtros aplicados.'
            }
            actionLabel={
              records.length === 0 ? 'Ver ordens' : hasFilters ? 'Limpar filtros' : undefined
            }
            onAction={
              records.length === 0
                ? () => router.push('/ordens')
                : hasFilters
                  ? clearFilters
                  : undefined
            }
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
