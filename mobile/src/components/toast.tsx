import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Press } from './button';
import { T } from './text';

type ToastState = { id: number; message: string; undo?: () => void };

/**
 * Bottom toast, rendered by the screen that uses it (a root-level toast would sit
 * behind native modal screens). Shows for 3 s, or 5 s when it offers Annuler.
 */
export function useToast(bottom = 24) {
  const t = useTheme();
  const [state, setState] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const show = (message: string, undo?: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    setState({ id: Date.now(), message, undo });
    timer.current = setTimeout(() => setState(null), undo ? 5000 : 3000);
  };

  const node = state ? (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom }}>
      <Animated.View
        key={state.id}
        entering={FadeInDown.duration(240)}
        exiting={FadeOutDown.duration(180)}
        accessibilityLiveRegion="polite"
        style={{
          minHeight: 52,
          borderRadius: radius.pill,
          backgroundColor: t.pillBg,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 20,
          paddingRight: state.undo ? 6 : 20,
          gap: 8,
        }}>
        <T variant="label" color={t.pillFg} style={{ flex: 1 }}>
          {state.message}
        </T>
        {state.undo && (
          <Press
            onPress={() => {
              state.undo?.();
              setState(null);
            }}
            accessibilityRole="button"
            style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: t.pillFg }}>
            <T variant="label" color={t.pillBg}>
              Annuler
            </T>
          </Press>
        )}
      </Animated.View>
    </View>
  ) : null;

  return { show, node };
}
