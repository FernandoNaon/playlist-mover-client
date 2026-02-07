import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ThemeMode = "tech" | "minimal";

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme-mode");
    return (saved as ThemeMode) || "minimal";
  });

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);

    // Update CSS variables based on mode
    const root = document.documentElement;

    if (mode === "tech") {
      // Tech mode - dark theme
      root.style.setProperty("--bg-cream", "#0a0a0a");
      root.style.setProperty("--bg-warm", "#111111");
      root.style.setProperty("--bg-accent", "#1a1a1a");
      root.style.setProperty("--green-primary", "#22c55e");
      root.style.setProperty("--green-light", "#4ade80");
      root.style.setProperty("--green-pale", "#22c55e20");
      root.style.setProperty("--green-bright", "#86efac");
      root.style.setProperty("--coral", "#f87171");
      root.style.setProperty("--coral-light", "#fca5a5");
      root.style.setProperty("--peach", "#f8717120");
      root.style.setProperty("--blue-soft", "#06b6d420");
      root.style.setProperty("--blue-accent", "#06b6d4");
      root.style.setProperty("--text-dark", "#ffffff");
      root.style.setProperty("--text-medium", "#a1a1aa");
      root.style.setProperty("--text-light", "#71717a");
      root.style.setProperty("--border-light", "#27272a");
      root.classList.add("theme-tech");
      root.classList.remove("theme-minimal");
    } else {
      // Minimal mode - warm light theme
      root.style.setProperty("--bg-cream", "#FDF9F3");
      root.style.setProperty("--bg-warm", "#F5EDE4");
      root.style.setProperty("--bg-accent", "#E8F5E9");
      root.style.setProperty("--green-primary", "#4A7C59");
      root.style.setProperty("--green-light", "#7CB587");
      root.style.setProperty("--green-pale", "#C8E6C9");
      root.style.setProperty("--green-bright", "#A8D5BA");
      root.style.setProperty("--coral", "#E8846B");
      root.style.setProperty("--coral-light", "#F5B7A5");
      root.style.setProperty("--peach", "#FFE4D6");
      root.style.setProperty("--blue-soft", "#B8D4E3");
      root.style.setProperty("--blue-accent", "#6BA3BE");
      root.style.setProperty("--text-dark", "#2D3A2D");
      root.style.setProperty("--text-medium", "#5A6B5A");
      root.style.setProperty("--text-light", "#8A9B8A");
      root.style.setProperty("--border-light", "#E5DDD4");
      root.classList.add("theme-minimal");
      root.classList.remove("theme-tech");
    }
  }, [mode]);

  const toggleMode = () => {
    setModeState((prev) => (prev === "tech" ? "minimal" : "tech"));
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
