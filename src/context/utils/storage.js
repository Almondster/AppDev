// Storage utilities for context persistence

export const loadFromStorage = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage`, e);
  }
  return fallback;
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`Failed to remove ${key} from localStorage`, e);
  }
};
