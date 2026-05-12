"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!revealTargets.length) {
    return;
  }

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  document.documentElement.classList.add("motion-ready");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px 20% 0px",
    threshold: 0.05,
  });

  revealTargets.forEach((target) => observer.observe(target));
});
