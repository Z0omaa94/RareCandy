import { router } from 'expo-router';

import { useDialog } from '@/components/dialog';
import { findDay, startWorkout } from '@/core/engine';
import { getData, setData } from '@/store/store';

/** Starts (or resumes) the workout of a day, asking first if another one is running. */
export function useStartWorkout() {
  const dialog = useDialog();
  return (dayId: string) => {
    const d = getData();
    const day = findDay(d, dayId);
    if (!day || !day.exercises.length) return;
    if (d.active && d.active.dayId !== day.id) {
      dialog({
        title: 'Une séance est en cours',
        message: `Tu peux la reprendre, ou l’abandonner pour lancer « ${day.name} ».`,
        buttons: [
          { label: 'Reprendre la séance', role: 'primary', run: () => router.push('/workout') },
          {
            label: `Lancer « ${day.name} »`,
            role: 'destructive',
            run: () => {
              setData(startWorkout(getData(), day.id));
              router.push('/workout');
            },
          },
        ],
      });
      return;
    }
    if (!d.active) setData(startWorkout(d, day.id));
    router.push('/workout');
  };
}
