import { useCallback } from 'react';

export const useHaptic = () => {
  
  const vibrate = useCallback((pattern) => {
    // බ්‍රව්සර් එකේ vibration support කරනවද බලනවා
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.error("Haptic feedback error:", error);
      }
    }
  }, []);

  // 1. සාමාන්‍ය ශබ්දයකට (කෙටි කම්පනයක් - මිලිතත්පර 150)
  const triggerNormalVibration = useCallback(() => {
    vibrate(150);
  }, [vibrate]);

  // 2. හදිසි අවස්ථාවකට / වාහන හෝන් එකකට (SOS රටාව - [කම්පනය, නැවතීම, කම්පනය...])
  const triggerEmergencyVibration = useCallback(() => {
    vibrate([200, 100, 200, 100, 200, 100, 400]);
  }, [vibrate]);

  // 3. කම්පනය නවත්වන්න අවශ්‍ය නම්
  const stopVibration = useCallback(() => {
    vibrate(0);
  }, [vibrate]);

  return { triggerNormalVibration, triggerEmergencyVibration, stopVibration };
};