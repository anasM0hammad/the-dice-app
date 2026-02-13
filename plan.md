# The Dice App — Version 2.0 Implementation Plan

## Overview
A comprehensive update focused on premium feel, better UX flow, ad strategy overhaul, new features (image dice, dice skins), interactive onboarding, and UI polish throughout.

---

## Phase 1: Sidebar Overhaul & UI Foundation

### 1.1 Sidebar Redesign
**Files**: `src/components/Sidebar.tsx`, `src/components/Sidebar.css`

- Replace emoji icons (⚙, 💾) with proper SVG icons throughout the app
- Rename menu items:
  - "Custom Faces" → **"Create Dice"** (icon: dice with pencil/edit)
  - "Saved Configs" → **"Saved Dices"** (icon: bookmark/collection)
- Add new menu items:
  - **"Image Dice"** (icon: image/photo) — new feature
  - **"Dices"** (icon: palette/sparkle) — dice skins
- Improve sidebar visual design:
  - Better spacing, typography, hover states
  - Premium-feeling hamburger icon (animated → X on open)
  - Smooth slide animation refinement
  - App logo/branding at the top of sidebar
  - Version number subtly at bottom

### 1.2 Icon System
- Create an `src/components/icons/` directory with reusable SVG icon components
- Icons needed: Hamburger/Menu, Close (X), Back Arrow, Create/Edit, Bookmark/Save, Image, Palette, Sound On, Sound Off, Dice, ChevronRight
- All icons should be consistent in stroke width, size, and style
- Use a clean line-icon style (similar to Lucide/Feather icons)

---

## Phase 2: "Create Dice" Flow Rework

### 2.1 Rename & Enhance CustomFacesModal
**Files**: `src/screens/Dice/CustomFacesModal.tsx`, `src/screens/Dice/CustomFacesModal.css`

- Rename references from "Custom Faces" to "Create Dice"
- Keep the modal behavior (6 input fields for face values)
- On "Apply" (was "Save"): close modal and apply values to dice
- The "Reset" button clears values and reverts to standard dice

### 2.2 "Save This Dice" Button on Main Page
**Files**: `src/screens/Dice/DicePage.tsx`, `src/screens/Dice/DicePage.css`

- When custom face values are active (applied from Create Dice modal), show a **"Save This Dice"** button on the main page (positioned subtly, e.g., below the result or near the roll button)
- Tapping this button navigates to ConfigManagerPage with the current face values pre-filled
- User only needs to enter a name and tap save
- Button should have a subtle animation (fade in) when custom values are applied
- Button disappears when dice is reset to standard

### 2.3 Pre-fill Config Page
**Files**: `src/screens/ConfigManager/ConfigManagerPage.tsx`

- Accept optional `prefillValues` parameter (the 6 face values from Create Dice)
- When present, open directly in "create" mode with values pre-filled
- Name field focused and empty, ready for user input
- User taps save → config saved → navigate back to dice page with config active

---

## Phase 3: "Saved Dices" Page Redesign

### 3.1 Visual Grid Cards
**Files**: `src/screens/ConfigManager/ConfigManagerPage.tsx`, `src/screens/ConfigManager/ConfigManagerPage.css`

- Each saved dice card shows:
  - Config name (prominent, good typography)
  - A **2×3 visual grid** representing the 6 dice faces (like an unfolded cube net)
  - Each cell in the grid shows the face value text
  - Active config highlighted with accent color border + subtle glow
- Card interactions:
  - Tap card → activate/deactivate this config
  - Swipe left or long press → reveal delete option
  - Edit button (pencil icon) on card

### 3.2 Empty State
- When no configs saved, show an engaging empty state:
  - Illustration or icon
  - "No saved dices yet"
  - "Create your first custom dice" with a CTA button that opens Create Dice

### 3.3 Page Header
- Clean header with back arrow and title "Saved Dices"
- Config count shown subtly (e.g., "3 of 5")
- "Create New" floating action button or prominent button at top/bottom

### 3.4 Overall Polish
- Better spacing and padding
- Subtle card shadows/elevation
- Smooth list animations (cards fade/slide in)
- Active state is visually unmistakable (checkmark overlay or accent border + icon)

---

## Phase 4: Image Dice Feature

### 4.1 New Dependencies
- Add `@capacitor/camera` for camera access
- Use file input with accept="image/*" for gallery on web fallback

### 4.2 Image Dice Modal
**New Files**: `src/screens/Dice/ImageDiceModal.tsx`, `src/screens/Dice/ImageDiceModal.css`

- Opened from sidebar "Image Dice" menu item
- Shows 6 image slots (grid layout) for the 6 dice faces
- Each slot has:
  - Tap to add image (opens camera/gallery picker)
  - Thumbnail preview once selected
  - Remove button (X) on each thumbnail
- "Apply" button: all 6 images must be selected
- "Reset" button: clear all images and revert to standard dice

### 4.3 Image Rendering on Dice
**Files**: `src/components/Dice3D.tsx`

