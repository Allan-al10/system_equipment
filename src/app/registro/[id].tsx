import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';

import { useData } from '@/lib/data-context';
import { useToast } from '@/components/Toast';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  IconButton,
  InfoRow,
  ScreenHeader,
  SectionTitle,
  StatusBadge,
  Tag,
} from '@/components/ui';
import { colors } from '@/lib/theme';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import {
  getWarrantyEnd,
  isWarrantyActive,
  itemTotal,
  orderTotal,
  warrantyLabel,
} from '@/lib/os-utils';
import { getOrderRecord, getRecordKindLabel } from '@/lib/records';
import { buildOrderSummary, shareText } from '@/lib/share';

function TextBlock({ label, value }: { label: string; value: string }) {
  const content = value.trim();

  return (
    <View style={styles.textBlock}>
      <Text style={styles.textBlockLabel}>{label}</Text>
      <Text style={[styles.textBlockValue, !content && styles.textBlockEmpty]}>
        {content || 'Não informado'}
      </Text>
    </View>
  );
}

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, settings } = useData();
  const toast = useToast();

  const order = orders.find((item) => item.id === id);
  const record = order ? getOrderRecord(order) : null;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/registros');
  };

  if (!order) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Registro" onBack={goBack} />
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="archive-outline"
            title="Registro não encontrado"
            description="Esta OS não está mais disponível no aplicativo."
            actionLabel="Ver registros"
            onAction={() => router.replace('/registros')}
          />
        </View>
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Registro" subtitle={order.number} onBack={goBack} />
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="refresh-outline"
            title="Esta OS saiu do arquivo"
            description="Ela foi reaberta e voltou para o fluxo de ordens em andamento."
            actionLabel="Abrir OS"
            onAction={() =>
              router.replace({ pathname: '/os/[id]', params: { id: order.id } })
            }
          />
        </View>
      </View>
    );
  }

  const finalized = record.kind === 'finalizado';
  const kindLabel = getRecordKindLabel(record.kind);
  const kindColor = finalized ? colors.success : colors.danger;
  const kindBg = finalized ? colors.successSoft : colors.dangerSoft;
  const kindIcon = finalized ? 'checkmark-done-outline' : 'close-circle-outline';
  const delivered = Boolean(order.deliveredAt);
  const total = orderTotal(order);
  const warrantyApplies = order.status !== 'recusado';
  const warrantyEnd = warrantyApplies ? getWarrantyEnd(order) : null;
  const warrantyPeriodText = !warrantyApplies
    ? 'Não se aplica'
    : order.warrantyDays > 0
      ? `${order.warrantyDays} dias`
      : 'Sem garantia';
  const warrantyText = warrantyApplies
    ? warrantyLabel(order)
    : 'Não se aplica (OS cancelada)';
  const warrantyTone =
    warrantyApplies && order.warrantyDays > 0 && warrantyEnd
      ? isWarrantyActive(order)
        ? colors.success
        : colors.danger
      : colors.textMuted;
  const deliveryTagLabel = finalized
    ? delivered
      ? 'Entregue ao cliente'
      : 'Aguardando entrega'
    : 'Orçamento recusado';
  const deliveryTagColor = finalized
    ? delivered
      ? colors.slate
      : colors.warning
    : colors.danger;
  const deliveryTagBackground = finalized
    ? delivered
      ? colors.slateSoft
      : colors.warningSoft
    : colors.dangerSoft;

  const handleShare = async () => {
    const result = await shareText(buildOrderSummary(order, settings), `OS ${order.number}`);
    if (result === 'copied') {
      toast('Resumo copiado para a área de transferência.', 'info');
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Registro"
        subtitle={order.number}
        onBack={goBack}
        right={
          <IconButton
            icon="share-social-outline"
            accessibilityLabel="Compartilhar resumo da OS"
            color={colors.primary}
            onPress={handleShare}
            style={styles.shareButton}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: kindBg }]}>
              <Ionicons name={kindIcon} size={26} color={kindColor} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.eyebrow}>REGISTRO DA OS</Text>
              <Text style={styles.heroNumber}>{order.number}</Text>
              <Text style={[styles.heroStatus, { color: kindColor }]}>{kindLabel}</Text>
            </View>
            <StatusBadge status={order.status} compact />
          </View>

          <Text style={styles.heroDescription}>
            {finalized
              ? delivered
                ? 'Serviço concluído e equipamento entregue ao cliente.'
                : 'Serviço concluído. Equipamento aguardando entrega.'
              : 'OS encerrada como cancelada. Confira abaixo o registro completo.'}
          </Text>

          <View style={styles.tagRow}>
            <Tag
              label={deliveryTagLabel}
              color={deliveryTagColor}
              backgroundColor={deliveryTagBackground}
            />
            {order.warrantyPending ? (
              <Tag
                label="Garantia a fazer"
                color={colors.purple}
                backgroundColor={colors.purpleSoft}
              />
            ) : null}
          </View>

          <Divider />

          <InfoRow
            icon="calendar-outline"
            label={finalized ? 'Finalizada em' : 'Cancelada em'}
            value={formatDateTime(record.at)}
          />
          {order.deliveredAt ? (
            <InfoRow
              icon="bag-check-outline"
              label="Entregue em"
              value={formatDateTime(order.deliveredAt)}
            />
          ) : null}
          <InfoRow
            icon="cash-outline"
            label="Total do orçamento"
            value={total > 0 ? formatCurrency(total) : 'Sem custo'}
          />
        </Card>

        <Card>
          <SectionTitle title="Cliente" icon="person-outline" />
          <View style={styles.cardGap} />
          <InfoRow
            icon="person-outline"
            label="Nome"
            value={order.clientName || 'Não informado'}
          />
          <InfoRow
            icon="call-outline"
            label="Telefone"
            value={order.clientPhone || 'Não informado'}
          />
        </Card>

        <Card>
          <SectionTitle title="Equipamento" icon="print-outline" />
          <View style={styles.cardGap} />
          <InfoRow
            icon="cube-outline"
            label="Marca / modelo"
            value={`${order.brand} ${order.model}`.trim() || 'Não informado'}
          />
          <InfoRow
            icon="barcode-outline"
            label="Nº de série"
            value={order.serial || 'Não informado'}
          />
          <InfoRow
            icon="calendar-outline"
            label="Entrada"
            value={formatDateTime(order.createdAt)}
          />
          <InfoRow
            icon="flag-outline"
            label="Prazo de entrega"
            value={order.dueDate ? formatDate(order.dueDate) : 'Não definido'}
          />

          <View style={styles.accessories}>
            <Text style={styles.accessoriesLabel}>Acessórios deixados</Text>
            {order.accessories.length ? (
              <View style={styles.tags}>
                {order.accessories.map((accessory) => (
                  <Tag key={accessory} label={accessory} />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyInline}>Nenhum acessório informado.</Text>
            )}
          </View>
        </Card>

        <Card>
          <SectionTitle title="Defeito e diagnóstico" icon="search-outline" />
          <View style={styles.cardGap} />
          <TextBlock label="Relato do cliente" value={order.reportedDefect} />
          <TextBlock label="Diagnóstico técnico" value={order.diagnosis} />
        </Card>

        <Card>
          <SectionTitle
            title="Orçamento"
            subtitle={`${order.budgetItems.length} ${
              order.budgetItems.length === 1 ? 'item' : 'itens'
            }`}
            icon="calculator-outline"
          />
          {order.budgetItems.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum item foi adicionado ao orçamento.</Text>
          ) : (
            <View style={styles.budgetList}>
              {order.budgetItems.map((item) => (
                <View key={item.id} style={styles.budgetItem}>
                  <View style={styles.budgetIcon}>
                    <Ionicons
                      name={item.kind === 'peca' ? 'cube-outline' : 'construct-outline'}
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.budgetDescription}>{item.description}</Text>
                    <Text style={styles.budgetMeta}>
                      {item.kind === 'peca' ? 'Peça' : 'Serviço'} • {item.quantity}x{' '}
                      {formatCurrency(item.unitPrice)}
                    </Text>
                  </View>
                  <Text style={styles.budgetTotal}>{formatCurrency(itemTotal(item))}</Text>
                </View>
              ))}
            </View>
          )}

          {order.budgetItems.length > 0 ? (
            <>
              <Divider />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total do orçamento</Text>
                <Text style={styles.grandTotal}>{formatCurrency(total)}</Text>
              </View>
            </>
          ) : null}

          <View style={styles.budgetNotes}>
            <TextBlock label="Observações do orçamento" value={order.budgetNotes} />
          </View>
        </Card>

        <Card>
          <SectionTitle title="Serviço realizado" icon="construct-outline" />
          <View style={styles.cardGap} />
          <TextBlock label="O que foi feito" value={order.servicePerformed} />
        </Card>

        <Card>
          <SectionTitle
            title="Anotações internas"
            subtitle="Não aparecem no resumo compartilhado."
            icon="lock-closed-outline"
          />
          <View style={styles.cardGap} />
          <TextBlock
            label="Provável defeito / observações"
            value={order.internalNotes}
          />
        </Card>

        <Card>
          <SectionTitle title="Garantia" icon="shield-checkmark-outline" />
          <View style={styles.cardGap} />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Prazo"
            value={warrantyPeriodText}
          />
          <InfoRow
            icon="calendar-outline"
            label="Situação"
            value={warrantyText}
            valueColor={warrantyTone}
          />
          {warrantyApplies && order.warrantyDays > 0 && order.deliveredAt ? (
            <InfoRow
              icon="bag-check-outline"
              label="Início"
              value={formatDateTime(order.deliveredAt)}
            />
          ) : null}
          {warrantyEnd ? (
            <InfoRow
              icon="calendar-outline"
              label="Fim da garantia"
              value={formatDate(warrantyEnd)}
            />
          ) : null}
          {order.warrantyPending ? (
            <InfoRow
              icon="alert-circle-outline"
              label="Garantia a fazer"
              value={order.warrantyPendingNote.trim() || 'Pendente'}
              valueColor={colors.purple}
            />
          ) : null}
        </Card>

        <Card>
          <SectionTitle title="Datas" icon="calendar-outline" />
          <View style={styles.cardGap} />
          <InfoRow
            icon="add-circle-outline"
            label="Abertura da OS"
            value={formatDateTime(order.createdAt)}
          />
          {order.approvedAt ? (
            <InfoRow
              icon="checkmark-circle-outline"
              label="Autorização"
              value={formatDateTime(order.approvedAt)}
            />
          ) : null}
          {order.completedAt ? (
            <InfoRow
              icon="checkmark-done-outline"
              label="Serviço concluído"
              value={formatDateTime(order.completedAt)}
            />
          ) : null}
          {order.deliveredAt ? (
            <InfoRow
              icon="bag-check-outline"
              label="Entrega"
              value={formatDateTime(order.deliveredAt)}
            />
          ) : null}
          {order.canceledAt ? (
            <InfoRow
              icon="close-circle-outline"
              label="Cancelamento"
              value={formatDateTime(order.canceledAt)}
            />
          ) : null}
          <InfoRow
            icon="refresh-outline"
            label="Última atualização"
            value={formatDateTime(order.updatedAt)}
          />
        </Card>

        <Card>
          <SectionTitle
            title="Histórico da OS"
            subtitle={`${order.history.length} ${
              order.history.length === 1 ? 'evento registrado' : 'eventos registrados'
            }`}
            icon="time-outline"
          />
          {order.history.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum evento registrado.</Text>
          ) : (
            <View style={styles.historyList}>
              {[...order.history].reverse().map((event, index, list) => (
                <View key={event.id} style={styles.historyRow}>
                  <View style={styles.historyRail}>
                    <View
                      style={[
                        styles.historyDot,
                        index === 0 && {
                          backgroundColor: kindColor,
                          borderColor: kindBg,
                        },
                      ]}
                    />
                    {index < list.length - 1 ? <View style={styles.historyLine} /> : null}
                  </View>
                  <View style={styles.historyBody}>
                    <Text style={styles.historyTitle}>{event.title}</Text>
                    {event.detail ? (
                      <Text style={styles.historyDetail}>{event.detail}</Text>
                    ) : null}
                    <Text style={styles.historyDate}>{formatDateTime(event.at)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.readOnlyCard}>
          <View style={styles.readOnlyHeader}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
            <Text style={styles.readOnlyTitle}>Visualização somente leitura</Text>
          </View>
          <Text style={styles.readOnlyText}>
            Este registro reúne as informações da OS finalizada ou cancelada. Para editar
            dados ou registrar a entrega, abra a OS original.
          </Text>
          <Button
            label="Abrir OS original"
            icon="open-outline"
            variant="soft"
            fullWidth
            onPress={() =>
              router.push({ pathname: '/os/[id]', params: { id: order.id } })
            }
          />
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
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 14,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  cardGap: { height: 10 },
  shareButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.7,
  },
  heroNumber: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    marginTop: 1,
  },
  heroStatus: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  heroDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  accessories: {
    marginTop: 8,
  },
  accessoriesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 7,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  textBlock: {
    marginBottom: 12,
  },
  textBlockLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  textBlockValue: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
  },
  textBlockEmpty: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: 12,
  },
  emptyInline: {
    fontSize: 13,
    color: colors.textMuted,
  },
  budgetList: {
    marginTop: 4,
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  budgetIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  budgetMeta: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  budgetTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  budgetNotes: {
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  grandTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  historyList: {
    marginTop: 12,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  historyRail: {
    width: 14,
    alignItems: 'center',
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: 4,
  },
  historyLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 3,
  },
  historyBody: {
    flex: 1,
    paddingBottom: 16,
  },
  historyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  historyDetail: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  readOnlyCard: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primarySoft,
  },
  readOnlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readOnlyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  readOnlyText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 14,
  },
});
