/* ============================================================
   BMW CCA Central California Chapter
   Built by Rift Media.

   The calendar generates itself. Kars & Koffee is the 2nd Saturday
   of every month, so the site computes upcoming dates at page load
   instead of waiting for someone to type them in. The old site died
   because that typing stopped in December 2024.
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- nav ---------------- */
  function initNav() {
    var nav = document.getElementById('nav');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('solid', window.scrollY > 40); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    var toggle = document.querySelector('.nav-toggle');
    var panel = document.getElementById('mobile-nav');
    if (!toggle || !panel) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.setAttribute('data-open', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { var first = panel.querySelector('a, button'); if (first) first.focus(); }
    }
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    panel.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var items = panel.querySelectorAll('a, button'); if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------------- dates ---------------- */
  function nthWeekday(year, month, weekday, nth) {
    var first = new Date(year, month, 1);
    var offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + offset + (nth - 1) * 7);
  }
  function atTime(date, hhmm) {
    var p = String(hhmm || '00:00').split(':');
    var d = new Date(date.getTime());
    d.setHours(parseInt(p[0], 10) || 0, parseInt(p[1], 10) || 0, 0, 0);
    return d;
  }
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function fmtLong(d) { return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
  function fmtShort(d) { return DAYS[d.getDay()].slice(0, 3) + ' ' + MON[d.getMonth()] + ' ' + d.getDate(); }
  function fmtTime(hhmm) {
    var p = String(hhmm).split(':'), h = parseInt(p[0], 10), m = p[1] || '00';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + (m === '00' ? '' : ':' + m) + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function stamp(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00'; }

  /* ---------------- occurrences ---------------- */
  function expandRecurring(ev, count) {
    var out = [], now = new Date(), cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    for (var i = 0; i < count + 14 && out.length < count; i++) {
      var d = nthWeekday(cursor.getFullYear(), cursor.getMonth(), ev.rule.weekday, ev.rule.nth);
      var ends = atTime(d, ev.end);
      if (ends > now) out.push({ id: ev.id, title: ev.title, date: atTime(d, ev.start), endDate: ends, start: ev.start, end: ev.end,
        venue: ev.venue, address: ev.address, blurb: ev.blurb, open: ev.open, cost: ev.cost, kind: 'recurring', ruleText: ev.ruleText });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return out;
  }
  function expandDated(list) {
    var now = new Date();
    return (list || []).map(function (ev) {
      return { id: ev.id, title: ev.title, date: new Date(ev.date + 'T' + (ev.start || '00:00')), endDate: new Date(ev.date + 'T' + (ev.end || '23:59')),
        start: ev.start, end: ev.end, venue: ev.venue, address: ev.address, blurb: ev.blurb, open: ev.open, cost: ev.cost, kind: 'dated' };
    }).filter(function (ev) { return ev.endDate > now; });
  }
  function buildUpcoming(data, count) {
    var all = [];
    (data.recurring || []).forEach(function (ev) { all = all.concat(expandRecurring(ev, count)); });
    all = all.concat(expandDated(data.dated));
    all.sort(function (a, b) { return a.date - b.date; });
    return all.slice(0, count);
  }

  /* ---------------- links ---------------- */
  function googleCalUrl(ev) {
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(ev.title + ' - BMW CCA Cen Cal') +
      '&dates=' + stamp(ev.date) + '/' + stamp(ev.endDate) + '&details=' + encodeURIComponent(ev.blurb || '') +
      '&location=' + encodeURIComponent((ev.venue ? ev.venue + ', ' : '') + (ev.address || ''));
  }
  function mapUrl(ev) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((ev.venue ? ev.venue + ' ' : '') + (ev.address || '')); }
  // Apple Calendar: a real .ics served by /api/ics so iOS opens its Add to Calendar sheet
  function icsUrl(ev) {
    var d = ev.date, file = ev.id + '-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return '/api/ics?' + [
      'title=' + encodeURIComponent(ev.title + ' - BMW CCA Cen Cal'),
      'start=' + stamp(ev.date), 'end=' + stamp(ev.endDate),
      'loc=' + encodeURIComponent((ev.venue ? ev.venue + ', ' : '') + (ev.address || '')),
      'desc=' + encodeURIComponent(ev.blurb || ''),
      'uid=' + encodeURIComponent(file), 'file=' + encodeURIComponent(file)
    ].join('&');
  }

  /* "Add to calendar" button that asks Google or Apple */
  var calSeq = 0;
  function calMenu(ev, cls) {
    var id = 'cal-' + (++calSeq);
    return '<div class="cal' + (cls ? ' ' + cls : '') + '">' +
      '<button class="pill sm" type="button" data-cal-toggle aria-haspopup="menu" aria-expanded="false" aria-controls="' + id + '">Add to calendar</button>' +
      '<div class="cal-menu" id="' + id + '" role="menu" hidden>' +
        '<a role="menuitem" href="' + icsUrl(ev) + '">Apple Calendar</a>' +
        '<a role="menuitem" href="' + googleCalUrl(ev) + '" target="_blank" rel="noopener">Google Calendar</a>' +
      '</div></div>';
  }
  function closeCalMenus(except) {
    document.querySelectorAll('[data-cal-toggle][aria-expanded="true"]').forEach(function (b) {
      if (b === except) return;
      b.setAttribute('aria-expanded', 'false');
      var m = document.getElementById(b.getAttribute('aria-controls')); if (m) m.hidden = true;
    });
  }
  function initCalMenus() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cal-toggle]');
      closeCalMenus(t);
      if (!t) return;
      var m = document.getElementById(t.getAttribute('aria-controls')); if (!m) return;
      var open = m.hidden; m.hidden = !open; t.setAttribute('aria-expanded', String(open));
      if (open) { var f = m.querySelector('a'); if (f) f.focus(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openBtn = document.querySelector('[data-cal-toggle][aria-expanded="true"]');
      closeCalMenus(null); if (openBtn) openBtn.focus();
    });
  }

  /* ---------------- render ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function eventRow(ev) {
    var d = ev.date;
    return '<article class="event-row">' +
      '<div class="event-date" aria-hidden="true"><div class="event-date__mon">' + MON[d.getMonth()] + '</div><div class="event-date__day">' + d.getDate() + '</div><div class="event-date__yr">' + d.getFullYear() + '</div></div>' +
      '<div class="event-body"><h3>' + esc(ev.title) + '</h3>' +
        '<div class="event-meta"><span>' + esc(fmtLong(d)) + '</span><span>' + esc(fmtTime(ev.start)) + ' to ' + esc(fmtTime(ev.end)) + '</span><span>' + esc(ev.venue) + '</span></div>' +
        (ev.blurb ? '<p>' + esc(ev.blurb) + '</p>' : '') +
        '<div class="event-meta" style="margin-top:10px">' + (ev.open ? '<span class="badge badge--recurring">' + esc(ev.open) + '</span>' : '') + (ev.cost ? '<span class="badge">' + esc(ev.cost) + '</span>' : '') + '</div>' +
      '</div>' +
      '<div class="event-actions">' +
        calMenu(ev) +
        '<a class="pill sm" href="' + mapUrl(ev) + '" target="_blank" rel="noopener">Directions</a>' +
      '</div></article>';
  }
  function renderList(el, events) {
    el.innerHTML = events.length ? events.map(eventRow).join('') :
      '<div class="empty-state">No dates on the calendar right now. Kars &amp; Koffee still runs the 2nd Saturday of every month.</div>';
  }
  function annualCard(ev) {
    return '<article class="card">' +
      (ev.image ? '<div class="card__media"><img src="' + esc(ev.image) + '" alt="' + esc(ev.alt || ev.title) + '" loading="lazy" width="800" height="534"><span class="card__tag">' + esc(ev.window) + '</span></div>' : '') +
      '<div class="card__body"><h3>' + esc(ev.title) + '</h3><p>' + esc(ev.blurb) + '</p>' +
      '<div class="card__foot"><span>' + esc(ev.venue) + '</span><span>' + esc(ev.cost) + '</span><span>' + esc(ev.open) + '</span></div></div></article>';
  }

  /* inline "next meet" hooks used in the hero and live line */
  function renderInline(ev) {
    if (!ev) return;
    var set = function (sel, fn) { document.querySelectorAll(sel).forEach(fn); };
    var days = Math.ceil((ev.date - new Date()) / 86400000);
    set('[data-next-when]', function (el) { el.textContent = fmtLong(ev.date) + ', ' + fmtTime(ev.start) + ' to ' + fmtTime(ev.end); });
    set('[data-next-short]', function (el) { el.textContent = fmtShort(ev.date) + ', ' + fmtTime(ev.start) + ' to ' + fmtTime(ev.end); });
    set('[data-next-days]', function (el) { el.textContent = days <= 0 ? 'today' : 'in ' + days + ' day' + (days === 1 ? '' : 's'); });
    set('[data-next-btn]', function (el) { el.textContent = 'Next meet, ' + fmtShort(ev.date); });
    set('[data-next-google]', function (el) { el.href = googleCalUrl(ev); el.target = '_blank'; el.rel = 'noopener'; });
    set('[data-next-apple]', function (el) { el.href = icsUrl(ev); });
    set('[data-next-map]', function (el) { el.href = mapUrl(ev); el.target = '_blank'; el.rel = 'noopener'; });
  }

  function initCalendar() {
    var lists = document.querySelectorAll('[data-events]');
    var annual = document.querySelector('[data-annual]');
    var inline = document.querySelector('[data-next-when],[data-next-short],[data-next-days],[data-next-btn],[data-next-google],[data-next-apple],[data-next-map]');
    var rules = document.querySelectorAll('[data-rule-text]');
    if (!lists.length && !annual && !inline) return;

    fetch('/events.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (data) {
      var upcoming = buildUpcoming(data, 12);
      lists.forEach(function (el) { renderList(el, upcoming.slice(0, parseInt(el.getAttribute('data-events'), 10) || upcoming.length)); });
      if (annual) annual.innerHTML = (data.annual || []).map(annualCard).join('');
      renderInline(upcoming[0]);
      if (data.recurring && data.recurring[0]) rules.forEach(function (el) { el.textContent = data.recurring[0].ruleText; });
    }).catch(function () {
      lists.forEach(function (el) { el.innerHTML = '<div class="empty-state">The calendar could not load. Kars &amp; Koffee runs the 2nd Saturday of every month, 8 AM, at the Starbucks across from Woodward Park.</div>'; });
    });
  }

  /* ---------------- gallery ---------------- */
  function initGallery() {
    var bar = document.querySelector('[data-filter-bar]'), grid = document.querySelector('[data-gallery]');
    if (!bar || !grid) return;
    var buttons = bar.querySelectorAll('.filter-btn'), tiles = grid.querySelectorAll('.tile'), count = document.querySelector('[data-gallery-count]');
    function apply(f) {
      var shown = 0;
      tiles.forEach(function (t) { var show = f === 'all' || t.getAttribute('data-cat') === f; t.hidden = !show; if (show) shown++; });
      if (count) count.textContent = shown + (shown === 1 ? ' photo' : ' photos');
    }
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn'); if (!btn) return;
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      apply(btn.getAttribute('data-filter'));
    });
    apply('all');
  }

  /* ---------------- reveal ---------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal'); if (!items.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { items.forEach(function (i) { i.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (i) { io.observe(i); });
  }

  /* ---------------- forms ---------------- */
  function initForms() {
    document.querySelectorAll('form[data-validate]').forEach(function (form) {
      var fields = form.querySelectorAll('input[required], textarea[required], select[required]');
      function validate(input) {
        var err = input.closest('.field') && input.closest('.field').querySelector('.error'), msg = '';
        if (!input.value.trim()) msg = 'This one is required.';
        else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = 'Check the email address.';
        input.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (err) err.textContent = msg; return !msg;
      }
      fields.forEach(function (input) {
        input.addEventListener('blur', function () { validate(input); });
        input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') validate(input); });
      });
      form.addEventListener('submit', function (e) {
        var ok = true, first = null;
        fields.forEach(function (input) { if (!validate(input)) { ok = false; if (!first) first = input; } });
        if (!ok) { e.preventDefault(); if (first) first.focus(); }
      });
    });
  }

  function initYear() { document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); }); }

  function boot() { initNav(); initCalendar(); initCalMenus(); initGallery(); initReveal(); initForms(); initYear(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
