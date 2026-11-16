import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DataProvider } from '@/lib/data-context';
import { ToastProvider } from '@/components/Toast';
import { colors } from '@/lib/theme';
import { getCurrentUser } from '@/lib/auth';

export default function RootLayout() {
  const [checked, setChecked] = useState(false);
  const [redirectTo, setRedirectTo] = useState<'/(tabs)' | '/login' | null>(null);

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((user) => {
      if (!mounted) return;
      setRedirectTo(user ? '/(tabs)' : '/login');
      setChecked(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!checked || !redirectTo) return;
    router.replace(redirectTo);
  }, [checked, redirectTo]);

  if (!checked) {
    return (
      <SafeAreaProvider>
        <DataProvider>
          <ToastProvider>
            <StatusBar style="dark" />
          </ToastProvider>
        </DataProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <DataProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="cadastro-funcionario" />
            <Stack.Screen name="nova-os" options={{ presentation: 'modal' }} />
            <Stack.Screen name="os/[id]" />
            <Stack.Screen name="registro/[id]" />
            <Stack.Screen name="defeito/[id]" />
            <Stack.Screen name="defeito-form" options={{ presentation: 'modal' }} />
          </Stack>
        </ToastProvider>
      </DataProvider>
    </SafeAreaProvider>
  );
}
