/* ARCA — arcatrans.com site script (no server code needed) */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  /* ------------------------------------------------------------------
     FORM SETTINGS — where each form is delivered.
     Forms are sent through FormSubmit (https://formsubmit.co), a free
     form-to-email service. The FIRST submission to each address sends a
     one-time "Activate form" email to that inbox — click it once and all
     later submissions arrive as normal emails.
     To use another service (Formspree, Web3Forms, Netlify Forms), change
     ENDPOINT below.
  ------------------------------------------------------------------ */
  var ENDPOINT = function (to) { return 'https://formsubmit.co/ajax/' + to; };
  var ROUTES = {
    quote:   { to: 'sales@arcatrans.com',    label: 'Quote request' },
    track:   { to: 'info@arcatrans.com',     label: 'Tracking request' },
    carrier: { to: 'dispatch@arcatrans.com', label: 'Carrier partner application' },
    careers: { to: 'info@arcatrans.com',     label: 'Job application' },
    contact: { to: 'info@arcatrans.com',     label: 'Website message' }
  };

  /* Mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Reveal on scroll */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.1 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }


  /* Fleet gallery: reveal only the photos that exist in assets/img/ */
  var fleet = document.getElementById('fleet');
  if (fleet) {
    fleet.querySelectorAll('img[data-fleet]').forEach(function (img) {
      var probe = new Image();
      probe.onload = function () { img.src = probe.src; img.parentNode.hidden = false; fleet.hidden = false; };
      probe.onerror = function () { img.parentNode.remove(); };
      probe.src = img.getAttribute('data-src');
    });
  }

  /* Pre-select service from URL, e.g. quote.html?service=LTL */
  var params = new URLSearchParams(location.search);
  var svc = params.get('service');
  if (svc) {
    var r = document.querySelector('input[name="Service"][value="' + svc.replace(/"/g, '') + '"]');
    if (r) r.checked = true;
  }

  /* Forms */
  function fieldLabel(el) {
    var l = el.id && document.querySelector('label[for="' + el.id + '"]');
    return l ? l.textContent.replace('*', '').trim() : el.name;
  }

  function validate(form) {
    var bad = [];
    form.querySelectorAll('[required]').forEach(function (el) {
      var ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
      if (ok && el.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) bad.push(el);
    });
    return bad;
  }

  function collect(form) {
    var data = {};
    new FormData(form).forEach(function (v, k) {
      if (k.charAt(0) === '_' ) return;
      v = String(v).trim();
      if (!v) return;
      data[k] = data[k] ? data[k] + ', ' + v : v;
    });
    return data;
  }

  function mailtoFallback(route, subject, data) {
    var body = Object.keys(data).map(function (k) { return k + ': ' + data[k]; }).join('\n');
    return 'mailto:' + route.to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var route = ROUTES[form.dataset.form];
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type="submit"]');

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      var bad = validate(form);
      if (bad.length) {
        bad[0].focus();
        status.textContent = 'Please complete: ' + bad.map(fieldLabel).join(', ') + '.';
        status.className = 'form-status show err';
        return;
      }
      if (form.querySelector('[name="_honey"]').value) return; // bot

      var data = collect(form);
      var subjBits = (form.dataset.subject || '').split('|').map(function (k) { return data[k]; }).filter(Boolean);
      var subject = 'ARCA website — ' + route.label + (subjBits.length ? ' — ' + subjBits.join(' / ') : '');
      var payload = Object.assign({}, data, {
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        _replyto: data.Email || ''
      });

      var original = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending…';

      fetch(ENDPOINT(route.to), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
        .then(function (r) {
          if (!r.ok || String(r.j.success) === 'false') throw new Error(r.j.message || 'Send failed');
          form.innerHTML =
            '<div class="form-success" role="status">' +
            '<div class="tick"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg></div>' +
            '<h2>Thank you — we received it.</h2>' +
            '<p>' + (form.dataset.success || 'Our team will get back to you shortly.') + '</p>' +
            '<p class="form-note">Urgent? Call <a href="tel:+19056732002">+1 (905) 673-2002</a>.</p></div>';
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = original;
          status.innerHTML = 'We couldn’t send this automatically. <a href="' + mailtoFallback(route, subject, data) +
            '">Click here to send it by email</a> or call <a href="tel:+19056732002">+1 (905) 673-2002</a>.';
          status.className = 'form-status show err';
        });
    });
  });
})();
