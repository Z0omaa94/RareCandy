import { createContext, use, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, TextInput, View } from 'react-native';

import { font, radius } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Press } from './button';
import { Glass } from './glass';
import { T } from './text';

export type DialogButton = {
  label: string;
  /** primary: navy pill; destructive: red; on: the current choice in a list. */
  role?: 'primary' | 'destructive' | 'on';
  run?: (value: string) => void;
};

export type DialogSpec = {
  title: string;
  message?: string;
  buttons: DialogButton[];
  input?: { label: string; value?: string; placeholder?: string };
};

const DialogContext = createContext<(spec: DialogSpec) => void>(() => {});

export const useDialog = () => use(DialogContext);

/**
 * Glass dialog shown in a native Modal. Each modal screen mounts its own provider:
 * iOS presents a Modal from the closest view controller, which must not already
 * be presenting another screen.
 */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const [spec, setSpec] = useState<DialogSpec | null>(null);
  const [value, setValue] = useState('');
  // iOS cannot present a screen while the Modal is still closing, so an action that
  // navigates must wait for onDismiss (with a timer in case the event never comes).
  const pending = useRef<(() => void) | null>(null);
  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  const open = (next: DialogSpec) => {
    setValue(next.input?.value ?? '');
    setSpec(next);
  };
  const close = () => setSpec(null);
  const choose = (b: DialogButton) => {
    close();
    if (!b.run) return;
    const typed = value;
    if (process.env.EXPO_OS !== 'ios') return b.run(typed);
    pending.current = () => b.run?.(typed);
    setTimeout(runPending, 450);
  };

  return (
    <DialogContext value={open}>
      {children}
      <Modal visible={!!spec} transparent animationType="fade" onRequestClose={close} onDismiss={runPending} statusBarTranslucent>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <Pressable
            onPress={close}
            accessibilityLabel="Fermer"
            style={{ flex: 1, backgroundColor: t.scrim, justifyContent: 'center', padding: 24 }}>
            {spec && (
              <Pressable onPress={() => {}} accessible={false}>
                <Glass solid style={{ padding: 20, gap: 12 }}>
                  <View accessibilityRole="alert" style={{ gap: 6 }}>
                    <T variant="h3">{spec.title}</T>
                    {spec.message && (
                      <T variant="body" tone="ink2">
                        {spec.message}
                      </T>
                    )}
                  </View>
                  {spec.input && (
                    <View style={{ gap: 6 }}>
                      <T variant="caption" tone="ink2">
                        {spec.input.label.toUpperCase()}
                      </T>
                      <TextInput
                        value={value}
                        onChangeText={setValue}
                        placeholder={spec.input.placeholder}
                        placeholderTextColor={t.ink3}
                        autoFocus
                        accessibilityLabel={spec.input.label}
                        onSubmitEditing={() => {
                          const primary = spec.buttons.find((b) => b.role === 'primary');
                          if (primary) choose(primary);
                        }}
                        style={{
                          minHeight: 48,
                          paddingHorizontal: 14,
                          borderRadius: radius.field,
                          backgroundColor: t.fill,
                          color: t.ink,
                          fontFamily: font.semibold,
                          fontSize: 16,
                        }}
                      />
                    </View>
                  )}
                  <View style={{ gap: 8, paddingTop: 4 }}>
                    {spec.buttons.map((b) => {
                      const primary = b.role === 'primary' || b.role === 'on';
                      return (
                        <Press
                          key={b.label}
                          onPress={() => choose(b)}
                          accessibilityRole="button"
                          accessibilityState={b.role === 'on' ? { selected: true } : undefined}
                          style={{
                            minHeight: 48,
                            borderRadius: radius.button,
                            borderCurve: 'continuous',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 16,
                            backgroundColor: primary ? t.pillBg : t.fill,
                          }}>
                          <T variant="label" color={primary ? t.pillFg : b.role === 'destructive' ? t.danger : t.ink}>
                            {b.label}
                          </T>
                        </Press>
                      );
                    })}
                    {/* A button without an action already closes the dialog. */}
                    {spec.buttons.every((b) => b.run) && (
                      <Press onPress={close} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <T variant="label" tone="ink2">
                          Annuler
                        </T>
                      </Press>
                    )}
                  </View>
                </Glass>
              </Pressable>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </DialogContext>
  );
}
