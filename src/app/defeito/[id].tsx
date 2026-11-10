import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';

import { useData } from '@/lib/data-context';
import { useToast } from '@/components/Toast';
import {
  Button,
  Card,
  IconButton,
  ScreenHeader,
  SectionTitle,
  Tag,
} from '@/components/ui';
import { CATEGORY_META, colors, radius } from '@/lib/theme';
import { formatDateTime } from '@/lib/format';
import { buildDefectText, shareText } from '@/lib/share';
import { confirmAsync } from '@/lib/confirm';

export default function DefectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { defects, deleteDefect } = useData();
  const toast = useToast();

  const defect = defects.find((item) => item.id === id);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/defeitos');
  };

  if (!defect) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Defeito" onBack={goBack} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Referência não encontrada</Text>
          <Text style={styles.notFoundText}>Ela pode ter sido removida da base de defeitos.</Text>
          <Button label="Voltar" variant="soft" onPress={goBack} style={styles.notFoundButton} />
        </View>
      </View>
    );
  }

  const meta = CATEGORY_META[defect.category];

  const handleShare = async () => {
    const result = await shareText(buildDefectText(defect), defect.title);
    if (result === 'copied') {
      toast('Checklist copiado para a área de transferência.', 'info');
    }
  };

  const handleDelete = async () => {
    const ok = await confirmAsync(
      'Excluir referência',
      `Remover "${defect.title}" da base de defeitos?`,
      'Excluir',
      true,
    );
    if (!ok) return;

    deleteDefect(defect.id);
    toast('Referência excluída.');
    goBack();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Detalhe do defeito"
        subtitle={defect.category}
        onBack={goBack}
        right={
          <View style={styles.headerActions}>
            <IconButton
              icon="share-social-outline"
              accessibilityLabel="Compartilhar referência"
              onPress={handleShare}
            />
            <IconButton
              icon="create-outline"
              accessibilityLabel="Editar referência"
              onPress={() =>
                router.push({ pathname: '/defeito-form', params: { id: defect.id } })
              }
            />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: meta.bg }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name={meta.icon} size={24} color={meta.color} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.category, { color: meta.color }]}>{defect.category}</Text>
            <Text style={styles.title}>{defect.title}</Text>
          </View>
        </View>

        {defect.tags.length ? (
          <View style={styles.tags}>
            {defect.tags.map((tag) => (
              <Tag key={tag} label={tag} color={meta.color} backgroundColor={meta.bg} />
            ))}
          </View>
        ) : null}

        <Card>
          <SectionTitle title="Sintomas" icon="eye-outline" />
          <Text style={styles.body}>{defect.symptoms.trim() || 'Não informado.'}</Text>
        </Card>

        <Card>
          <SectionTitle title="Causas comuns" icon="help-circle-outline" />
          <Text style={styles.body}>{defect.causes.trim() || 'Não informado.'}</Text>
        </Card>

        <Card>
          <SectionTitle title="Como resolver" icon="construct-outline" />
          <Text style={styles.body}>{defect.solution.trim() || 'Não informado.'}</Text>
        </Card>

        <Text style={styles.updated}>Atualizado em {formatDateTime(defect.updatedAt)}</Text>

        <View style={styles.actions}>
          <Button
            label="Editar"
            icon="create-outline"
            variant="soft"
            onPress={() => router.push({ pathname: '/defeito-form', params: { id: defect.id } })}
            style={styles.flex}
          />
          <Button
            label="Excluir"
            icon="trash-outline"
            variant="dangerSoft"
            onPress={handleDelete}
            style={styles.flex}
          />
        </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: radius.lg,
    padding: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
    marginTop: 3,
    letterSpacing: -0.4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: 10,
  },
  updated: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
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
