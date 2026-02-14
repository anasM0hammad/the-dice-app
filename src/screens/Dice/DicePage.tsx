import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import CustomFacesModal from './CustomFacesModal';
import ImageDiceModal from './ImageDiceModal';
import Sidebar from '../../components/Sidebar';
import { useShakeDetection } from '../../hooks/useShakeDetection';
import {
  getActiveConfigId, getConfigById, getConfigs, saveConfig, setActiveConfigId,
  clearActiveConfig, generateId, canAddMore, MAX_CONFIGS, DiceConfig,
} from '../../utils/configStorage';
import { MenuIcon, SoundOnIcon, SoundOffIcon, ShareIcon, ChevronRightIcon } from '../../components/icons';
import { getActiveSkin } from '../../utils/diceSkins';
import { incrementRollCountForAd, showInterstitialAd } from '../../utils/admob';
import './DicePage.css';

const Dice3D = lazy(() => import('../../components/Dice3D'));

const ROLL_COUNT_KEY = 'dice_roll_count';
const REVIEW_DISMISS_COUNT_KEY = 'dice_review_dismiss_count';
const SOUND_ENABLED_KEY = 'dice_sound_enabled';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.anaslyzer.thedice';
const REVIEW_THRESHOLDS = [10, 50, 200];

interface RollHistoryEntry {
  label: string;
  timestamp: number;
}

interface DicePageProps {
  onNavigateToConfigs: () => void;
  onNavigateToSkins: () => void;
  isActive: boolean;
}

