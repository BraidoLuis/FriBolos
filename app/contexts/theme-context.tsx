"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY =
  "fribolos-theme";

const THEME_CHANGE_EVENT =
  "fribolos-theme-change";

const ThemeContext =
  createContext<ThemeContextValue | null>(
    null
  );

function getSavedTheme(): Theme | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const savedTheme =
    localStorage.getItem(
      THEME_STORAGE_KEY
    );

  if (
    savedTheme === "light" ||
    savedTheme === "dark"
  ) {
    return savedTheme;
  }

  return null;
}

function getBrowserTheme(): Theme {
  if (
    typeof window === "undefined"
  ) {
    return "light";
  }

  const savedTheme =
    getSavedTheme();

  if (savedTheme) {
    return savedTheme;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
}

function getServerTheme(): Theme {
  return "light";
}

function subscribeToTheme(
  callback: () => void
) {
  if (
    typeof window === "undefined"
  ) {
    return () => {};
  }

  const colorScheme =
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

  function handleStorage(
    event: StorageEvent
  ) {
    if (
      event.key ===
        THEME_STORAGE_KEY ||
      event.key === null
    ) {
      callback();
    }
  }

  function handleThemeChange() {
    callback();
  }

  function handleSystemThemeChange() {
    /*
     * O tema do sistema só deve alterar
     * o FriBolos se o usuário ainda não
     * tiver escolhido uma preferência.
     */
    if (!getSavedTheme()) {
      callback();
    }
  }

  window.addEventListener(
    "storage",
    handleStorage
  );

  window.addEventListener(
    THEME_CHANGE_EVENT,
    handleThemeChange
  );

  colorScheme.addEventListener(
    "change",
    handleSystemThemeChange
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage
    );

    window.removeEventListener(
      THEME_CHANGE_EVENT,
      handleThemeChange
    );

    colorScheme.removeEventListener(
      "change",
      handleSystemThemeChange
    );
  };
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme =
    useSyncExternalStore(
      subscribeToTheme,
      getBrowserTheme,
      getServerTheme
    );

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme;
  }, [theme]);

  function toggleTheme() {
    const nextTheme =
      theme === "light"
        ? "dark"
        : "light";

    localStorage.setItem(
      THEME_STORAGE_KEY,
      nextTheme
    );

    document.documentElement.dataset.theme =
      nextTheme;

    window.dispatchEvent(
      new Event(
        THEME_CHANGE_EVENT
      )
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme precisa ser utilizado dentro de ThemeProvider."
    );
  }

  return context;
}