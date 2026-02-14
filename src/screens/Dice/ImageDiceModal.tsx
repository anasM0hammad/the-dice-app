import { useState, useEffect, useRef } from 'react';
import './ImageDiceModal.css';

interface ImageDiceModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (imageUrls: string[]) => void;
  initialImages?: string[];
}

export default function ImageDiceModal({ visible, onClose, onApply, initialImages }: ImageDiceModalProps) {
  const [images, setImages] = useState<string[]>(
    initialImages && initialImages.length === 6 ? [...initialImages] : ['', '', '', '', '', '']
  );
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<number>(0);
  const isMultiSelectRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && initialImages && initialImages.length === 6) {
      setImages([...initialImages]);
    }
  }, [visible, initialImages]);

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

  const handleSlotClick = (index: number) => {
    activeSlotRef.current = index;
    isMultiSelectRef.current = true;
    if (fileInputRef.current) fileInputRef.current.multiple = true;
    fileInputRef.current?.click();
  };

  const handleChangeClick = (index: number) => {
    activeSlotRef.current = index;
    isMultiSelectRef.current = false;
    if (fileInputRef.current) fileInputRef.current.multiple = false;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isMultiSelectRef.current) {
      // Multi-select: fill empty slots in order
      const emptySlots: number[] = [];
      for (let i = 0; i < 6; i++) {
        if (images[i] === '') emptySlots.push(i);
      }

      const maxFiles = Math.min(files.length, emptySlots.length);
      for (let f = 0; f < maxFiles; f++) {
        const file = files[f];
        if (!file.type.startsWith('image/')) continue;

        const slotIndex = emptySlots[f];
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setImages(prev => {
            const updated = [...prev];
            updated[slotIndex] = dataUrl;
            return updated;
          });
          if (error) setError('');
        };
        reader.readAsDataURL(file);
      }
    } else {
      // Single replacement
      const file = files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImages(prev => {
          const updated = [...prev];
          updated[activeSlotRef.current] = dataUrl;
          return updated;
        });
        if (error) setError('');
      };
      reader.readAsDataURL(file);
    }

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    const next = [...images];
    next[index] = '';
    setImages(next);
  };

  const handleApply = () => {
    const allFilled = images.every(img => img !== '');
    if (!allFilled) {
      setError('Please add images for all 6 faces');
      return;
    }
    setError('');
    onApply(images);
    onClose();
  };

  const handleReset = () => {
    onApply(['', '', '', '', '', '']);
    setError('');
    onClose();
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!visible) return null;

  const filledCount = images.filter(img => img !== '').length;

  return (
    <div className="imgdice-overlay" ref={overlayRef} onClick={handleClose}>
      <div className="imgdice-container" onClick={e => e.stopPropagation()}>
        <div className="imgdice-header">
          <h2 className="imgdice-title">Image Dice</h2>
          <button onClick={handleClose} className="imgdice-close">✕</button>
        </div>

        <p className="imgdice-note">Images are for this session only</p>

        <div className="imgdice-content">
          {error && (
            <div className="imgdice-error">{error}</div>
          )}

          <div className="imgdice-grid">
            {images.map((img, i) => (
              <div key={i} className="imgdice-slot" onClick={() => !img && handleSlotClick(i)}>
                {img ? (
                  <>
                    <img src={img} alt={`Face ${i + 1}`} className="imgdice-preview" />
                    <button
                      className="imgdice-remove"
                      onClick={e => { e.stopPropagation(); handleRemove(i); }}
                    >
                      ✕
                    </button>
                    <button
                      className="imgdice-change"
                      onClick={e => { e.stopPropagation(); handleChangeClick(i); }}
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <div className="imgdice-placeholder">
                    <span className="imgdice-plus">+</span>
                    <span className="imgdice-face-label">Face {i + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="imgdice-footer">
          <span className="imgdice-count">{filledCount}/6 images</span>
          <button className="imgdice-apply-btn" onClick={handleApply}>
            Apply
          </button>
          <button className="imgdice-reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
