import * as Haptics from 'expo-haptics';

const enabled = process.env.EXPO_OS === 'ios';

/** Light tap for toggles and steppers. */
export function tap() {
  if (enabled) Haptics.selectionAsync().catch(() => {});
}

/** Success feedback when a set is validated or a workout is finished. */
export function success() {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
