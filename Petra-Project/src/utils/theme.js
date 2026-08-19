const THEME_KEY = "petra-theme";

export function getStoredTheme() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(THEME_KEY);
  return value === "dark" || value === "light" || value === "system" ? value : null;
}

export function getInitialTheme() {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window === "undefined") return "system";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme = "system") {
  if (typeof document === "undefined") return;

  const resolvedTheme = theme === "system"
    ? (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.classList.toggle("light", resolvedTheme !== "dark");
  root.setAttribute("data-theme", resolvedTheme);

  document.body.classList.toggle("dark", resolvedTheme === "dark");
  document.body.classList.toggle("light", resolvedTheme !== "dark");
  document.body.setAttribute("data-theme", resolvedTheme);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_KEY, theme);
  }
}

