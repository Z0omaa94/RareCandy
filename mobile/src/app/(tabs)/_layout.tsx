import { NativeTabs } from 'expo-router/native-tabs';

import { font, palette } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

// Native tab bar: Liquid Glass on iOS 26, tinted with the palette.
export default function TabsLayout() {
  const t = useTheme();
  return (
    <NativeTabs
      tintColor={t.dark ? palette.mint : palette.navy}
      iconColor={{ default: t.ink2, selected: t.dark ? palette.mint : palette.navy }}
      labelStyle={{ default: { fontFamily: font.bold, color: t.ink2 }, selected: { fontFamily: font.bold, color: t.ink } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>Accueil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="train">
        <NativeTabs.Trigger.Icon sf={{ default: 'dumbbell', selected: 'dumbbell.fill' }} />
        <NativeTabs.Trigger.Label>Entraînement</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
