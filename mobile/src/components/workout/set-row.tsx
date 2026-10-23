import { useState } from 'react';
import { TextInput, View } from 'react-native';

import type { ActiveSet } from '@/core/engine';
import { fmtSet, goalLabel, num, parseNum } from '@/core/format';
import { font, radius } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Press } from '../button';
import { Icon } from '../icon';
import { T } from '../text';

export const COLUMNS = { set: 40, previous: 1, input: 60, check: 44 } as const;

function meetsTarget(s: ActiveSet) {
  return !!s.target && s.reps >= s.target.reps && s.weight >= (s.target.weight ?? 0);
}

/**
 * One line of the set table: SÉRIE | PRÉCÉDENT | KG | RÉPS | ✓, pre-filled with the
 * target. Text stays local while typing ("62," is not a number yet); valid numbers
 * are saved at once, and the field shows the saved value again when it loses focus.
 */
export function SetRow({
  set,
  index,
  onChange,
  onToggle,
}: {
  set: ActiveSet;
  index: number;
  onChange: (field: 'weight' | 'reps', value: number) => void;
  onToggle: () => void;
}) {
  const t = useTheme();
  const [weightText, setWeightText] = useState(num(set.weight));
  const [repsText, setRepsText] = useState(String(set.reps));
  const [error, setError] = useState<'weight' | 'reps' | null>(null);

  const edit = (field: 'weight' | 'reps', text: string) => {
    (field === 'weight' ? setWeightText : setRepsText)(text);
    const v = parseNum(text);
    setError(v === null && text.trim() !== '' ? field : null);
    if (v !== null) onChange(field, field === 'reps' ? Math.round(v) : v);
  };
  const reset = () => {
    setWeightText(num(set.weight));
    setRepsText(String(set.reps));
    setError(null);
  };

  const ok = meetsTarget(set);
  const input = (field: 'weight' | 'reps') => (
    <TextInput
      value={field === 'weight' ? weightText : repsText}
      onChangeText={(text) => edit(field, text)}
      onBlur={reset}
      keyboardType={field === 'weight' ? 'decimal-pad' : 'number-pad'}
      selectTextOnFocus
      accessibilityLabel={`${field === 'weight' ? 'Kilos' : 'Répétitions'} série ${index + 1}`}
      maxFontSizeMultiplier={1.3}
      style={{
        width: COLUMNS.input,
        height: 44,
        borderRadius: radius.field,
        backgroundColor: set.done ? 'transparent' : t.fillStrong,
        borderWidth: error === field ? 2 : 0,
        borderColor: t.danger,
        color: t.ink,
        textAlign: 'center',
        fontFamily: font.extrabold,
        fontSize: 17,
        fontVariant: ['tabular-nums'],
        padding: 0,
      }}
    />
  );

  return (
    <View style={{ borderRadius: radius.field, backgroundColor: set.done ? t.mintSoft : 'transparent', paddingVertical: 4, paddingHorizontal: 4, gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <T variant="label" style={{ width: COLUMNS.set, textAlign: 'center' }}>
          {index + 1}
        </T>
        <T variant="small" tone="ink2" numberOfLines={1} style={{ flex: COLUMNS.previous }}>
          {set.previous ? fmtSet(set.previous) : '-'}
        </T>
        {input('weight')}
        {input('reps')}
        <Press
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.done }}
          accessibilityLabel={`Valider la série ${index + 1}`}
          style={{
            width: COLUMNS.check,
            height: 44,
            borderRadius: radius.field,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: set.done ? t.pillBg : t.fill,
          }}>
          <Icon name="check" size={20} color={set.done ? t.pillFg : t.ink3} />
        </Press>
      </View>
      {(set.target || error) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: COLUMNS.set + 6 }}>
          {!error && <Icon name={ok ? 'checkCircle' : 'target'} size={13} color={ok ? t.ok : t.ink3} />}
          <T variant="caption" color={error ? t.danger : ok ? t.ok : t.ink3}>
            {error ? 'Entre un nombre (ex. 62,5)' : goalLabel(set.target!)}
          </T>
        </View>
      )}
    </View>
  );
}
