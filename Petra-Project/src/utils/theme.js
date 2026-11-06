const THEME_KEY = "nuvora-theme";
const THEME_EVENT = "petra-theme-change";

function isTheme(value) {
  return value === "light" || value === "dark";
}

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
  return getStoredTheme() || "light";
}

export function applyTheme(theme = getInitialTheme()) {
  if (typeof document === "undefined") return getInitialTheme();

  const nextTheme = isTheme(theme) ? theme : "light";
  const elements = [document.documentElement, document.body].filter(Boolean);

  elements.forEach((element) => {
    element.classList.toggle("dark", nextTheme === "dark");
    element.classList.toggle("light", nextTheme === "light");
    element.setAttribute("data-theme", nextTheme);
  });

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // Theme still applies for this session when storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: nextTheme }));
  }

  return nextTheme;
}

export { THEME_KEY, THEME_EVENT };
