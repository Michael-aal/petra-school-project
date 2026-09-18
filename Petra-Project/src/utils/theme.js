const THEME_KEY="nuvora-theme";
export function getStoredTheme(){if(typeof window==="undefined")return null;return window.localStorage.getItem(THEME_KEY)==="light"?"light":null}
export function getInitialTheme(){return getStoredTheme()||"light"}
export function applyTheme(){if(typeof document==="undefined")return;const r=document.documentElement;r.classList.remove("dark");r.classList.add("light");r.setAttribute("data-theme","light");document.body.classList.remove("dark");document.body.classList.add("light");document.body.setAttribute("data-theme","light");if(typeof window!=="undefined")window.localStorage.setItem(THEME_KEY,"light")}
