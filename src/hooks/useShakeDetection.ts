import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Motion, AccelListenerEvent } from '@capacitor/motion';

interface ShakeOptions {
  threshold?: number;
  cooldown?: number;
}

export function useShakeDetection(onShake: () => void, options: ShakeOptions = {}) {
  const { threshold = 25, cooldown = 1000 } = options;
  const lastShakeRef = useRef(0);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    let listenerHandle: { remove: () => void } | null = null;

    const processAccel = (x: number, y: number, z: number) => {
      const last = lastAccelRef.current;
      const deltaX = Math.abs(x - last.x);
      const deltaY = Math.abs(y - last.y);
      const deltaZ = Math.abs(z - last.z);

      lastAccelRef.current = { x, y, z };

      if (deltaX + deltaY + deltaZ > threshold) {
        const now = Date.now();
        if (now - lastShakeRef.current > cooldown) {
          lastShakeRef.current = now;
          onShake();
        }
      }
    };

    const startNativeListener = async () => {
      // Request permission on iOS 13+ (required for DeviceMotionEvent)
      if (
        typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
      ) {
        try {
          const permission = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
          if (permission !== 'granted') return;
        } catch {
          return;
        }
      }

      listenerHandle = await Motion.addListener('accel', (event: AccelListenerEvent) => {
        const accel = event.accelerationIncludingGravity;
        processAccel(accel.x, accel.y, accel.z);
      });
    };

    const startWebListener = () => {
      const handleMotion = (event: DeviceMotionEvent) => {
        const accel = event.accelerationIncludingGravity;
        if (!accel || accel.x == null || accel.y == null || accel.z == null) return;
        processAccel(accel.x, accel.y, accel.z);
      };

      const requestAndListen = async () => {
        if (
          typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
        ) {
          try {
            const permission = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
            if (permission !== 'granted') return;
          } catch {
            return;
          }
        }
        window.addEventListener('devicemotion', handleMotion);
      };

      requestAndListen();
      return () => window.removeEventListener('devicemotion', handleMotion);
    };

    let webCleanup: (() => void) | undefined;

    if (Capacitor.isNativePlatform()) {
      startNativeListener();
    } else {
      webCleanup = startWebListener();
    }

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
      if (webCleanup) {
        webCleanup();
      }
    };
  }, [onShake, threshold, cooldown]);
}
