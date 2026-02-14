# Plan: Premium Dice Skins, Textures & Fixes

## Summary of Changes

4 areas of work across 7 files:
1. **Premium procedural textures** for new skins (Wooden, Crystal, Glass, Leather, Paper) + improved Gold & Matte Black
2. **Fix skin card 3D alignment** for proper isometric cube look
3. **Image dice PNG transparency** support
4. **15% dice size increase**

---

## Current State Analysis

**Material system limitation**: The current `DiceSkin` interface only supports `color`, `roughness`, `metalness` — flat solid colors with no textures, no transparency, no clearcoat/transmission. All skins use `meshStandardMaterial`.

**Skin card misalignment**: The CSS 3D cube faces use `translateX(12px) translateY(12px)` offsets on all three faces. The front, right, and top faces all share the same 12px translate, which breaks the illusion since the cube faces don't connect at shared edges.

**Image dice**: Uses `meshBasicMaterial` without `transparent: true`, so PNG transparency is ignored — the alpha channel is rendered as opaque white.

**Dice size**: Box geometry is `[2, 2, 2]` with dots at `1.01` offset. All size-related constants are hardcoded.

---

## Detailed Implementation Plan

### Step 1: Extend DiceSkin Interface (`src/utils/diceSkins.ts`)

Add new optional material properties to the `DiceSkin` interface:

```typescript
export interface DiceSkin {
  id: string;
  name: string;
  type: 'free' | 'rewarded';
  material: {
    color: string;
    roughness: number;
    metalness: number;
    // New properties for premium materials:
    opacity?: number;           // 0-1, for glass/crystal transparency
    transparent?: boolean;      // Enable transparency
    emissive?: string;          // Emissive color for glow effects
    emissiveIntensity?: number; // Emissive strength
    clearcoat?: number;         // Clearcoat layer (0-1)
    clearcoatRoughness?: number;
    transmission?: number;      // Glass-like light transmission (0-1)
    thickness?: number;         // Refraction thickness
    ior?: number;               // Index of refraction
    textureType?: 'none' | 'wood' | 'leather' | 'paper' | 'brushed-metal'; // Procedural texture
  };
  dotColor: string;
  preview: string;              // Primary CSS preview color
  previewGradient?: string;     // Optional CSS gradient for card preview
}
```

### Step 2: Replace Skins List (`src/utils/diceSkins.ts`)

Remove: Ocean Blue, Rose Gold, Neon Green, Deep Purple, Crimson

Final 8 skins:

| # | Skin | Type | Key Material Properties |
|---|------|------|------------------------|
| 1 | **Standard (Classic White)** | free | White, red dots — no change |
| 2 | **Matte Black** | free | Dark black, improved: slight clearcoat (0.3) for subtle sheen, better envMapIntensity |
| 3 | **Metallic Gold** | rewarded | Rich gold, brushed-metal texture, high metalness (0.95), clearcoat (0.8), warm emissive glow |
| 4 | **Wooden** | rewarded | Procedural wood grain texture, warm brown, medium roughness (0.7), low metalness (0.05) |
| 5 | **Crystal** | rewarded | Blue-tinted, transmission (0.7), clearcoat (1.0), ior (2.0), slight opacity, white dots |
| 6 | **Glass** | rewarded | Clear, transmission (0.92), near-transparent faces, clearcoat (1.0), ior (1.5), white dots |
| 7 | **Brown Leather** | rewarded | Procedural leather texture, rich brown, high roughness (0.85), low metalness (0.05) |
| 8 | **Light Brown Paper** | rewarded | Procedural paper texture, cream/beige, high roughness (0.9), zero metalness |

### Step 3: Create Procedural Texture Generator (`src/utils/proceduralTextures.ts` — NEW FILE)

A utility module that generates Canvas-based textures for:

- **`generateWoodTexture()`**: Brown wood grain rings with annual ring patterns using sine waves + noise. Returns a `CanvasTexture` with both color and subtle bump variation.
- **`generateLeatherTexture()`**: Dark brown pebbled leather pattern using layered noise for the dimpled surface effect.
- **`generatePaperTexture()`**: Light cream/beige with subtle fiber noise patterns.
- **`generateBrushedMetalTexture(color)`**: Horizontal streaks over base color for brushed gold effect.

Each returns a Three.js `CanvasTexture` (256x256 or 512x512). These are generated once and cached.

### Step 4: Upgrade Dice3D Material System (`src/components/Dice3D.tsx`)

**Replace `meshStandardMaterial` with `meshPhysicalMaterial`** for the dice body. `meshPhysicalMaterial` is a superset that supports clearcoat, transmission, thickness, and ior — required for Crystal and Glass skins.

