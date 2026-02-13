import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import CustomFacesModal from './CustomFacesModal';
import Sidebar from '../../components/Sidebar';
import { useShakeDetection } from '../../hooks/useShakeDetection';
import { getActiveConfigId, getConfigById } from '../../utils/configStorage';
import './DicePage.css';

const Dice3D = lazy(() => import('../../components/Dice3D'));

const ROLL_COUNT_KEY = 'dice_roll_count';
const REVIEW_DISMISSED_KEY = 'dice_review_dismissed';
const REVIEW_THRESHOLD = 10;
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.anaslyzer.thedice';

interface DicePageProps {
  onNavigateToConfigs: () => void;
}

export default function DicePage({ onNavigateToConfigs }: DicePageProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customFaceValues, setCustomFaceValues] = useState<string[]>([]);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rollCountRef = useRef(
    parseInt(localStorage.getItem(ROLL_COUNT_KEY) || '0', 10)
  );

  // Auto-apply active saved config on mount
  useEffect(() => {
    const activeId = getActiveConfigId();
    if (activeId) {
      const config = getConfigById(activeId);
      if (config) {
        setCustomFaceValues(config.faceValues);
      }
    }
  }, []);

  useEffect(() => {
    // Pre-load audio
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

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const handleRoll = useCallback(() => {
    if (!isRolling) {
      setIsRolling(true);
      playSound();
    }
  }, [isRolling]);

  // Shake-to-roll on mobile devices
  useShakeDetection(handleRoll, { threshold: 25, cooldown: 3500 });

  const handleRollComplete = useCallback((result: number) => {
    setIsRolling(false);
    setCurrentNumber(result);

    rollCountRef.current += 1;
    localStorage.setItem(ROLL_COUNT_KEY, String(rollCountRef.current));

    const dismissed = localStorage.getItem(REVIEW_DISMISSED_KEY);
    if (rollCountRef.current === REVIEW_THRESHOLD && !dismissed) {
      setShowReviewPrompt(true);
    }
  }, []);

  const handleCustomFacesSave = (faceValues: string[]) => {
    setCustomFaceValues(faceValues);
  };

  const hasCustomValues = customFaceValues.length === 6 && customFaceValues.every(val => val.trim() !== '');

  return (
    <div className="dice-page">
      <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCustomFaces={() => setIsModalVisible(true)}
        onManageConfigs={onNavigateToConfigs}
      />

      <div className="header">
        <h1 className="title">The Dice</h1>
        <p className="subtitle">Drag to rotate • Tap button to roll</p>
      </div>

      <div className="dice-container">
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a0a0b0' }}>
            Loading 3D engine...
          </div>
        }>
          <Dice3D
            isRolling={isRolling}
            onRollComplete={handleRollComplete}
            customFaceValues={hasCustomValues ? customFaceValues : undefined}
          />
        </Suspense>
      </div>

      <div className="result-container">
        <p className="result-number">
          {!isRolling ?  (hasCustomValues ? customFaceValues[currentNumber - 1] : currentNumber) : ('...')}
        </p>
      </div>

      <button
        className={`roll-button ${isRolling ? 'disabled' : ''}`}
        onClick={handleRoll}
        disabled={isRolling}
      >
        {isRolling ? 'Rolling...' : 'Roll Dice'}
      </button>

      <p className="instructions">
        {isRolling ? 'Watch the dice roll!' : 'Use your finger to spin the dice'}
      </p>

      <CustomFacesModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleCustomFacesSave}
        initialValues={customFaceValues}
      />

      {showReviewPrompt && (
        <div className="review-overlay">
          <div className="review-card">
            <p className="review-title">Enjoying The Dice?</p>
            <p className="review-subtitle">You have rolled {REVIEW_THRESHOLD} times! Would you like to rate us on the Play Store?</p>
            <div className="review-buttons">
              <button
                className="review-btn review-btn-primary"
                onClick={() => {
                  window.open(PLAY_STORE_URL, '_blank');
                  localStorage.setItem(REVIEW_DISMISSED_KEY, '1');
                  setShowReviewPrompt(false);
                }}
              >
                Rate Now
              </button>
              <button
                className="review-btn review-btn-secondary"
                onClick={() => {
                  localStorage.setItem(REVIEW_DISMISSED_KEY, '1');
                  setShowReviewPrompt(false);
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
