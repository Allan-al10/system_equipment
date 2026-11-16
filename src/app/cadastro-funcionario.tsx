import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import type { User } from '@/lib/auth';
import { Button, Field, FormAlert } from '@/components/ui';
import { colors, radius } from '@/lib/theme';
import {
  registerEmployee,
  getCurrentUser,
  isAdmin,
  listUsers,
  deleteEmployee,
} from '@/lib/auth';

export default function CadastroFuncionarioScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [funcionarios, setFuncionarios] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      if (user && isAdmin(user)) {
        const users = await listUsers();
        setFuncionarios(users.filter((u) => u.role === 'funcionario'));
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return null;

  if (!currentUser || !isAdmin(currentUser)) {
    router.replace('/(tabs)');
    return null;
  }

  const handleRegister = async () => {
    setError('');

    if (!name.trim() || !password) {
      setError('Preencha nome e senha.');
      return;
    }

    setBusy(true);
    try {
      const { user, error: regError } = await registerEmployee(currentUser, {
        name,
        password,
      });

      if (user) {
        setName('');
        setPassword('');
        const users = await listUsers();
        setFuncionarios(users.filter((u) => u.role === 'funcionario'));
        return;
      }

      setError(regError ?? 'Não foi possível cadastrar o funcionário.');
    } catch {
      setError('Não foi possível cadastrar o funcionário. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      const { ok, error: delError } = await deleteEmployee(currentUser, id);
      if (ok) {
        const users = await listUsers();
        setFuncionarios(users.filter((u) => u.role === 'funcionario'));
      } else {
        setError(delError ?? 'Não foi possível remover o funcionário.');
      }
    } catch {
      setError('Não foi possível remover o funcionário. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>TI</Text>
          </View>
          <Text style={styles.title}>Cadastro de Funcionários</Text>
          <Text style={styles.subtitle}>
            Apenas o administrador pode cadastrar funcionários.
          </Text>
        </View>

        {error ? (
          <FormAlert errors={[error]} title="Erro" style={styles.alert} />
        ) : null}

        <Card>
          <Field
            label="Nome do funcionário"
            value={name}
            onChangeText={setName}
            placeholder="Ex.: João Silva"
            autoCapitalize="words"
          />
          <Field
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
        </Card>

        <Button
          label="Cadastrar funcionário"
          onPress={handleRegister}
          loading={busy}
          fullWidth
          style={styles.registerButton}
        />

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Funcionários cadastrados</Text>
        </View>

        {funcionarios.length === 0 ? (
          <Text style={styles.emptyList}>Nenhum funcionário cadastrado.</Text>
        ) : (
          funcionarios.map((func) => (
            <View key={func.id} style={styles.funcItem}>
              <Text style={styles.funcName}>{func.name}</Text>
              <Button
                label="Remover"
                variant="dangerSoft"
                size="sm"
                onPress={() => handleDelete(func.id)}
                loading={busy}
                style={styles.removeBtn}
              />
            </View>
          ))
        )}

        <View style={styles.footer}>
          <Button
            label="Voltar"
            variant="ghost"
            onPress={() => router.back()}
            fullWidth
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.card, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  alert: {
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadowsCard(),
  },
  registerButton: {
    marginTop: 8,
  },
  listHeader: {
    marginTop: 24,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  emptyList: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  funcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  funcName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  removeBtn: {
    minWidth: 80,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  backButton: {
    marginTop: 16,
  },
});

function shadowsCard() {
  return {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  };
}
