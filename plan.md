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

### 2.2 "Save This Dice" Button & Inline Save Bottom Sheet
**Files**: `src/screens/Dice/DicePage.tsx`, `src/screens/Dice/DicePage.css`

- When custom face values are active (applied from Create Dice modal), show a **"Save This Dice"** button on the main page (positioned subtly, e.g., below the result or near the roll button)
- Button should have a subtle animation (fade in) when custom values are applied
- Button disappears when dice is reset to standard
- **No page navigation** — tapping the button opens an **inline bottom sheet** on DicePage itself

#### Save Limit Awareness (limit: 10)
- The button must be **save-limit-aware** using `canAddMore()` from configStorage
- **When limit NOT reached**: Show button as `"Save This Dice (3/10)"` — tappable, opens the inline save bottom sheet
- **When limit IS reached (10/10)**: Show button in a **disabled/dimmed state** with text `"Save limit reached (10/10)"` — not tappable
  - Below the disabled button, show a subtle link: **"Manage saved dices →"** that navigates to ConfigManagerPage (list view, not create mode)
  - This gives the user a clear path: go delete one, then come back and save
- The count (`X/10`) updates reactively — after deleting a config and returning, button becomes active again

#### Inline Save Bottom Sheet
**New Component**: `src/components/SaveDiceSheet.tsx`, `src/components/SaveDiceSheet.css`

- A compact bottom sheet that slides up from the bottom of DicePage
- Contains only:
  - A title: "Save This Dice"
  - A single text input: "Dice name" (focused on open, max 30 chars)
  - A "Save" button (red accent, full width)
  - A "Cancel" link/button (subtle, below Save)
- On Save:
  - Validates name is non-empty
  - Calls `saveConfig()` with the current `customFaceValues` and entered name
  - Sets the new config as active via `setActiveConfigId()`
  - Shows brief success feedback (checkmark animation or green flash)
  - Dismisses the sheet
- On Cancel: dismisses the sheet, no action
- Dark backdrop overlay behind the sheet (tap to dismiss)
- This approach keeps the user on the main page, avoids state loss, and feels faster than navigating away

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

### 3.3 Page Header & Config Count
- Clean header with back arrow and title "Saved Dices"
- Config count shown subtly: **"3 of 10"** (updated from 5 → 10)
- "Create New" floating action button or prominent button at top/bottom
- When at limit (10/10), count text turns amber/warning color and "Create New" button is disabled with tooltip-style text: "Delete a dice to create a new one"

### 3.4 Delete Confirmation
- **Currently missing**: Delete is immediate with no confirmation — risky for users
- Add a lightweight confirmation: brief bottom sheet or inline "Are you sure? [Yes] [No]" that replaces the card's action row
- This avoids accidental deletion, especially important since limit is now 10 (more invested configs)

