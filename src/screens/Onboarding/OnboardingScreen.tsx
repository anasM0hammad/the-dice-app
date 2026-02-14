import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { useShakeDetection } from '../../hooks/useShakeDetection';
import './OnboardingScreen.css';

const Dice3D = lazy(() => import('../../components/Dice3D'));

const ONBOARDING_KEY = 'dice_onboarding_complete';

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

const steps = [
  {
    title: 'Tap to Roll',
    description: 'Tap the roll button or shake your phone to roll the dice.',
    visual: 'roll',
  },
  {
    title: 'Drag to Explore',
    description: 'Use your finger to rotate the 3D dice and explore every angle.',
    visual: 'drag',
  },
  {
    title: 'Make It Yours',
    description: 'Create custom dice with your own text or images on each face.',
    visual: 'create',
  },
  {
    title: 'Save Your Favorites',
    description: 'Save your custom dice and switch between them anytime.',
    visual: 'save',
  },
  {
    title: 'Track Your Rolls',
    description: 'View your roll history and share results with friends.',
    visual: 'history',
  },
];

// Phone frame wrapper component
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="onboarding-phone-frame">
      <div className="phone-frame-notch" />
      <div className="phone-frame-content">
        {children}
      </div>
    </div>
  );
}

// Step 1: Interactive 3D dice with roll button + shake support
function RollVisual() {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState(0);

  const handleRoll = useCallback(() => {
    if (!isRolling) setIsRolling(true);
  }, [isRolling]);

  const handleRollComplete = useCallback((res: number) => {
    setIsRolling(false);
    setResult(res);
  }, []);

  // Enable shake to actually roll the dice on this onboarding screen
  useShakeDetection(handleRoll, { threshold: 25, cooldown: 3500 });

  return (
    <div className="onboarding-roll-visual">
      <PhoneFrame>
        <div className="onboarding-3d-container">
          <Suspense fallback={<div className="onboarding-3d-loading">Loading...</div>}>
            <Dice3D
              isRolling={isRolling}
              onRollComplete={handleRollComplete}
            />
          </Suspense>
        </div>
        {result > 0 && !isRolling && (
          <span className="onboarding-roll-result" key={result}>{result}</span>
        )}
        {isRolling && (
          <span className="onboarding-roll-result rolling">...</span>
        )}
        <button
          className={`onboarding-roll-btn ${isRolling ? 'rolling' : ''}`}
          onClick={handleRoll}
          disabled={isRolling}
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>
      </PhoneFrame>
      <div className="onboarding-gesture-hints">
        <div className="onboarding-gesture-hint">
          <div className="onboarding-tap-gesture">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#DC2626" strokeWidth="1.5" fill="none" />
              <path d="M12 12v6m0 0l-2-2m2 2l2-2" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="onboarding-gesture-label">Tap</span>
        </div>
        <div className="onboarding-gesture-hint">
          <div className="onboarding-shake-gesture">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="7" y="3" width="10" height="18" rx="2" stroke="#DC2626" strokeWidth="1.5" fill="none" />
              <path d="M4 8l-2 2 2 2" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 8l2 2-2 2" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="onboarding-gesture-label">Shake</span>
        </div>
      </div>
    </div>
  );
}

// Step 2: Interactive 3D dice for drag exploration in phone frame
function DragVisual() {
  return (
    <div className="onboarding-drag-visual">
      <PhoneFrame>
        <div className="onboarding-3d-container">
          <Suspense fallback={<div className="onboarding-3d-loading">Loading...</div>}>
            <Dice3D
              isRolling={false}
              onRollComplete={() => {}}
            />
          </Suspense>
        </div>
      </PhoneFrame>
      <div className="onboarding-swipe-indicator">
        <svg width="80" height="40" viewBox="0 0 80 40" className="onboarding-finger-motion">
          <path d="M15 20 C30 20 50 20 65 20" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="4 4" />
          <circle cx="15" cy="20" r="8" fill="rgba(220,38,38,0.2)" stroke="#DC2626" strokeWidth="1.5" />
          <circle cx="15" cy="20" r="3" fill="#DC2626" />
          <path d="M58 14l7 6-7 6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="onboarding-swipe-label">Swipe to rotate</span>
      </div>
    </div>
  );
}