Key changes in the `<mesh>` rendering:

```tsx
<meshPhysicalMaterial
  color={skin.material.color}
  roughness={skin.material.roughness}
  metalness={skin.material.metalness}
  envMapIntensity={1.0}           // Increased from 0.5
  // Conditional premium properties:
  clearcoat={skin.material.clearcoat ?? 0}
  clearcoatRoughness={skin.material.clearcoatRoughness ?? 0}
  transmission={skin.material.transmission ?? 0}
  thickness={skin.material.thickness ?? 0}
  ior={skin.material.ior ?? 1.5}
  opacity={skin.material.opacity ?? 1}
  transparent={skin.material.transparent ?? false}
  emissive={skin.material.emissive ?? '#000000'}
  emissiveIntensity={skin.material.emissiveIntensity ?? 0}
  map={proceduralTexture}         // From texture generator if textureType set
/>
```

**Improve lighting setup** for better reflections:
- Add an environment map using `@react-three/drei`'s `Environment` component with a `"studio"` or `"city"` preset for realistic reflections (critical for Gold, Crystal, Glass).
- Adjust directional lights: primary at `[5, 5, 5]` intensity 2.0, add a rim light for edge highlights.

**Increase dice size by 15%**:
- Box geometry: `[2, 2, 2]` → `[2.3, 2.3, 2.3]`
- Face offset: `1.01` → `1.161` (1.15 * 1.01)
- Dot positions: scale by 1.15 (e.g., `0.3` → `0.345`)
- Dot radius: `0.12` → `0.138`
- Image/text plane: `1.8` → `2.07`, `1.9` → `2.185`
- Camera position may need slight adjustment for framing

### Step 5: Update DicePreviewModal (`src/components/DicePreviewModal.tsx`)

Apply the same material system upgrade (meshPhysicalMaterial, procedural textures, size increase) to the preview modal's `AutoRotatingDice` component. Add environment map here as well.

### Step 6: Fix Skin Card 3D Alignment (`src/screens/DiceSkins/DiceSkinsPage.css`)

The current CSS cube faces all use the same `translateX(12px) translateY(12px)` which breaks the 3D illusion. Fix the transforms so the three visible faces (front, right, top) share proper edges:

- **Front face**: `translateZ(24px)` — centered in the wrapper
- **Right face**: `rotateY(90deg) translateZ(24px)` — shares right edge with front
- **Top face**: `rotateX(90deg) translateZ(24px)` — shares top edge with front

Also update the skin cards to show gradient previews for textured skins (wood grain gradient, leather gradient, etc.) using the new `previewGradient` field.

### Step 7: Image Dice PNG Transparency (`src/components/Dice3D.tsx`)

In `createImagePlane()`, enable transparency on the image material:

```tsx
<meshBasicMaterial
  map={tex}
  transparent={true}     // Already has transparent but need alphaTest
  alphaTest={0.01}       // Discard near-transparent pixels
  side={THREE.DoubleSide}
/>
```

This ensures PNG images with alpha channels render correctly with transparent backgrounds.

### Step 8: Install `@react-three/drei` dependency

Required for `Environment` component (provides HDR environment maps for realistic reflections). This is a standard companion library to `@react-three/fiber` and is already peer-compatible.

```bash
npm install @react-three/drei
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/utils/diceSkins.ts` | Extended interface, replaced skin list |
| `src/utils/proceduralTextures.ts` | **NEW** — procedural texture generators |
| `src/components/Dice3D.tsx` | meshPhysicalMaterial, textures, size increase, lighting, image transparency |
| `src/components/DicePreviewModal.tsx` | Same material/size/lighting upgrades |
| `src/screens/DiceSkins/DiceSkinsPage.tsx` | Gradient previews for textured skins |
| `src/screens/DiceSkins/DiceSkinsPage.css` | Fixed 3D cube face alignment |
| `package.json` | Add `@react-three/drei` dependency |

---

## Questions / Things to Confirm

1. **Removing existing skins**: The plan removes Ocean Blue, Rose Gold, Neon Green, Deep Purple, and Crimson. Users who have these skins active will fall back to the default (Classic White). Is that acceptable?
2. **`@react-three/drei` dependency**: Adding ~200KB (gzipped) for the Environment component that provides HDR environment maps. This is the standard way to get realistic reflections in R3F. Alternative is to bake a simple environment manually, but quality would be lower.
3. **Procedural textures vs. image assets**: Using procedurally generated textures (Canvas API) rather than bundled image files. This keeps the app bundle small and avoids loading external assets, but the textures will be stylized rather than photorealistic. The wood, leather, and paper will look convincing but not photo-identical.
