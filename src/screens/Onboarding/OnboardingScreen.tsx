import { useState, useCallback } from 'react';
import { DiceIcon } from '../../components/icons';
import './OnboardingScreen.css';

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
    description: 'Create custom dice with your own text on each face.',
    visual: 'create',
  },
  {
    title: 'Save Your Favorites',
    description: 'Save your custom dice and switch between them anytime.',
    visual: 'save',
  },
];

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

      <div className="onboarding-content">
        <div className="onboarding-visual">
          {step.visual === 'roll' && (
            <div className="onboarding-icon-wrapper onboarding-icon-roll">
              <DiceIcon size={64} color="#DC2626" />
              <div className="onboarding-tap-ring" />
            </div>
          )}
          {step.visual === 'drag' && (
            <div className="onboarding-icon-wrapper">
              <DiceIcon size={64} color="#DC2626" />
              <div className="onboarding-drag-hint">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 8 C20 8 12 16 12 22 C12 26.4 15.6 30 20 30 C24.4 30 28 26.4 28 22 C28 16 20 8 20 8Z" fill="rgba(220,38,38,0.3)" stroke="#DC2626" strokeWidth="1.5"/>
                  <circle cx="20" cy="20" r="3" fill="#DC2626"/>
                </svg>
              </div>
            </div>
          )}
          {step.visual === 'create' && (
            <div className="onboarding-icon-wrapper">
              <div className="onboarding-create-grid">
                {['A', 'B', 'C', 'D', 'E', 'F'].map((letter, i) => (
                  <div key={i} className="onboarding-create-cell" style={{ animationDelay: `${i * 0.15}s` }}>
                    {letter}
                  </div>
                ))}
              </div>
            </div>
          )}
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
