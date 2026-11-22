(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var floatQuietZones = Array.prototype.slice.call(document.querySelectorAll(".hero, .specials, .menuband, .gallery, .contact"));
  var waFloat = document.querySelector(".wa-float");
  var visibleQuietZones = [];
  if (floatQuietZones.length && waFloat && "IntersectionObserver" in window) {
    var floatObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var position = visibleQuietZones.indexOf(entry.target);
        if (entry.isIntersecting && position === -1) visibleQuietZones.push(entry.target);
        if (!entry.isIntersecting && position !== -1) visibleQuietZones.splice(position, 1);
      });
      waFloat.classList.toggle("is-hidden-over-section", visibleQuietZones.length > 0);
    }, { threshold: 0.08, rootMargin: "-5% 0px -5% 0px" });
    floatQuietZones.forEach(function (section) { floatObserver.observe(section); });
  }

  var nav = document.querySelector(".nav");
  var navAnchorLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__links .nav__link[href^='#']"));
  var trackedSections = Array.prototype.slice.call(document.querySelectorAll("#tarihce, #spesiyaller, #galeri, #iletisim"));
  function updateActiveNav() {
    var activeHref = "#top";
    var marker = window.innerHeight * 0.42;
    trackedSections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= marker) activeHref = "#" + section.id;
    });
    navAnchorLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === activeHref);
    });
  }
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
    updateActiveNav();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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

  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero__slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".hero__dot"));
  var slideCount = document.querySelector(".hero__slide-count b");
  var idx = 0, timer = null, DUR = 6000;
  function show(n) {
    idx = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
    dots.forEach(function (d, i) {
      d.classList.remove("is-active");
      if (i === idx) { void d.offsetWidth; d.classList.add("is-active"); }
    });
    if (slideCount) slideCount.textContent = String(idx + 1).padStart(2, "0");
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

  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    function revealVisible() {
      revealEls.forEach(function (el) {
        if (el.classList.contains("is-in")) return;
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "10000px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    window.addEventListener("scroll", revealVisible, { passive: true });
    requestAnimationFrame(revealVisible);
  }

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

  var y = document.getElementById("yr");
  if (y) y.textContent = new Date().getFullYear();

  function initScrollDots(gridSelector, hintSelector) {
    var grid = document.querySelector(gridSelector);
    var hint = document.querySelector(gridSelector + " + " + hintSelector);
    if (!grid || !hint) return;

    var items = Array.prototype.slice.call(grid.children);
    if (items.length < 2) return;

    var mq = window.matchMedia("(max-width: 619px)");

    function setup() {
      if (!mq.matches) { hint.innerHTML = ""; return; }

      hint.innerHTML = "";
      items.forEach(function (_, i) {
        var dot = document.createElement("span");
        dot.className = "scroll-hint__dot" + (i === 0 ? " is-active" : "");
        hint.appendChild(dot);
      });

      var dots = Array.prototype.slice.call(hint.querySelectorAll(".scroll-hint__dot"));

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

(function () {
  "use strict";
  var mc = navigator.modelContext;
  if (!mc || (typeof mc.registerTool !== "function" && typeof mc.provideContext !== "function")) return;

  var menuCache = null;
  function loadMenu() {
    if (menuCache) return menuCache;
    menuCache = fetch("/api/menu/", { headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("api");
        return res.json();
      })
      .catch(function () {
        return fetch("/menu/menu-data.json").then(function (res) { return res.json(); });
      })
      .catch(function (err) {
        menuCache = null;
        throw err;
      });
    return menuCache;
  }

  function norm(value) {
    return String(value || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
  }

  function text(data) {
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }

  var info = {
    name: "Yedigül Restaurant",
    type: "Seafood restaurant",
    address: "Anadolu Kavağı Mahallesi, Macar Tabya Cd. 6/A, 34825 Beykoz / İstanbul, Türkiye",
    geo: { latitude: 41.17343, longitude: 29.08846 },
    opening_hours: "Every day 11:00-00:00 (Europe/Istanbul)",
    phone: "+905369379280",
    reservations: "https://wa.me/905369379280",
    email: "info@yedigulrestorant.com",
    currency: "TRY",
    menu_languages: ["tr", "en", "ar", "ru"],
    links: {
      prices: "https://www.yedigulrestorant.com/fiyatlar/",
      prices_markdown: "https://www.yedigulrestorant.com/fiyatlar.md",
      menu: "https://www.yedigulrestorant.com/menu/",
      contact: "https://www.yedigulrestorant.com/iletisim/",
      llms: "https://www.yedigulrestorant.com/llms.txt"
    }
  };

  var tools = [
    {
      name: "search_menu",
      description: "Search Yedigül Restaurant's menu by dish, ingredient or category name (Turkish, English, Arabic or Russian). Returns matching items with price in Turkish lira (null means daily market price), portion and allergens.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Dish, ingredient or category, e.g. 'levrek', 'sea bass', 'rakı', 'dessert'." },
          max_results: { type: "integer", minimum: 1, maximum: 50, description: "Maximum number of items to return (default 10)." }
        },
        required: ["query"]
      },
      annotations: { readOnlyHint: true },
      execute: function (input) {
        var q = norm(input && input.query).trim();
        var limit = Math.min(Math.max(parseInt(input && input.max_results, 10) || 10, 1), 50);
        return loadMenu().then(function (menu) {
          var cats = {};
          (menu.categories || []).forEach(function (c) { cats[c.id] = c; });
          var hits = (menu.products || []).filter(function (p) {
            var cat = cats[p.cat] || {};
            var hay = [p.name && p.name.tr, p.name && p.name.en, p.name && p.name.ar, p.name && p.name.ru, cat.tr, cat.en]
              .concat((p.ing && p.ing.tr) || [], (p.ing && p.ing.en) || []);
            return !q || hay.some(function (v) { return norm(v).indexOf(q) !== -1; });
          }).slice(0, limit).map(function (p) {
            var cat = cats[p.cat] || {};
            return {
              name: p.name && p.name.tr,
              name_en: p.name && p.name.en,
              category: cat.tr,
              price_try: typeof p.price === "number" ? p.price : null,
              variants: (p.variants || []).map(function (v) { return { name: v.name && v.name.tr, price_try: v.price }; }),
              portion: p.portion || null,
              allergens: (p.alg && p.alg.en) || []
            };
          });
          return text({ query: input && input.query, count: hits.length, items: hits, full_price_list: info.links.prices_markdown });
        });
      }
    },
    {
      name: "get_restaurant_info",
      description: "Get Yedigül Restaurant's address, location, opening hours, phone, reservation link and key page links.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: function () {
        return Promise.resolve(text(info));
      }
    }
  ];

  try {
    if (typeof mc.registerTool === "function") {
      tools.forEach(function (tool) { mc.registerTool(tool); });
    } else {
      mc.provideContext({ tools: tools });
    }
  } catch (err) {
    return;
  }
})();
