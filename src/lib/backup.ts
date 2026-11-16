import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import type { AppData, BackupPayload } from './types';
import { normalizeAppData } from './storage';

export type ExportBackupResult = 'shared' | 'downloaded' | 'unavailable';

export function backupFilename(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `tecinfo-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

export function serializeBackup(data: AppData): string {
  const payload: BackupPayload = {
    app: 'TecInfo',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBackupJson(raw: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('O arquivo selecionado não é um JSON válido.');
  }

  const wrapper =
    typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  const candidate = wrapper && 'data' in wrapper ? wrapper.data : parsed;
  const hasMarker = wrapper?.app === 'TecInfo';
  const data = normalizeAppData(candidate);

  if (!hasMarker && data.orders.length === 0 && data.defects.length === 0) {
    throw new Error('Este arquivo não parece ser um backup do TecInfo.');
  }

  return data;
}

export async function exportBackup(data: AppData): Promise<ExportBackupResult> {
  const json = serializeBackup(data);
  const filename = backupFilename();

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return 'downloaded';
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  await file.write(json);

  const Sharing = await import('expo-sharing');
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Salvar backup do TecInfo',
      UTI: 'public.json',
    });
    return 'shared';
  }

  return 'unavailable';
}

export async function pickBackupJson(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  if (Platform.OS === 'web') {
    if (asset.file) return await asset.file.text();
    const response = await fetch(asset.uri);
    return await response.text();
  }

  const { File } = await import('expo-file-system');
  return await new File(asset.uri).text();
}
