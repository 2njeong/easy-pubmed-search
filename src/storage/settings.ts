import { getDefaultConfig } from "../providers";
import type { StoredSettings } from "../types";

const STORAGE_KEY = "easyPubMedSearch.settings";

const defaultSettings: StoredSettings = {
  ...getDefaultConfig("ollama"),
  onboardingComplete: false,
};

function hasChromeStorage(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

export async function getSettings(): Promise<StoredSettings> {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return { ...defaultSettings, ...(result[STORAGE_KEY] as Partial<StoredSettings> | undefined) };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? { ...defaultSettings, ...JSON.parse(raw) as Partial<StoredSettings> } : defaultSettings;
}

export async function saveSettings(settings: StoredSettings): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
