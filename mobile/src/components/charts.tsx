import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import type { WeekStats } from '@/core/engine';
import { big, fmtDate } from '@/core/format';
import { font, palette } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** Weekly bars; the current week in the "now" colour. */
export function BarChart({ weeks, value, label, unit }: { weeks: WeekStats[]; value: (w: WeekStats) => number; label: string; unit: string }) {
  const t = useTheme();
  const W = 330, H = 150, L = 4, R = 4, T = 10, B = 22;
  const max = Math.max(1, ...weeks.map(value));
  const bw = (W - L - R) / weeks.length;
  const avg = weeks.reduce((a, w) => a + value(w), 0) / weeks.length;
  const summary = `${label} par semaine sur ${weeks.length} semaines. Cette semaine : ${big(value(weeks[weeks.length - 1]))}${unit}. Moyenne : ${big(avg)}${unit}.`;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {[0.5, 1].map((k) => {
          const y = T + (1 - k) * (H - T - B);
          return <Line key={k} x1={0} x2={W} y1={y} y2={y} stroke={t.line} strokeWidth={1} />;
        })}
        {weeks.map((w, i) => {
          const h = Math.max(3, (value(w) / max) * (H - T - B));
          const x = L + i * bw + bw * 0.18;
          const now = i === weeks.length - 1;
          return (
            <Rect key={w.start} x={x} y={H - B - h} width={bw * 0.64} height={h} rx={6} fill={now ? t.dataNow : t.data} />
          );
        })}
        {weeks.map((w, i) =>
          i % 3 === 0 || i === weeks.length - 1 ? (
            <SvgText key={`l${w.start}`} x={L + i * bw + bw * 0.5} y={H - 6} fontSize={11} fontFamily={font.bold} fill={t.ink2} textAnchor="middle">
              {fmtDate(w.start)}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  );
}

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

/** Progress line with a mint area, y grid on round values. */
export function LineChart({ points, label }: { points: { x: number; y: number }[]; label: string }) {
  const t = useTheme();
  const area = `area${useId().replace(/\W/g, '')}`;
  const W = 330, H = 170, L = 38, R = 10, T = 12, B = 24;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yLo = Math.min(...ys), yHi = Math.max(...ys);
  const span = Math.max(yHi - yLo, 1);
  const step = niceStep(span / 3);
  const y0 = Math.floor((yLo - span * 0.1) / step) * step;
  const y1 = Math.ceil((yHi + span * 0.1) / step) * step;
  const sx = (v: number) => (xMax === xMin ? (L + W - R) / 2 : L + ((v - xMin) / (xMax - xMin)) * (W - L - R));
  const sy = (v: number) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const first = points[0], last = points[points.length - 1];
  const summary = `${label} : de ${big(first.y)} le ${fmtDate(first.x)} à ${big(last.y)} le ${fmtDate(last.x)}, sur ${points.length} séances.`;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ');
  const grid: number[] = [];
  for (let v = y0; v <= y1 + 1e-9; v += step) grid.push(v);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id={area} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.mint} stopOpacity={0.65} />
            <Stop offset="1" stopColor={palette.mint} stopOpacity={0.05} />
          </LinearGradient>
        </Defs>
        {grid.map((v) => (
          <G key={v}>
            <Line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} stroke={t.line} strokeWidth={1} />
            <SvgText x={L - 6} y={sy(v) + 4} fontSize={11} fontFamily={font.bold} fill={t.ink2} textAnchor="end">
              {big(v)}
            </SvgText>
          </G>
        ))}
        <Path d={`${line} L${sx(xMax).toFixed(1)} ${H - B} L${sx(xMin).toFixed(1)} ${H - B} Z`} fill={`url(#${area})`} />
        <Path d={line} stroke={t.data} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <Circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={isLast ? 5 : 3} fill={isLast ? t.dataNow : t.data} stroke={t.bg} strokeWidth={isLast ? 2 : 0} />
          );
        })}
        <SvgText x={L} y={H - 6} fontSize={11} fontFamily={font.bold} fill={t.ink2} textAnchor="start">
          {fmtDate(xMin)}
        </SvgText>
        <SvgText x={W - R} y={H - 6} fontSize={11} fontFamily={font.bold} fill={t.ink2} textAnchor="end">
          {fmtDate(xMax)}
        </SvgText>
      </Svg>
    </View>
  );
}
