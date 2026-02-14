export interface DiceSkinMaterial {
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  transparent?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  thickness?: number;
  ior?: number;
  textureType?: 'none' | 'wood' | 'leather' | 'paper' | 'brushed-metal';
}

export interface DiceSkin {
  id: string;
  name: string;
  type: 'free' | 'rewarded';
  material: DiceSkinMaterial;
  dotColor: string;
  preview: string;
  previewGradient?: string;
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
    material: {
      color: '#1a1a1a',
      roughness: 0.7,
      metalness: 0.15,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      emissive: '#111111',
      emissiveIntensity: 0.1,
    },
    dotColor: '#FFFFFF',
    preview: '#1a1a1a',
  },
  {
    id: 'metallic-gold',
    name: 'Metallic Gold',
    type: 'rewarded',
    material: {
      color: '#c9952e',
      roughness: 0.18,
      metalness: 0.95,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      emissive: '#4a3510',
      emissiveIntensity: 0.25,
      textureType: 'brushed-metal',
    },
    dotColor: '#1a1a1a',
    preview: '#c9952e',
    previewGradient: 'linear-gradient(135deg, #e8c84a 0%, #c9952e 40%, #a07720 70%, #d4aa3c 100%)',
  },
  {
    id: 'wooden',
    name: 'Wooden',
    type: 'rewarded',
    material: {
      color: '#8B5E3C',
      roughness: 0.7,
      metalness: 0.05,
      clearcoat: 0.15,
      clearcoatRoughness: 0.6,
      textureType: 'wood',
    },
    dotColor: '#1a1a1a',
    preview: '#8B5E3C',
    previewGradient: 'linear-gradient(160deg, #b07d50 0%, #8B5E3C 30%, #6b3f1f 60%, #a07040 100%)',
  },
  {
    id: 'crystal',
    name: 'Crystal',
    type: 'rewarded',
    material: {
      color: '#88bbee',
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      transmission: 0.7,
      thickness: 1.5,
      ior: 2.0,
      opacity: 0.65,
      transparent: true,
      emissive: '#3366aa',
      emissiveIntensity: 0.15,
    },
    dotColor: '#FFFFFF',
    preview: '#88bbee',
    previewGradient: 'linear-gradient(135deg, #b0d4f1 0%, #88bbee 30%, #5599dd 60%, #a0ccf0 100%)',
  },
  {
    id: 'glass',
    name: 'Glass',
    type: 'rewarded',
    material: {
      color: '#e8f0f8',
      roughness: 0.02,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      transmission: 0.92,
      thickness: 1.0,
      ior: 1.5,
      opacity: 0.35,
      transparent: true,
      emissive: '#ffffff',
      emissiveIntensity: 0.05,
    },
    dotColor: '#FFFFFF',
    preview: '#c8dce8',
    previewGradient: 'linear-gradient(135deg, #f0f8ff 0%, #d4e8f4 30%, #b8d0e0 60%, #e8f4ff 100%)',
  },
  {
    id: 'brown-leather',
    name: 'Brown Leather',
    type: 'rewarded',
    material: {
      color: '#6B3A2A',
      roughness: 0.85,
      metalness: 0.05,
      clearcoat: 0.08,
      clearcoatRoughness: 0.7,
      textureType: 'leather',
    },
    dotColor: '#f0d8a8',
    preview: '#6B3A2A',
    previewGradient: 'linear-gradient(145deg, #8B5A3A 0%, #6B3A2A 35%, #4a2518 65%, #7B4A35 100%)',
  },
  {
    id: 'light-paper',
    name: 'Light Brown Paper',
    type: 'rewarded',
    material: {
      color: '#d4b896',
      roughness: 0.92,
      metalness: 0.0,
      textureType: 'paper',
    },
    dotColor: '#3a2a1a',
    preview: '#d4b896',
    previewGradient: 'linear-gradient(140deg, #e8d4b8 0%, #d4b896 35%, #c0a07a 65%, #dcc4a0 100%)',
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