export default function DicePage({ onNavigateToConfigs, onNavigateToSkins, isActive }: DicePageProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customFaceValues, setCustomFaceValues] = useState<string[]>([]);
  const [customFaceImages, setCustomFaceImages] = useState<string[]>([]);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() =>
    localStorage.getItem(SOUND_ENABLED_KEY) !== 'false'
  );
  const [hasRolled, setHasRolled] = useState(false);
  const [resultKey, setResultKey] = useState(0);

  // Quick dice switcher
  const [savedConfigs, setSavedConfigs] = useState<DiceConfig[]>([]);
  const [activeConfigId, setActiveConfigIdState] = useState<string | null>(null);

  // Roll history
  const [rollHistory, setRollHistory] = useState<RollHistoryEntry[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Save bottom sheet
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Dice skin
  const [activeSkin, setActiveSkinState] = useState(getActiveSkin);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rollCountRef = useRef(
    parseInt(localStorage.getItem(ROLL_COUNT_KEY) || '0', 10)
  );

  const refreshConfigs = useCallback(() => {
    setSavedConfigs(getConfigs());
    setActiveConfigIdState(getActiveConfigId());
    setActiveSkinState(getActiveSkin());
  }, []);

  // Auto-apply active saved config on mount + load configs
  useEffect(() => {
    refreshConfigs();
    const activeId = getActiveConfigId();
    if (activeId) {
      const config = getConfigById(activeId);
      if (config) {
        setCustomFaceValues(config.faceValues);
      }
    }
  }, [refreshConfigs]);

  // Refresh configs and skin when page becomes active (returning from other pages)
  useEffect(() => {
    if (isActive) {
      refreshConfigs();
      // Re-apply active config in case it was deleted or changed
      const activeId = getActiveConfigId();
      if (activeId) {
        const config = getConfigById(activeId);
        if (config) {
          setCustomFaceValues(config.faceValues);
        } else {
          // Active config was deleted
          clearActiveConfig();
          setCustomFaceValues([]);
          setActiveConfigIdState(null);
        }
      }
    }
  }, [isActive, refreshConfigs]);

  useEffect(() => {
    const audio = new Audio('/dice-roll.mp3');
    audio.volume = 0.5;
    audio.load();
    audioRef.current = audio;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  const handleRoll = useCallback(() => {
    if (!isRolling) {
      setIsRolling(true);
      playSound();
    }
  }, [isRolling, playSound]);

  useShakeDetection(handleRoll, { threshold: 25, cooldown: 3500 });

  const hasCustomValues = customFaceValues.length === 6 && customFaceValues.every(val => val.trim() !== '');
  const hasCustomImages = customFaceImages.length === 6 && customFaceImages.every(img => img !== '');

  const handleRollComplete = useCallback((result: number) => {
    setIsRolling(false);
    setCurrentNumber(result);
    setHasRolled(true);
    setResultKey(k => k + 1);

    // Roll history
    const label = hasCustomImages ? `Face ${result}` : hasCustomValues ? customFaceValues[result - 1] : String(result);
    setRollHistory(prev => [{ label, timestamp: Date.now() }, ...prev].slice(0, 10));

    // Roll count + review prompt
    rollCountRef.current += 1;
    localStorage.setItem(ROLL_COUNT_KEY, String(rollCountRef.current));

    const dismissCount = parseInt(localStorage.getItem(REVIEW_DISMISS_COUNT_KEY) || '0', 10);
    if (dismissCount < REVIEW_THRESHOLDS.length) {
      const threshold = REVIEW_THRESHOLDS[dismissCount];
      if (rollCountRef.current === threshold) {
        setShowReviewPrompt(true);
      }
    }

    // Interstitial ad after every N rolls
    if (incrementRollCountForAd()) {
      showInterstitialAd();
    }
  }, [hasCustomValues, customFaceValues]);

  const handleDismissReview = (rated: boolean) => {
    if (rated) {
      window.open(PLAY_STORE_URL, '_blank');
    }
    const dismissCount = parseInt(localStorage.getItem(REVIEW_DISMISS_COUNT_KEY) || '0', 10);
    localStorage.setItem(REVIEW_DISMISS_COUNT_KEY, String(dismissCount + 1));
    setShowReviewPrompt(false);
  };

  const handleCustomFacesSave = (faceValues: string[]) => {
    setCustomFaceValues(faceValues);
    setCustomFaceImages([]); // Clear images when applying text faces
    if (faceValues.every(v => !v.trim())) {
      clearActiveConfig();
      setActiveConfigIdState(null);
    }
  };

  const handleImageDiceApply = (imageUrls: string[]) => {
    setCustomFaceImages(imageUrls);
    if (imageUrls.every(img => img !== '')) {
      // Image dice active — clear text custom values and active config
      setCustomFaceValues([]);
      clearActiveConfig();
      setActiveConfigIdState(null);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_ENABLED_KEY, String(next));
  };

  // Quick dice switcher
  const handleSwitcherSelect = (configId: string | null) => {
    setCustomFaceImages([]); // Clear images on config switch
    if (configId === null) {
      clearActiveConfig();
      setCustomFaceValues([]);
      setActiveConfigIdState(null);
    } else if (configId === activeConfigId) {
      clearActiveConfig();
      setCustomFaceValues([]);
      setActiveConfigIdState(null);
    } else {
      setActiveConfigId(configId);
      setActiveConfigIdState(configId);
      const config = getConfigById(configId);
      if (config) setCustomFaceValues(config.faceValues);
    }
  };

  // Share roll
  const [shareToast, setShareToast] = useState('');
  const handleShare = async () => {
    const resultText = hasCustomImages
      ? `Face ${currentNumber}`
      : hasCustomValues
        ? customFaceValues[currentNumber - 1]
        : String(currentNumber);
    const text = `I rolled ${resultText} on The Dice!\n${PLAY_STORE_URL}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      // Share cancelled or failed, fall through to clipboard
    }
    // Clipboard fallback
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setShareToast('Copied to clipboard!');
      } else {
        // Last resort: textarea copy method
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setShareToast('Copied to clipboard!');
      }
    } catch {
      setShareToast('Could not share');
    }
    setTimeout(() => setShareToast(''), 2000);
  };

  // Save bottom sheet
  const configCount = savedConfigs.length;
  const canSave = canAddMore();

  const openSaveSheet = () => {
    setSaveName('');
    setSaveError('');
    setSaveSuccess(false);
    setShowSaveSheet(true);
    setTimeout(() => saveInputRef.current?.focus(), 100);
  };

  const handleSaveConfig = () => {
    const trimmed = saveName.trim();
    if (!trimmed) {
      setSaveError('Please enter a name');
      return;
    }
    const config = {
      id: generateId(),
      name: trimmed,
      faceValues: [...customFaceValues],
    };
    const ok = saveConfig(config);
    if (!ok) {
      setSaveError(`Maximum ${MAX_CONFIGS} reached`);
      return;
    }
    setActiveConfigId(config.id);
    setActiveConfigIdState(config.id);
    setSaveSuccess(true);
    refreshConfigs();
    setTimeout(() => setShowSaveSheet(false), 800);
  };

  // Refresh configs when coming back from config page (visibility change)
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) refreshConfigs();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    // Also refresh on focus for the mount-both-pages approach
    const handleFocus = () => refreshConfigs();
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshConfigs]);

  return (
    <div className="dice-page">
      <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
        <MenuIcon size={22} />
      </button>

      <button className="sound-toggle-btn" onClick={toggleSound} aria-label={soundEnabled ? 'Mute' : 'Unmute'}>
        {soundEnabled ? <SoundOnIcon size={20} /> : <SoundOffIcon size={20} />}
      </button>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCustomFaces={() => setIsModalVisible(true)}
        onManageConfigs={onNavigateToConfigs}
        onImageDice={() => setIsImageModalVisible(true)}
        onDiceSkins={onNavigateToSkins}
      />

      <div className="header">
        <h1 className="title">The Dice</h1>
        <p className="subtitle">Drag to rotate · Tap button to roll</p>
      </div>

      {/* Quick dice switcher */}
      {savedConfigs.length > 0 && (
        <div className="quick-switcher">
          <button
            className={`quick-switcher-pill ${!activeConfigId ? 'active' : ''}`}
            onClick={() => handleSwitcherSelect(null)}
          >
            Standard
          </button>
          {savedConfigs.map(c => (
            <button
              key={c.id}
              className={`quick-switcher-pill ${activeConfigId === c.id ? 'active' : ''}`}
              onClick={() => handleSwitcherSelect(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="dice-container">
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#606070' }}>
            Loading 3D engine...
          </div>
        }>
          <Dice3D
            isRolling={isRolling}
            onRollComplete={handleRollComplete}
            customFaceValues={hasCustomValues ? customFaceValues : undefined}
            customFaceImages={hasCustomImages ? customFaceImages : undefined}
            activeSkin={activeSkin}
          />
        </Suspense>
      </div>

      <div className="result-container">
        {hasCustomImages ? (
          hasRolled && !isRolling ? (
            <p className="result-image-label result-pop" key={resultKey}>Face {currentNumber}</p>
          ) : isRolling ? (
            <p className="result-number">...</p>
          ) : null
        ) : (
          <p className={`result-number ${hasRolled && !isRolling ? 'result-pop' : ''}`} key={resultKey}>
            {!isRolling
              ? (hasCustomValues ? customFaceValues[currentNumber - 1] : currentNumber)
              : '...'}
          </p>
        )}
      </div>

      {/* Save This Dice button - not shown for image dice */}
      {hasCustomValues && !activeConfigId && !hasCustomImages && (
        <div className="save-dice-area">
          <button
            className="save-dice-btn"
            onClick={openSaveSheet}
            disabled={!canSave}
          >
            {canSave
              ? `Save This Dice (${configCount}/${MAX_CONFIGS})`
              : `Save limit reached (${configCount}/${MAX_CONFIGS})`
            }
          </button>
          {!canSave && (
            <button className="manage-link" onClick={onNavigateToConfigs}>
              Manage saved dices →
            </button>
          )}
        </div>
      )}

      <button
        className={`roll-button ${isRolling ? 'disabled' : ''}`}
        onClick={handleRoll}
        disabled={isRolling}
      >
        {isRolling ? 'Rolling...' : 'Roll Dice'}
      </button>

      {hasRolled && !isRolling && (
        <button className="share-result-btn" onClick={handleShare}>
          <ShareIcon size={16} />
          Share Result
        </button>
      )}

      {shareToast && (
        <div className="share-toast">{shareToast}</div>
      )}

      {/* Roll history */}
      {rollHistory.length > 0 && (
        <div className="roll-history-section">
          <button
            className={`roll-history-toggle ${historyExpanded ? 'expanded' : ''}`}
            onClick={() => setHistoryExpanded(!historyExpanded)}
          >
            History <ChevronRightIcon size={14} />
          </button>
          {historyExpanded && (
            <div className="roll-history-pills">
              {rollHistory.map((entry, i) => (
                <span key={entry.timestamp + '-' + i} className="roll-history-pill">
                  {entry.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="instructions">
        {isRolling ? 'Watch the dice roll!' : 'Use your finger to spin the dice'}
      </p>

      <CustomFacesModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleCustomFacesSave}
        initialValues={customFaceValues}
      />

      <ImageDiceModal
        visible={isImageModalVisible}
        onClose={() => setIsImageModalVisible(false)}
        onApply={handleImageDiceApply}
        initialImages={customFaceImages}
      />

      {/* Save bottom sheet */}
      {showSaveSheet && (
        <>
          <div className="sheet-overlay" onClick={() => setShowSaveSheet(false)} />
          <div className="save-sheet">
            <div className="save-sheet-handle" />
            <h3 className="save-sheet-title">Save This Dice</h3>
            {saveSuccess ? (
              <p className="save-sheet-success">Saved!</p>
            ) : (
              <>
                <input
                  ref={saveInputRef}
                  className="save-sheet-input"
                  value={saveName}
                  onChange={e => { setSaveName(e.target.value); setSaveError(''); }}
                  placeholder="Dice name"
                  maxLength={30}
                  onKeyDown={e => e.key === 'Enter' && handleSaveConfig()}
                />
                {saveError && <p className="save-sheet-error">{saveError}</p>}
                <button className="save-sheet-save-btn" onClick={handleSaveConfig}>Save</button>
                <button className="save-sheet-cancel" onClick={() => setShowSaveSheet(false)}>Cancel</button>
              </>
            )}
          </div>
        </>
      )}

      {/* Review prompt */}
      {showReviewPrompt && (
        <div className="review-overlay">
          <div className="review-card">
            <p className="review-title">Enjoying The Dice?</p>
            <p className="review-subtitle">You've been rolling a lot! Would you like to rate us on the Play Store?</p>
            <div className="review-buttons">
              <button className="review-btn review-btn-primary" onClick={() => handleDismissReview(true)}>
                Rate Now
              </button>
              <button className="review-btn review-btn-secondary" onClick={() => handleDismissReview(false)}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
