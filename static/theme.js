"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const select = document.querySelector("#themeSelect");
  const storageKey = "labplot-theme";

  if (!select) {
    return;
  }

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(mode) {
    const finalMode = mode === "system" ? getSystemTheme() : mode;
    root.setAttribute("data-theme", finalMode);
    root.setAttribute("data-theme-mode", mode);
    localStorage.setItem(storageKey, mode);

    document.querySelectorAll(".brand-logo").forEach((logo) => {
      const lightSrc = logo.getAttribute("data-light");
      const darkSrc = logo.getAttribute("data-dark");
      logo.src = finalMode === "dark" ? darkSrc : lightSrc;
    });

    select.value = mode;
  }

  const saved = localStorage.getItem(storageKey) || "dark";
  applyTheme(saved);

  select.addEventListener("change", () => applyTheme(select.value));
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const currentMode = localStorage.getItem(storageKey) || "system";
    if (currentMode === "system") {
      applyTheme("system");
    }
  });
});
