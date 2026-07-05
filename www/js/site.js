/* Yedigül Restaurant — homepage interactions. Vanilla JS, no deps. */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Sticky nav scroll state ---- */
  var nav = document.querySelector(".nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile nav panel ---- */
  var toggle = document.querySelector(".nav__toggle");
  var panelLinks = document.querySelectorAll(".nav__panel a");
  function closeNav() { document.body.classList.remove("nav-open"); if (toggle) toggle.setAttribute("aria-expanded", "false"); }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  panelLinks.forEach(function (a) { a.addEventListener("click", closeNav); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  /* ---- Hero slider ---- */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero__slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".hero__dot"));
  var idx = 0, timer = null, DUR = 6000;
  function show(n) {
    idx = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
    dots.forEach(function (d, i) {
      d.classList.remove("is-active");
      if (i === idx) { void d.offsetWidth; d.classList.add("is-active"); }
    });
  }
  function next() { show(idx + 1); }
  function start() { if (reduceMotion || slides.length < 2) return; stop(); timer = setInterval(next, DUR); }
  function stop() { if (timer) clearInterval(timer); }
  if (slides.length) {
    show(0);
    start();
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { show(i); start(); });
    });
  }

  /* ---- Scroll reveals ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "10000px 0px -8% 0px" });
    // rootMargin üst değeri büyük: çapa ile aşağı atlanınca viewport'un
    // ÜSTÜNDE kalan bölümler de "görüldü" sayılır, gizli kalmazlar
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Gallery lightbox ---- */
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var cells = Array.prototype.slice.call(document.querySelectorAll(".gcell"));
    var current = 0;
    function open(i) {
      current = (i + cells.length) % cells.length;
      var full = cells[current].getAttribute("data-full");
      var alt = cells[current].getAttribute("data-alt") || "";
      lbImg.setAttribute("src", full);
      lbImg.setAttribute("alt", alt);
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    cells.forEach(function (c, i) {
      c.addEventListener("click", function () { open(i); });
      c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } });
    });
    lb.querySelector(".lightbox__close").addEventListener("click", close);
    lb.querySelector(".lightbox__nav--prev").addEventListener("click", function () { open(current - 1); });
    lb.querySelector(".lightbox__nav--next").addEventListener("click", function () { open(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") open(current - 1);
      if (e.key === "ArrowRight") open(current + 1);
    });
  }

  /* ---- Footer year ---- */
  var y = document.getElementById("yr");
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Mobile scroll indicator dots ---- */
  function initScrollDots(gridSelector, hintSelector) {
    var grid = document.querySelector(gridSelector);
    var hint = document.querySelector(gridSelector + " + " + hintSelector);
    if (!grid || !hint) return;

    var items = Array.prototype.slice.call(grid.children);
    if (items.length < 2) return;

    // Only activate on mobile
    var mq = window.matchMedia("(max-width: 619px)");

    function setup() {
      if (!mq.matches) { hint.innerHTML = ""; return; }

      // Create dots
      hint.innerHTML = "";
      items.forEach(function (_, i) {
        var dot = document.createElement("span");
        dot.className = "scroll-hint__dot" + (i === 0 ? " is-active" : "");
        hint.appendChild(dot);
      });

      var dots = Array.prototype.slice.call(hint.querySelectorAll(".scroll-hint__dot"));

      // Track which item is most visible
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var idx = items.indexOf(entry.target);
            dots.forEach(function (d, di) { d.classList.toggle("is-active", di === idx); });
          }
        });
      }, { root: grid, threshold: 0.6 });

      items.forEach(function (item) { observer.observe(item); });
    }

    setup();
    mq.addEventListener("change", setup);
  }

  initScrollDots(".specials__grid", ".scroll-hint");
  initScrollDots(".gallery__grid", ".scroll-hint");
})();
