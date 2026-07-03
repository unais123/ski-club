/* ==========================================================================
   Gulmarg Ski Club — main.js
   Shared behaviour: navbar, mobile menu, scroll reveals, split text,
   counters, FAQ accordion, magnetic buttons, cursor glow, parallax,
   scroll progress, forms. Vanilla ES6, no dependencies.
   ========================================================================== */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------- navbar */
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      navbar.classList.toggle("is-scrolled", y > 40);
      // Hide on fast downward scroll, reveal on any upward scroll
      if (y > 400 && y - lastY > 6) navbar.classList.add("is-hidden");
      else if (y < lastY - 2 || y < 200) navbar.classList.remove("is-hidden");
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* -------------------------------------------------------- mobile menu */
  const toggle = document.querySelector(".nav-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  if (toggle && mobileMenu) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      mobileMenu.classList.toggle("is-open", !open);
      document.body.style.overflow = open ? "" : "hidden";
    });
    // Close when a link is chosen
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        mobileMenu.classList.remove("is-open");
        document.body.style.overflow = "";
      })
    );
    // Sub-menu accordions
    mobileMenu.querySelectorAll(".sub-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sub = btn.nextElementSibling;
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        sub.style.maxHeight = open ? "0" : sub.scrollHeight + "px";
      });
    });
    // Escape closes the menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        mobileMenu.classList.remove("is-open");
        document.body.style.overflow = "";
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------ scroll reveals */
  const revealables = document.querySelectorAll("[data-reveal], [data-stagger], [data-split], .img-reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-visible"));
  }

  /* --------------------------------------------- split headings into words */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map((w, i) =>
        `<span class="split-word"><span style="transition-delay:${i * 0.06}s">${w}</span></span>`)
      .join(" ");
  });

  /* ----------------------------------------------------------- counters */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const dur = 1800;
      const start = performance.now();
      const fmt = (v) =>
        target >= 1000 ? Math.round(v).toLocaleString("en-IN") : (target % 1 ? v.toFixed(1) : Math.round(v));
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      reduceMotion ? (el.textContent = fmt(target)) : requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animate(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ------------------------------------------------------ FAQ accordion */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-item__q");
    const a = item.querySelector(".faq-item__a");
    if (!q || !a) return;
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      // close siblings for a tidy single-open accordion
      item.parentElement.querySelectorAll(".faq-item.is-open").forEach((o) => {
        o.classList.remove("is-open");
        o.querySelector(".faq-item__a").style.maxHeight = "0";
        o.querySelector(".faq-item__q").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        a.style.maxHeight = a.scrollHeight + "px";
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* --------------------------------------------------- magnetic buttons */
  if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 22;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
        const y = ((e.clientY - r.top) / r.height - 0.5) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });

    /* --------------------------------------------------- cursor glow */
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
    let gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function follow() {
      gx += (tx - gx) * 0.08;
      gy += (ty - gy) * 0.08;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(follow);
    })();
  }

  /* --------------------------------------------- page-hero bg parallax */
  const heroBg = document.querySelector(".page-hero__bg img");
  if (heroBg && !reduceMotion) {
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        heroBg.style.transform = `translateY(${y * 0.35}px) scale(1.06)`;
      }
    }, { passive: true });
  }

  /* ----------------------------------------------------- scroll progress */
  const progressBar = document.querySelector(".scroll-progress span");
  if (progressBar) {
    window.addEventListener("scroll", () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    }, { passive: true });
  }

  /* ----------------------------------------------- ambient page snowfall
     Lightweight fixed-position snow for pages that opt in via
     <body data-snow>. Fewer flakes than the hero version. */
  if (document.body.dataset.snow !== undefined && !reduceMotion) {
    const c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:900;";
    document.body.appendChild(c);
    const sctx = c.getContext("2d");
    let sw, sh;
    const size = () => { sw = c.width = innerWidth; sh = c.height = innerHeight; };
    size();
    addEventListener("resize", size);
    const flakes = Array.from({ length: innerWidth < 700 ? 25 : 55 }, () => ({
      x: Math.random() * 2000, y: Math.random() * 1200,
      r: 0.5 + Math.random() * 1.8, vy: 0.25 + Math.random() * 0.8,
      wob: Math.random() * Math.PI * 2, o: 0.15 + Math.random() * 0.35,
    }));
    (function tick() {
      sctx.clearRect(0, 0, sw, sh);
      sctx.fillStyle = "#aab4e8";
      for (const f of flakes) {
        f.wob += 0.008;
        f.x += Math.sin(f.wob) * 0.3;
        f.y += f.vy;
        if (f.y > sh + 4) { f.y = -4; f.x = Math.random() * sw; }
        sctx.globalAlpha = f.o;
        sctx.beginPath();
        sctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        sctx.fill();
      }
      sctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    })();
  }

  /* -------------------------------------------------------------- forms */
  document.querySelectorAll("form[data-demo]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = form.querySelector(".form__status");
      if (status) {
        status.textContent =
          "Thank you! Your enquiry has been received — our team will reach out within 24 hours.";
        status.setAttribute("role", "status");
      }
      form.reset();
    });
  });

  /* ------------------------------------------------------- footer year */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
