import { useState, useEffect, useCallback } from 'react';
import {
  DiceConfig,
  getConfigs,
  saveConfig,
  deleteConfig,
  getActiveConfigId,
  setActiveConfigId,
  clearActiveConfig,
  generateId,
  canAddMore,
  MAX_CONFIGS,
} from '../../utils/configStorage';
import { BackArrowIcon, EditIcon, TrashIcon, PlusIcon } from '../../components/icons';
import './ConfigManagerPage.css';

interface ConfigManagerPageProps {
  onBack: () => void;
}

export default function ConfigManagerPage({ onBack }: ConfigManagerPageProps) {
  const [configs, setConfigs] = useState<DiceConfig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<DiceConfig | null>(null);
  const [faceInputs, setFaceInputs] = useState<string[]>(['', '', '', '', '', '']);
  const [configName, setConfigName] = useState('');
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setConfigs(getConfigs());
    setActiveId(getActiveConfigId());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh when page becomes visible (both pages mounted)
  useEffect(() => {
    const onVisibility = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  const handleSelect = (id: string) => {
    if (activeId === id) {
      clearActiveConfig();
    } else {
      setActiveConfigId(id);
    }
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteConfig(id);
    setConfirmDeleteId(null);
    refresh();
  };

  const startCreate = () => {
    if (!canAddMore()) {
      setError(`Maximum ${MAX_CONFIGS} dices reached. Delete one to add a new one.`);
      return;
    }
    setEditingConfig({ id: '', name: '', faceValues: ['', '', '', '', '', ''] });
    setFaceInputs(['', '', '', '', '', '']);
    setConfigName('');
    setError('');
  };

  const startEdit = (config: DiceConfig) => {
    setEditingConfig(config);
    setFaceInputs([...config.faceValues]);
    setConfigName(config.name);
    setError('');
  };

  const cancelEdit = () => {
    setEditingConfig(null);
    setError('');
  };

  const handleSave = () => {
    const trimmedName = configName.trim();
    if (!trimmedName) {
      setError('Please enter a name for this dice.');
      return;
    }
    const allFilled = faceInputs.every(v => v.trim() !== '');
    if (!allFilled) {
      setError('Please fill in all 6 face values.');
      return;
    }

    const config: DiceConfig = {
      id: editingConfig!.id || generateId(),
      name: trimmedName,
      faceValues: faceInputs.map(v => v.trim()),
    };

    const ok = saveConfig(config);
    if (!ok) {
      setError(`Maximum ${MAX_CONFIGS} dices reached.`);
      return;
    }

    setEditingConfig(null);
    setError('');
    refresh();
  };

  const handleFaceChange = (index: number, value: string) => {
    const next = [...faceInputs];
    next[index] = value;
    setFaceInputs(next);
    if (error) setError('');
  };

  const isAtLimit = configs.length >= MAX_CONFIGS;

  // Edit view
  if (editingConfig) {
    return (
      <div className="config-page">
        <div className="config-page-header">
          <button className="config-back-btn" onClick={cancelEdit} aria-label="Cancel">
            <BackArrowIcon size={20} />
          </button>
          <h1 className="config-page-title">
            {editingConfig.id ? 'Edit Dice' : 'New Dice'}
          </h1>
        </div>

        <div className="config-form">
          {error && <div className="config-error">{error}</div>}

          <div className="config-input-group">
            <label className="config-label">Dice Name</label>
            <input
              className="config-input"
              value={configName}
              onChange={e => setConfigName(e.target.value)}
              placeholder="e.g. Party Dice"
              maxLength={30}
              autoFocus
            />
          </div>

          {faceInputs.map((val, i) => (
            <div key={i} className="config-input-group">
              <label className="config-label">Face {i + 1}</label>
              <input
                className={`config-input ${!val.trim() && error ? 'config-input-error' : ''}`}
                value={val}
                onChange={e => handleFaceChange(i, e.target.value)}
                placeholder={`Value for face ${i + 1}`}
                maxLength={10}
              />
            </div>
          ))}

          <button className="config-save-btn" onClick={handleSave}>
            Save Dice
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="config-page">
      <div className="config-page-header">
        <button className="config-back-btn" onClick={onBack} aria-label="Back">
          <BackArrowIcon size={20} />
        </button>
        <h1 className="config-page-title">Saved Dices</h1>
        <span className={`config-header-count ${isAtLimit ? 'at-limit' : ''}`}>
          {configs.length}/{MAX_CONFIGS}
        </span>
      </div>

      {error && <div className="config-error" style={{ margin: '0 20px' }}>{error}</div>}

      <div className="config-list">
        {configs.length === 0 && (
          <div className="config-empty">
            <div className="config-empty-icon">🎲</div>
            <p className="config-empty-title">No saved dices yet</p>
            <p className="config-empty-subtitle">Create your first custom dice to get started</p>
            <button className="config-empty-cta" onClick={startCreate}>Create Dice</button>
          </div>
        )}

        {configs.map(config => (
          <div
            key={config.id}
            className={`config-card ${activeId === config.id ? 'config-card-active' : ''}`}
          >
            <div className="config-card-body" onClick={() => handleSelect(config.id)}>
              <div className="config-card-header">
                <div className="config-card-name">{config.name}</div>
                {activeId === config.id && (
                  <span className="config-active-badge">Active</span>
                )}
              </div>
              <div className="config-card-grid">
                {config.faceValues.map((val, i) => (
                  <div key={i} className="config-card-cell">{val}</div>
                ))}
              </div>
            </div>

            {confirmDeleteId === config.id ? (
              <div className="config-card-confirm">
                <span className="config-confirm-text">Delete this dice?</span>
                <button className="config-confirm-yes" onClick={() => handleDelete(config.id)}>Yes</button>
                <button className="config-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
              </div>
            ) : (
              <div className="config-card-actions">
                <button className="config-action-btn" onClick={() => startEdit(config)} aria-label="Edit">
                  <EditIcon size={15} /> Edit
                </button>
                <button className="config-action-btn config-delete-btn" onClick={() => setConfirmDeleteId(config.id)} aria-label="Delete">
                  <TrashIcon size={15} /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="config-footer">
        <button
          className="config-add-btn"
          onClick={startCreate}
          disabled={isAtLimit}
        >
          <PlusIcon size={18} /> New Dice
        </button>
        {isAtLimit && (
          <p className="config-limit-hint">Delete a dice to create a new one</p>
        )}
      </div>
    </div>
  );
}
