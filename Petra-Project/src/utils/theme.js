const THEME_KEY = "petra-theme";

export function getStoredTheme() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(THEME_KEY);
  return value === "dark" || value === "light" ? value : null;
}

export function getInitialTheme() {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;

  const isDark = theme === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);
  root.setAttribute("data-theme", theme);

  document.body.classList.toggle("dark", isDark);
  document.body.classList.toggle("light", !isDark);
  document.body.setAttribute("data-theme", theme);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_KEY, theme);
  }
}

