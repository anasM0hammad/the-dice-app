export interface DiceConfig {
  id: string;
  name: string;
  faceValues: string[];
}

const CONFIGS_KEY = 'dice_configs';
const ACTIVE_CONFIG_KEY = 'dice_active_config_id';
const MAX_CONFIGS = 5;

function loadConfigs(): DiceConfig[] {
  try {
    const raw = localStorage.getItem(CONFIGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConfigs(configs: DiceConfig[]) {
  localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
}

export function getConfigs(): DiceConfig[] {
  return loadConfigs();
}

export function getConfigById(id: string): DiceConfig | undefined {
  return loadConfigs().find(c => c.id === id);
}

export function saveConfig(config: DiceConfig): boolean {
  const configs = loadConfigs();
  const existingIndex = configs.findIndex(c => c.id === config.id);

  if (existingIndex >= 0) {
    configs[existingIndex] = config;
  } else {
    if (configs.length >= MAX_CONFIGS) return false;
    configs.push(config);
  }

  saveConfigs(configs);
  return true;
}

export function deleteConfig(id: string) {
  const configs = loadConfigs().filter(c => c.id !== id);
  saveConfigs(configs);

  if (getActiveConfigId() === id) {
    clearActiveConfig();
  }
}

export function getActiveConfigId(): string | null {
  return localStorage.getItem(ACTIVE_CONFIG_KEY);
}

export function setActiveConfigId(id: string) {
  localStorage.setItem(ACTIVE_CONFIG_KEY, id);
}

export function clearActiveConfig() {
  localStorage.removeItem(ACTIVE_CONFIG_KEY);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function canAddMore(): boolean {
  return loadConfigs().length < MAX_CONFIGS;
}
