import { useState, useEffect, useRef } from 'react';
import './CustomFacesModal.css';

interface CustomFacesModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (faceValues: string[]) => void;
  initialValues?: string[];
}

export default function CustomFacesModal({ visible, onClose, onSave, initialValues }: CustomFacesModalProps) {
  const [faceValues, setFaceValues] = useState<string[]>(
    initialValues && initialValues.length === 6 ? initialValues : ['', '', '', '', '', '']
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && initialValues && initialValues.length === 6) {
      setFaceValues(initialValues);
    }
  }, [visible, initialValues]);

  useEffect(() => {
    if (!visible) return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      if (overlayRef.current) {
        overlayRef.current.style.height = `${viewport.height}px`;
      }
    };

    viewport.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      viewport.removeEventListener('resize', handleResize);
      if (overlayRef.current) {
        overlayRef.current.style.height = '';
      }
    };
  }, [visible]);

  const handleFaceChange = (index: number, value: string) => {
    const newValues = [...faceValues];
    newValues[index] = value;
    setFaceValues(newValues);
    
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSave = () => {
    const isFilled = faceValues.every(value => value.trim() !== '');

    if (!isFilled) {
      setErrorMessage('⚠️ Please fill in all face values');
      return;
    }
    
    setErrorMessage('');
    onSave(faceValues);
    onClose();
  };

  const handleClose = () => {
    setErrorMessage('');
    onClose();
  };

  const handleReset = () => {
    onSave(['', '', '', '', '', '']);
    setErrorMessage('');
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Dice</h2>
          <button onClick={handleClose} className="close-button">✕</button>
        </div>

        <div className="modal-content">
          {errorMessage && (
            <div className="error-container">
              <p className="error-text">{errorMessage}</p>
            </div>
          )}

          {faceValues.map((value, index) => (
            <div key={index} className="input-container">
              <label className="input-label">Face {index + 1}</label>
              <input
                className={`input ${!value && errorMessage ? 'input-error' : ''}`}
                value={value}
                onChange={(e) => handleFaceChange(index, e.target.value)}
                placeholder={`Enter value for face ${index + 1}`}
                maxLength={10}
              />
            </div>
          ))}
        </div>

        <div className="button-container">
          <button className="save-button" onClick={handleSave}>
            Apply
          </button>
          
          <button className="reset-button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

