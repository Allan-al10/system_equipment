import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { Button, Field, FormAlert } from '@/components/ui';
import { colors, radius } from '@/lib/theme';
import { loginUser } from '@/lib/auth';

export default function LoginScreen() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!password) {
      setError('Informe a senha.');
      return;
    }

    setBusy(true);
    try {
      const { user, error: loginError } = await loginUser(password);

      if (user) {
        router.replace('/(tabs)');
        return;
      }

      setError(loginError ?? 'Não foi possível fazer o login.');
    } catch {
      setError('Não foi possível fazer o login. Tente novamente.');
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
          <Text style={styles.title}>Bem-vindo ao TecInfo</Text>
          <Text style={styles.subtitle}>
            Informe a senha para acessar o aplicativo.
          </Text>
        </View>

        {error ? (
          <FormAlert errors={[error]} title="Erro ao entrar" style={styles.alert} />
        ) : null}

        <Card>
          <Field
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            error={error ? 'Senha incorreta.' : undefined}
          />
        </Card>

        <Button
          label="Entrar"
          onPress={handleLogin}
          loading={busy}
          fullWidth
          style={styles.loginButton}
        />
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
    gap: 18,
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
    fontSize: 26,
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
  loginButton: {
    marginTop: 8,
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
