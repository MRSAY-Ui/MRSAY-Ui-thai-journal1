// Theme helpers — persisted preference, applied on <html data-theme="...">.

const KEY = "notely.theme";

export function getTheme() {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "dark" || t === "light") return t;
  } catch (e) {
    /* ignore */
  }
  return "light";
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0d1420" : "#f6f8fb");
  }
  try {
    localStorage.setItem(KEY, theme);
  } catch (e) {
    /* ignore */
  }
}
