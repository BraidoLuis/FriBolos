"use client";

import {
  useTheme,
} from "../contexts/theme-context";

export function ThemeToggle() {
  const {
    theme,
    toggleTheme,
  } = useTheme();

  const darkMode =
    theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={
        darkMode
          ? "Ativar modo claro"
          : "Ativar modo escuro"
      }
      title={
        darkMode
          ? "Ativar modo claro"
          : "Ativar modo escuro"
      }
    >
      <span aria-hidden="true">
        {darkMode ? "☀" : "☾"}
      </span>
    </button>
  );
}