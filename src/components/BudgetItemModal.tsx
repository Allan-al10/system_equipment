import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { BudgetItem, BudgetItemKind } from '@/lib/types';
import { colors, radius, shadows } from '@/lib/theme';
import { formatCurrency, parseCurrency, parseQuantity } from '@/lib/format';
import { Button, Chip, Field, FormAlert } from './ui';

export interface BudgetItemDraft {
  kind: BudgetItemKind;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface BudgetItemModalProps {
  visible: boolean;
  initial?: BudgetItem | null;
  onClose: () => void;
  onSubmit: (draft: BudgetItemDraft) => void;
}

export function BudgetItemModal({ visible, initial, onClose, onSubmit }: BudgetItemModalProps) {
  const [kind, setKind] = useState<BudgetItemKind>(initial?.kind ?? 'peca');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '1');
  const [price, setPrice] = useState(initial ? formatCurrency(initial.unitPrice) : '');
  const [error, setError] = useState('');

  const totalPreview = Math.round(parseQuantity(quantity) * parseCurrency(price) * 100) / 100;

  const handleSubmit = () => {
    const trimmed = description.trim();
    if (!trimmed) {
      setError('Informe a descrição da peça ou do serviço.');
      return;
    }

    onSubmit({
      kind,
      description: trimmed,
      quantity: parseQuantity(quantity),
      unitPrice: parseCurrency(price),
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Ionicons name="calculator-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.title}>{initial ? 'Editar item' : 'Adicionar item'}</Text>
              <Text style={styles.subtitle}>
                Peças e serviços entram no total do orçamento.
              </Text>
            </View>
          </View>

          <View style={styles.kindRow}>
            <Chip
              label="Peça"
              icon="cube-outline"
              selected={kind === 'peca'}
              onPress={() => setKind('peca')}
              style={styles.kindChip}
            />
            <Chip
              label="Serviço"
              icon="construct-outline"
              selected={kind === 'servico'}
              onPress={() => setKind('servico')}
              style={styles.kindChip}
            />
          </View>

          <Field
            label="Descrição"
            required
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (error) setError('');
            }}
            placeholder="Ex.: Fusor, rolete de tração, mão de obra..."
            autoFocus
            error={error || undefined}
          />

          <View style={styles.row}>
            <Field
              label="Quantidade"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="1"
              containerStyle={styles.flex}
            />
            <Field
              label="Valor unitário"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="0,00"
              containerStyle={styles.flex}
            />
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total do item</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalPreview)}</Text>
          </View>

          {error ? (
            <FormAlert
              errors={[error]}
              title={
                initial ? 'Não foi possível salvar o item' : 'Não foi possível adicionar o item'
              }
              style={styles.alert}
            />
          ) : null}

          <View style={styles.actions}>
            <Button label="Cancelar" variant="outline" onPress={onClose} style={styles.flex} />
            <Button
              label={initial ? 'Salvar item' : 'Adicionar item'}
              onPress={handleSubmit}
              style={styles.flex}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    paddingBottom: 28,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    ...shadows.floating,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  titleIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  kindRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kindChip: {
    flex: 1,
    minHeight: 42,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  alert: {
    marginBottom: 12,
  },
});
