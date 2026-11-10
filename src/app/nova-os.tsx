import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useData } from '@/lib/data-context';
import { useToast } from '@/components/Toast';
import { Button, Card, Chip, Field, FormAlert, ScreenHeader, SectionTitle } from '@/components/ui';
import { colors } from '@/lib/theme';
import { ACCESSORY_OPTIONS } from '@/lib/constants';
import { formatDate, formatPhoneBR, isValidPhoneBR } from '@/lib/format';
import { nextOSNumber } from '@/lib/os-utils';

export default function NewOrderScreen() {
  const { orders, createOrder } = useData();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [accessories, setAccessories] = useState<string[]>([]);
  const [reportedDefect, setReportedDefect] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const previewNumber = useMemo(() => nextOSNumber(orders), [orders]);
  const errorMessages = Object.values(errors);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/ordens');
  };

  const clearError = (field: string) => {
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const toggleAccessory = (item: string) => {
    setAccessories((previous) =>
      previous.includes(item) ? previous.filter((value) => value !== item) : [...previous, item],
    );
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    if (!clientName.trim()) nextErrors.clientName = 'Informe o nome do cliente.';
    else if (clientName.trim().length < 2) {
      nextErrors.clientName = 'O nome do cliente está muito curto.';
    }
    if (clientPhone.trim() && !isValidPhoneBR(clientPhone)) {
      nextErrors.clientPhone = 'Telefone inválido. Informe DDD + número (10 ou 11 dígitos).';
    }
    if (!brand.trim()) nextErrors.brand = 'Informe a marca da impressora.';
    if (!model.trim()) nextErrors.model = 'Informe o modelo da impressora.';
    if (!reportedDefect.trim()) {
      nextErrors.reportedDefect = 'Descreva o defeito relatado pelo cliente.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast('Corrija os dados destacados para abrir a OS.', 'error');
      return;
    }

    const order = createOrder({
      clientName,
      clientPhone,
      brand,
      model,
      serial,
      accessories,
      reportedDefect,
      internalNotes,
    });

    toast(`OS ${order.number} criada.`);
    router.replace({ pathname: '/os/[id]', params: { id: order.id } });
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Nova OS"
        subtitle="Entrada de impressora na assistência"
        onBack={goBack}
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
          <Card style={styles.introCard}>
            <View style={styles.introIcon}>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.introTitle}>{previewNumber}</Text>
              <Text style={styles.introText}>
                Entrada em {formatDate(new Date().toISOString())} • status inicial Recebida
              </Text>
            </View>
          </Card>

          <Card>
            <SectionTitle title="Cliente" icon="person-outline" />
            <View style={styles.spacer} />
            <Field
              label="Nome do cliente"
              required
              value={clientName}
              onChangeText={(text) => {
                setClientName(text);
                clearError('clientName');
              }}
              placeholder="Ex.: Maria Silva"
              autoCapitalize="words"
              error={errors.clientName}
            />
            <Field
              label="Telefone / WhatsApp"
              value={clientPhone}
              onChangeText={(text) => {
                setClientPhone(formatPhoneBR(text));
                clearError('clientPhone');
              }}
              placeholder="(11) 91234-5678"
              keyboardType="phone-pad"
              hint="Opcional, mas útil para avisar sobre o orçamento."
              error={errors.clientPhone}
              containerStyle={styles.lastField}
            />
          </Card>

          <Card>
            <SectionTitle title="Impressora" icon="print-outline" />
            <View style={styles.spacer} />
            <View style={styles.row}>
              <Field
                label="Marca"
                required
                value={brand}
                onChangeText={(text) => {
                  setBrand(text);
                  clearError('brand');
                }}
                placeholder="Ex.: Epson"
                autoCapitalize="words"
                containerStyle={styles.flex}
                error={errors.brand}
              />
              <Field
                label="Modelo"
                required
                value={model}
                onChangeText={(text) => {
                  setModel(text);
                  clearError('model');
                }}
                placeholder="Ex.: L3250"
                containerStyle={styles.flex}
                error={errors.model}
              />
            </View>
            <Field
              label="Número de série"
              value={serial}
              onChangeText={setSerial}
              placeholder="Ex.: X1Y2Z3"
              autoCapitalize="characters"
              autoCorrect={false}
              hint="Cadastre o S/N para localizar o histórico do equipamento em retornos e garantias."
            />

            <Text style={styles.groupLabel}>Acessórios deixados</Text>
            <View style={styles.chips}>
              {ACCESSORY_OPTIONS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={accessories.includes(item)}
                  onPress={() => toggleAccessory(item)}
                />
              ))}
            </View>
          </Card>

          <Card>
            <SectionTitle
              title="Defeito relatado"
              subtitle="Use as palavras do cliente; complemente no diagnóstico."
              icon="alert-circle-outline"
            />
            <View style={styles.spacer} />
            <Field
              label="O que o cliente relatou"
              required
              value={reportedDefect}
              onChangeText={(text) => {
                setReportedDefect(text);
                clearError('reportedDefect');
              }}
              placeholder="Ex.: luzes piscando, não conecta no Wi-Fi, scanner sai com faixa..."
              multiline
              error={errors.reportedDefect}
            />
            <Field
              label="Observações internas"
              value={internalNotes}
              onChangeText={setInternalNotes}
              placeholder="Ex.: cliente autorizou contato apenas à tarde..."
              multiline
              hint="Visível apenas para você."
              containerStyle={styles.lastField}
            />
          </Card>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {errorMessages.length > 0 ? (
            <FormAlert
              errors={errorMessages}
              title="Não foi possível abrir a OS"
              style={styles.footerAlert}
            />
          ) : null}
          <Button
            label="Abrir OS"
            icon="checkmark-circle-outline"
            size="lg"
            onPress={handleSave}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 20,
    gap: 14,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primaryTint,
    borderColor: colors.primarySoft,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.2,
  },
  introText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  spacer: { height: 12 },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  lastField: {
    marginBottom: 0,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  footerAlert: { marginBottom: 0 },
});
