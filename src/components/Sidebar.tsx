import { useEffect, useRef } from 'react';
import { CloseIcon, CreateDiceIcon, BookmarkIcon, ImageIcon, PaletteIcon, DiceIcon } from './icons';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomFaces: () => void;
  onManageConfigs: () => void;
  onImageDice?: () => void;
  onDiceSkins?: () => void;
}

export default function Sidebar({ isOpen, onClose, onCustomFaces, onManageConfigs, onImageDice, onDiceSkins }: SidebarProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleItemClick = (callback: (() => void) | undefined) => {
    if (callback) {
      callback();
    }
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" ref={overlayRef} onClick={onClose} />
      )}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <DiceIcon size={28} color="#DC2626" />
            <h2 className="sidebar-title">The Dice</h2>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <CloseIcon size={18} color="#a0a0b0" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Create</div>
          <button
            className="sidebar-item"
            onClick={() => handleItemClick(onCustomFaces)}
          >
            <span className="sidebar-icon"><CreateDiceIcon size={20} /></span>
            <span className="sidebar-item-text">Create Dice</span>
          </button>
          <button
            className="sidebar-item"
            onClick={() => handleItemClick(onImageDice)}
            disabled={!onImageDice}
          >
            <span className="sidebar-icon"><ImageIcon size={20} /></span>
            <span className="sidebar-item-text">Image Dice</span>
            {!onImageDice && <span className="sidebar-badge-soon">Soon</span>}
          </button>

          <div className="sidebar-divider" />

          <div className="sidebar-section-label">Collection</div>
          <button
            className="sidebar-item"
            onClick={() => handleItemClick(onManageConfigs)}
          >
            <span className="sidebar-icon"><BookmarkIcon size={20} /></span>
            <span className="sidebar-item-text">Saved Dices</span>
          </button>
          <button
            className="sidebar-item"
            onClick={() => handleItemClick(onDiceSkins)}
            disabled={!onDiceSkins}
          >
            <span className="sidebar-icon"><PaletteIcon size={20} /></span>
            <span className="sidebar-item-text">Dice Skins</span>
            {!onDiceSkins && <span className="sidebar-badge-soon">Soon</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-version">v2.0</span>
        </div>
      </div>
    </>
  );
}
