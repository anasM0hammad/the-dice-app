# The Dice 🎲

A beautiful 3D dice rolling app built with React, Three.js, and Capacitor.

## Features

✅ **3D Interactive Dice** - Drag to rotate, tap to roll
✅ **Realistic Physics** - Smooth tumbling animation with natural settling
✅ **Custom Face Values** - Replace numbers with custom text (up to 6 characters)
✅ **Sound Effects** - Dice roll audio
✅ **Animated Splash Screen** - GIF splash with loading text
✅ **Cross-Platform** - Works on Web, Android, and iOS

## Tech Stack

- **React 18** - UI framework
- **Three.js + React Three Fiber** - 3D graphics
- **Vite** - Fast build tool
- **Capacitor** - Native app wrapper
- **TypeScript** - Type safety

## Development

### Install Dependencies

```bash
npm install
```

### Run Web App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

### Android Build

1. Build the web app:
```bash
npm run build
```

2. Sync with Capacitor:
```bash
npm run android
```

3. Build APK in Android Studio

### iOS Build

1. Build the web app:
```bash
npm run build
```

2. Sync with Capacitor:
```bash
npm run ios
```

3. Build in Xcode

## Assets

### Replace Dice Roll Sound

Place your `dice-roll.mp3` file in `/public/dice-roll.mp3`

### Replace Splash Screen GIF

1. Create a GIF (recommended: 1080x1920 for portrait)
2. Save as `/public/splash.gif`
3. Android: Replace `android/app/src/main/res/drawable/splash.png`
4. iOS: Replace `ios/App/App/Assets.xcassets/Splash.imageset/splash.png`

### Replace App Icon

1. Create icon (1024x1024 PNG with transparent background)
2. Save as `/public/dice-icon.svg` or `.png`
3. Use [Icon Generator](https://www.appicon.co/) to create all sizes
4. Replace in:
   - `android/app/src/main/res/mipmap-*/ic_launcher.png`
   - `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

## Guide for Play Store Deployment

See `PLAY_STORE_GUIDE.md` for comprehensive deployment instructions.

## License

MIT
