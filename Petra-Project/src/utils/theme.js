export const THEME_KEY = "nuvora-theme";
export const THEME_CHANGE_EVENT = "petra-theme-change";

const isTheme = (value) => value === "dark" || value === "light";

export function getStoredTheme() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function getInitialTheme() {
  if (typeof document !== "undefined") {
    const current = document.documentElement?.getAttribute("data-theme");
    if (isTheme(current)) return current;
  }
  return getStoredTheme() || "light";
}

export function applyTheme(theme = getInitialTheme(), options = {}) {
  if (typeof document === "undefined") return "light";
  const nextTheme = isTheme(theme) ? theme : "light";
  const { persist = true, broadcast = false } = options;
  [document.documentElement, document.body].filter(Boolean).forEach((root) => {
    root.setAttribute("data-theme", nextTheme);
    root.classList.toggle("dark", nextTheme === "dark");
    root.classList.toggle("light", nextTheme === "light");
  });
  document.documentElement.style.colorScheme = nextTheme;
  if (persist && typeof window !== "undefined") {
    try { window.localStorage.setItem(THEME_KEY, nextTheme); } catch {}
  }
  if (broadcast && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: nextTheme }));
  }
  return nextTheme;
}
