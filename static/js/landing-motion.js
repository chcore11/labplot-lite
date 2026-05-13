"use strict";

function initHeroShowcase(reduceMotion) {
  const carousel = document.querySelector("[data-hero-carousel]");
  if (!carousel) {
    return;
  }

  const track = carousel.querySelector("[data-hero-track]");
  const cards = Array.from(carousel.querySelectorAll("[data-hero-card]"));
  const prevControl = carousel.querySelector("[data-hero-prev]");
  const nextControl = carousel.querySelector("[data-hero-next]");
  const mobileQuery = window.matchMedia?.("(max-width: 900px)");
  const positionClasses = [
    "hero-showcase-card-main",
    "hero-showcase-card-side",
    "hero-showcase-card-left",
    "hero-showcase-card-left-far",
    "hero-showcase-card-right",
  ];

  if (!track || cards.length < 2) {
    return;
  }

  let activeIndex = cards.findIndex((card) => card.dataset.heroActive === "true");
  if (activeIndex < 0) {
    activeIndex = 0;
  }

  function scrollActiveCard() {
    if (!mobileQuery?.matches || track.scrollWidth <= track.clientWidth) {
      return;
    }

    cards[activeIndex].scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }

  function setActiveCard(nextIndex, shouldScroll = false) {
    activeIndex = (nextIndex + cards.length) % cards.length;

    cards.forEach((card, index) => {
      const offset = (index - activeIndex + cards.length) % cards.length;
      const isActive = offset === 0;
      const isPrevious = offset === cards.length - 1;
      const isFarPrevious = offset === cards.length - 2;

      card.classList.remove(...positionClasses);
      card.removeAttribute("data-hero-active");
      card.removeAttribute("aria-current");

      if (isActive) {
        card.classList.add("hero-showcase-card-main");
        card.dataset.heroActive = "true";
        card.setAttribute("aria-current", "true");
      } else if (isPrevious) {
        card.classList.add("hero-showcase-card-side", "hero-showcase-card-left");
      } else if (isFarPrevious) {
        card.classList.add("hero-showcase-card-side", "hero-showcase-card-left-far");
      } else {
        card.classList.add("hero-showcase-card-side", "hero-showcase-card-right");
      }
    });

    if (shouldScroll) {
      scrollActiveCard();
    }
  }

  cards.forEach((card, index) => {
    card.addEventListener("click", (event) => {
      if (index === activeIndex) {
        return;
      }

      event.preventDefault();
      setActiveCard(index, true);
    });
  });

  prevControl?.addEventListener("click", () => setActiveCard(activeIndex - 1, true));
  nextControl?.addEventListener("click", () => setActiveCard(activeIndex + 1, true));

  carousel.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    setActiveCard(activeIndex + (event.key === "ArrowRight" ? 1 : -1), true);
  });

  setActiveCard(activeIndex);
}

document.addEventListener("DOMContentLoaded", () => {
  const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  initHeroShowcase(reduceMotion);

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
