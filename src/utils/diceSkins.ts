export interface DiceSkin {
  id: string;
  name: string;
  type: 'free' | 'rewarded';
  material: {
    color: string;
    roughness: number;
    metalness: number;
  };
  dotColor: string;
  preview: string;
}

export const SKINS: DiceSkin[] = [
  {
    id: 'default',
    name: 'Classic White',
    type: 'free',
    material: { color: '#FFFFFF', roughness: 0.3, metalness: 0.3 },
    dotColor: '#DC2626',
    preview: '#FFFFFF',
  },
  {
    id: 'matte-black',
    name: 'Matte Black',
    type: 'free',
    material: { color: '#1a1a1a', roughness: 0.8, metalness: 0.1 },
    dotColor: '#FFFFFF',
    preview: '#1a1a1a',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    type: 'free',
    material: { color: '#1e40af', roughness: 0.4, metalness: 0.2 },
    dotColor: '#FFFFFF',
    preview: '#1e40af',
  },
  {
    id: 'metallic-gold',
    name: 'Metallic Gold',
    type: 'rewarded',
    material: { color: '#d4a017', roughness: 0.2, metalness: 0.9 },
    dotColor: '#1a1a1a',
    preview: '#d4a017',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    type: 'rewarded',
    material: { color: '#c77d6f', roughness: 0.25, metalness: 0.85 },
    dotColor: '#FFFFFF',
    preview: '#c77d6f',
  },
  {
    id: 'neon-green',
    name: 'Neon Green',
    type: 'rewarded',
    material: { color: '#22c55e', roughness: 0.3, metalness: 0.4 },
    dotColor: '#000000',
    preview: '#22c55e',
  },
  {
    id: 'deep-purple',
    name: 'Deep Purple',
    type: 'rewarded',
    material: { color: '#7c3aed', roughness: 0.35, metalness: 0.5 },
    dotColor: '#FFFFFF',
    preview: '#7c3aed',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    type: 'rewarded',
    material: { color: '#DC2626', roughness: 0.3, metalness: 0.4 },
    dotColor: '#FFFFFF',
    preview: '#DC2626',
  },
];

const ACTIVE_SKIN_KEY = 'dice_active_skin';
const SKIN_UNLOCKS_KEY = 'dice_skin_unlocks';
const UNLOCK_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

export function getActiveSkinId(): string {
  return localStorage.getItem(ACTIVE_SKIN_KEY) || 'default';
}

export function setActiveSkinId(id: string) {
  localStorage.setItem(ACTIVE_SKIN_KEY, id);
}

export function getActiveSkin(): DiceSkin {
  const id = getActiveSkinId();
  return SKINS.find(s => s.id === id) || SKINS[0];
}

export function getSkinUnlocks(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SKIN_UNLOCKS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isSkinUnlocked(skinId: string): boolean {
  const skin = SKINS.find(s => s.id === skinId);
  if (!skin) return false;
  if (skin.type === 'free') return true;
  const unlocks = getSkinUnlocks();
  const unlockTime = unlocks[skinId];
  if (!unlockTime) return false;
  return Date.now() - unlockTime < UNLOCK_DURATION_MS;
}

export function unlockSkin(skinId: string) {
  const unlocks = getSkinUnlocks();
  unlocks[skinId] = Date.now();
  localStorage.setItem(SKIN_UNLOCKS_KEY, JSON.stringify(unlocks));
}

export function getUnlockTimeRemaining(skinId: string): number {
  const unlocks = getSkinUnlocks();
  const unlockTime = unlocks[skinId];
  if (!unlockTime) return 0;
  const remaining = UNLOCK_DURATION_MS - (Date.now() - unlockTime);
  return Math.max(0, remaining);
}
