import { Monitor, Leaf } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <button
      onClick={toggleMode}
      className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all"
      style={{
        background: mode === "tech" ? "#27272a" : "var(--bg-warm)",
        color: mode === "tech" ? "#a1a1aa" : "var(--text-medium)",
        border: `1px solid ${mode === "tech" ? "#3f3f46" : "var(--border-light)"}`,
      }}
      title={mode === "tech" ? "Switch to Minimal mode" : "Switch to Tech mode"}
    >
      {mode === "tech" ? (
        <>
          <Monitor className="w-4 h-4" />
          <span>Tech</span>
        </>
      ) : (
        <>
          <Leaf className="w-4 h-4" />
          <span>Minimal</span>
        </>
      )}
    </button>
  );
}
