import { Empty } from '@/components/bits';
import { ScreenScroll } from '@/components/screen';
import { SessionCard } from '@/components/session-card';
import { sessionsByDate } from '@/core/engine';
import { useData } from '@/store/store';

export default function HistoryScreen() {
  const d = useData();
  const list = sessionsByDate(d).reverse();
  return (
    <ScreenScroll>
      {!list.length && <Empty icon="history" title="Aucune séance" text="Tes séances terminées apparaîtront ici." />}
      {list.slice(0, 30).map((s) => (
        <SessionCard key={s.id} session={s} />
      ))}
    </ScreenScroll>
  );
}
