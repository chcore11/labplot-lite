"use strict";

(function initLandingHero() {
  const hero = document.querySelector("[data-lab-hero]");
  if (!hero) {
    return;
  }

  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    return;
  }

  function setSpot(clientX, clientY) {
    const rect = hero.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    hero.style.setProperty("--spot-x", `${Math.max(8, Math.min(92, x)).toFixed(2)}%`);
    hero.style.setProperty("--spot-y", `${Math.max(18, Math.min(78, y)).toFixed(2)}%`);
  }

  hero.addEventListener("pointermove", (event) => {
    hero.classList.add("is-pointer-active");
    setSpot(event.clientX, event.clientY);
  }, { passive: true });

  hero.addEventListener("pointerleave", () => {
    hero.classList.remove("is-pointer-active");
    hero.style.setProperty("--spot-x", "56%");
    hero.style.setProperty("--spot-y", "43%");
  });
}());
