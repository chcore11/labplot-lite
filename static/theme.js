"use strict";

(() => {
  const root = document.documentElement;
  const storageKey = "labplot-theme";
  const validModes = new Set(["dark"]);
  const onApplyCallbacks = new Set();

  function normalizeMode(mode) {
    return validModes.has(mode) ? mode : "dark";
  }

  function getSavedMode() {
    try {
      return normalizeMode(localStorage.getItem(storageKey));
    } catch (error) {
      return "dark";
    }
  }

  function saveMode(mode) {
    try {
      localStorage.setItem(storageKey, mode);
    } catch (error) {
      // Storage can be unavailable in some privacy modes. The in-page theme still works.
    }
  }

  function resolveTheme() {
    return "dark";
  }

  function writeTheme(mode) {
    const nextMode = normalizeMode(mode);
    const finalMode = resolveTheme();
    root.setAttribute("data-theme", finalMode);
    root.setAttribute("data-theme-mode", nextMode);
    root.style.colorScheme = finalMode;
    return finalMode;
  }

  function syncControls(finalMode) {
    document.querySelectorAll(".brand-logo").forEach((logo) => {
      const lightSrc = logo.getAttribute("data-light");
      const darkSrc = logo.getAttribute("data-dark");
      if (lightSrc && darkSrc) {
        logo.src = finalMode === "dark" ? darkSrc : lightSrc;
      }
    });
  }

  function notifyThemeApplied(mode, finalMode) {
    onApplyCallbacks.forEach((callback) => {
      callback({ mode, finalMode });
    });
  }

  function applyTheme(mode, options = {}) {
    const nextMode = normalizeMode(mode);
    const finalMode = writeTheme(nextMode);

    if (options.persist !== false) {
      saveMode(nextMode);
    }

    if (document.readyState !== "loading") {
      syncControls(finalMode);
    }

    if (options.notify !== false) {
      notifyThemeApplied(nextMode, finalMode);
    }

    return { mode: nextMode, finalMode };
  }

  function initTheme(options = {}) {
    if (typeof options.onApply === "function") {
      onApplyCallbacks.add(options.onApply);
    }

    const currentMode = getSavedMode();
    const finalMode = writeTheme(currentMode);
    syncControls(finalMode);

    return { mode: currentMode, finalMode };
  }

  writeTheme(getSavedMode());

  window.LabPlotTheme = {
    apply: applyTheme,
    init: initTheme,
    getCurrent() {
      const mode = normalizeMode(root.getAttribute("data-theme-mode"));
      return { mode, finalMode: resolveTheme() };
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initTheme());
  } else {
    initTheme();
  }
})();
