import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useData } from '@/lib/data-context';
import { colors } from '@/lib/theme';
import {
  filterOrders,
  ORDER_FILTERS,
  type OrderFilterKey,
} from '@/lib/os-utils';
import { OrderCard } from '@/components/OrderCard';
import {
  Chip,
  EmptyState,
  IconButton,
  ScreenHeader,
  SearchBar,
} from '@/components/ui';

function isFilterKey(value: string | undefined): value is OrderFilterKey {
  return ORDER_FILTERS.some((filter) => filter.key === value);
}

export default function OrdersScreen() {
  const { orders } = useData();
  const params = useLocalSearchParams<{ filter?: string }>();
  const filter: OrderFilterKey = isFilterKey(params.filter) ? params.filter : 'todas';
  const [query, setQuery] = useState('');

  const setFilter = (next: OrderFilterKey) => {
    router.setParams({ filter: next });
  };

  const filtered = useMemo(() => filterOrders(orders, filter, query), [orders, filter, query]);

  const hasFilters = filter !== 'todas' || query.trim().length > 0;

  const clearFilters = () => {
    setFilter('todas');
    setQuery('');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Ordens de serviço"
        subtitle={
          orders.length === 0
            ? 'Nenhuma OS registrada'
            : `${filtered.length} de ${orders.length} ${orders.length === 1 ? 'ordem' : 'ordens'}`
        }
        right={
          <IconButton
            icon="add"
            accessibilityLabel="Abrir nova OS"
            color={colors.white}
            backgroundColor={colors.primary}
            onPress={() => router.push('/nova-os')}
          />
        }
      />

      <View style={styles.controls}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Cliente, modelo, nº de série ou OS..."
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {ORDER_FILTERS.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              selected={filter === item.key}
              onPress={() => setFilter(item.key)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={orders.length === 0 ? 'file-tray-outline' : 'search-outline'}
            title={orders.length === 0 ? 'Nenhuma OS registrada' : 'Nenhuma OS encontrada'}
            description={
              orders.length === 0
                ? 'Abra a primeira ordem de serviço ao receber uma impressora.'
                : 'Tente outro termo de busca ou remova os filtros aplicados.'
            }
            actionLabel={orders.length === 0 ? 'Abrir nova OS' : hasFilters ? 'Limpar filtros' : undefined}
            onAction={
              orders.length === 0 ? () => router.push('/nova-os') : hasFilters ? clearFilters : undefined
            }
          />
        }
        ListFooterComponent={
          filtered.length > 0 ? (
            <Text style={styles.footerText}>
              {filtered.length === 1 ? '1 ordem exibida' : `${filtered.length} ordens exibidas`}
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
