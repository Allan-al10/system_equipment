import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

import { useData } from '@/lib/data-context';
import { CATEGORY_META, colors, radius, shadows } from '@/lib/theme';
import { DEFECT_CATEGORIES, type DefectCategory, type DefectEntry } from '@/lib/types';
import { normalizeText } from '@/lib/format';
import { Chip, EmptyState, IconButton, ScreenHeader, SearchBar, Tag } from '@/components/ui';

type CategoryFilter = 'Todas' | DefectCategory;

function DefectCard({ defect }: { defect: DefectEntry }) {
  const meta = CATEGORY_META[defect.category];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/defeito/[id]', params: { id: defect.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.categoryIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.category, { color: meta.color }]}>{defect.category}</Text>
          <Text style={styles.title}>{defect.title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.borderStrong} />
      </View>

      {defect.symptoms ? (
        <Text style={styles.symptoms} numberOfLines={2}>
          {defect.symptoms}
        </Text>
      ) : null}

      {defect.tags.length ? (
        <View style={styles.tags}>
          {defect.tags.slice(0, 3).map((tag) => (
            <Tag key={tag} label={tag} color={meta.color} backgroundColor={meta.bg} />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export default function DefectsScreen() {
  const { defects } = useData();
  const [category, setCategory] = useState<CategoryFilter>('Todas');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return defects
      .filter((defect) => {
        if (category !== 'Todas' && defect.category !== category) return false;
        if (!normalizedQuery) return true;

        const haystack = normalizeText(
          [
            defect.title,
            defect.category,
            defect.symptoms,
            defect.causes,
            defect.solution,
            defect.tags.join(' '),
          ].join(' '),
        );

        return normalizedQuery
          .split(/\s+/)
          .filter(Boolean)
          .every((term) => haystack.includes(term));
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [defects, category, query]);

  const hasFilters = category !== 'Todas' || query.trim().length > 0;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Defeitos & soluções"
        subtitle={`${defects.length} ${defects.length === 1 ? 'referência' : 'referências'} de diagnóstico`}
        right={
          <IconButton
            icon="add"
            accessibilityLabel="Cadastrar novo defeito"
            color={colors.white}
            backgroundColor={colors.primary}
            onPress={() => router.push('/defeito-form')}
          />
        }
      />

      <View style={styles.controls}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Sintoma, causa, solução ou tag..."
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Chip
            label="Todas"
            selected={category === 'Todas'}
            onPress={() => setCategory('Todas')}
          />
          {DEFECT_CATEGORIES.map((item) => {
            const meta = CATEGORY_META[item];
            return (
              <Chip
                key={item}
                label={item}
                icon={meta.icon}
                color={meta.color}
                selected={category === item}
                selectedBackgroundColor={meta.color}
                onPress={() => setCategory(item)}
              />
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(defect) => defect.id}
        renderItem={({ item }) => <DefectCard defect={item} />}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Nenhum defeito encontrado"
            description={
              hasFilters
                ? 'Tente outro termo ou remova os filtros aplicados.'
                : 'Cadastre um defeito para consultar depois.'
            }
            actionLabel={hasFilters ? 'Limpar filtros' : 'Cadastrar defeito'}
            onAction={
              hasFilters
                ? () => {
                    setCategory('Todas');
                    setQuery('');
                  }
                : () => router.push('/defeito-form')
            }
          />
        }
        ListFooterComponent={
          filtered.length > 0 ? (
            <Text style={styles.footerText}>
              {filtered.length === 1
                ? '1 referência exibida'
                : `${filtered.length} referências exibidas`}
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
  flex: { flex: 1 },
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    ...shadows.card,
  },
  pressed: { opacity: 0.86 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  symptoms: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  footerText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11.5,
    marginTop: 6,
    marginBottom: 8,
  },
});
