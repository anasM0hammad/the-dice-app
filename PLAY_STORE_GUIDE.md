# Google Play Store Deployment Guide

Complete guide to deploy **The Dice** app to Google Play Store.

## Prerequisites

1. **Google Play Console Account** ($25 one-time fee)
2. **Android Studio** installed
3. **Java JDK 17+** installed
4. **Signing Keystore** (we'll create this)

---

## Step 1: Prepare Your App

### 1.1 Update App Information

Edit `capacitor.config.json`:
```json
{
  "appId": "com.yourcompany.thedice",
  "appName": "The Dice"
}
```

### 1.2 Update `package.json` Version

```json
{
  "version": "1.0.0"
}
```

---

## Step 2: Build the Web App

```bash
npm run build
```

This creates optimized production files in `/dist`.

---

## Step 3: Sync with Android

```bash
npx cap sync android
```

This copies web files to Android project.

---

## Step 4: Create Signing Keystore

**IMPORTANT: Store this keystore safely! You'll need it for ALL future updates.**

```bash
keytool -genkey -v -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Answer the prompts:
- **Password**: Choose a strong password (save it!)
- **Name, Organization**: Your details
- **City, State, Country**: Your location

Save the keystore file somewhere safe (NOT in your project folder).

---

## Step 5: Configure Signing in Android Studio

1. Open Android Studio
2. Open project: `android/` folder
3. Go to **Build > Generate Signed Bundle / APK**
4. Select **Android App Bundle** (AAB)
5. Click **Next**
6. Click **Create new...** to create or **Choose existing...** to select your keystore
7. Fill in:
   - **Key store path**: Path to your `.keystore` file
   - **Key store password**: Your keystore password
   - **Key alias**: `my-key-alias`
   - **Key password**: Your key password
8. Click **Next**
9. Select **release** build variant
10. Check both signature versions (V1 and V2)
11. Click **Finish**

---

## Step 6: Prepare App Assets

### 6.1 App Icon

Create a 512x512 PNG icon (no transparency for Play Store).

### 6.2 Feature Graphic

Create 1024x500 PNG banner image for Play Store listing.

### 6.3 Screenshots

Take 2-8 screenshots:
- Phone: 16:9 or 9:16 ratio
- Minimum 320px
- Recommended: 1080x1920 (portrait) or 1920x1080 (landscape)

### 6.4 Privacy Policy (Required)

Create a simple privacy policy and host it online (GitHub Pages, Google Docs public link, etc.).

Example minimal privacy policy:
```
The Dice Privacy Policy

Last updated: [Date]

The Dice does not collect, store, or share any personal information.
The app runs entirely on your device and does not connect to any servers.

Contact: [your-email@example.com]
```

---

## Step 7: Create Play Console Listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - **App name**: The Dice
   - **Default language**: English (US)
   - **App or game**: App
   - **Free or paid**: Free

---

## Step 8: Fill Store Listing

### Main Store Listing

- **Short description** (80 chars):
  ```
  Roll a beautiful 3D dice with custom faces and realistic physics!
  ```

- **Full description** (4000 chars max):
  ```
  🎲 The Dice - Beautiful 3D Dice Roller

  Roll dice like never before with stunning 3D graphics and realistic physics!

  ✨ FEATURES:
  • Gorgeous 3D dice with smooth animations
  • Drag to rotate and inspect the dice
  • Tap the button to roll with realistic tumbling
  • Customize all 6 faces with your own text
  • Satisfying dice roll sound effects
  • Clean, modern dark interface

  🎯 PERFECT FOR:
  • Board game nights
  • Decision making
  • Teaching probability
  • Fun and entertainment

  Simply drag to rotate the dice, or tap "Roll Dice" to watch it tumble with
  realistic physics. Customize faces for your own games or decisions!

  No ads, no tracking, completely free!
  ```

- **App icon**: Upload your 512x512 icon
- **Feature graphic**: Upload 1024x500 banner
- **Screenshots**: Upload 2-8 screenshots
- **Privacy policy URL**: Your hosted privacy policy link

---

## Step 9: Content Rating

1. Go to **Content rating**
2. Fill out the questionnaire
3. Select **No** for ads (if you don't have ads)
4. Submit for rating

---

## Step 10: App Access

1. Go to **App access**
2. Select "All functionality is available without special access"
3. Save

---

## Step 11: Upload AAB

1. Go to **Release > Production**
2. Click **Create new release**
3. Upload your `.aab` file from:
   ```
   android/app/release/app-release.aab
   ```
4. **Release name**: `1.0.0`
5. **Release notes**:
   ```
   Initial release
   - 3D interactive dice
   - Custom face values
   - Realistic physics
   - Sound effects
   ```

---

## Step 12: Pricing & Distribution

1. Go to **Pricing & distribution**
2. Select **Free**
3. Select countries (or select all)
4. Check content guidelines boxes
5. Save

---

## Step 13: Submit for Review

1. Go to **Publishing overview**
2. Check all sections are complete (green checkmarks)
3. Click **Send for review**

**Review time**: Usually 1-7 days.

---

## Updates & Future Releases

For updates:

1. Update `version` in `package.json`
2. Update `versionCode` and `versionName` in `android/app/build.gradle`:
   ```gradle
   versionCode 2
   versionName "1.0.1"
   ```
3. Build and sign new AAB
4. Upload to a new release in Play Console

---

## Common Issues

### Issue: "You need to use a different package name"
**Solution**: Change `appId` in `capacitor.config.json` to something unique (e.g., `com.yourname.thedice`)

### Issue: "Upload failed: APK specifies a version code that has already been used"
**Solution**: Increment `versionCode` in `android/app/build.gradle`

### Issue: "You uploaded a debuggable APK"
**Solution**: Make sure you're building the **release** variant, not debug

---

## Useful Commands

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open Android Studio
npx cap open android

# Check Capacitor
npx cap doctor
```

---

## Need Help?

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Play Console Help](https://support.google.com/googleplay/android-developer)

Good luck with your launch! 🚀

