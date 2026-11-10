import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

import { useData } from '@/lib/data-context';
import { colors, radius, shadows } from '@/lib/theme';
import { formatLongDate } from '@/lib/format';
import { isWarrantyActive } from '@/lib/os-utils';
import { OrderCard } from '@/components/OrderCard';
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  ScreenHeader,
  SectionTitle,
  StatCard,
} from '@/components/ui';

export default function HomeScreen() {
  const { orders, settings } = useData();

  const firstName = settings.technicianName.trim().split(/\s+/)[0];
  const greeting = firstName ? `Olá, ${firstName}` : 'Olá, técnico';

  const stats = useMemo(() => {
    const inProgress = orders.filter((order) =>
      ['recebida', 'em_analise', 'aprovada', 'em_reparo'].includes(order.status),
    ).length;
    const awaiting = orders.filter((order) => order.status === 'aguardando_aprovacao').length;
    const ready = orders.filter((order) => order.status === 'concluida').length;
    const warranties = orders.filter(
      (order) => order.status === 'entregue' && isWarrantyActive(order),
    ).length;

    return { inProgress, awaiting, ready, warranties };
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
    [orders],
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={greeting}
        subtitle={formatLongDate()}
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroGlowA} />
          <View style={styles.heroGlowB} />

          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="print-outline" size={22} color={colors.white} />
            </View>
            <View style={styles.heroPill}>
              <View style={styles.heroPillDot} />
              <Text style={styles.heroPillText}>Oficina ativa</Text>
            </View>
          </View>

          <Text style={styles.heroLabel}>OS EM ANDAMENTO</Text>
          <View style={styles.heroNumberRow}>
            <Text style={styles.heroNumber}>{stats.inProgress}</Text>
            <Text style={styles.heroNumberHint}>
              {stats.inProgress === 1 ? 'ordem na oficina' : 'ordens na oficina'}
            </Text>
          </View>

          <View style={styles.heroActions}>
            <Button
              label="Nova OS"
              icon="add"
              variant="inverse"
              size="sm"
              onPress={() => router.push('/nova-os')}
            />
            <Button
              label="Ver ordens"
              iconRight="arrow-forward"
              variant="inverseGhost"
              size="sm"
              onPress={() => router.push('/ordens')}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="time-outline"
            value={stats.awaiting}
            label="Aguardando aprovação"
            color={colors.orange}
            backgroundColor={colors.orangeSoft}
            onPress={() => router.push({ pathname: '/ordens', params: { filter: 'aguardando' } })}
          />
          <StatCard
            icon="checkmark-done-outline"
            value={stats.ready}
            label="Prontas p/ entrega"
            color={colors.success}
            backgroundColor={colors.successSoft}
            onPress={() => router.push({ pathname: '/ordens', params: { filter: 'prontas' } })}
          />
          <StatCard
            icon="shield-checkmark-outline"
            value={stats.warranties}
            label="Garantias ativas"
            color={colors.primary}
            backgroundColor={colors.primarySoft}
            onPress={() => router.push({ pathname: '/ordens', params: { filter: 'entregues' } })}
          />
        </View>

        <View style={styles.sectionHeader}>
          <SectionTitle title="Ordens recentes" subtitle="Últimas atualizações da oficina" />
          {orders.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/ordens')}
              hitSlop={8}
              style={styles.seeAll}
            >
              <Text style={styles.seeAllText}>Ver todas</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>

        {recentOrders.length > 0 ? (
          <View style={styles.orderList}>
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        ) : (
          <Card>
            <EmptyState
              icon="file-tray-outline"
              title="Nenhuma OS registrada"
              description="Ao receber uma impressora, abra uma OS para iniciar o diagnóstico e o orçamento."
              actionLabel="Criar primeira OS"
              onAction={() => router.push('/nova-os')}
            />
          </Card>
        )}

        <Card style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.tipTitle}>Garantia sem dor de cabeça</Text>
            <Text style={styles.tipText}>
              Registre o nº de série e o serviço executado. Se a impressora voltar, todo o
              histórico dela estará aqui.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 14,
  },
  flex: { flex: 1 },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: 18,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroGlowA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -70,
    right: -40,
  },
  heroGlowB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -60,
    left: 40,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  heroPillText: {
    color: colors.white,
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 18,
  },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
    marginTop: 2,
  },
  heroNumber: {
    color: colors.white,
    fontSize: 50,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 56,
  },
  heroNumberHint: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 9,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  orderList: {
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.successSoft,
    borderColor: '#BBF7D0',
  },
  tipIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  tipText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 3,
  },
});