- Accept `customFaceImages` prop (array of 6 image data URLs or blob URLs)
- When image faces active:
  - Create `TextureLoader` textures from the image data
  - Apply as material map to each dice face
  - Images should be cropped/fitted to square aspect ratio
  - Maintain existing lighting/material properties over the texture
- Result text below dice shows nothing (empty) when image dice is active
- Rolling still works — detects which face is up (1-6 index) but displays no text result

### 4.4 Session-Only Behavior
- Images stored in component state only (not localStorage)
- Navigating away or closing app loses the images
- Show a subtle note: "Image dice are for this session only"
- No "Save This Dice" button appears for image dice

---

## Phase 5: Dice Skins ("Dices" Feature)

### 5.1 Dice Skin Definitions
**New File**: `src/utils/diceSkins.ts`

- Define a `DiceSkin` interface:
  ```typescript
  interface DiceSkin {
    id: string;
    name: string;
    type: 'free' | 'rewarded';
    material: {
      color: string;
      roughness: number;
      metalness: number;
      textureUrl?: string; // for texture-based skins
    };
    dotColor: string; // color of dots/text on this skin
    preview: string; // hex color for preview circle
  }
  ```
- Define 6-8 skins:
  - **Free**: Default White, Matte Black, Ocean Blue
  - **Rewarded**: Wooden (texture), Metallic Gold (material), Marble (texture), Neon Green (material+emissive), Rose Gold (material)

### 5.2 Dice Skins Page
**New Files**: `src/screens/DiceSkins/DiceSkinsPage.tsx`, `src/screens/DiceSkins/DiceSkinsPage.css`

- Grid layout showing all available skins
- Each skin card shows:
  - Preview (colored circle or small rendered preview)
  - Skin name
  - "Free" badge or "Watch to unlock" badge
  - Active state indicator (checkmark)
- Tapping a free skin → activates immediately
- Tapping a rewarded skin:
  - If currently unlocked (within 24h window) → activate
  - If locked → show rewarded ad → on completion → unlock for 24 hours and activate
- Unlock expiry tracked in localStorage with timestamp

### 5.3 Dice3D Skin Integration
**Files**: `src/components/Dice3D.tsx`

- Accept `activeSkin` prop
- Apply skin material properties (color, roughness, metalness)
- If skin has texture URL, load and apply texture
- Adjust dot/text color based on skin's `dotColor` property
- Ensure custom text and image faces work with all skins (text color adapts)

### 5.4 Skin Persistence
**Files**: `src/utils/configStorage.ts`

- Store active skin ID in localStorage (`dice_active_skin`)
- Store unlock timestamps for rewarded skins (`dice_skin_unlocks`)
- Check unlock expiry on app load

---

## Phase 6: Ad Strategy Overhaul

### 6.1 Remove Banner Ad
**Files**: `src/utils/admob.ts`, `src/main.tsx`

- Remove `showBannerAd()` call from app initialization
- Remove banner ad functions (or keep as dead code for potential future use)
- Remove any bottom padding/margin that was accommodating the banner

### 6.2 Implement Rewarded Ads
**Files**: `src/utils/admob.ts`

- Add rewarded ad functions:
  - `loadRewardedAd()` — pre-load for instant display
  - `showRewardedAd()` — show and return promise resolving on reward earned
- Pre-load a rewarded ad on app start and after each showing
- Used for: unlocking dice skins (Phase 5)
- Test ad unit IDs for development, production IDs for release

### 6.3 Implement Interstitial Ads
**Files**: `src/utils/admob.ts`

- Add interstitial ad functions:
  - `loadInterstitialAd()` — pre-load
  - `showInterstitialAd()` — show full-screen ad
- Trigger points:
  - After every 15 rolls (tracked via roll counter in localStorage)
  - When navigating back from Saved Dices or Dice Skins pages
- **Frequency cap**: Maximum 1 interstitial per 3 minutes (tracked with timestamp)
- Pre-load next interstitial after each showing

### 6.4 Ad Helper Utilities
- `canShowInterstitial()` — checks frequency cap
- `incrementRollCount()` — increments and checks if threshold reached
- `resetRollCountForAd()` — resets counter after showing ad
- All thresholds configurable as constants at top of file

---

## Phase 7: Interactive Onboarding

### 7.1 Onboarding Screen
**New Files**: `src/screens/Onboarding/OnboardingScreen.tsx`, `src/screens/Onboarding/OnboardingScreen.css`

- Full-screen overlay shown on first app launch only
- Tracked via localStorage flag (`dice_onboarding_complete`)
- "Skip" button always visible in top-right corner

### 7.2 Interactive Steps (4 steps)

**Step 1: "Tap to Roll"**
- Show the actual 3D dice (or a simplified version)
- Prompt: "Tap the button below to roll your dice"
- User taps a roll button → dice rolls → step completes with success feedback
- Also mention: "You can shake your phone too!"

**Step 2: "Drag to Explore"**
- Prompt: "Use your finger to rotate the dice"
- User drags the dice → after sufficient rotation → step completes
- Highlight the drag gesture with a subtle animated hand icon

