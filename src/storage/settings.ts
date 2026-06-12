import { getDefaultConfig } from "../providers";
import type { SearchHistoryItem, StoredSettings } from "../types";

const STORAGE_KEY = "easyPubMedSearch.settings";
const HISTORY_KEY = "easyPubMedSearch.history";
const MAX_HISTORY_ITEMS = 20;
const LEGACY_OLLAMA_DEFAULT_MODELS = new Set(["gemma3", "gemma4", "gemma4:latest"]);

const defaultSettings: StoredSettings = {
  ...getDefaultConfig("ollama"),
  onboardingComplete: false,
};

function hasChromeStorage(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

function normalizeSettings(settings: Partial<StoredSettings> | undefined): StoredSettings {
  const merged = { ...defaultSettings, ...settings };

  if (merged.provider !== "ollama") {
    return defaultSettings;
  }

  if (LEGACY_OLLAMA_DEFAULT_MODELS.has(merged.model)) {
    return {
      ...merged,
      model: defaultSettings.model,
    };
  }

  return merged;
}

export async function getSettings(): Promise<StoredSettings> {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return normalizeSettings(result[STORAGE_KEY] as Partial<StoredSettings> | undefined);
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  return normalizeSettings(raw ? JSON.parse(raw) as Partial<StoredSettings> : undefined);
}

export async function saveSettings(settings: StoredSettings): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function getHistory(): Promise<SearchHistoryItem[]> {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(HISTORY_KEY);
    return Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] as SearchHistoryItem[] : [];
  }

  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) as SearchHistoryItem[] : [];
}

export async function saveHistoryItem(item: SearchHistoryItem): Promise<SearchHistoryItem[]> {
  const nextHistory = [item, ...(await getHistory()).filter((historyItem) => historyItem.id !== item.id)]
    .slice(0, MAX_HISTORY_ITEMS);

  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [HISTORY_KEY]: nextHistory });
  } else {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  }

  return nextHistory;
}

export async function clearHistory(): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.remove(HISTORY_KEY);
    return;
  }

  localStorage.removeItem(HISTORY_KEY);
}
