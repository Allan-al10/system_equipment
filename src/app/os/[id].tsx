import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useData } from '@/lib/data-context';
import { useToast } from '@/components/Toast';
import { BudgetItemModal, type BudgetItemDraft } from '@/components/BudgetItemModal';
import {
  Button,
  Card,
  Chip,
  Divider,
  Field,
  InfoRow,
  ScreenHeader,
  SectionTitle,
  StatusBadge,
  Tag,
} from '@/components/ui';
import {
  ALL_STATUSES,
  colors,
  getNextStatus,
  NEXT_ACTION_LABEL,
  radius,
  STATUS_META,
} from '@/lib/theme';
import type { BudgetItem, OrderPatch, OSStatus, ServiceOrder } from '@/lib/types';
import {
  addDays,
  formatCurrency,
  formatDate,
  formatDateInput,
  formatDateTime,
  parseDateInput,
  phoneDigits,
  uid,
} from '@/lib/format';
import {
  findRelatedOrders,
  getWarrantyEnd,
  isOrderOverdue,
  isWarrantyActive,
  itemTotal,
  orderTotal,
  overdueDays,
  warrantyLabel,
} from '@/lib/os-utils';
import { buildBudgetText, buildOrderSummary, shareText } from '@/lib/share';
import { confirmAsync } from '@/lib/confirm';
import { DEADLINE_PRESETS, WARRANTY_PRESETS } from '@/lib/constants';

interface FormState {
  reportedDefect: string;
  diagnosis: string;
  budgetNotes: string;
  servicePerformed: string;
  internalNotes: string;
  warrantyDaysText: string;
  dueDateText: string;
  warrantyPending: boolean;
  warrantyPendingNote: string;
}

const EMPTY_FORM: FormState = {
  reportedDefect: '',
  diagnosis: '',
  budgetNotes: '',
  servicePerformed: '',
  internalNotes: '',
  warrantyDaysText: '90',
  dueDateText: '',
  warrantyPending: false,
  warrantyPendingNote: '',
};

