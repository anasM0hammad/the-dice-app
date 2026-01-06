# Splash Screen Setup Guide

This guide explains how to set up an animated GIF splash screen for **The Dice** app.

## Overview

Capacitor supports splash screens on both Android and iOS. For an animated GIF effect:
- **Web**: Use CSS animation or GIF
- **Android**: Use animated PNG (APNG) or video
- **iOS**: Use animated PNG or LaunchScreen.storyboard

---

## Option 1: Static Splash (Easiest)

### Create Splash Image

1. Design a 2048x2048 PNG image with:
   - Dark background (#1a1a2e)
   - White 3D dice in center
   - "The Dice" text below
   - Optional: "Loading..." text at bottom

2. Save as `splash.png`

### Android Setup

1. Generate all sizes using [App Icon Generator](https://appicon.co/)
2. Place in `android/app/src/main/res/`:
   ```
   drawable-land-mdpi/splash.png
   drawable-land-hdpi/splash.png
   drawable-land-xhdpi/splash.png
   drawable-land-xxhdpi/splash.png
   drawable-land-xxxhdpi/splash.png
   drawable-port-mdpi/splash.png
   drawable-port-hdpi/splash.png
   drawable-port-xhdpi/splash.png
   drawable-port-xxhdpi/splash.png
   drawable-port-xxxhdpi/splash.png
   ```

### iOS Setup

1. Open Xcode
2. Go to `ios/App/App/Assets.xcassets/Splash.imageset/`
3. Replace `splash.png` with your image
4. Add `splash@2x.png` (2x size) and `splash@3x.png` (3x size)

---

## Option 2: Animated Splash (Advanced)

### Web (GIF/CSS Animation)

Create `public/splash.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: sans-serif;
    }
    .dice {
      width: 200px;
      height: 200px;
      animation: spin 2s infinite linear;
    }
    .loading {
      color: #ffffff;
      margin-top: 20px;
      font-size: 18px;
    }
    @keyframes spin {
      from { transform: rotateX(0deg) rotateY(0deg); }
      to { transform: rotateX(360deg) rotateY(360deg); }
    }
  </style>
</head>
<body>
  <img src="/dice-icon.svg" class="dice" alt="Dice">
  <div class="loading">Loading...</div>
</body>
</html>
```

### Android (Animated XML)

1. Create `android/app/src/main/res/drawable/splash_animation.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<animation-list xmlns:android="http://schemas.android.com/apk/res/android"
    android:oneshot="false">
    <item android:drawable="@drawable/splash_frame1" android:duration="100" />
    <item android:drawable="@drawable/splash_frame2" android:duration="100" />
    <item android:drawable="@drawable/splash_frame3" android:duration="100" />
    <!-- Add more frames -->
</animation-list>
```

2. Extract GIF frames to `splash_frame1.png`, `splash_frame2.png`, etc.

### iOS (LaunchScreen.storyboard)

iOS doesn't support animated splash screens by default. Options:
1. **Static image** (recommended)
2. **Custom launch screen** with UIKit animation (complex)
3. **Lottie animation** (requires additional setup)

---

## Recommended Approach

**For simplicity and best UX:**

1. **Use a static splash screen** with your logo
2. **Keep it short** (1-2 seconds max)
3. **Match app theme** (dark background)
4. **Add animation inside the app** after splash

Create a simple, clean splash:
- Background: #1a1a2e (dark blue)
- Icon: White dice with red dots
- Text: "The Dice" in white

---

## Assets Checklist

- [ ] `public/dice-icon.svg` - App icon for web
- [ ] `public/splash.gif` - Splash GIF for web (if using)
- [ ] `public/dice-roll.mp3` - Dice roll sound
- [ ] `android/app/src/main/res/drawable-*/splash.png` - Android splash
- [ ] `android/app/src/main/res/mipmap-*/ic_launcher.png` - Android icon
- [ ] `ios/App/App/Assets.xcassets/Splash.imageset/splash.png` - iOS splash
- [ ] `ios/App/App/Assets.xcassets/AppIcon.appiconset/` - iOS icon

---

## Tools

- [App Icon Generator](https://appicon.co/) - Generate all icon sizes
- [Splash Screen Generator](https://www.simicart.com/manifest-generator.html/)
- [GIF to PNG Frames](https://ezgif.com/split) - Extract GIF frames
- [Figma](https://www.figma.com/) - Design splash screen

---

## Configuration

Update `capacitor.config.json`:

```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#1a1a2e",
      "androidSplashResourceName": "splash",
      "iosSplashResourceName": "splash",
      "showSpinner": false,
      "androidScaleType": "CENTER_CROP",
      "splashFullScreen": true,
      "splashImmersive": true
    }
  }
}
```

---

## Testing

### Web
```bash
npm run dev
```

### Android
```bash
npm run build
npx cap sync android
npx cap open android
```

Run on emulator or device from Android Studio.

### iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
```

Run on simulator or device from Xcode.

---

## Quick Fix: No Splash

If you prefer no splash screen:

```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0
    }
  }
}
```

---

Need help? Check [Capacitor Splash Screen Docs](https://capacitorjs.com/docs/apis/splash-screen)
