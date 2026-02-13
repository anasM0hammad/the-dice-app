import { useEffect, useRef } from 'react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomFaces: () => void;
  onManageConfigs: () => void;
}

export default function Sidebar({ isOpen, onClose, onCustomFaces, onManageConfigs }: SidebarProps) {
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

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" ref={overlayRef} onClick={onClose} />
      )}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Menu</h2>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <button
            className="sidebar-item"
            onClick={() => {
              onCustomFaces();
              onClose();
            }}
          >
            <span className="sidebar-icon">&#9881;</span>
            <span>Custom Faces</span>
          </button>
          <button
            className="sidebar-item"
            onClick={() => {
              onManageConfigs();
              onClose();
            }}
          >
            <span className="sidebar-icon">&#128190;</span>
            <span>Saved Configs</span>
          </button>
        </nav>
      </div>
    </>
  );
}