**Step 3: "Make It Yours"**
- Prompt: "Create custom dice with your own text or images"
- Show a quick visual demonstration (animated mockup of custom faces being typed)
- Tap "Next" to continue (this step is informational with visual demo)

**Step 4: "Save Your Favorites"**
- Prompt: "Save your custom dice and switch between them anytime"
- Show visual of saved dice cards
- "Get Started" button to dismiss onboarding

### 7.3 Visual Design
- Dark overlay background matching app theme
- Step indicators (dots) at bottom
- Smooth transitions between steps
- Highlight/spotlight effect on interactive elements
- Consistent with app's premium dark theme + red accent

---

## Phase 8: Roll History

### 8.1 Roll History Component
**New File**: `src/components/RollHistory.tsx`, `src/components/RollHistory.css`

- Collapsible section on the main DicePage, positioned below the result display
- Shows the **last 10 rolls** in a horizontal scrollable row (newest on left)
- Each roll displayed as a small pill/chip showing:
  - The roll result number (or custom face text if custom dice was active)
  - Subtle background color to distinguish entries
- Collapse/expand toggle: small "History" label with a chevron icon
- When collapsed: shows just the label + chevron (minimal footprint)
- Default state: collapsed (doesn't clutter the main view)
- Smooth expand/collapse animation (max-height transition)

### 8.2 Roll History State
**Files**: `src/screens/Dice/DicePage.tsx`

- Maintain a `rollHistory` array in component state (max 10 items)
- Each entry: `{ value: number, label: string, timestamp: number }`
  - `value`: the numeric face (1-6)
  - `label`: display text (the number, or custom face text if active)
  - `timestamp`: for ordering
- On each roll result: prepend to array, trim to 10 items
- **Session-only**: history resets on app reload (no localStorage persistence)
- When dice mode changes (standard → custom → image), history continues accumulating across modes

### 8.3 Visual Design
- Pills use a muted background (#2a2a3e) with white text
- Latest roll pill slightly larger or with accent border to stand out
- Horizontal scroll with hidden scrollbar (clean look)
- Fade-in animation for new entries
- Fits the dark theme and doesn't compete visually with the main result display

---

## Phase 9: Haptic Feedback & Sound Toggle

### 8.1 Haptic Feedback
**New File**: `src/utils/haptics.ts`

- Add `@capacitor/haptics` dependency
- Haptic triggers:
  - **Roll start**: Light impact
  - **Roll result**: Medium impact
  - **Button taps**: Selection haptic (subtle)
  - **Config activated/deactivated**: Notification success
- Graceful fallback: no-op on web/unsupported devices

### 8.2 Sound Toggle
**Files**: `src/screens/Dice/DicePage.tsx`

- Add sound on/off icon button in the header (next to hamburger)
- Sound state persisted in localStorage (`dice_sound_enabled`, default: true)
- When enabled: play `dice-roll.mp3` on roll
- Icon toggles between Sound On / Sound Off SVG icons
- Subtle toggle animation

---

## Phase 10: Overall UI Polish

### 9.1 Global Design Improvements
- Consistent border-radius across all components (12px for cards, 24px for buttons, 50% for circles)
- Subtle shadows and elevation system (3 levels: low, medium, high)
- Consistent animation timing (0.2s for micro-interactions, 0.3s for transitions, 0.5s for page changes)
- Button press states (scale down slightly on tap)

### 9.2 Main Page (DicePage) Polish
- Remove any banner ad spacing
- Better typography for the result number (larger, bolder, with subtle animation on change)
- Instruction text with better hierarchy
- "Save This Dice" button animation
- Smooth page transitions to/from other screens

### 9.3 Transitions
- Page transitions: slide in from right (forward), slide out to right (back)
- Modal transitions: slide up from bottom (already exists, refine timing)
- Sidebar: already has slide, refine easing curve

---

## Implementation Order (Recommended)

The recommended order optimizes for building foundational changes first:

1. **Phase 1**: Sidebar & Icon System — foundation for everything else
2. **Phase 10**: UI Polish — establish design language early
3. **Phase 2**: Create Dice flow — core feature rework
4. **Phase 3**: Saved Dices redesign — depends on new design language
5. **Phase 8**: Roll History — lightweight addition to main page
6. **Phase 9**: Haptics & Sound — quick wins, immediate feel improvement
7. **Phase 7**: Onboarding — can reference all features that now exist
8. **Phase 4**: Image Dice — new feature, needs camera plugin
9. **Phase 5**: Dice Skins — new feature, needs rewarded ads
10. **Phase 6**: Ad Strategy — integrate after features that use ads exist

---

## Technical Notes

- **State Management**: Continue using React local state + localStorage. No need for Redux/Zustand for this app size.
- **Navigation**: Continue using the current simple page switching in App.tsx. Add support for passing props (prefill values) during navigation.
- **Assets**: Texture images for dice skins (wood, marble) need to be created or sourced. Keep them small (256x256 or 512x512 max) for performance.
- **Testing**: Test on both Android and web. Camera/gallery features need device testing.
- **Ad IDs**: Keep test IDs during development. Switch to production IDs only for release builds.
