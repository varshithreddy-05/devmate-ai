import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DetectedLanguage } from "@/lib/detectLanguage";

export interface HistoryItem {
  id: string;
  tool: "code-review" | "code-optimize" | "code-convert" | "concept-detector";
  language: DetectedLanguage;
  targetLanguage?: DetectedLanguage;
  codeSnippet: string; // first ~200 chars, for the history list preview
  createdAt: number;
  pinned: boolean;
  favorite: boolean;
}

interface AppState {
  currentCode: string;
  currentLanguage: DetectedLanguage;
  history: HistoryItem[];
  setCurrentCode: (code: string) => void;
  setCurrentLanguage: (lang: DetectedLanguage) => void;
  addHistoryItem: (item: HistoryItem) => void;
  togglePin: (id: string) => void;
  toggleFavorite: (id: string) => void;
  removeHistoryItem: (id: string) => void;
}

// Persisted to localStorage so history/pins survive a refresh even before
// the Postgres-backed history (see prisma/schema.prisma: Analysis) is wired
// up to a signed-in user.
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentCode: "",
      currentLanguage: "unknown",
      history: [],
      setCurrentCode: (code) => set({ currentCode: code }),
      setCurrentLanguage: (lang) => set({ currentLanguage: lang }),
      addHistoryItem: (item) =>
        set((state) => ({ history: [item, ...state.history].slice(0, 100) })),
      togglePin: (id) =>
        set((state) => ({
          history: state.history.map((h) => (h.id === id ? { ...h, pinned: !h.pinned } : h)),
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          history: state.history.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h)),
        })),
      removeHistoryItem: (id) =>
        set((state) => ({ history: state.history.filter((h) => h.id !== id) })),
    }),
    { name: "ai-code-suite-store" }
  )
);
