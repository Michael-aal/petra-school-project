const THEME_KEY = "petra-theme";

export function getStoredTheme() {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "light";
}

export function getInitialTheme() {
  return "light";
}

export function applyTheme() {
  if (typeof document === "undefined") return;

  const resolvedTheme = "light";
  const root = document.documentElement;
  root.classList.remove("dark");
  root.classList.add("light");
  root.setAttribute("data-theme", resolvedTheme);

  document.body.classList.remove("dark");
  document.body.classList.add("light");
  document.body.setAttribute("data-theme", resolvedTheme);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_KEY, "light");
  }
}

