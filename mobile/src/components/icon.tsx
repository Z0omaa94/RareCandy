import { SymbolView, type SFSymbol } from 'expo-symbols';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PHOSPHOR } from './icon-paths';

export type IconName = keyof typeof PHOSPHOR;

// SF Symbols on iOS, Phosphor elsewhere (MASTER.md: one icon family per platform).
const SF: Record<IconName, SFSymbol> = {
  home: 'house',
  homeFill: 'house.fill',
  barbell: 'dumbbell',
  barbellFill: 'dumbbell.fill',
  user: 'person',
  userFill: 'person.fill',
  timer: 'timer',
  note: 'square.and.pencil',
  plus: 'plus',
  check: 'checkmark',
  back: 'chevron.left',
  chevron: 'chevron.right',
  down: 'chevron.down',
  more: 'ellipsis',
  chart: 'chart.line.uptrend.xyaxis',
  calendar: 'calendar',
  trophy: 'trophy',
  trophyFill: 'trophy.fill',
  history: 'clock.arrow.circlepath',
  arrowUp: 'arrow.up',
  arrowUR: 'arrow.up.right',
  warning: 'exclamationmark.triangle.fill',
  x: 'xmark',
  play: 'play.fill',
  search: 'magnifyingglass',
  list: 'list.bullet',
  trash: 'trash',
  pencil: 'pencil',
  minus: 'minus',
  skip: 'forward.end',
  checkCircle: 'checkmark.circle.fill',
  xCircle: 'xmark.circle',
  fire: 'flame',
  arrowDown: 'arrow.down',
  target: 'target',
};

export function Icon({ name, size = 18, color }: { name: IconName; size?: number; color: string }) {
  if (process.env.EXPO_OS === 'ios') {
    return <SymbolView name={SF[name]} size={size} tintColor={color} weight="semibold" resizeMode="scaleAspectFit" />;
  }
  // Wrapped in a View so that, on web, the icon stacks above absolutely positioned layers.
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 256 256" accessible={false}>
        <Path d={PHOSPHOR[name]} fill={color} />
      </Svg>
    </View>
  );
}
