import { useEffect, useState } from "react";
import { Generator } from "./components/Generator";
import { Onboarding } from "./components/Onboarding";
import { getSettings, saveSettings } from "./storage/settings";
import type { StoredSettings } from "./types";

export function App() {
  const [settings, setSettings] = useState<StoredSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  async function completeOnboarding(nextSettings: StoredSettings) {
    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setShowSettings(false);
  }

  if (!settings) {
    return <main className="app-shell"><p className="muted">설정을 불러오는 중...</p></main>;
  }

  const needsOnboarding = showSettings || !settings.onboardingComplete;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Easy PubMed Search</h1>
          <p>자연어를 PubMed 검색식 초안으로 변환합니다.</p>
        </div>
      </header>

      {needsOnboarding ? (
        <Onboarding initialSettings={settings} onComplete={completeOnboarding} />
      ) : (
        <Generator settings={settings} onOpenSettings={() => setShowSettings(true)} />
      )}
    </main>
  );
}
