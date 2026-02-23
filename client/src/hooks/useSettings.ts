import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { AppSettings, CurrencyOption } from "@/lib/types";

const DEFAULT_SETTINGS: AppSettings = {
  sources: ["Walk-in", "Marketplace", "Phone", "Facebook"],
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    const settingsRef = doc(db, "users", user.uid, "settings", "config");

    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snapshot.data() } as AppSettings);
      } else {
        // Initialize settings if they don't exist
        setDoc(settingsRef, DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!user) return;
    const settingsRef = doc(db, "users", user.uid, "settings", "config");
    await setDoc(settingsRef, { ...settings, ...updates }, { merge: true });
  };

  const addSource = async (source: string) => {
    const newSources = [...settings.sources, source];
    await updateSettings({ sources: newSources });
  };

  const removeSource = async (source: string) => {
    const newSources = settings.sources.filter((s) => s !== source);
    await updateSettings({ sources: newSources });
  };

  const updateSource = async (oldSource: string, newSource: string) => {
    const newSources = settings.sources.map((s) => (s === oldSource ? newSource : s));
    await updateSettings({ sources: newSources });
  };

  const setCurrency = async (currency: CurrencyOption) => {
    await updateSettings({ currency });
  };

  return {
    settings,
    loading,
    updateSettings,
    addSource,
    removeSource,
    updateSource,
    setCurrency,
    currency: settings.currency || "PHP",
  };
}