// Step 3: Faces form grid → float/roam → assemble into dice → rotate → repeat with icons
function CreateVisual() {
  const [phase, setPhase] = useState<'grid-text' | 'float-text' | 'dice-text' | 'grid-icons' | 'float-icons' | 'dice-icons'>('grid-text');
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cycle = () => {
      // Text iteration
      setPhase('grid-text');
      phaseTimerRef.current = setTimeout(() => {
        setPhase('float-text');
        phaseTimerRef.current = setTimeout(() => {
          setPhase('dice-text');
          phaseTimerRef.current = setTimeout(() => {
            // Icons iteration
            setPhase('grid-icons');
            phaseTimerRef.current = setTimeout(() => {
              setPhase('float-icons');
              phaseTimerRef.current = setTimeout(() => {
                setPhase('dice-icons');
                phaseTimerRef.current = setTimeout(cycle, 2500);
              }, 1800);
            }, 2000);
          }, 2500);
        }, 1800);
      }, 2000);
    };
    cycle();
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  const textFaces = ['A', 'B', 'C', 'D', 'E', 'F'];
  const iconFaces = ['★', '♥', '♦', '♣', '♠', '●'];

  const isTextPhase = phase.endsWith('-text');
  const faces = isTextPhase ? textFaces : iconFaces;
  const isGrid = phase.startsWith('grid');
  const isFloat = phase.startsWith('float');
  const isDice = phase.startsWith('dice');

  // Randomized float positions for the roaming phase
  const floatPositions = [
    { x: -40, y: -30, rotate: 15 },
    { x: 35, y: -45, rotate: -20 },
    { x: -50, y: 20, rotate: 25 },
    { x: 45, y: 15, rotate: -15 },
    { x: -20, y: 50, rotate: 10 },
    { x: 30, y: 45, rotate: -25 },
  ];

  return (
    <div className="onboarding-create-visual">
      <div className="onboarding-faces-stage">
        {/* Grid / Float phase */}
        {!isDice && faces.map((face, i) => (
          <div
            key={`${phase}-${i}`}
            className={`onboarding-face-cell ${isGrid ? 'face-in-grid' : 'face-floating'}`}
            style={isFloat ? {
              '--float-x': `${floatPositions[i].x}px`,
              '--float-y': `${floatPositions[i].y}px`,
              '--float-rotate': `${floatPositions[i].rotate}deg`,
              animationDelay: `${i * 0.08}s`,
            } as React.CSSProperties : {
              animationDelay: `${i * 0.08}s`,
            }}
            data-grid-index={i}
          >
            {face}
          </div>
        ))}

        {/* Dice phase - assembled cube that rotates */}
        {isDice && (
          <div className="onboarding-assembled-dice">
            <div className="onboarding-dice-cube-3d">
              <div className="cube-face cube-front">{faces[0]}</div>
              <div className="cube-face cube-back">{faces[5]}</div>
              <div className="cube-face cube-right">{faces[1]}</div>
              <div className="cube-face cube-left">{faces[4]}</div>
              <div className="cube-face cube-top">{faces[2]}</div>
              <div className="cube-face cube-bottom">{faces[3]}</div>
            </div>
          </div>
        )}
      </div>
      <div className="onboarding-create-label">
        {isTextPhase ? 'Custom text' : 'Custom icons'}
      </div>
    </div>
  );
}

// Step 5: Roll history visual
function HistoryVisual() {
  const rolls = [
    { label: '6', isLatest: true },
    { label: '3', isLatest: false },
    { label: '1', isLatest: false },
    { label: '5', isLatest: false },
    { label: '2', isLatest: false },
  ];

  return (
    <div className="onboarding-history-visual">
      <div className="onboarding-history-mockup">
        <div className="onboarding-history-header-mock">
          <span className="onboarding-history-toggle-mock">History ▾</span>
        </div>
        <div className="onboarding-history-pills-mock">
          {rolls.map((roll, i) => (
            <span
              key={i}
              className={`onboarding-history-pill-mock ${roll.isLatest ? 'latest' : ''}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {roll.label}
            </span>
          ))}
        </div>
      </div>
      <div className="onboarding-share-mock">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#808090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <span className="onboarding-share-label">Share results with friends</span>
      </div>
    </div>
  );
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleSkip = useCallback(() => {
    markOnboardingComplete();
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      markOnboardingComplete();
      onComplete();
    }
  }, [currentStep, onComplete]);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="onboarding-overlay">
      <button className="onboarding-skip" onClick={handleSkip}>
        Skip
      </button>

      <div className="onboarding-content" key={currentStep}>
        <div className="onboarding-visual">
          {step.visual === 'roll' && <RollVisual />}
          {step.visual === 'drag' && <DragVisual />}
          {step.visual === 'create' && <CreateVisual />}
          {step.visual === 'save' && (
            <div className="onboarding-icon-wrapper">
              <div className="onboarding-save-cards">
                <div className="onboarding-save-card" style={{ animationDelay: '0s' }}>
                  <span className="onboarding-card-dot active" />
                  Party Dice
                </div>
                <div className="onboarding-save-card" style={{ animationDelay: '0.15s' }}>
                  <span className="onboarding-card-dot" />
                  Game Night
                </div>
                <div className="onboarding-save-card" style={{ animationDelay: '0.3s' }}>
                  <span className="onboarding-card-dot" />
                  Custom #3
                </div>
              </div>
            </div>
          )}
          {step.visual === 'history' && <HistoryVisual />}
        </div>

        <h2 className="onboarding-title">{step.title}</h2>
        <p className="onboarding-desc">{step.description}</p>
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
            />
          ))}
        </div>

        <button className="onboarding-next-btn" onClick={handleNext}>
          {isLast ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
