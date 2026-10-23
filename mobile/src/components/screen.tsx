import { ScrollView, View, type ScrollViewProps } from 'react-native';

import { Backdrop } from './backdrop';
import { T } from './text';

const isWeb = process.env.EXPO_OS === 'web';

/**
 * Scrolling screen over the frosted backdrop. The ScrollView comes first so iOS
 * can adjust it under headers and above the tab bar (contentInsetAdjustmentBehavior).
 */
export function ScreenScroll({ children, contentContainerStyle, ...props }: ScrollViewProps) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        {...props}
        contentContainerStyle={[{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: isWeb ? 120 : 40, gap: 12 }, contentContainerStyle]}>
        {children}
      </ScrollView>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
        <Backdrop />
      </View>
    </View>
  );
}

/** Large title for tab screens, with a small line above it. */
export function TabHeader({ kicker, title, trailing }: { kicker: string; title: string; trailing?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: isWeb ? 76 : 8, paddingBottom: 4 }}>
      <View style={{ flex: 1 }}>
        <T variant="small" tone="ink2">
          {kicker}
        </T>
        <T variant="title" accessibilityRole="header">
          {title}
        </T>
      </View>
      {trailing}
    </View>
  );
}
