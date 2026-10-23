import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DialogProvider } from '@/components/dialog';
import { font } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

SplashScreen.preventAutoHideAsync();

const isIOS = process.env.EXPO_OS === 'ios';

export default function RootLayout() {
  const t = useTheme();
  const [loaded, error] = useFonts({ Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  const base = t.dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: t.ink, background: t.bg, card: t.bg, text: t.ink, border: t.line },
  };

  // Detail screens push over the tabs with a native header, transparent on iOS
  // so the frosted background shows through.
  const detail = {
    headerShown: true,
    headerTransparent: isIOS,
    headerStyle: isIOS ? undefined : { backgroundColor: t.bg },
    headerShadowVisible: false,
    headerTintColor: t.ink,
    headerTitleStyle: { fontFamily: font.extrabold, color: t.ink },
    headerBackButtonDisplayMode: 'minimal' as const,
  };

  return (
    <ThemeProvider value={navTheme}>
      <DialogProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="summary" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="routine/[id]" options={{ presentation: 'modal', gestureEnabled: false }} />
          <Stack.Screen name="exercises" options={{ ...detail, title: 'Exercices' }} />
          <Stack.Screen name="exercise/[id]" options={{ ...detail, title: '' }} />
          <Stack.Screen name="history" options={{ ...detail, title: 'Historique' }} />
          <Stack.Screen name="session/[id]" options={{ ...detail, title: '' }} />
          <Stack.Screen name="records" options={{ ...detail, title: 'Records' }} />
          <Stack.Screen name="calendar" options={{ ...detail, title: 'Calendrier' }} />
        </Stack>
      </DialogProvider>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
