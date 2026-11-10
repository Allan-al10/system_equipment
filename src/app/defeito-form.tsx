import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useData } from '@/lib/data-context';
import { useToast } from '@/components/Toast';
import { Button, Card, Chip, Field, FormAlert, ScreenHeader, SectionTitle } from '@/components/ui';
import { CATEGORY_META, colors } from '@/lib/theme';
import { DEFECT_CATEGORIES, type DefectCategory, type DefectInput } from '@/lib/types';

export default function DefectFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { defects, createDefect, updateDefect } = useData();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const existing = id ? defects.find((defect) => defect.id === id) : undefined;
  const editing = Boolean(existing);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [category, setCategory] = useState<DefectCategory>(existing?.category ?? 'Outros');
  const [symptoms, setSymptoms] = useState(existing?.symptoms ?? '');
  const [causes, setCauses] = useState(existing?.causes ?? '');
  const [solution, setSolution] = useState(existing?.solution ?? '');
  const [tags, setTags] = useState(existing?.tags.join(', ') ?? '');
  const [titleError, setTitleError] = useState('');

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/defeitos');
  };

  if (id && !existing) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Defeito" onBack={goBack} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Referência não encontrada</Text>
          <Text style={styles.notFoundText}>
            Ela pode ter sido removida. Volte para a base de defeitos.
          </Text>
          <Button label="Voltar" onPress={goBack} variant="soft" style={styles.notFoundButton} />
        </View>
      </View>
    );
  }

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Informe um título para identificar o defeito.');
      return;
    }
    if (trimmedTitle.length < 3) {
      setTitleError('O título precisa ter pelo menos 3 caracteres.');
      return;
    }

    const input: DefectInput = {
      title: trimmedTitle,
      category,
      symptoms,
      causes,
      solution,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (existing) {
      updateDefect(existing.id, input);
      toast('Defeito atualizado.');
    } else {
      createDefect(input);
      toast('Defeito cadastrado.');
    }

    goBack();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={editing ? 'Editar defeito' : 'Novo defeito'}
        subtitle="Referência para diagnósticos futuros"
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
          <Card>
            <SectionTitle
              title="Identificação"
              subtitle="Um nome curto e a categoria facilitam a busca."
              icon="pricetag-outline"
            />
            <View style={styles.spacer} />
            <Field
              label="Título"
              required
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (titleError) setTitleError('');
              }}
              placeholder="Ex.: Impressora não liga"
              error={titleError}
            />

            <Text style={styles.groupLabel}>Categoria</Text>
            <View style={styles.chips}>
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
            </View>
          </Card>

          <Card>
            <SectionTitle
              title="Sinais e solução"
              subtitle="Registre o que ajuda a identificar e resolver o problema."
              icon="construct-outline"
            />
            <View style={styles.spacer} />
            <Field
              label="Sintomas"
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder="Ex.: LEDs piscando, painel apagado, papel não é puxado..."
              multiline
            />
            <Field
              label="Causas comuns"
              value={causes}
              onChangeText={setCauses}
              placeholder="Ex.: rolete gasto, fonte queimada, cabo flat solto..."
              multiline
            />
            <Field
              label="Como resolver"
              value={solution}
              onChangeText={setSolution}
              placeholder="Ex.: limpar contatos, substituir o fusor, resetar a rede..."
              multiline
            />
            <Field
              label="Tags"
              value={tags}
              onChangeText={setTags}
              placeholder="Ex.: wifi, rede, 2.4ghz"
              hint="Separe as tags por vírgula."
              autoCapitalize="none"
              containerStyle={styles.lastField}
            />
          </Card>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {titleError ? (
            <FormAlert
              errors={[titleError]}
              title={
                editing
                  ? 'Não foi possível salvar as alterações'
                  : 'Não foi possível cadastrar o defeito'
              }
              style={styles.footerAlert}
            />
          ) : null}
          <Button
            label={editing ? 'Salvar alterações' : 'Cadastrar defeito'}
            icon="checkmark"
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
  spacer: { height: 12 },
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
  footerAlert: {
    marginBottom: 0,
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
