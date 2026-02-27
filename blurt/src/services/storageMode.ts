export type StorageMode = 'local' | 'cloud' | 'hybrid';

const DEFAULT_MODE: StorageMode = 'cloud';

export const getStorageMode = (): StorageMode => {
  const rawMode = (import.meta.env.VITE_STORAGE_MODE ?? DEFAULT_MODE).toLowerCase();
  if (rawMode === 'cloud' || rawMode === 'hybrid' || rawMode === 'local') {
    return rawMode;
  }
  return DEFAULT_MODE;
};

export const isCloudBackedMode = (mode: StorageMode): boolean => mode === 'cloud' || mode === 'hybrid';
