import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
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

// Step 1: Interactive 3D dice with roll button
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

  return (
    <div className="onboarding-roll-visual">
      <div className="onboarding-3d-container">
        <Suspense fallback={<div className="onboarding-3d-loading">Loading...</div>}>
          <Dice3D
            isRolling={isRolling}
            onRollComplete={handleRollComplete}
          />
        </Suspense>
      </div>
      <div className="onboarding-roll-controls">
        <button
          className={`onboarding-roll-btn ${isRolling ? 'rolling' : ''}`}
          onClick={handleRoll}
          disabled={isRolling}
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>
        {result > 0 && !isRolling && (
          <span className="onboarding-roll-result">{result}</span>
        )}
      </div>
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

// Step 2: Interactive 3D dice for drag exploration
function DragVisual() {
  return (
    <div className="onboarding-drag-visual">
      <div className="onboarding-3d-container">
        <Suspense fallback={<div className="onboarding-3d-loading">Loading...</div>}>
          <Dice3D
            isRolling={false}
            onRollComplete={() => {}}
          />
        </Suspense>
      </div>
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

// Step 3: Faces forming into a dice animation
function CreateVisual() {
  const [phase, setPhase] = useState<'text' | 'collapse-text' | 'icons' | 'collapse-icons'>('text');
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cycle = () => {
      setPhase('text');
      phaseTimerRef.current = setTimeout(() => {
        setPhase('collapse-text');
        phaseTimerRef.current = setTimeout(() => {
          setPhase('icons');
          phaseTimerRef.current = setTimeout(() => {
            setPhase('collapse-icons');
            phaseTimerRef.current = setTimeout(cycle, 1500);
          }, 2000);
        }, 1500);
      }, 2000);
    };
    cycle();
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  const textFaces = ['A', 'B', 'C', 'D', 'E', 'F'];
  const iconFaces = ['★', '♥', '♦', '♣', '♠', '●'];

  const isCollapsing = phase === 'collapse-text' || phase === 'collapse-icons';
  const faces = phase === 'icons' || phase === 'collapse-icons' ? iconFaces : textFaces;

  // Positions for dice-face formation (cross shape of a cube net → collapse to center)
  const gridPositions = [
    { gridRow: 1, gridCol: 1 },
    { gridRow: 1, gridCol: 2 },
    { gridRow: 1, gridCol: 3 },
    { gridRow: 2, gridCol: 1 },
    { gridRow: 2, gridCol: 2 },
    { gridRow: 2, gridCol: 3 },
  ];

  return (
    <div className="onboarding-create-visual">
      <div className={`onboarding-faces-container ${isCollapsing ? 'collapsing' : ''}`}>
        {faces.map((face, i) => (
          <div
            key={`${phase}-${i}`}
            className={`onboarding-face-cell ${isCollapsing ? 'face-collapse' : 'face-expand'}`}
            style={{
              animationDelay: `${i * 0.1}s`,
              gridRow: gridPositions[i].gridRow,
              gridColumn: gridPositions[i].gridCol,
            }}
          >
            {face}
          </div>
        ))}
        {isCollapsing && (
          <div className="onboarding-dice-form">
            <div className="onboarding-dice-cube">
              <div className="cube-face cube-front">{faces[0]}</div>
              <div className="cube-face cube-right">{faces[1]}</div>
              <div className="cube-face cube-top">{faces[2]}</div>
            </div>
          </div>
        )}
      </div>
      <div className="onboarding-create-label">
        {phase === 'text' || phase === 'collapse-text' ? 'Custom text' : 'Custom images'}
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
