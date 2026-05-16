import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Hook that wires up native iOS/Android behaviour when the app runs inside Capacitor.
 * Safe to call on the web — it no-ops if not native.
 */
export const useNativeApp = () => {
  const [isNative] = useState(() => Capacitor.isNativePlatform());

  useEffect(() => {
    if (!isNative) return;

    (async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await SplashScreen.hide();
      } catch (err) {
        console.warn('Native init error', err);
      }
    })();
  }, [isNative]);

  return { isNative };
};

export const hapticTap = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
};

export const registerPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return null;
  await PushNotifications.register();
  return new Promise<string>((resolve) => {
    PushNotifications.addListener('registration', (token) => resolve(token.value));
  });
};
