/**
 * Global Settings Context — single Firestore listener shared across all pages.
 * Fixes OT-8 (settings race condition with merge: true).
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { AppSettings, CurrencyOption } from "@/lib/types";

const DEFAULT_SETTINGS: AppSettings = {
  sources: ["Walk-in", "Marketplace", "Phone", "Facebook"],
};

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  currency: CurrencyOption;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  addSource: (source: string) => Promise<void>;
  removeSource: (source: string) => Promise<void>;
  updateSource: (oldSource: string, newSource: string) => Promise<void>;
  setCurrency: (currency: CurrencyOption) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
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

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snapshot.data() } as AppSettings);
        } else {
          // Initialize settings with merge to avoid race conditions (OT-8)
          setDoc(settingsRef, DEFAULT_SETTINGS, { merge: true });
          setSettings(DEFAULT_SETTINGS);
        }
        setLoading(false);
      },
      (error) => {
        console.error("[Settings] Firestore listener error:", error);
        toast.error("Failed to load settings. Please refresh.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!user) return;
    try {
      const settingsRef = doc(db, "users", user.uid, "settings", "config");
      await setDoc(settingsRef, { ...settings, ...updates }, { merge: true });
    } catch (err) {
      console.error("[Settings] Failed to update settings:", err);
      toast.error("Failed to save settings");
      throw err;
    }
  }, [user, settings]);

  const addSource = useCallback(async (source: string) => {
    const newSources = [...settings.sources, source];
    await updateSettings({ sources: newSources });
  }, [settings.sources, updateSettings]);

  const removeSource = useCallback(async (source: string) => {
    const newSources = settings.sources.filter((s) => s !== source);
    await updateSettings({ sources: newSources });
  }, [settings.sources, updateSettings]);

  const updateSource = useCallback(async (oldSource: string, newSource: string) => {
    const newSources = settings.sources.map((s) => (s === oldSource ? newSource : s));
    await updateSettings({ sources: newSources });
  }, [settings.sources, updateSettings]);

  const setCurrency = useCallback(async (currency: CurrencyOption) => {
    await updateSettings({ currency });
  }, [updateSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        currency: settings.currency || "PHP",
        updateSettings,
        addSource,
        removeSource,
        updateSource,
        setCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
