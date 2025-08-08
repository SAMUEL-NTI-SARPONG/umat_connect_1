
'use client';

// Helper functions for localStorage
export const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
        const parsed = JSON.parse(item);
        // Add a null check to prevent TypeError
        if (parsed === null) {
            return defaultValue;
        }
        // Special handling for Maps
        if (parsed.dataType === 'Map' && Array.isArray(parsed.value)) {
            return new Map(parsed.value) as T;
        }
        return parsed;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

export const saveToStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    let itemToStore;
    // Special handling for Maps
    if (value instanceof Map) {
        itemToStore = JSON.stringify({ dataType: 'Map', value: Array.from(value.entries()) });
    } else {
        itemToStore = JSON.stringify(value);
    }
    window.localStorage.setItem(key, itemToStore);
  } catch (error) {
    // Catch quota exceeded errors
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn(`LocalStorage quota exceeded for key “${key}”. Data could not be saved.`);
    } else {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
  }
};
