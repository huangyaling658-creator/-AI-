"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "pm-settings";

interface Settings {
  model: string;
  apiKey: string;
}

const defaultSettings: Settings = {
  model: "claude-sonnet",
  apiKey: "",
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { ...settings, loaded, updateSettings };
}
