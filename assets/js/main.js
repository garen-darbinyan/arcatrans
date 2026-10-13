(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");
  var cfg = window.ARCATRANS || {};

  // ---- Apply company config ----
  function setAll(sel, fn) { document.querySelectorAll(sel).forEach(fn); }
  if (cfg.phone) setAll('[data-cfg="phone"]', function (a) { a.textContent = cfg.phone; a.href = "tel:" + cfg.phoneLink; });
  if (cfg.phoneLink) setAll('[data-cfg="phone-btn"]', function (a) { a.href = "tel:" + cfg.phoneLink; });
  if (cfg.email) setAll('[data-cfg="email"]', function (a) { a.textContent = cfg.email; a.href = "mailto:" + cfg.email; });
  if (cfg.addressLines) setAll('[data-cfg="address"]', function (el) {
    el.textContent = "";
    cfg.addressLines.forEach(function (line, i) { if (i) el.appendChild(document.createElement("br")); el.appendChild(document.createTextNode(line)); });
  });
  setAll('[data-cfg="authority"]', function (el) {
    var parts = [];
    if (cfg.usdot) parts.push("USDOT # " + cfg.usdot);
    if (cfg.mc) parts.push("MC # " + cfg.mc);
    if (parts.length) el.textContent = parts.join(" · "); else el.hidden = true;
  });
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---- Header: shadow + mobile menu ----
  var header = document.querySelector(".header");
  var nav = document.getElementById("nav");
  var toggle = document.querySelector(".nav-toggle");
  var sticky = document.querySelector(".sticky-cta");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 10);
    if (sticky) sticky.classList.toggle("is-visible", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() { if (!nav) return; nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  // ---- Reveal on scroll + counters ----
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function countUp(el) {
    var target = +el.dataset.count, suffix = el.dataset.suffix || "";
    if (reduce) { el.textContent = target + suffix; return; }
    var start = null;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / 1200, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        if (en.target.dataset.count) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    setAll(".reveal, [data-count]", function (el) { io.observe(el); });
  } else {
    setAll(".reveal", function (el) { el.classList.add("is-in"); });
    setAll("[data-count]", function (el) { el.textContent = el.dataset.count + (el.dataset.suffix || ""); });
  }

  // ---- Quick quote → prefill full form ----
  var quick = document.getElementById("quick-quote");
  var full = document.getElementById("quote-form");
  if (quick && full) {
    quick.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(quick)) return;
      ["origin", "destination", "equipment"].forEach(function (n) { full.elements[n].value = quick.elements[n].value; });
      document.getElementById("quote").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      setTimeout(function () { full.elements.pickup_date.focus({ preventScroll: true }); }, reduce ? 0 : 600);
    });
  }

  // ---- Validation ----
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validate(form) {
    var ok = true, first = null;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === "hidden" || el.closest(".hp")) return;
      var v = (el.value || "").trim();
      var bad = (el.required && !v) || (el.type === "email" && v && !emailRe.test(v));
      el.classList.toggle("is-invalid", bad);
      el.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad) { ok = false; if (!first) first = el; }
    });
    if (first) first.focus();
    return ok;
  }
  document.addEventListener("input", function (e) {
    if (e.target.classList && e.target.classList.contains("is-invalid")) e.target.classList.remove("is-invalid");
  });

  // ---- Form submission (quote, tracking) ----
  var messages = {
    quote: "Thanks! Your quote request was sent. We'll reply shortly.",
    tracking: "Request received. Dispatch will email you the status shortly."
  };
  setAll("form[data-form]", function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector(".form__msg");
      msg.className = "form__msg";
      msg.textContent = "";
      if (!validate(form)) { msg.classList.add("is-err"); msg.textContent = "Please complete the highlighted fields."; return; }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";

      fetch(cfg.formEndpoint || "send.php", { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok || d.ok === false) throw new Error(d.error || "Request failed"); }); })
        .then(function () {
          form.reset();
          msg.classList.add("is-ok");
          msg.textContent = messages[form.dataset.form] || "Sent!";
        })
        .catch(function () {
          msg.classList.add("is-err");
          msg.textContent = "Sorry, something went wrong. Please call " + (cfg.phone || "us") + " or email " + (cfg.email || "us") + ".";
        })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  });
})();
