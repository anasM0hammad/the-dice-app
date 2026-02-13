import { useState, useCallback, useEffect } from 'react';
import {
  SKINS, DiceSkin, getActiveSkinId, setActiveSkinId,
  isSkinUnlocked, unlockSkin, getUnlockTimeRemaining,
} from '../../utils/diceSkins';
import { BackArrowIcon } from '../../components/icons';
import { showRewardedAd } from '../../utils/admob';
import './DiceSkinsPage.css';

interface DiceSkinsPageProps {
  onBack: () => void;
}

function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
}

export default function DiceSkinsPage({ onBack }: DiceSkinsPageProps) {
  const [activeSkinId, setActiveSkinIdState] = useState(getActiveSkinId);
  const [, setTick] = useState(0);

  // Refresh unlock timers periodically
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const refresh = useCallback(() => {
    setActiveSkinIdState(getActiveSkinId());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSelect = async (skin: DiceSkin) => {
    if (skin.type === 'free' || isSkinUnlocked(skin.id)) {
      // Activate or deactivate
      if (activeSkinId === skin.id) {
        setActiveSkinId('default');
        setActiveSkinIdState('default');
      } else {
        setActiveSkinId(skin.id);
        setActiveSkinIdState(skin.id);
      }
    } else {
      // Rewarded skin — show rewarded ad first
      const rewarded = await showRewardedAd();
      if (rewarded) {
        unlockSkin(skin.id);
        setActiveSkinId(skin.id);
        setActiveSkinIdState(skin.id);
      }
    }
  };

  return (
    <div className="skins-page">
      <div className="skins-header">
        <button className="skins-back-btn" onClick={onBack} aria-label="Back">
          <BackArrowIcon size={20} />
        </button>
        <h1 className="skins-title">Dice Skins</h1>
      </div>

      <div className="skins-grid">
        {SKINS.map(skin => {
          const isActive = activeSkinId === skin.id;
          const unlocked = isSkinUnlocked(skin.id);
          const timeRemaining = getUnlockTimeRemaining(skin.id);

          return (
            <button
              key={skin.id}
              className={`skin-card ${isActive ? 'skin-card-active' : ''}`}
              onClick={() => handleSelect(skin)}
            >
              <div
                className="skin-preview"
                style={{
                  backgroundColor: skin.preview,
                  boxShadow: isActive ? `0 0 16px ${skin.preview}40` : 'none',
                }}
              >
                <div className="skin-preview-dots">
                  {[[-6, -6], [6, -6], [-6, 0], [6, 0], [-6, 6], [6, 6]].map(([x, y], i) => (
                    <div
                      key={i}
                      className="skin-preview-dot"
                      style={{
                        backgroundColor: skin.dotColor,
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                      }}
                    />
                  ))}
                </div>
                {isActive && <div className="skin-active-check">✓</div>}
              </div>

              <span className="skin-name">{skin.name}</span>

              {skin.type === 'free' ? (
                <span className="skin-badge skin-badge-free">Free</span>
              ) : unlocked ? (
                <span className="skin-badge skin-badge-unlocked">
                  {timeRemaining > 0 ? formatTimeRemaining(timeRemaining) : 'Expired'}
                </span>
              ) : (
                <span className="skin-badge skin-badge-locked">Watch to Unlock</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
