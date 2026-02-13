import { useState, useEffect } from 'react';
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

  useEffect(() => {
    setConfigs(getConfigs());
    setActiveId(getActiveConfigId());
  }, []);

  const refresh = () => {
    setConfigs(getConfigs());
    setActiveId(getActiveConfigId());
  };

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
    refresh();
  };

  const startCreate = () => {
    if (!canAddMore()) {
      setError(`Maximum ${MAX_CONFIGS} configurations reached. Delete one to add a new one.`);
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
      setError('Please enter a configuration name.');
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
      setError(`Maximum ${MAX_CONFIGS} configurations reached.`);
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

  if (editingConfig) {
    return (
      <div className="config-page">
        <div className="config-page-header">
          <button className="config-back-btn" onClick={cancelEdit}>&#8592;</button>
          <h1 className="config-page-title">
            {editingConfig.id ? 'Edit Config' : 'New Config'}
          </h1>
        </div>

        <div className="config-form">
          {error && <div className="config-error">{error}</div>}

          <div className="config-input-group">
            <label className="config-label">Config Name</label>
            <input
              className="config-input"
              value={configName}
              onChange={e => setConfigName(e.target.value)}
              placeholder="e.g. Party Dice"
              maxLength={30}
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
            Save Configuration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="config-page">
      <div className="config-page-header">
        <button className="config-back-btn" onClick={onBack}>&#8592;</button>
        <h1 className="config-page-title">Saved Configs</h1>
      </div>

      {error && <div className="config-error" style={{ margin: '0 20px' }}>{error}</div>}

      <div className="config-list">
        {configs.length === 0 && (
          <p className="config-empty">No saved configurations yet. Create one to get started.</p>
        )}

        {configs.map(config => (
          <div
            key={config.id}
            className={`config-card ${activeId === config.id ? 'config-card-active' : ''}`}
          >
            <div className="config-card-body" onClick={() => handleSelect(config.id)}>
              <div className="config-card-name">{config.name}</div>
              <div className="config-card-faces">
                {config.faceValues.join(' / ')}
              </div>
              {activeId === config.id && (
                <span className="config-active-badge">Active</span>
              )}
            </div>
            <div className="config-card-actions">
              <button className="config-action-btn" onClick={() => startEdit(config)}>Edit</button>
              <button className="config-action-btn config-delete-btn" onClick={() => handleDelete(config.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="config-footer">
        <button
          className="config-add-btn"
          onClick={startCreate}
          disabled={!canAddMore()}
        >
          + New Configuration
        </button>
        <p className="config-count">{configs.length} / {MAX_CONFIGS} configurations</p>
      </div>
    </div>
  );
}
