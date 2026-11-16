import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';

import { router } from 'expo-router';

import { useData } from '@/lib/data-context';
import { useToast } from '@/components/Toast';
import {
  Button,
  Card,
  Chip,
  Divider,
  Field,
  FormAlert,
  ScreenHeader,
  SectionTitle,
} from '@/components/ui';
import { colors, radius } from '@/lib/theme';
import { APP_VERSION, DEADLINE_PRESETS, WARRANTY_PRESETS } from '@/lib/constants';
import { formatPhoneBR, isValidPhoneBR } from '@/lib/format';
import { exportBackup, parseBackupJson, pickBackupJson } from '@/lib/backup';
import { confirmAsync } from '@/lib/confirm';
import type { User } from '@/lib/auth';
import { getCurrentUser, isAdmin } from '@/lib/auth';

const STEPS = [
  {
    title: 'Abra a OS',
    text: 'Registre o cliente, o equipamento e as anotações do cliente na entrada.',
  },
  {
    title: 'Diagnostique e orce',
    text: 'Faça os testes, registre as anotações internas e adicione peças e serviços.',
  },
  {
    title: 'Envie e autorize',
    text: 'Envie o orçamento, registre a resposta do cliente e as soluções do reparo.',
  },
  {
    title: 'Pronto e entregue',
    text: 'Marque como pronto, registre a entrega e acompanhe a garantia. A entrega move o serviço para o grupo Entregues em Registros; prazos vencidos e garantias a fazer ficam em Pendências.',
  },
];

export default function SettingsScreen() {
  const { settings } = useData();
  const formKey = [
    settings.technicianName,
    settings.companyName,
    settings.phone,
    String(settings.defaultWarrantyDays),
    String(settings.defaultDeadlineDays),
  ].join('\u0000');

  return <SettingsForm key={formKey} />;
}