### 3.5 Overall Polish
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
  - If currently unlocked (within 48h window) → activate
  - If locked → show rewarded ad → on completion → unlock for 48 hours and activate
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
  - On **forward navigation** into Saved Dices or Dice Skins pages (not on navigating back — that feels punishing and breaks flow)
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
- User touches/drags the dice → step completes on **any touch interaction** (don't gate on rotation amount — let the user feel in control)
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

### 9.1 Haptic Feedback
**New File**: `src/utils/haptics.ts`

- Add `@capacitor/haptics` dependency
- Haptic triggers:
  - **Roll start**: Light impact
  - **Roll result**: Medium impact
  - **Button taps**: Selection haptic (subtle)
  - **Config activated/deactivated**: Notification success
- Graceful fallback: no-op on web/unsupported devices

### 9.2 Sound Toggle
**Files**: `src/screens/Dice/DicePage.tsx`

- Add sound on/off icon button in the header (next to hamburger)
- Sound state persisted in localStorage (`dice_sound_enabled`, default: true)
- When enabled: play `dice-roll.mp3` on roll
- Icon toggles between Sound On / Sound Off SVG icons
- Subtle toggle animation

---

## Phase 10: Overall UI Polish

### 10.1 Global Design Improvements
- Consistent border-radius across all components (12px for cards, 24px for buttons, 50% for circles)
- Subtle shadows and elevation system (3 levels: low, medium, high)
- Consistent animation timing (0.2s for micro-interactions, 0.3s for transitions, 0.5s for page changes)
- Button press states (scale down slightly on tap)

### 10.2 Main Page (DicePage) Polish
- Remove any banner ad spacing
- Better typography for the result number (larger, bolder, with subtle animation on change)
- Instruction text with better hierarchy
- "Save This Dice" button animation
- Smooth page transitions to/from other screens

### 10.3 Transitions
- Page transitions: slide in from right (forward), slide out to right (back)
- Modal transitions: slide up from bottom (already exists, refine timing)
- Sidebar: already has slide, refine easing curve

---

## Implementation Order (Recommended)

The recommended order optimizes for building foundational changes first:

1. **Phase 1**: Sidebar & Icon System — foundation for everything else
2. **Phase 10**: UI Polish — establish design language early
3. **Phase 2**: Create Dice flow — core feature rework (includes save limit UX)
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
- **Save Limit**: Increased from 5 → **10** in `configStorage.ts` (`MAX_CONFIGS = 10`). Update all references: ConfigManagerPage footer count, error messages, and new "Save This Dice" button count display.
- **Assets**: Texture images for dice skins (wood, marble) need to be created or sourced. Keep them small (256x256 or 512x512 max) for performance.
- **Testing**: Test on both Android and web. Camera/gallery features need device testing.
- **Ad IDs**: Keep test IDs during development. Switch to production IDs only for release builds.

---

## Pre-Implementation: Issues to Fix

These are existing bugs/issues in the current codebase that must be resolved before or during the v2.0 phases. Each is assigned to the phase where the fix naturally belongs.

### Issue 1: No Delete Confirmation (Fix in Phase 3)
**File**: `src/screens/ConfigManager/ConfigManagerPage.tsx`
**Problem**: `handleDelete` immediately removes the config with zero confirmation. One accidental tap and the config is gone forever.
**Fix**: Add inline confirmation — when user taps Delete, replace the card's action row with "Are you sure? [Yes] [No]". Covered by Phase 3.4.

### Issue 2: Review Prompt Permanently Dismissed (Fix in Phase 10)
**File**: `src/screens/Dice/DicePage.tsx`
**Problem**: The "Rate on Play Store" prompt at 10 rolls stores `dice_review_dismissed: '1'` permanently. If user taps "Maybe Later", they can never be prompted again, even at 500+ rolls.
**Fix**: Replace the boolean flag with a dismiss count and escalating thresholds:
- 1st prompt: 10 rolls
- 2nd prompt: 50 rolls (if dismissed once)
- 3rd prompt: 200 rolls (if dismissed twice)
- After 3 dismissals: never prompt again
- Storage: `dice_review_dismiss_count` (integer) instead of `dice_review_dismissed` (boolean)

### Issue 3: CustomFacesModal Uses Native `alert()` (Fix in Phase 2)
**File**: `src/screens/Dice/CustomFacesModal.tsx`, line 61
**Problem**: Calls `alert('Please fill in all 6 face values...')` which shows a jarring native browser dialog on top of the already-rendered inline error message. Double feedback is confusing.
**Fix**: Remove the `alert()` call entirely. The inline error message (`errorMessage` state) is sufficient and matches the app's visual language.

### Issue 4: Navigation Loses State (Fix in Phase 2)
**File**: `src/App.tsx`
**Problem**: Navigating DicePage → ConfigManagerPage → back unmounts and remounts DicePage. This loses:
- Custom face values applied via modal (but not yet saved to a config)
- Roll history (once added in Phase 8)
- Dice rotation/position
**Fix**: Change App.tsx to keep both pages mounted and toggle visibility with CSS `display: none` / `display: block`. This way DicePage's state persists across navigation:
```typescript
// Instead of conditional rendering:
<div style={{ display: page === 'dice' ? 'block' : 'none' }}>
  <DicePage ... />
</div>
<div style={{ display: page === 'configs' ? 'block' : 'none' }}>
  <ConfigManagerPage ... />
</div>
```

### Issue 5: Hardcoded Limit Strings (Fix in Phase 2/3)
**File**: `src/screens/ConfigManager/ConfigManagerPage.tsx`, `src/utils/configStorage.ts`
**Problem**: `MAX_CONFIGS = 5` exists as a constant in configStorage.ts, but ConfigManagerPage hardcodes `"5 / 5 configurations"` and `"Maximum 5 configurations reached"` as literal strings that won't update when the constant changes.
**Fix**:
- Export `MAX_CONFIGS` from configStorage.ts
- Import it in ConfigManagerPage and use template literals: `` `${configs.length} / ${MAX_CONFIGS} configurations` ``
- Same for the error message: `` `Maximum ${MAX_CONFIGS} configurations reached.` ``
- Apply the same pattern to the new "Save This Dice" button count display

### Issue 6: Orphaned Active Config ID (Fix in Phase 2)
**File**: `src/utils/configStorage.ts`
**Problem**: If configs are cleared from localStorage but `dice_active_config_id` remains, DicePage tries to load a non-existent config. It fails silently, but the stale ID persists forever and could cause subtle bugs.
**Fix**: Add validation in `getActiveConfigId()`:
```typescript
export function getActiveConfigId(): string | null {
  const id = localStorage.getItem(ACTIVE_CONFIG_KEY);
  if (id && !loadConfigs().find(c => c.id === id)) {
    clearActiveConfig();
    return null;
  }
  return id;
}
```
This auto-heals orphaned references without any user-facing impact.

---

## New Features Added to Plan

### Quick Dice Switcher (Phase 2.5 — after Save flow)
**New File**: `src/components/QuickDiceSwitcher.tsx`, `src/components/QuickDiceSwitcher.css`
**Rendered in**: `src/screens/Dice/DicePage.tsx`

A horizontal pill/chip bar on the main DicePage for instant config switching — reduces the current 4-step flow (Sidebar → Saved Dices → tap config → go back) to 1 tap.

**Placement & Design**:
- Positioned below the subtitle ("Drag to rotate..."), above the dice container
- Only visible when user has 1+ saved dices; hidden when no configs exist (keeps main page clean for new users)
- Horizontal scrollable row with hidden scrollbar
- Each pill: config name in compact text, subtle rounded background (#2a2a3e), max-width truncation for long names
- Active pill: red accent border (#DC2626) + slightly brighter background
- First pill is always **"Standard"** (default 1-6 dice) — tapping it deactivates any custom config
- Premium feel: pills have subtle backdrop blur, thin border (1px #3a3a4e), smooth transitions on activate/deactivate
- Spacing: small gap between pills (8px), horizontal padding so pills don't touch screen edges
- Max visible without scrolling: ~4 pills; remaining accessible by horizontal swipe
- Interaction: tap pill → `setActiveConfigId(id)` + update `customFaceValues` state → dice instantly reflects new config. Tap active pill → deactivate → standard dice

**State**:
- Reads from `getConfigs()` on mount and after navigation returns
- Reacts to activeId changes from any source (sidebar, ConfigManagerPage, or switcher itself)

### Share Roll (Phase 8.4 — alongside Roll History)
**Files**: `src/screens/Dice/DicePage.tsx`, `src/screens/Dice/DicePage.css`

- After a roll completes, show a subtle **share icon** (arrow-out-of-box) to the right of the result number
- Icon only appears after a roll (not on initial load or during rolling)
- Tapping triggers the native share sheet:
  - On native (Capacitor): use `@capacitor/share` plugin
  - On web: use `navigator.share()` with fallback to clipboard copy
- Share message format: `"I rolled [result] on The Dice! 🎲\n[Play Store URL]"`
  - For custom dice: `"I rolled [custom face text] on The Dice! 🎲"`
- Icon design: small (20px), muted color (#606070), brightens on hover/tap
- Positioned inline with result, doesn't shift layout

### Long-Press 3D Preview (Phase 3.6 & Phase 5.5)

#### For Saved Dices (Phase 3.6)
**Files**: `src/screens/ConfigManager/ConfigManagerPage.tsx`, `src/screens/ConfigManager/ConfigManagerPage.css`

- Long-pressing (500ms) a saved dice card triggers a **preview overlay**
- Overlay: centered modal with a small 3D dice viewport (~200x200px) showing the config's custom face values rendered on the actual Dice3D component
- Dark backdrop behind the preview (same as modal overlay pattern)
- The dice in preview is slowly auto-rotating (gentle spin, no user interaction needed)
- Config name shown below the preview dice
- Releasing the long-press or tapping the backdrop dismisses the preview
- Uses the same `Dice3D` component in a small `<Canvas>` — keeps rendering consistent
- Lazy-loaded to avoid loading Dice3D on ConfigManagerPage unless needed

#### For Dice Skins (Phase 5.5)
**Files**: `src/screens/DiceSkins/DiceSkinsPage.tsx`, `src/screens/DiceSkins/DiceSkinsPage.css`

- Same long-press pattern as saved dices
- Shows a small 3D dice with the skin's material properties applied (color, roughness, metalness, texture)
- Dice shows standard 1-6 dots (not custom faces) so the skin itself is the focus
- Skin name + "Free" / "Locked" badge shown below
- Helps users see exactly what the skin looks like on a real 3D dice before unlocking via rewarded ad