function formFromOrder(order: ServiceOrder): FormState {
  return {
    reportedDefect: order.reportedDefect,
    diagnosis: order.diagnosis,
    budgetNotes: order.budgetNotes,
    servicePerformed: order.servicePerformed,
    internalNotes: order.internalNotes,
    warrantyDaysText: String(order.warrantyDays),
    dueDateText: order.dueDate ? formatDate(order.dueDate) : '',
    warrantyPending: order.warrantyPending,
    warrantyPendingNote: order.warrantyPendingNote,
  };
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    orders,
    settings,
    updateOrder,
    changeStatus,
    deleteOrder,
    addBudgetItem,
    updateBudgetItem,
    removeBudgetItem,
  } = useData();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const order = orders.find((item) => item.id === id);

  const [form, setForm] = useState<FormState>(() => (order ? formFromOrder(order) : EMPTY_FORM));
  const [budgetModal, setBudgetModal] = useState<{ visible: boolean; item: BudgetItem | null }>({
    visible: false,
    item: null,
  });
  const [showStatuses, setShowStatuses] = useState(false);
  const [dateErrorVisible, setDateErrorVisible] = useState(false);
  const formOrderIdRef = useRef(order?.id);

  useEffect(() => {
    if (order && formOrderIdRef.current !== order.id) {
      formOrderIdRef.current = order.id;
      setForm(formFromOrder(order));
    }
  }, [order]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/ordens');
  };

  if (!order) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="OS não encontrada" onBack={goBack} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Ordem de serviço não encontrada</Text>
          <Text style={styles.notFoundText}>
            Ela pode ter sido excluída. Volte para a lista de ordens.
          </Text>
          <Button
            label="Voltar para ordens"
            variant="soft"
            onPress={() => router.replace('/ordens')}
            style={styles.notFoundButton}
          />
        </View>
      </View>
    );
  }

  const statusMeta = STATUS_META[order.status];
  const nextStatus = getNextStatus(order.status);
  const nextActionLabel = nextStatus ? NEXT_ACTION_LABEL[nextStatus] ?? 'Avançar' : null;
  const total = orderTotal(order);
  const relatedOrders = findRelatedOrders(orders, order);

  const warrantyDaysNumber = Math.max(
    0,
    Math.min(3650, Math.round(Number(form.warrantyDaysText.replace(/\D/g, '')) || 0)),
  );
  const warrantyPreview =
    warrantyDaysNumber > 0 && order.deliveredAt
      ? addDays(order.deliveredAt, warrantyDaysNumber)
      : null;

  const parsedDueDate = parseDateInput(form.dueDateText);
  const dueDateError =
    form.dueDateText.trim().length > 0 && !parsedDueDate
      ? 'Data inválida. Use o formato dd/mm/aaaa.'
      : '';
  const overdue = isOrderOverdue(order);
  const lateDays = overdue ? overdueDays(order) : 0;
  const formHasPending = overdue || form.warrantyPending;

  const dirty =
    form.reportedDefect !== order.reportedDefect ||
    form.diagnosis !== order.diagnosis ||
    form.budgetNotes !== order.budgetNotes ||
    form.servicePerformed !== order.servicePerformed ||
    form.internalNotes !== order.internalNotes ||
    form.warrantyDaysText !== String(order.warrantyDays) ||
    form.dueDateText !== (order.dueDate ? formatDate(order.dueDate) : '') ||
    form.warrantyPending !== order.warrantyPending ||
    (form.warrantyPending && form.warrantyPendingNote !== order.warrantyPendingNote);

  const buildPatch = () => {
    const patch: OrderPatch = {
      reportedDefect: form.reportedDefect.trim(),
      diagnosis: form.diagnosis.trim(),
      budgetNotes: form.budgetNotes.trim(),
      servicePerformed: form.servicePerformed.trim(),
      internalNotes: form.internalNotes.trim(),
      warrantyDays: warrantyDaysNumber,
      dueDate: parsedDueDate ?? undefined,
      warrantyPending: form.warrantyPending,
      warrantyPendingNote: form.warrantyPending ? form.warrantyPendingNote.trim() : '',
    };

    const nextDueDateText = patch.dueDate ? formatDate(patch.dueDate) : '';
    const currentDueDateText = order.dueDate ? formatDate(order.dueDate) : '';

    const changed: string[] = [];
    if (patch.reportedDefect !== order.reportedDefect) changed.push('anotações do cliente');
    if (patch.diagnosis !== order.diagnosis) changed.push('diagnóstico');
    if (patch.budgetNotes !== order.budgetNotes) changed.push('observações do orçamento');
    if (patch.servicePerformed !== order.servicePerformed) changed.push('soluções');
    if (patch.internalNotes !== order.internalNotes) changed.push('anotações internas');
    if (patch.warrantyDays !== order.warrantyDays) changed.push('garantia');
    if (nextDueDateText !== currentDueDateText) {
      changed.push(patch.dueDate ? 'prazo de entrega' : 'prazo de entrega removido');
    }
    if (patch.warrantyPending !== order.warrantyPending) {
      changed.push(patch.warrantyPending ? 'garantia a fazer' : 'garantia resolvida');
    }
    if (
      patch.warrantyPending &&
      patch.warrantyPendingNote !== order.warrantyPendingNote
    ) {
      changed.push('observação da garantia');
    }

    const nextForm: FormState = {
      reportedDefect: patch.reportedDefect ?? '',
      diagnosis: patch.diagnosis ?? '',
      budgetNotes: patch.budgetNotes ?? '',
      servicePerformed: patch.servicePerformed ?? '',
      internalNotes: patch.internalNotes ?? '',
      warrantyDaysText: String(warrantyDaysNumber),
      dueDateText: nextDueDateText,
      warrantyPending: patch.warrantyPending ?? false,
      warrantyPendingNote: patch.warrantyPendingNote ?? '',
    };

    return { patch, changed, nextForm };
  };

  const saveChanges = (showFeedback = true): boolean => {
    if (dueDateError) {
      setDateErrorVisible(true);
      if (showFeedback) {
        toast('Informe o prazo de entrega no formato dd/mm/aaaa.', 'error');
      }
      return false;
    }

    const { patch, changed, nextForm } = buildPatch();

    if (changed.length === 0) {
      setForm(nextForm);
      setDateErrorVisible(false);
      return true;
    }

    updateOrder(order.id, patch, {
      id: uid('h_'),
      at: new Date().toISOString(),
      title: 'OS atualizada',
      detail: `Alterado: ${changed.join(', ')}.`,
    });
    setForm(nextForm);
    setDateErrorVisible(false);

    if (showFeedback) toast('Alterações salvas.');
    return true;
  };

  const applyStatus = async (next: OSStatus) => {
    if (next === order.status) return;
    if (dirty && !saveChanges(false)) return;
    changeStatus(order.id, next);
    toast(`Status alterado para ${STATUS_META[next].label}.`);
  };

  const handleNext = async () => {
    if (!nextStatus) return;

    if (nextStatus === 'orcamento_realizado' && order.budgetItems.length === 0) {
      const ok = await confirmAsync(
        'Orçamento sem itens',
        'Nenhuma peça ou serviço foi adicionado ao orçamento. Finalizar o orçamento mesmo assim?',
        'Finalizar',
      );
      if (!ok) return;
    }

    if (
      nextStatus === 'pronto' &&
      !form.servicePerformed.trim() &&
      !order.servicePerformed.trim()
    ) {
      const ok = await confirmAsync(
        'Soluções não descritas',
        'O campo "Soluções" está vazio. Deseja marcar o equipamento como pronto mesmo assim?',
        'Marcar pronto',
      );
      if (!ok) return;
    }

    await applyStatus(nextStatus);
  };

  const handleReject = async () => {
    const ok = await confirmAsync(
      'Recusar orçamento',
      'A OS será marcada como recusada. Deseja continuar?',
      'Recusar',
      true,
    );
    if (!ok) return;
    await applyStatus('recusado');
  };

  const handleDeliver = async () => {
    if (order.deliveredAt) return;

    const ok = await confirmAsync(
      'Registrar entrega',
      'Confirmar a entrega do equipamento ao cliente? A garantia começará a contar a partir de agora.',
      'Entregar',
    );
    if (!ok) return;

    if (dirty && !saveChanges(false)) return;

    const now = new Date().toISOString();
    updateOrder(
      order.id,
      { deliveredAt: now },
      {
        id: uid('h_'),
        at: now,
        title: 'Equipamento entregue',
        detail: 'Garantia iniciada na data da entrega.',
      },
    );
    toast('Entrega registrada. Garantia iniciada.');  };

  const handleManualStatus = async (status: OSStatus) => {
    if (status === order.status) return;
    const ok = await confirmAsync(
      'Alterar status',
      `Alterar a OS para "${STATUS_META[status].label}"?`,
      'Alterar',
    );
    if (!ok) return;
    await applyStatus(status);
  };

  const handleShareSummary = async () => {
    if (dirty && !saveChanges(false)) return;
    const { patch } = buildPatch();
    const target: ServiceOrder = { ...order, ...patch };
    const result = await shareText(buildOrderSummary(target, settings), `OS ${order.number}`);
    if (result === 'copied') {
      toast('Resumo copiado para a área de transferência.', 'info');
    }
  };

  const handleShareBudget = async () => {
    if (order.budgetItems.length === 0) {
      toast('Adicione itens ao orçamento primeiro.', 'error');
      return;
    }
    if (dirty && !saveChanges(false)) return;
    const { patch } = buildPatch();
    const target: ServiceOrder = { ...order, ...patch };
    const result = await shareText(
      buildBudgetText(target, settings),
      `Orçamento ${order.number}`,
    );
    if (result === 'copied') {
      toast('Orçamento copiado para a área de transferência.', 'info');
    }
  };

  const handleWhatsApp = async () => {
    const digits = phoneDigits(order.clientPhone);
    if (!digits) {
      toast('Cliente sem telefone cadastrado.', 'error');
      return;
    }
    const number = digits.startsWith('55') && digits.length > 11 ? digits : `55${digits}`;
    const firstName = order.clientName.trim().split(/\s+/)[0];
    const printer = `${order.brand} ${order.model}`.trim();
    const message = `Olá${firstName ? `, ${firstName}` : ''}! Sobre a OS ${order.number}${
      printer ? ` da impressora ${printer}` : ''
    }.`;

    try {
      await Linking.openURL(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
    } catch {
      toast('Não foi possível abrir o WhatsApp.', 'error');
    }
  };

  const handleCall = async () => {
    const digits = phoneDigits(order.clientPhone);
    if (!digits) {
      toast('Cliente sem telefone cadastrado.', 'error');
      return;
    }
    try {
      await Linking.openURL(`tel:${digits}`);
    } catch {
      toast('Não foi possível iniciar a ligação.', 'error');
    }
  };

  const handleBudgetSubmit = (draft: BudgetItemDraft) => {
    if (budgetModal.item) {
      updateBudgetItem(order.id, { ...budgetModal.item, ...draft });
      toast('Item do orçamento atualizado.');
    } else {
      addBudgetItem(order.id, draft);
      toast('Item adicionado ao orçamento.');
    }
  };

  const handleRemoveItem = async (item: BudgetItem) => {
    const ok = await confirmAsync(
      'Remover item',
      `Remover "${item.description}" do orçamento?`,
      'Remover',
      true,
    );
    if (!ok) return;
    removeBudgetItem(order.id, item.id);
    toast('Item removido.');
  };

  const handleDelete = async () => {
    const ok = await confirmAsync(
      'Excluir OS',
      `Excluir a ${order.number}? Todo o histórico, orçamento e registro de garantia serão apagados.`,
      'Excluir OS',
      true,
    );
    if (!ok) return;
    deleteOrder(order.id);
    toast('OS excluída.');
    goBack();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={order.number}
        subtitle={`${order.brand} ${order.model}`.trim() || 'Impressora'}
        onBack={goBack}
        right={
          <View style={styles.headerActions}>
            <StatusBadge status={order.status} compact />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Compartilhar resumo da OS"
              onPress={handleShareSummary}
              style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
            >
              <Ionicons name="share-social-outline" size={18} color={colors.primary} />
            </Pressable>
          </View>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <View style={styles.statusTop}>
              <View style={[styles.statusIcon, { backgroundColor: statusMeta.bg }]}>
                <Ionicons name={statusMeta.icon} size={24} color={statusMeta.color} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.statusEyebrow}>STATUS ATUAL</Text>
                <Text style={[styles.statusTitle, { color: statusMeta.color }]}>
                  {statusMeta.label}
                </Text>
              </View>
            </View>
            <Text style={styles.statusDescription}>{statusMeta.description}</Text>

            {nextStatus && nextActionLabel ? (
              <Button
                label={nextActionLabel}
                icon={STATUS_META[nextStatus].icon}
                onPress={handleNext}
                fullWidth
                style={styles.nextButton}
              />
            ) : null}

            {order.status === 'pronto' ? (
              order.deliveredAt ? (
                <View style={styles.deliveredRow}>
                  <Ionicons name="bag-check-outline" size={16} color={colors.success} />
                  <Text style={styles.deliveredText}>
                    Entregue em {formatDateTime(order.deliveredAt)}
                  </Text>
                </View>
              ) : (
                <Button
                  label="Registrar entrega"
                  icon="bag-check-outline"
                  variant="soft"
                  onPress={handleDeliver}
                  fullWidth
                  style={styles.nextButton}
                />
              )
            ) : null}

            {order.status === 'esperando_resposta' || order.status === 'orcamento_realizado' ? (
              <Button
                label="Cliente recusou"
                icon="close-circle-outline"
                variant="dangerSoft"
                onPress={handleReject}
                fullWidth
                style={styles.rejectButton}
              />
            ) : null}

            {order.status === 'recusado' ? (
              <Button
                label="Reabrir orçamento"
                icon="refresh-outline"
                variant="soft"
                onPress={() => applyStatus('orcamento')}
                fullWidth
                style={styles.nextButton}
              />
            ) : null}

            {order.status === 'pronto' || order.status === 'recusado' ? (
              <Button
                label="Ver registro"
                icon="archive-outline"
                variant="outline"
                onPress={() =>
                  router.push({ pathname: '/registro/[id]', params: { id: order.id } })
                }
                fullWidth
                style={styles.nextButton}
              />
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => setShowStatuses((value) => !value)}
              style={styles.manualToggle}
            >
              <Text style={styles.manualToggleText}>
                {showStatuses ? 'Ocultar status' : 'Alterar status manualmente'}
              </Text>
              <Ionicons
                name={showStatuses ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>

            {showStatuses ? (
              <View style={styles.statusChips}>
                {ALL_STATUSES.map((status) => {
                  const meta = STATUS_META[status];
                  return (
                    <Chip
                      key={status}
                      label={meta.shortLabel}
                      icon={meta.icon}
                      color={meta.color}
                      selected={order.status === status}
                      selectedBackgroundColor={meta.color}
                      onPress={() => handleManualStatus(status)}
                    />
                  );
                })}
              </View>
            ) : null}
          </Card>

          <Card style={formHasPending ? styles.pendingCard : undefined}>
            <SectionTitle
              title="Pendências"
              subtitle="Acompanhe prazos e garantias que precisam de atenção."
              icon="alert-circle-outline"
            />

            <View style={styles.pendingTags}>
              {overdue ? (
                <Tag
                  label={
                    lateDays > 0
                      ? `Atrasada há ${lateDays} ${lateDays === 1 ? 'dia' : 'dias'}`
                      : 'Serviço atrasado'
                  }
                  color={colors.danger}
                  backgroundColor={colors.dangerSoft}
                />
              ) : null}
              {form.warrantyPending ? (
                <Tag
                  label="Garantia a fazer"
                  color={colors.purple}
                  backgroundColor={colors.purpleSoft}
                />
              ) : null}
              {!overdue && !form.warrantyPending ? (
                <Tag
                  label="Sem pendências"
                  color={colors.success}
                  backgroundColor={colors.successSoft}
                />
              ) : null}
            </View>

            <View style={styles.cardGap} />
            <Field
              label="Prazo de entrega"
              value={form.dueDateText}
              onChangeText={(text) => {
                setForm((previous) => ({
                  ...previous,
                  dueDateText: formatDateInput(text),
                }));
                setDateErrorVisible(false);
              }}
              placeholder="dd/mm/aaaa"
              keyboardType="numeric"
              hint="Se o prazo passar e a OS não for entregue, ela aparece automaticamente em Pendências."
              error={dateErrorVisible ? dueDateError : undefined}
            />

            <View style={styles.presets}>
              {DEADLINE_PRESETS.filter((days) => days > 0).map((days) => {
                const value = formatDate(addDays(new Date().toISOString(), days));
                return (
                  <Chip
                    key={days}
                    label={`+${days} dias`}
                    selected={form.dueDateText === value}
                    onPress={() =>
                      setForm((previous) => ({ ...previous, dueDateText: value }))
                    }
                  />
                );
              })}
              {form.dueDateText ? (
                <Chip
                  label="Limpar"
                  icon="close-outline"
                  onPress={() => {
                    setForm((previous) => ({ ...previous, dueDateText: '' }));
                    setDateErrorVisible(false);
                  }}
                />
              ) : null}
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: form.warrantyPending }}
              onPress={() =>
                setForm((previous) => ({
                  ...previous,
                  warrantyPending: !previous.warrantyPending,
                }))
              }
              style={({ pressed }) => [
                styles.warrantyToggle,
                form.warrantyPending && styles.warrantyToggleActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.checkbox, form.warrantyPending && styles.checkboxActive]}>
                {form.warrantyPending ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : null}
              </View>
              <View style={styles.flex}>
                <Text style={styles.warrantyToggleTitle}>Garantia a fazer</Text>
                <Text style={styles.warrantyToggleText}>
                  Marque quando o equipamento voltar com um serviço em garantia pendente.
                </Text>
              </View>
            </Pressable>

            {form.warrantyPending ? (
              <Field
                label="Observação da garantia"
                value={form.warrantyPendingNote}
                onChangeText={(text) =>
                  setForm((previous) => ({ ...previous, warrantyPendingNote: text }))
                }
                placeholder="Ex.: trocar rolete em garantia; cliente aguardando peça..."
                multiline
                containerStyle={styles.noMargin}
              />
            ) : null}
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
            {order.clientPhone ? (
              <View style={styles.contactRow}>
                <Button
                  label="WhatsApp"
                  icon="logo-whatsapp"
                  variant="soft"
                  size="sm"
                  onPress={handleWhatsApp}
                  style={styles.flex}
                />
                <Button
                  label="Ligar"
                  icon="call-outline"
                  variant="outline"
                  size="sm"
                  onPress={handleCall}
                  style={styles.flex}
                />
              </View>
            ) : null}

            <Divider />

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
            {order.deliveredAt ? (
              <InfoRow
                icon="bag-check-outline"
                label="Entrega"
                value={formatDateTime(order.deliveredAt)}
              />
            ) : null}

            {order.accessories.length ? (
              <View style={styles.accessories}>
                <Text style={styles.accessoriesLabel}>Acessórios deixados</Text>
                <View style={styles.tags}>
                  {order.accessories.map((accessory) => (
                    <Tag key={accessory} label={accessory} />
                  ))}
                </View>
              </View>
            ) : null}

            <Divider />

            <InfoRow
              icon="shield-checkmark-outline"
              label="Garantia"
              value={warrantyLabel(order)}
              valueColor={
                order.warrantyDays > 0 && getWarrantyEnd(order)
                  ? isWarrantyActive(order)
                    ? colors.success
                    : colors.danger
                  : colors.textMuted
              }
            />
          </Card>

          {relatedOrders.length > 0 ? (
            <Card>
              <SectionTitle
                title="Histórico do equipamento"
                subtitle={`${relatedOrders.length} ${
                  relatedOrders.length === 1 ? 'OS anterior' : 'OS anteriores'
                } com o mesmo nº de série`}
                icon="repeat-outline"
              />
              <View style={styles.relatedList}>
                {relatedOrders.map((related) => (
                  <Pressable
                    key={related.id}
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({ pathname: '/os/[id]', params: { id: related.id } })
                    }
                    style={({ pressed }) => [styles.relatedItem, pressed && styles.pressed]}
                  >
                    <View style={styles.relatedIcon}>
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.relatedNumber}>
                        {related.number} • {formatDate(related.createdAt)}
                      </Text>
                      <Text style={styles.relatedDesc} numberOfLines={2}>
                        {related.servicePerformed.trim() ||
                          related.reportedDefect.trim() ||
                          'Sem descrição'}
                      </Text>
                    </View>
                    <StatusBadge status={related.status} compact />
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          <Card>
            <SectionTitle
              title="Anotações do cliente"
              subtitle="Defeito ou possível defeito na visão do cliente."
              icon="chatbubble-ellipses-outline"
            />
            <View style={styles.cardGap} />
            <Field
              label="Relato do cliente"
              value={form.reportedDefect}
              onChangeText={(text) =>
                setForm((previous) => ({ ...previous, reportedDefect: text }))
              }
              placeholder="Ex.: cliente relata luzes piscando e acha que é problema de Wi-Fi..."
              multiline
              containerStyle={styles.noMargin}
            />
          </Card>

          <Card>
            <SectionTitle
              title="Diagnóstico técnico"
              subtitle="Resultado dos testes e causa confirmada."
              icon="search-outline"
            />
            <View style={styles.cardGap} />
            <Field
              label="Diagnóstico confirmado"
              value={form.diagnosis}
              onChangeText={(text) => setForm((previous) => ({ ...previous, diagnosis: text }))}
              placeholder="Ex.: fonte sem tensão de 24 V; cabo flat do scanner rompido..."
              multiline
              containerStyle={styles.noMargin}
            />
          </Card>

          <Card>
            <SectionTitle
              title="Orçamento"
              subtitle="Peças e serviços do reparo."
              icon="calculator-outline"
              right={
                <Button
                  label="Adicionar"
                  icon="add"
                  size="sm"
                  variant="soft"
                  onPress={() => setBudgetModal({ visible: true, item: null })}
                />
              }
            />

            {order.budgetItems.length === 0 ? (
              <Text style={styles.budgetEmpty}>
                Nenhum item adicionado. Toque em “Adicionar” para incluir peças ou mão de obra.
              </Text>
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
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Editar ${item.description}`}
                      onPress={() => setBudgetModal({ visible: true, item })}
                      hitSlop={8}
                      style={styles.itemAction}
                    >
                      <Ionicons name="create-outline" size={17} color={colors.textMuted} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remover ${item.description}`}
                      onPress={() => handleRemoveItem(item)}
                      hitSlop={8}
                      style={styles.itemAction}
                    >
                      <Ionicons name="trash-outline" size={17} color={colors.danger} />
                    </Pressable>
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
                <Button
                  label="Compartilhar orçamento"
                  icon="logo-whatsapp"
                  variant="soft"
                  size="sm"
                  onPress={handleShareBudget}
                  fullWidth
                  style={styles.shareBudgetButton}
                />
              </>
            ) : null}

            <Field
              label="Observações do orçamento"
              value={form.budgetNotes}
              onChangeText={(text) =>
                setForm((previous) => ({ ...previous, budgetNotes: text }))
              }
              placeholder="Ex.: validade de 7 dias, condições de pagamento..."
              multiline
              containerStyle={styles.budgetNotes}
            />
          </Card>

          <Card>
            <SectionTitle
              title="Soluções"
              subtitle="Serviço realizado para corrigir o equipamento."
              icon="construct-outline"
            />
            <View style={styles.cardGap} />
            <Field
              label="O que foi feito"
              value={form.servicePerformed}
              onChangeText={(text) =>
                setForm((previous) => ({ ...previous, servicePerformed: text }))
              }
              placeholder="Ex.: troca do rolete de tração, limpeza do cabeçote e reset de rede..."
              multiline
            />

            <Field
              label="Prazo de garantia (dias)"
              value={form.warrantyDaysText}
              onChangeText={(text) =>
                setForm((previous) => ({
                  ...previous,
                  warrantyDaysText: text.replace(/\D/g, ''),
                }))
              }
              keyboardType="numeric"
              placeholder="90"
              hint="0 = sem garantia. O prazo começa na entrega."
            />

            <View style={styles.presets}>
              {WARRANTY_PRESETS.map((days) => (
                <Chip
                  key={days}
                  label={days === 0 ? 'Sem garantia' : `${days} dias`}
                  selected={warrantyDaysNumber === days}
                  onPress={() =>
                    setForm((previous) => ({
                      ...previous,
                      warrantyDaysText: String(days),
                    }))
                  }
                />
              ))}
            </View>

            <Text style={styles.warrantyPreview}>
              {warrantyDaysNumber === 0
                ? 'Este serviço será registrado sem garantia.'
                : warrantyPreview
                  ? `Garantia até ${formatDate(warrantyPreview)}.`
                  : `Garantia de ${warrantyDaysNumber} dias, contados a partir da entrega.`}
            </Text>
          </Card>

          <Card>
            <SectionTitle
              title="Anotações internas"
              subtitle="Provável defeito e observações da bancada. Não aparecem no resumo compartilhado."
              icon="lock-closed-outline"
            />
            <View style={styles.cardGap} />
            <Field
              label="Provável defeito / anotações internas"
              value={form.internalNotes}
              onChangeText={(text) =>
                setForm((previous) => ({ ...previous, internalNotes: text }))
              }
              placeholder="Ex.: provável fonte com defeito; peça encomendada; cliente avisado..."
              multiline
              containerStyle={styles.noMargin}
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
            <View style={styles.historyList}>
              {[...order.history].reverse().map((event, index, list) => (
                <View key={event.id} style={styles.historyRow}>
                  <View style={styles.historyRail}>
                    <View
                      style={[
                        styles.historyDot,
                        index === 0 && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primarySoft,
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
          </Card>

          <Card style={styles.dangerCard}>
            <View style={styles.dangerHeader}>
              <Ionicons name="warning-outline" size={18} color={colors.danger} />
              <Text style={styles.dangerTitle}>Zona de risco</Text>
            </View>
            <Text style={styles.dangerText}>
              Excluir esta OS apaga também o orçamento, o histórico e o registro de garantia.
            </Text>
            <Button
              label="Excluir OS"
              icon="trash-outline"
              variant="dangerSoft"
              onPress={handleDelete}
              fullWidth
            />
          </Card>
        </ScrollView>

        {dirty ? (
          <View style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <View style={styles.saveHint}>
              <View style={styles.unsavedDot} />
              <Text style={styles.saveHintText}>Alterações não salvas</Text>
            </View>
            <Button label="Salvar" icon="checkmark" onPress={() => saveChanges()} />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      {budgetModal.visible ? (
        <BudgetItemModal
          key={budgetModal.item?.id ?? 'new'}
          visible
          initial={budgetModal.item}
          onClose={() => setBudgetModal({ visible: false, item: null })}
          onSubmit={handleBudgetSubmit}
        />
      ) : null}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.82 },
  cardGap: { height: 10 },
  noMargin: { marginBottom: 0 },
  statusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.7,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  statusDescription: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginTop: 10,
  },
  nextButton: {
    marginTop: 14,
  },
  deliveredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.successSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  deliveredText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.success,
  },
  rejectButton: {
    marginTop: 8,
  },
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 14,
    paddingBottom: 2,
  },
  manualToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pendingCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  pendingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  warrantyToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    marginBottom: 12,
  },
  warrantyToggleActive: {
    borderColor: colors.purple,
    backgroundColor: colors.purpleSoft,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    borderColor: colors.purple,
    backgroundColor: colors.purple,
  },
  warrantyToggleTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  warrantyToggleText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
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
  relatedList: {
    gap: 8,
    marginTop: 12,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: 10,
  },
  relatedIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  relatedDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  budgetEmpty: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 14,
  },
  budgetList: {
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: 10,
  },
  budgetIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetDescription: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  budgetMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  budgetTotal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
  },
  itemAction: {
    padding: 2,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  grandTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  shareBudgetButton: {
    marginTop: 10,
  },
  budgetNotes: {
    marginTop: 12,
    marginBottom: 0,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -4,
    marginBottom: 12,
  },
  warrantyPreview: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  historyList: {
    marginTop: 14,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 10,
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
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    marginTop: 3,
  },
  historyLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 3,
  },
  historyBody: {
    flex: 1,
    paddingBottom: 14,
  },
  historyTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
  },
  historyDetail: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: 2,
  },
  historyDate: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 3,
  },
  dangerCard: {
    borderColor: colors.dangerSoft,
    backgroundColor: '#FFFBFB',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger,
  },
  dangerText: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  saveHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  unsavedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  saveHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  notFoundText: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  notFoundButton: { marginTop: 18 },
});
