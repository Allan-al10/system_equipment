import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DataProvider } from '@/lib/data-context';
import { ToastProvider } from '@/components/Toast';
import { colors } from '@/lib/theme';

export default function RootLayout() {
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
            <Stack.Screen name="nova-os" options={{ presentation: 'modal' }} />
            <Stack.Screen name="os/[id]" />
            <Stack.Screen name="defeito/[id]" />
            <Stack.Screen name="defeito-form" options={{ presentation: 'modal' }} />
          </Stack>
        </ToastProvider>
      </DataProvider>
    </SafeAreaProvider>
  );
}
