import * as React from 'react';

export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const patterns: Record<HapticIntensity, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [12, 40, 20],
  warning: [24, 60, 24],
  error: [40, 60, 40, 60, 40],
};

export function useHaptic() {
  return React.useCallback((intensity: HapticIntensity = 'light') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return false;
    try {
      return navigator.vibrate(patterns[intensity]);
    } catch {
      return false;
    }
  }, []);
}
