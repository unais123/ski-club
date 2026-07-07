/* ==========================================================================
   Gulmarg Ski Club — booking.js
   Reusable, framework-free booking widget.

   USAGE
   -----
   1. In <head>:   <link rel="stylesheet" href="booking/booking.css">
   2. Optional (email): load the EmailJS SDK before this file:
        <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
   3. Anywhere in <body>:
        <div id="booking-container" data-expedition="Skiing"></div>
   4. Before </body>:  <script src="booking/booking.js" defer></script>

   The widget renders itself into #booking-container and preselects the
   expedition from the container's data-expedition attribute (or, failing
   that, from the page filename). See CONFIG below for contact settings.
   ========================================================================== */

(() => {
  "use strict";

  /* ============================ CONFIGURATION ============================ */
  const CONFIG = {
    whatsappNumber: "917006575092",              // international format, no +
    businessEmail: "gulmargskiclub@gmail.com",
    emailService: {                               // EmailJS — see booking/README.md
      serviceId: "YOUR_EMAILJS_SERVICE_ID",
      templateId: "YOUR_EMAILJS_TEMPLATE_ID",
      publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
    },
    googleSheetWebhook: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL", // see README.md
  };

  const EXPEDITIONS = [
    "Skiing", "Snowboarding", "Private Instructor",
    "Kashmir Great Lakes Trek", "Tarsar Marsar Trek",
    "Mount Apharwat Summit", "Sunset Peak Expedition",
    "Tour Package", "Custom",
  ];

  // Expeditions that require a skill level (Basic / Intermediate / Advanced)
  const LEVEL_EXPEDITIONS = ["Skiing", "Snowboarding", "Private Instructor"];

  // Common country dial codes (default +91)
  const DIAL_CODES = [
    ["+91", "🇮🇳"], ["+971", "🇦🇪"], ["+44", "🇬🇧"], ["+1", "🇺🇸"],
    ["+61", "🇦🇺"], ["+65", "🇸🇬"], ["+49", "🇩🇪"], ["+33", "🇫🇷"],
    ["+7", "🇷🇺"], ["+81", "🇯🇵"], ["+86", "🇨🇳"], ["+966", "🇸🇦"],
    ["+974", "🇶🇦"], ["+60", "🇲🇾"], ["+94", "🇱🇰"], ["+977", "🇳🇵"],
  ];

  const MONTHS = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  /* -------------------------- expedition detection --------------------- */
  function detectExpedition(container) {
    const explicit = container.getAttribute("data-expedition");
    if (explicit && EXPEDITIONS.includes(explicit)) return explicit;
    const file = (location.pathname.split("/").pop() || "").toLowerCase();
    const map = {
      "skiing": "Skiing",
      "snowboarding": "Snowboarding",
      "trek-great-lakes": "Kashmir Great Lakes Trek",
      "trek-tarsar-marsar": "Tarsar Marsar Trek",
      "trek-apharwat": "Mount Apharwat Summit",
      "trek-sunset-peak": "Sunset Peak Expedition",
      "tour-packages": "Tour Package",
      "luxury-tours": "Tour Package",
      "ladakh": "Tour Package",
    };
    for (const key in map) if (file.includes(key)) return map[key];
    if (file.startsWith("offbeat")) return "Tour Package";
    if (file.startsWith("treks")) return "Kashmir Great Lakes Trek";
    return "";
  }

  /* ------------------------------ markup ------------------------------- */
  function optionList(selected) {
    return EXPEDITIONS.map(e =>
      `<option value="${e}"${e === selected ? " selected" : ""}>${e}</option>`).join("");
  }
  function dialOptions() {
    return DIAL_CODES.map(([code, flag], i) =>
      `<option value="${code}"${i === 0 ? " selected" : ""}>${flag} ${code}</option>`).join("");
  }

  function template(preselect) {
    return `
    <form class="gsc-card" novalidate aria-label="Booking enquiry">
      <div class="gsc-head">
        <span class="gsc-eyebrow">Reserve Your Adventure</span>
        <h3 class="gsc-title">Book with Gulmarg Ski Club</h3>
        <p class="gsc-sub">Tell us your plans — we'll confirm availability on WhatsApp within 24 hours.</p>
      </div>

      <div class="gsc-grid">
        <div class="gsc-field gsc-col-2">
          <input type="text" id="gsc-name" name="name" autocomplete="name" placeholder=" " required>
          <label for="gsc-name">Full Name <span class="gsc-req">*</span></label>
          <p class="gsc-error">Please enter your full name.</p>
        </div>

        <div class="gsc-field">
          <div class="gsc-phone">
            <div class="gsc-select-wrap">
              <select id="gsc-dial" name="dial" aria-label="Country code">${dialOptions()}</select>
            </div>
            <div style="position:relative">
              <input type="tel" id="gsc-phone" name="phone" inputmode="tel" autocomplete="tel" placeholder=" " required>
              <label for="gsc-phone">Phone <span class="gsc-req">*</span></label>
            </div>
          </div>
          <p class="gsc-error">Enter a valid phone number (7–15 digits).</p>
        </div>

        <div class="gsc-field">
          <input type="email" id="gsc-email" name="email" autocomplete="email" placeholder=" " required>
          <label for="gsc-email">Email Address <span class="gsc-req">*</span></label>
          <p class="gsc-error">Enter a valid email address.</p>
        </div>

        <div class="gsc-field gsc-col-2 gsc-select-wrap">
          <select id="gsc-expedition" name="expedition" required>${optionList(preselect)}</select>
          <label for="gsc-expedition" class="${preselect ? "gsc-lifted" : ""}">Expedition <span class="gsc-req">*</span></label>
          <p class="gsc-error">Please choose an expedition.</p>
        </div>

        <div class="gsc-field gsc-col-2 gsc-select-wrap gsc-level" id="gsc-level-field" hidden>
          <select id="gsc-level" name="level">
            <option value="">Choose your level…</option>
            <option value="Basic">Basic — first time on snow</option>
            <option value="Intermediate">Intermediate — linking turns</option>
            <option value="Advanced">Advanced — confident / off-piste</option>
          </select>
          <label for="gsc-level">Skill Level <span class="gsc-req">*</span></label>
          <p class="gsc-error">Please select your skill level.</p>
        </div>

        <div class="gsc-field gsc-col-2">
          <div class="gsc-date-toggle" role="tablist" aria-label="Date selection mode">
            <button type="button" data-mode="range" class="is-active" role="tab">Date range</button>
            <button type="button" data-mode="single" role="tab">Single day</button>
          </div>
          <div class="gsc-date-display" style="position:relative">
            <input type="text" id="gsc-dates" name="dates" placeholder=" " readonly aria-haspopup="dialog">
            <label for="gsc-dates">Travel Dates <span class="gsc-req">*</span></label>
          </div>
          <input type="hidden" id="gsc-start" name="start">
          <input type="hidden" id="gsc-end" name="end">
          <div class="gsc-cal" role="dialog" aria-label="Choose dates" hidden></div>
          <p class="gsc-error">Please choose your travel date(s).</p>
        </div>

        <div class="gsc-field">
          <div class="gsc-stepper" role="group" aria-label="Number of persons">
            <span class="gsc-stepper__label">Persons</span>
            <span class="gsc-stepper__ctrl">
              <button type="button" class="gsc-step-btn" data-step="-1" aria-label="Decrease persons">−</button>
              <span class="gsc-step-val" id="gsc-persons" aria-live="polite">1</span>
              <button type="button" class="gsc-step-btn" data-step="1" aria-label="Increase persons">+</button>
            </span>
          </div>
        </div>

        <div class="gsc-field">
          <input type="text" id="gsc-from" name="from" autocomplete="address-level2" placeholder=" " required>
          <label for="gsc-from">Where are you from? <span class="gsc-req">*</span></label>
          <p class="gsc-error">Tell us your city (e.g. Mumbai, Dubai).</p>
        </div>

        <div class="gsc-field gsc-col-2">
          <textarea id="gsc-message" name="message" placeholder=" "></textarea>
          <label for="gsc-message">Additional Message</label>
          <p class="gsc-error"></p>
        </div>
      </div>

      <button type="submit" class="gsc-submit">
        <span class="gsc-submit__txt">Book Now →</span>
        <span class="gsc-spinner" aria-hidden="true"></span>
      </button>
      <p class="gsc-consent">By booking you agree to be contacted about your enquiry. No spam, ever.</p>

      <div class="gsc-toast gsc-toast--warn" role="status"></div>
      <div class="gsc-summary" aria-live="polite"></div>
    </form>

    <div class="gsc-modal" role="dialog" aria-modal="true" aria-labelledby="gsc-modal-title" hidden>
      <div class="gsc-modal__card">
        <div class="gsc-check" aria-hidden="true">✓</div>
        <h3 id="gsc-modal-title">Thank you!</h3>
        <p>Your booking request has been received. We'll contact you shortly on WhatsApp.</p>
        <div class="gsc-modal__actions">
          <button type="button" class="gsc-btn gsc-btn--ghost" data-action="close">Close</button>
          <button type="button" class="gsc-btn gsc-btn--primary" data-action="again">Book Another</button>
        </div>
      </div>
    </div>`;
  }

  /* --------------------------- calendar module ------------------------- */
  function Calendar(root, onChange) {
    const el = root.querySelector(".gsc-cal");
    let mode = "range";           // 'range' | 'single'
    let start = null, end = null;
    let view = startOfMonth(new Date());

    function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
    function today0() { const t = new Date(); t.setHours(0,0,0,0); return t; }
    function same(a, b) { return a && b && a.toDateString() === b.toDateString(); }
    function fmt(d) { return d ? `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}` : ""; }

    function render() {
      const y = view.getFullYear(), m = view.getMonth();
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      const min = today0();
      let cells = DOW.map(d => `<span class="gsc-cal__dow">${d}</span>`).join("");
      for (let i = 0; i < first; i++) cells += `<button type="button" class="gsc-cal__day is-empty" tabindex="-1"></button>`;
      for (let d = 1; d <= days; d++) {
        const date = new Date(y, m, d);
        const past = date < min;
        let cls = "gsc-cal__day";
        if (same(date, start)) cls += " is-start";
        else if (same(date, end)) cls += " is-end";
        else if (start && end && date > start && date < end) cls += " is-range";
        cells += `<button type="button" class="${cls}" data-d="${d}"${past ? " disabled" : ""}>${d}</button>`;
      }
      el.innerHTML = `
        <div class="gsc-cal__head">
          <button type="button" class="gsc-cal__nav" data-nav="-1" aria-label="Previous month">‹</button>
          <strong>${MONTHS[m]} ${y}</strong>
          <button type="button" class="gsc-cal__nav" data-nav="1" aria-label="Next month">›</button>
        </div>
        <div class="gsc-cal__grid">${cells}</div>
        <div class="gsc-cal__foot">
          <span class="gsc-cal__hint">${mode === "range" ? "Pick a start and end date" : "Pick a day"}</span>
          <button type="button" class="gsc-cal__apply">Apply</button>
        </div>`;
    }

    function pick(d) {
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      if (mode === "single") { start = date; end = date; }
      else {
        if (!start || (start && end)) { start = date; end = null; }
        else if (date < start) { end = start; start = date; }
        else { end = date; }
      }
      render();
      commit();
    }
    function commit() {
      let label = "";
      if (mode === "single" && start) label = fmt(start);
      else if (start && end) label = `${fmt(start)} → ${fmt(end)}`;
      else if (start) label = `${fmt(start)} → …`;
      onChange({ start, end: end || start, label, mode });
    }

    el.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-nav]");
      if (nav) { view = new Date(view.getFullYear(), view.getMonth() + Number(nav.dataset.nav), 1); render(); return; }
      const day = e.target.closest(".gsc-cal__day[data-d]");
      if (day && !day.disabled) { pick(Number(day.dataset.d)); return; }
      if (e.target.closest(".gsc-cal__apply")) close();
    });

    function open() { render(); el.hidden = false; requestAnimationFrame(() => el.classList.add("is-open")); }
    function close() { el.classList.remove("is-open"); setTimeout(() => { el.hidden = true; }, 250); }
    function isOpen() { return el.classList.contains("is-open"); }
    function setMode(m) {
      mode = m; end = null;
      if (m === "single" && start) end = start;
      render(); commit();
    }
    function value() { return { start, end: end || start, mode }; }

    return { open, close, isOpen, setMode, value, el };
  }

  /* ------------------------------ helpers ------------------------------ */
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => /^[0-9]{7,15}$/.test(v.replace(/[\s-]/g, ""));

  function setFilled(input) {
    if (!input) return;
    const has = input.value && input.value.trim() !== "";
    input.classList.toggle("gsc-filled", !!has);
  }

  /* --------------------------------- init ------------------------------ */
  function init(container) {
    const preselect = detectExpedition(container);
    container.classList.add("gsc-booking");
    container.innerHTML = template(preselect);

    const form = container.querySelector(".gsc-card");
    const dial = form.querySelector("#gsc-dial");
    const persons = form.querySelector("#gsc-persons");
    const datesInput = form.querySelector("#gsc-dates");
    const startInput = form.querySelector("#gsc-start");
    const endInput = form.querySelector("#gsc-end");
    const submit = form.querySelector(".gsc-submit");
    const summary = form.querySelector(".gsc-summary");
    const toast = form.querySelector(".gsc-toast");
    const modal = container.querySelector(".gsc-modal");
    const expSelect = form.querySelector("#gsc-expedition");
    const levelField = form.querySelector("#gsc-level-field");
    const levelSelect = form.querySelector("#gsc-level");
    let personCount = 1;
    let submitting = false;

    // Show the skill-level field only for lesson-type expeditions.
    function updateLevel() {
      const show = LEVEL_EXPEDITIONS.includes(expSelect.value);
      levelField.hidden = !show;
      if (!show) { levelSelect.value = ""; clearError(levelSelect); }
    }

    // floating-label state on load + input
    form.querySelectorAll("input, textarea, select").forEach(setFilled);
    form.querySelectorAll("input, textarea").forEach(el =>
      el.addEventListener("input", () => { setFilled(el); clearError(el); }));
    expSelect.addEventListener("change", (e) => { setFilled(e.target); updateLevel(); });
    levelSelect.addEventListener("change", (e) => { setFilled(e.target); clearError(e.target); });
    updateLevel(); // reflect any preselected expedition on load

    // ---- stepper
    form.querySelectorAll(".gsc-step-btn").forEach(btn => btn.addEventListener("click", () => {
      personCount = Math.min(50, Math.max(1, personCount + Number(btn.dataset.step)));
      persons.textContent = personCount;
      form.querySelector('[data-step="-1"]').disabled = personCount <= 1;
      form.querySelector('[data-step="1"]').disabled = personCount >= 50;
    }));
    form.querySelector('[data-step="-1"]').disabled = true;

    // ---- calendar
    const cal = Calendar(container, ({ start, end, label }) => {
      datesInput.value = label;
      setFilled(datesInput);
      startInput.value = start ? start.toISOString().slice(0, 10) : "";
      endInput.value = end ? end.toISOString().slice(0, 10) : "";
      clearError(datesInput);
    });
    datesInput.addEventListener("click", () => cal.isOpen() ? cal.close() : cal.open());
    datesInput.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cal.open(); } });
    form.querySelectorAll(".gsc-date-toggle button").forEach(b => b.addEventListener("click", () => {
      form.querySelectorAll(".gsc-date-toggle button").forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
      cal.setMode(b.dataset.mode);
    }));
    // close calendar on outside click / escape
    document.addEventListener("click", (e) => {
      if (cal.isOpen() && !e.target.closest(".gsc-cal") && !e.target.closest(".gsc-date-display")) cal.close();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { cal.close(); closeModal(); } });

    // ---- validation helpers
    function fieldOf(el) { return el.closest(".gsc-field"); }
    function showError(el) { const f = fieldOf(el); if (f) f.classList.add("gsc-invalid"); }
    function clearError(el) { const f = fieldOf(el); if (f) f.classList.remove("gsc-invalid"); }

    function validate() {
      let ok = true;
      const name = form.querySelector("#gsc-name");
      const phone = form.querySelector("#gsc-phone");
      const email = form.querySelector("#gsc-email");
      const exp = form.querySelector("#gsc-expedition");
      const from = form.querySelector("#gsc-from");

      const check = (el, cond) => { if (cond) { clearError(el); } else { showError(el); ok = false; } };
      check(name, name.value.trim().length >= 2);
      check(phone, isPhone(phone.value));
      check(email, isEmail(email.value.trim()));
      check(exp, !!exp.value);
      check(from, from.value.trim().length >= 2);
      check(datesInput, !!startInput.value);
      if (!levelField.hidden) check(levelSelect, !!levelSelect.value);
      if (!ok) {
        const firstBad = form.querySelector(".gsc-invalid");
        if (firstBad) firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return ok;
    }

    // ---- data + formatting
    function collect() {
      const s = startInput.value, e = endInput.value;
      const fmtD = (iso) => {
        if (!iso) return "";
        const d = new Date(iso + "T00:00:00");
        return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
      };
      const datesLabel = (s === e || !e) ? fmtD(s) : `${fmtD(s)} to ${fmtD(e)}`;
      return {
        name: form.querySelector("#gsc-name").value.trim(),
        phone: `${dial.value} ${form.querySelector("#gsc-phone").value.trim()}`,
        email: form.querySelector("#gsc-email").value.trim(),
        expedition: form.querySelector("#gsc-expedition").value,
        level: levelField.hidden ? "" : levelSelect.value,
        start: s, end: e || s, datesLabel,
        persons: personCount,
        from: form.querySelector("#gsc-from").value.trim(),
        message: form.querySelector("#gsc-message").value.trim() || "—",
        status: "New",
        timestamp: new Date().toISOString(),
      };
    }

    function renderSummary(d) {
      summary.innerHTML = `
        <h4>🏔 Gulmarg Ski Club Booking</h4>
        <dl>
          <dt>Name</dt><dd>${esc(d.name)}</dd>
          <dt>Phone</dt><dd>${esc(d.phone)}</dd>
          <dt>Email</dt><dd>${esc(d.email)}</dd>
          <dt>Expedition</dt><dd>${esc(d.expedition)}</dd>
          ${d.level ? `<dt>Level</dt><dd>${esc(d.level)}</dd>` : ""}
          <dt>Travel Dates</dt><dd>${esc(d.datesLabel)}</dd>
          <dt>Persons</dt><dd>${d.persons}</dd>
          <dt>From</dt><dd>${esc(d.from)}</dd>
          <dt>Message</dt><dd>${esc(d.message)}</dd>
        </dl>`;
      summary.classList.add("is-visible");
    }
    const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

    // ---- Action 1: WhatsApp
    function whatsappURL(d) {
      const msg =
`🏔 New Booking Request
👤 Name: ${d.name}
📞 Phone: ${d.phone}
📧 Email: ${d.email}
🎿 Expedition: ${d.expedition}${d.level ? `\n🏂 Level: ${d.level}` : ""}
📅 Travel Dates: ${d.datesLabel}
👥 Persons: ${d.persons}
📍 From: ${d.from}
📝 Message: ${d.message}

Please confirm availability.`;
      return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    }

    // ---- Action 2: EmailJS (optional, graceful if unconfigured)
    function sendEmail(d) {
      const cfg = CONFIG.emailService;
      const configured = window.emailjs && cfg.publicKey && !cfg.publicKey.startsWith("YOUR_");
      if (!configured) return Promise.resolve({ skipped: true });
      try {
        emailjs.init({ publicKey: cfg.publicKey });
        return emailjs.send(cfg.serviceId, cfg.templateId, {
          to_email: CONFIG.businessEmail,
          subject: "New Booking Request - Gulmarg Ski Club",
          name: d.name, phone: d.phone, email: d.email,
          expedition: d.expedition, level: d.level || "—", dates: d.datesLabel,
          persons: d.persons, from: d.from, message: d.message,
          timestamp: d.timestamp,
        }).then(() => ({ ok: true })).catch((err) => ({ error: err }));
      } catch (err) { return Promise.resolve({ error: err }); }
    }

    // ---- Action 3: Google Sheet via Apps Script
    function saveToSheet(d) {
      const url = CONFIG.googleSheetWebhook;
      if (!url || url.startsWith("YOUR_")) return Promise.resolve({ skipped: true });
      // Apps Script web apps don't return CORS headers; use no-cors fire-and-forget.
      return fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(d),
      }).then(() => ({ ok: true })).catch((err) => ({ error: err }));
    }

    // ---- submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submitting) return;
      if (!validate()) return;

      submitting = true;
      submit.disabled = true;
      submit.classList.add("is-loading");

      const data = collect();
      renderSummary(data);

      // Fire background integrations (don't block the WhatsApp hand-off)
      const results = await Promise.allSettled([sendEmail(data), saveToSheet(data)]);
      const emailRes = results[0].value || {};
      const sheetRes = results[1].value || {};

      // Open WhatsApp (primary confirmation channel)
      window.open(whatsappURL(data), "_blank");

      // Surface a gentle note if optional integrations aren't wired yet
      const pending = [];
      if (emailRes.skipped) pending.push("email");
      if (sheetRes.skipped) pending.push("Google Sheet");
      if (pending.length) {
        toast.textContent = "Opened WhatsApp with your request. (" + pending.join(" & ") +
          " integration not configured yet — see booking/README.md.)";
        toast.classList.add("is-show");
      }

      openModal();
      submit.classList.remove("is-loading");
      submit.disabled = false;
      submitting = false;
    });

    // ---- modal
    function openModal() { modal.hidden = false; requestAnimationFrame(() => modal.classList.add("is-open")); }
    function closeModal() {
      if (!modal.classList.contains("is-open")) return;
      modal.classList.remove("is-open");
      setTimeout(() => { modal.hidden = true; }, 350);
    }
    modal.addEventListener("click", (e) => {
      const act = e.target.closest("[data-action]");
      if (e.target === modal || (act && act.dataset.action === "close")) return closeModal();
      if (act && act.dataset.action === "again") {
        closeModal();
        form.reset();
        summary.classList.remove("is-visible");
        toast.classList.remove("is-show");
        personCount = 1; persons.textContent = "1";
        startInput.value = ""; endInput.value = "";
        form.querySelectorAll("input, textarea, select").forEach(setFilled);
        setFilled(expSelect);
        updateLevel();
        form.querySelector("#gsc-name").focus();
      }
    });
  }

  /* -------------------------------- boot ------------------------------- */
  function boot() {
    document.querySelectorAll("#booking-container, [data-booking-widget]").forEach(init);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
