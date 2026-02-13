import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdOptions,
  RewardAdOptions,
  RewardAdPluginEvents,
  AdLoadInfo,
  AdMobRewardItem,
} from '@capacitor-community/admob';

// Test ad unit IDs (replace with real IDs for production)
const INTERSTITIAL_AD_ANDROID = 'ca-app-pub-3940256099942544/1033173712';
const INTERSTITIAL_AD_IOS = 'ca-app-pub-3940256099942544/4411468910';
const REWARDED_AD_ANDROID = 'ca-app-pub-3940256099942544/5224354917';
const REWARDED_AD_IOS = 'ca-app-pub-3940256099942544/1712485313';

// Interstitial ad thresholds
const ROLLS_PER_INTERSTITIAL = 15;
const INTERSTITIAL_FREQUENCY_CAP_MS = 3 * 60 * 1000; // 3 minutes

// Storage keys
const ROLL_COUNT_AD_KEY = 'dice_ad_roll_count';
const LAST_INTERSTITIAL_KEY = 'dice_last_interstitial_ts';

let initialized = false;

export async function initializeAdMob(): Promise<void> {
  if (initialized) return;
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.initialize({
      initializeForTesting: true,
    });
    initialized = true;

    // Pre-load ads
    prepareInterstitial();
    prepareRewarded();
  } catch (err) {
    console.warn('AdMob initialization failed:', err);
  }
}

// --- Interstitial Ads ---

async function prepareInterstitial(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const adId = Capacitor.getPlatform() === 'ios'
      ? INTERSTITIAL_AD_IOS
      : INTERSTITIAL_AD_ANDROID;

    const options: AdOptions = {
      adId,
      isTesting: true,
    };
    await AdMob.prepareInterstitial(options);
  } catch (err) {
    console.warn('Failed to prepare interstitial:', err);
  }
}

function canShowInterstitial(): boolean {
  const lastShown = parseInt(localStorage.getItem(LAST_INTERSTITIAL_KEY) || '0', 10);
  return Date.now() - lastShown >= INTERSTITIAL_FREQUENCY_CAP_MS;
}

export async function showInterstitialAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!canShowInterstitial()) return;

  try {
    await AdMob.showInterstitial();
    localStorage.setItem(LAST_INTERSTITIAL_KEY, String(Date.now()));
    // Pre-load next one
    prepareInterstitial();
  } catch (err) {
    console.warn('Failed to show interstitial:', err);
    prepareInterstitial();
  }
}

/**
 * Call after each roll. Returns true when interstitial should be shown.
 */
export function incrementRollCountForAd(): boolean {
  const count = parseInt(localStorage.getItem(ROLL_COUNT_AD_KEY) || '0', 10) + 1;
  if (count >= ROLLS_PER_INTERSTITIAL) {
    localStorage.setItem(ROLL_COUNT_AD_KEY, '0');
    return true;
  }
  localStorage.setItem(ROLL_COUNT_AD_KEY, String(count));
  return false;
}

/**
 * Show interstitial on forward navigation (to Saved Dices or Skins pages).
 */
export async function showInterstitialOnNavigation(): Promise<void> {
  await showInterstitialAd();
}

// --- Rewarded Ads ---

async function prepareRewarded(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const adId = Capacitor.getPlatform() === 'ios'
      ? REWARDED_AD_IOS
      : REWARDED_AD_ANDROID;

    const options: RewardAdOptions = {
      adId,
      isTesting: true,
    };
    await AdMob.prepareRewardVideoAd(options);
  } catch (err) {
    console.warn('Failed to prepare rewarded ad:', err);
  }
}

/**
 * Show a rewarded ad and return true if the user earned the reward.
 */
export function showRewardedAd(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // On web, simulate reward earned
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let rewarded = false;

    const rewardListener = AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      (_reward: AdMobRewardItem) => {
        rewarded = true;
      }
    );

    const dismissListener = AdMob.addListener(
      RewardAdPluginEvents.Dismissed,
      () => {
        rewardListener.then(h => h.remove());
        dismissListener.then(h => h.remove());
        failedListener.then(h => h.remove());
        prepareRewarded();
        resolve(rewarded);
      }
    );

    const failedListener = AdMob.addListener(
      RewardAdPluginEvents.FailedToShow,
      () => {
        rewardListener.then(h => h.remove());
        dismissListener.then(h => h.remove());
        failedListener.then(h => h.remove());
        prepareRewarded();
        resolve(false);
      }
    );

    AdMob.showRewardVideoAd().catch(() => {
      rewardListener.then(h => h.remove());
      dismissListener.then(h => h.remove());
      failedListener.then(h => h.remove());
      prepareRewarded();
      resolve(false);
    });
  });
}

// Keep type exports to avoid unused import warnings
export type { AdLoadInfo };
