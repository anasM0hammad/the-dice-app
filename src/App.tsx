import { useState, useCallback } from 'react';
import DicePage from './screens/Dice/DicePage';
import ConfigManagerPage from './screens/ConfigManager/ConfigManagerPage';
import DiceSkinsPage from './screens/DiceSkins/DiceSkinsPage';
import OnboardingScreen, { isOnboardingComplete } from './screens/Onboarding/OnboardingScreen';
import { showInterstitialOnNavigation } from './utils/admob';

type Page = 'dice' | 'configs' | 'skins';

function App() {
  const [page, setPage] = useState<Page>('dice');
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingComplete());

  // Forward navigation triggers interstitial ad
  const goToConfigs = useCallback(() => {
    showInterstitialOnNavigation();
    setPage('configs');
  }, []);
  const goToSkins = useCallback(() => {
    showInterstitialOnNavigation();
    setPage('skins');
  }, []);
  // Back navigation does NOT trigger interstitial
  const goToDice = useCallback(() => setPage('dice'), []);

  return (
    <>
      {showOnboarding && (
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      )}
      <div style={{ display: page === 'dice' ? 'block' : 'none' }}>
        <DicePage onNavigateToConfigs={goToConfigs} onNavigateToSkins={goToSkins} isActive={page === 'dice'} />
      </div>
      <div style={{ display: page === 'configs' ? 'block' : 'none' }}>
        <ConfigManagerPage onBack={goToDice} />
      </div>
      <div style={{ display: page === 'skins' ? 'block' : 'none' }}>
        <DiceSkinsPage onBack={goToDice} />
      </div>
    </>
  );
}

export default App;
