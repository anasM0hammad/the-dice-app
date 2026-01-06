import React, { useState, useRef, useEffect } from 'react';
import Dice3D from '../../components/Dice3D';
import CustomFacesModal from './CustomFacesModal';
import './DicePage.css';

export default function DicePage() {
  const [isRolling, setIsRolling] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customFaceValues, setCustomFaceValues] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const handleRoll = () => {
    if (!isRolling) {
      setIsRolling(true);
      playSound();
    }
  };

  const handleRollComplete = (result: number) => {
    setIsRolling(false);
    setCurrentNumber(result);
  };

  const handleCustomFacesSave = (faceValues: string[]) => {
    setCustomFaceValues(faceValues);
  };

  const hasCustomValues = customFaceValues.length === 6 && customFaceValues.every(val => val.trim() !== '');

  return (
    <div className="dice-page">
      <div className="header">
        <h1 className="title">The Dice</h1>
        <p className="subtitle">Drag to rotate • Tap button to roll</p>
        
        <button 
          className="custom-button"
          onClick={() => setIsModalVisible(true)}
        >
          ⚙️ Custom Faces
        </button>
      </div>

      <div className="dice-container">
        <Dice3D 
          isRolling={isRolling} 
          onRollComplete={handleRollComplete}
          customFaceValues={hasCustomValues ? customFaceValues : undefined}
        />
      </div>

      <div className="result-container">
        {/* <p className="result-label">Result</p> */}
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
    </div>
  );
}

