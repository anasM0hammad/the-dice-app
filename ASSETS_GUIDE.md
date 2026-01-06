# Asset Replacement Guide

Quick guide to replace app assets (sounds, images, icons).

## 1. Dice Roll Sound

**Location**: `/public/dice-roll.mp3`

**Requirements**:
- Format: MP3, WAV, or OGG
- Duration: 1-3 seconds recommended
- Size: <500KB recommended

**Steps**:
1. Find or record your dice roll sound
2. Save as `dice-roll.mp3`
3. Replace `/public/dice-roll.mp3`
4. Rebuild: `npm run build`

**Free Sound Resources**:
- [Freesound.org](https://freesound.org/)
- [Zapsplat.com](https://www.zapsplat.com/)
- [Mixkit.co](https://mixkit.co/free-sound-effects/)

---

## 2. App Icon (Web)

**Location**: `/public/dice-icon.svg` or `.png`

**Requirements**:
- Size: 512x512 or larger
- Format: SVG (preferred) or PNG
- Transparent background recommended

**Steps**:
1. Create/design your icon
2. Save as `dice-icon.svg` or `dice-icon.png`
3. Replace `/public/dice-icon.svg`
4. Update `index.html` if changing file name

---

## 3. App Icon (Android)

**Location**: `android/app/src/main/res/mipmap-*/`

**Required Sizes**:
- `mipmap-mdpi/ic_launcher.png` - 48x48
- `mipmap-hdpi/ic_launcher.png` - 72x72
- `mipmap-xhdpi/ic_launcher.png` - 96x96
- `mipmap-xxhdpi/ic_launcher.png` - 144x144
- `mipmap-xxxhdpi/ic_launcher.png` - 192x192

**Steps**:
1. Create a 1024x1024 PNG icon
2. Use [App Icon Generator](https://appicon.co/)
3. Upload your icon
4. Download Android sizes
5. Replace all `ic_launcher.png` files
6. Rebuild: `npx cap sync android`

---

## 4. App Icon (iOS)

**Location**: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Required Sizes**:
- 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024

**Steps**:
1. Create a 1024x1024 PNG icon
2. Use [App Icon Generator](https://appicon.co/)
3. Upload your icon
4. Download iOS sizes
5. Replace all files in `AppIcon.appiconset/`
6. Rebuild: `npx cap sync ios`

---

## 5. Splash Screen

**Location**: Multiple (see SPLASH_SCREEN_GUIDE.md)

**Quick Steps**:
1. Create a 2048x2048 PNG splash image
2. Background: #1a1a2e (dark theme)
3. Use [Splash Generator](https://www.simicart.com/manifest-generator.html/)
4. Replace Android: `android/app/src/main/res/drawable-*/splash.png`
5. Replace iOS: `ios/App/App/Assets.xcassets/Splash.imageset/splash.png`

For detailed steps, see `SPLASH_SCREEN_GUIDE.md`

---

## 6. Favicon (Web Only)

**Location**: `/public/favicon.ico`

**Steps**:
1. Create 32x32 or 16x16 icon
2. Convert to `.ico` using [Favicon Generator](https://www.favicon-generator.org/)
3. Save as `favicon.ico`
4. Replace `/public/favicon.ico`

---

## Design Tips

### Dice Icon

**Good dice icon checklist**:
- [ ] White/light cube shape
- [ ] Red dots visible (or numbers)
- [ ] Slight 3D perspective
- [ ] Clean, minimal design
- [ ] Works at small sizes (48x48)
- [ ] Transparent or solid background

**Tools**:
- [Figma](https://www.figma.com/) - Free design tool
- [Canva](https://www.canva.com/) - Template-based design
- [DALL-E / Midjourney](https://openai.com/dall-e-3) - AI-generated icons

---

## After Replacing Assets

Always rebuild and sync:

```bash
# Build web app
npm run build

# Sync to native apps
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode
npx cap open ios
```

---

## Asset Checklist

- [ ] `/public/dice-roll.mp3` - Dice sound
- [ ] `/public/dice-icon.svg` - Web icon
- [ ] `/public/favicon.ico` - Web favicon
- [ ] `android/app/src/main/res/mipmap-*/ic_launcher.png` - Android icon
- [ ] `android/app/src/main/res/drawable-*/splash.png` - Android splash
- [ ] `ios/App/App/Assets.xcassets/AppIcon.appiconset/*` - iOS icon
- [ ] `ios/App/App/Assets.xcassets/Splash.imageset/splash.png` - iOS splash

---

## Free Resources

**Icon Design**:
- [Flaticon](https://www.flaticon.com/)
- [Icons8](https://icons8.com/)
- [Noun Project](https://thenounproject.com/)

**Image Generation**:
- [DALL-E](https://openai.com/dall-e-3)
- [Midjourney](https://www.midjourney.com/)
- [Stable Diffusion](https://stability.ai/)

**Sound Effects**:
- [Freesound](https://freesound.org/)
- [Zapsplat](https://www.zapsplat.com/)
- [Mixkit](https://mixkit.co/)

**Tools**:
- [App Icon Generator](https://appicon.co/)
- [Favicon Generator](https://www.favicon-generator.org/)
- [Image Resizer](https://www.iloveimg.com/resize-image)
- [PNG to ICO](https://convertio.co/png-ico/)

---

Questions? Check the main `README.md` or open an issue!

