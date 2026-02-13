import { useEffect, useRef } from 'react';

interface ShakeOptions {
  threshold?: number;
  cooldown?: number;
}

export function useShakeDetection(onShake: () => void, options: ShakeOptions = {}) {
  const { threshold = 25, cooldown = 1000 } = options;
  const lastShakeRef = useRef(0);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel || accel.x == null || accel.y == null || accel.z == null) return;

      const last = lastAccelRef.current;
      const deltaX = Math.abs(accel.x - last.x);
      const deltaY = Math.abs(accel.y - last.y);
      const deltaZ = Math.abs(accel.z - last.z);

      lastAccelRef.current = { x: accel.x, y: accel.y, z: accel.z };

      if (deltaX + deltaY + deltaZ > threshold) {
        const now = Date.now();
        if (now - lastShakeRef.current > cooldown) {
          lastShakeRef.current = now;
          onShake();
        }
      }
    };

    // Request permission on iOS 13+ (required for DeviceMotionEvent)
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

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [onShake, threshold, cooldown]);
}
