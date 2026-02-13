import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
} from '@capacitor-community/admob';

// Test ad unit IDs (replace with real IDs for production)
const BANNER_AD_UNIT_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const BANNER_AD_UNIT_IOS = 'ca-app-pub-3940256099942544/2934735716';

let initialized = false;

export async function initializeAdMob(): Promise<void> {
  if (initialized) return;
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.initialize({
      initializeForTesting: true,
    });
    initialized = true;
  } catch (err) {
    console.warn('AdMob initialization failed:', err);
  }
}

export async function showBannerAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const adId =
      Capacitor.getPlatform() === 'ios'
        ? BANNER_AD_UNIT_IOS
        : BANNER_AD_UNIT_ANDROID;

    const options: BannerAdOptions = {
      adId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: true,
    };

    await AdMob.showBanner(options);
  } catch (err) {
    console.warn('Failed to show banner ad:', err);
  }
}

export async function hideBannerAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.hideBanner();
  } catch (err) {
    console.warn('Failed to hide banner ad:', err);
  }
}

export async function removeBannerAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.removeBanner();
  } catch (err) {
    console.warn('Failed to remove banner ad:', err);
  }
}