function SettingsForm() {
  const { orders, defects, settings, updateSettings, replaceData, resetData, getSnapshot } =
    useData();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      if (user) setCurrentUser(user);
    };
    loadUser();
  }, []);

  const [name, setName] = useState(settings.technicianName);
  const [company, setCompany] = useState(settings.companyName);
  const [phone, setPhone] = useState(settings.phone);
  const [warranty, setWarranty] = useState(String(settings.defaultWarrantyDays));
  const [deadline, setDeadline] = useState(String(settings.defaultDeadlineDays));
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const warrantyNumber = Number(warranty.replace(/\D/g, '')) || 0;
  const deadlineNumber = Number(deadline.replace(/\D/g, '')) || 0;
  const version = Constants.expoConfig?.version ?? APP_VERSION;

  const nameError =
    name.trim() && name.trim().length < 2 ? 'O nome do técnico está muito curto.' : '';
  const phoneError =
    phone.trim() && !isValidPhoneBR(phone)
      ? 'Telefone inválido. Informe DDD + número (10 ou 11 dígitos).'
      : '';
  const warrantyError =
    warrantyNumber > 3650 ? 'A garantia padrão pode ser de no máximo 3650 dias.' : '';
  const deadlineError =
    deadlineNumber > 365 ? 'O prazo padrão pode ser de no máximo 365 dias.' : '';
  const validationErrors = [nameError, phoneError, warrantyError, deadlineError].filter(Boolean);
  const visibleErrors = submitted ? validationErrors : [];

  const handleSave = () => {
    setSubmitted(true);
    if (validationErrors.length > 0) {
      toast('Corrija os dados destacados para salvar os ajustes.', 'error');
      return;
    }

    const days = Math.max(0, Math.min(3650, Math.round(warrantyNumber)));
    const deadlineDays = Math.max(0, Math.min(365, Math.round(deadlineNumber)));
    updateSettings({
      technicianName: name.trim(),
      companyName: company.trim(),
      phone: formatPhoneBR(phone),
      defaultWarrantyDays: days,
      defaultDeadlineDays: deadlineDays,
    });
    setWarranty(String(days));
    setDeadline(String(deadlineDays));
    toast('Ajustes salvos.');
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      const result = await exportBackup(getSnapshot());
      if (result === 'downloaded') toast('Backup baixado com sucesso.');
      else if (result === 'shared') toast('Backup pronto para compartilhar.');
      else toast('Compartilhamento indisponível neste aparelho.', 'error');
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Não foi possível exportar o backup.',
        'error',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    setBusy('import');
    try {
      const raw = await pickBackupJson();
      if (!raw) return;

      const data = parseBackupJson(raw);
      const ok = await confirmAsync(
        'Importar backup',
        `O arquivo contém ${data.orders.length} ${data.orders.length === 1 ? 'OS' : 'OS'} e ${data.defects.length} ${data.defects.length === 1 ? 'defeito' : 'defeitos'}. Os dados atuais serão substituídos.`,
        'Importar',
      );
      if (!ok) return;

      replaceData(data);
      toast('Backup importado com sucesso.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Não foi possível importar o backup.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    const ok = await confirmAsync(
      'Apagar todos os dados',
      'As OS, os defeitos cadastrados e os ajustes serão removidos. A base padrão de defeitos será restaurada. Essa ação não pode ser desfeita.',
      'Apagar tudo',
      true,
    );
    if (!ok) return;

    resetData();
    toast('Todos os dados foram apagados.');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Ajustes" subtitle="Perfil, backup e preferências" />

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
            <SectionTitle
              title="Perfil do técnico"
              subtitle="Usado nos resumos compartilhados."
              icon="person-circle-outline"
            />

            <View style={styles.spacer} />

            <Field
              label="Seu nome"
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Allan"
              autoCapitalize="words"
              error={submitted ? nameError : undefined}
            />
            <Field
              label="Empresa / assistência"
              value={company}
              onChangeText={setCompany}
              placeholder="Ex.: TecInfo Assistência"
              autoCapitalize="words"
            />
            <Field
              label="Telefone"
              value={phone}
              onChangeText={(text) => setPhone(formatPhoneBR(text))}
              keyboardType="phone-pad"
              placeholder="(11) 91234-5678"
              error={submitted ? phoneError : undefined}
            />
            <Field
              label="Garantia padrão (dias)"
              value={warranty}
              onChangeText={(text) => setWarranty(text.replace(/\D/g, ''))}
              keyboardType="numeric"
              placeholder="90"
              hint="Aplicada ao criar uma nova OS. Pode ser alterada em cada serviço."
              error={submitted ? warrantyError : undefined}
            />

            <View style={styles.presets}>
              {WARRANTY_PRESETS.map((days) => (
                <Chip
                  key={days}
                  label={days === 0 ? 'Sem garantia' : `${days} dias`}
                  selected={warrantyNumber === days}
                  onPress={() => setWarranty(String(days))}
                />
              ))}
            </View>

            <Field
              label="Prazo padrão de entrega (dias)"
              value={deadline}
              onChangeText={(text) => setDeadline(text.replace(/\D/g, ''))}
              keyboardType="numeric"
              placeholder="7"
              hint="Aplicado ao criar uma nova OS. 0 = sem prazo padrão. Serviços com prazo vencido aparecem em Pendências."
              error={submitted ? deadlineError : undefined}
            />

            <View style={styles.presets}>
              {DEADLINE_PRESETS.map((days) => (
                <Chip
                  key={days}
                  label={days === 0 ? 'Sem prazo' : `${days} dias`}
                  selected={deadlineNumber === days}
                  onPress={() => setDeadline(String(days))}
                />
              ))}
            </View>

            {visibleErrors.length > 0 ? (
              <FormAlert
                errors={visibleErrors}
                title="Não foi possível salvar o perfil"
                style={styles.saveAlert}
              />
            ) : null}

            <Button
              label="Salvar ajustes"
              icon="checkmark"
              onPress={handleSave}
              fullWidth
              style={styles.saveButton}
            />
          </Card>

          <Card>
            <SectionTitle
              title="Dados e backup"
              subtitle="Tudo fica salvo somente neste aparelho."
              icon="server-outline"
            />

            <View style={styles.dataCounts}>
              <View style={styles.dataCount}>
                <Text style={styles.dataValue}>{orders.length}</Text>
                <Text style={styles.dataLabel}>
                  {orders.length === 1 ? 'ordem de serviço' : 'ordens de serviço'}
                </Text>
              </View>
              <View style={styles.dataDivider} />
              <View style={styles.dataCount}>
                <Text style={styles.dataValue}>{defects.length}</Text>
                <Text style={styles.dataLabel}>
                  {defects.length === 1 ? 'defeito cadastrado' : 'defeitos cadastrados'}
                </Text>
              </View>
            </View>

            <Text style={styles.dataHint}>
              Faça backup regularmente. Se trocar de celular ou desinstalar o app, os dados podem
              ser perdidos.
            </Text>

            <View style={styles.dataActions}>
              <Button
                label="Exportar backup"
                icon="download-outline"
                variant="soft"
                onPress={handleExport}
                loading={busy === 'export'}
                disabled={busy !== null}
                fullWidth
              />
              <Button
                label="Importar backup"
                icon="cloud-upload-outline"
                variant="outline"
                onPress={handleImport}
                loading={busy === 'import'}
                disabled={busy !== null}
                fullWidth
              />
              <Button
                label="Apagar todos os dados"
                icon="trash-outline"
                variant="danger"
                onPress={handleReset}
                disabled={busy !== null}
                fullWidth
              />
            </View>
          </Card>

          <Card>
            <SectionTitle title="Como funciona" icon="compass-outline" />
            <View style={styles.steps}>
              {STEPS.map((step, index) => (
                <View key={step.title} style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepText}>{step.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <SectionTitle
              title="Sobre o TecInfo"
              subtitle={`Versão ${version}`}
              icon="information-circle-outline"
            />
            <Text style={styles.aboutText}>
              Aplicativo para técnicos de impressoras registrarem OS, orçamentos, serviços
              executados e garantias, com uma base de consulta de defeitos comuns.
            </Text>
            <Divider />
            <View style={styles.aboutRow}>
              <Ionicons name="phone-portrait-outline" size={16} color={colors.textMuted} />
              <Text style={styles.aboutSmall}>Funciona offline • dados locais</Text>
            </View>
            <View style={styles.aboutRow}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
              <Text style={styles.aboutSmall}>
                Nenhuma informação é enviada para servidores externos.
              </Text>
            </View>
          </Card>

          {isAdmin(currentUser) ? (
            <Card>
              <SectionTitle
                title="Administração"
                subtitle="Gerenciamento de usuários do sistema"
                icon="people-outline"
              />
              <Button
                label="Cadastrar funcionário"
                icon="person-add-outline"
                onPress={() => router.push('/cadastro-funcionario')}
                fullWidth
                style={styles.adminButton}
              />
            </Card>
          ) : null}
        </ScrollView>
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
    paddingBottom: 30,
    gap: 14,
  },
  spacer: { height: 12 },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -2,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 2,
  },
  saveAlert: {
    marginBottom: 10,
  },
  dataCounts: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: 14,
  },
  dataCount: {
    flex: 1,
    alignItems: 'center',
  },
  dataDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.border,
  },
  dataValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  dataLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  dataHint: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 14,
  },
  dataActions: {
    gap: 9,
  },
  steps: {
    gap: 14,
    marginTop: 14,
  },
  step: {
    flexDirection: 'row',
    gap: 11,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  stepText: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  aboutText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: 12,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  aboutSmall: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 17,
  },
  adminButton: {
    marginTop: 8,
  },
});
