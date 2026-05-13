"use strict";

function initHeroShowcase() {
  const carousel = document.querySelector("[data-hero-carousel]");
  if (!carousel) {
    return;
  }

  const cards = Array.from(carousel.querySelectorAll("[data-hero-card]"));
  const prevControl = carousel.querySelector("[data-hero-prev]");
  const nextControl = carousel.querySelector("[data-hero-next]");
  const positionClasses = [
    "hero-showcase-card-main",
    "hero-showcase-card-side",
    "hero-showcase-card-left",
    "hero-showcase-card-left-far",
    "hero-showcase-card-right",
  ];

  if (cards.length < 2) {
    return;
  }

  cards.forEach((card) => {
    card.dataset.heroHref = card.getAttribute("href") || "";
  });

  let activeIndex = cards.findIndex((card) => card.dataset.heroActive === "true");
  if (activeIndex < 0) {
    activeIndex = 0;
  }

  function setActiveCard(nextIndex) {
    activeIndex = (nextIndex + cards.length) % cards.length;

    cards.forEach((card, index) => {
      const offset = (index - activeIndex + cards.length) % cards.length;
      const isActive = offset === 0;
      const isPrevious = offset === cards.length - 1;
      const isFarPrevious = offset === cards.length - 2;

      card.classList.remove(...positionClasses);
      card.removeAttribute("data-hero-active");
      card.removeAttribute("aria-current");
      card.removeAttribute("href");
      card.setAttribute("aria-hidden", "true");
      card.setAttribute("tabindex", "-1");

      if (isActive) {
        card.classList.add("hero-showcase-card-main");
        card.dataset.heroActive = "true";
        card.setAttribute("aria-current", "true");
        if (card.dataset.heroHref) {
          card.setAttribute("href", card.dataset.heroHref);
        }
        card.removeAttribute("aria-hidden");
        card.removeAttribute("tabindex");
      } else if (isPrevious) {
        card.classList.add("hero-showcase-card-side", "hero-showcase-card-left");
      } else if (isFarPrevious) {
        card.classList.add("hero-showcase-card-side", "hero-showcase-card-left-far");
      } else {
        card.classList.add("hero-showcase-card-side", "hero-showcase-card-right");
      }
    });
  }

  prevControl?.addEventListener("click", () => setActiveCard(activeIndex - 1));
  nextControl?.addEventListener("click", () => setActiveCard(activeIndex + 1));

  carousel.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    setActiveCard(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  });

  setActiveCard(activeIndex);
}

document.addEventListener("DOMContentLoaded", () => {
  const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  initHeroShowcase();

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
