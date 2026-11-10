import { Alert, Platform } from 'react-native';

export function confirmAsync(
  title: string,
  message: string,
  confirmLabel = 'Confirmar',
  destructive = false,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    const text = `${title}\n\n${message}`;
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(text) : false);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => finish(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => finish(true),
        },
      ],
      { cancelable: true, onDismiss: () => finish(false) },
    );
  });
}
