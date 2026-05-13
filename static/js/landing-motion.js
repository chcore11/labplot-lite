"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const heroProduct = document.querySelector(".hero-product");
  const trackPreview = heroProduct
    && !reduceMotion
    && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

  if (trackPreview) {
    heroProduct.addEventListener("pointermove", (event) => {
      const bounds = heroProduct.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 6;

      heroProduct.style.setProperty("--preview-x", `${x.toFixed(1)}px`);
      heroProduct.style.setProperty("--preview-y", `${y.toFixed(1)}px`);
      heroProduct.classList.add("is-tracking");
    });

    heroProduct.addEventListener("pointerleave", () => {
      heroProduct.style.removeProperty("--preview-x");
      heroProduct.style.removeProperty("--preview-y");
      heroProduct.classList.remove("is-tracking");
    });
  }

  if (!revealTargets.length) {
    return;
  }

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
