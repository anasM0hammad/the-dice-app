import { useState, useCallback, useEffect, useRef } from 'react';
import {
  SKINS, DiceSkin, getActiveSkinId, setActiveSkinId,
  isSkinUnlocked, unlockSkin, getUnlockTimeRemaining,
} from '../../utils/diceSkins';
import DicePreviewModal from '../../components/DicePreviewModal';
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
  const [previewSkin, setPreviewSkin] = useState<DiceSkin | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const handleLongPressStart = useCallback((skin: DiceSkin) => {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setPreviewSkin(skin);
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

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
      <p className="skins-hint">Long press any skin for a 3D preview</p>

      <div className="skins-grid">
        {SKINS.map(skin => {
          const isActive = activeSkinId === skin.id;
          const unlocked = isSkinUnlocked(skin.id);
          const timeRemaining = getUnlockTimeRemaining(skin.id);

          return (
            <button
              key={skin.id}
              className={`skin-card ${isActive ? 'skin-card-active' : ''}`}
              onClick={() => { if (!longPressTriggeredRef.current) handleSelect(skin); }}
              onPointerDown={() => handleLongPressStart(skin)}
              onPointerUp={handleLongPressEnd}
              onPointerLeave={handleLongPressEnd}
              onContextMenu={e => e.preventDefault()}
            >
              <div
                className="skin-preview-3d-wrapper"
                style={{
                  filter: isActive ? `drop-shadow(0 0 8px ${skin.preview}60)` : 'none',
                }}
              >
                <div className="skin-preview-3d-cube">
                  <div className="skin-cube-face skin-cube-front" style={{ backgroundColor: skin.preview }}>
                    <div className="skin-cube-dots">
                      {[[-8, -8], [8, -8], [-8, 0], [8, 0], [-8, 8], [8, 8]].map(([x, y], i) => (
                        <div key={i} className="skin-cube-dot" style={{ backgroundColor: skin.dotColor, left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }} />
                      ))}
                    </div>
                  </div>
                  <div className="skin-cube-face skin-cube-right" style={{ backgroundColor: skin.preview, filter: 'brightness(0.75)' }}>
                    <div className="skin-cube-dots">
                      {[[0, -8], [0, 0], [0, 8]].map(([x, y], i) => (
                        <div key={i} className="skin-cube-dot" style={{ backgroundColor: skin.dotColor, left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }} />
                      ))}
                    </div>
                  </div>
                  <div className="skin-cube-face skin-cube-top" style={{ backgroundColor: skin.preview, filter: 'brightness(1.15)' }}>
                    <div className="skin-cube-dots">
                      {[[-6, -3], [6, -3], [0, 3]].map(([x, y], i) => (
                        <div key={i} className="skin-cube-dot" style={{ backgroundColor: skin.dotColor, left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }} />
                      ))}
                    </div>
                  </div>
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

      <DicePreviewModal
        visible={!!previewSkin}
        onClose={() => setPreviewSkin(null)}
        title={previewSkin?.name || ''}
        skin={previewSkin || SKINS[0]}
      />
    </div>
  );
}
