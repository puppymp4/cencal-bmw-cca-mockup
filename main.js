/* ============================================================
   BMW CCA Central California Chapter
   Built by Rift Media.

   The point of this file: the calendar generates itself.
   Kars & Koffee is the 2nd Saturday of every month, so the
   site computes the next dates at page load instead of waiting
   for someone to type them in. The old site died because that
   typing stopped in December 2024.
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- mobile nav ---------------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var panel = document.getElementById('mobile-nav');
    if (!toggle || !panel) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.setAttribute('data-open', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var first = panel.querySelector('a, button');
        if (first) first.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });

    // keep focus inside the overlay while it is open
    panel.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var items = panel.querySelectorAll('a, button');
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* ---------------- date helpers ---------------- */

  // nth weekday of a month. month is 0-indexed. weekday 0=Sun..6=Sat.
  function nthWeekday(year, month, weekday, nth) {
    var first = new Date(year, month, 1);
    var offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + offset + (nth - 1) * 7);
  }

  function atTime(date, hhmm) {
    var parts = String(hhmm || '00:00').split(':');
    var d = new Date(date.getTime());
    d.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0, 0, 0);
    return d;
  }

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function fmtLongDate(d) {
    return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function fmtTime(hhmm) {
    var parts = String(hhmm).split(':');
    var h = parseInt(parts[0], 10);
    var m = parts[1] || '00';
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + (m === '00' ? '' : ':' + m) + ' ' + suffix;
  }

  /* ---------------- occurrence building ---------------- */

  // Expand a recurring rule into the next `count` occurrences that have not ended yet.
  function expandRecurring(ev, count) {
    var out = [];
    var now = new Date();
    var cursor = new Date(now.getFullYear(), now.getMonth(), 1);

    for (var i = 0; i < count + 14 && out.length < count; i++) {
      var d = nthWeekday(cursor.getFullYear(), cursor.getMonth(), ev.rule.weekday, ev.rule.nth);
      var ends = atTime(d, ev.end);
      if (ends > now) {
        out.push({
          id: ev.id,
          title: ev.title,
          date: atTime(d, ev.start),
          endDate: ends,
          start: ev.start,
          end: ev.end,
          venue: ev.venue,
          address: ev.address,
          blurb: ev.blurb,
          open: ev.open,
          cost: ev.cost,
          kind: 'recurring',
          ruleText: ev.ruleText
        });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return out;
  }

  function expandDated(list) {
    var now = new Date();
    return (list || []).map(function (ev) {
      var d = new Date(ev.date + 'T' + (ev.start || '00:00'));
      var e = new Date(ev.date + 'T' + (ev.end || '23:59'));
      return {
        id: ev.id, title: ev.title, date: d, endDate: e,
        start: ev.start, end: ev.end, venue: ev.venue, address: ev.address,
        blurb: ev.blurb, open: ev.open, cost: ev.cost, kind: 'dated'
      };
    }).filter(function (ev) { return ev.endDate > now; });
  }

  function buildUpcoming(data, count) {
    var all = [];
    (data.recurring || []).forEach(function (ev) {
      all = all.concat(expandRecurring(ev, count));
    });
    all = all.concat(expandDated(data.dated));
    all.sort(function (a, b) { return a.date - b.date; });
    return all.slice(0, count);
  }

  /* ---------------- calendar links ---------------- */

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  // Floating local time. Calendar apps read this as the viewer's local clock,
  // which is what you want for an in-person meet.
  function stampLocal(d) {
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
           'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  }

  function googleCalUrl(ev) {
    var text = encodeURIComponent(ev.title + ' - BMW CCA Cen Cal');
    var dates = stampLocal(ev.date) + '/' + stampLocal(ev.endDate);
    var details = encodeURIComponent(ev.blurb || '');
    var loc = encodeURIComponent((ev.venue ? ev.venue + ', ' : '') + (ev.address || ''));
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + text +
           '&dates=' + dates + '&details=' + details + '&location=' + loc;
  }

  function icsHref(ev) {
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BMW CCA Cen Cal Chapter//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + ev.id + '-' + stampLocal(ev.date) + '@cencalbmwcca.com',
      'DTSTAMP:' + stampLocal(new Date()),
      'DTSTART:' + stampLocal(ev.date),
      'DTEND:' + stampLocal(ev.endDate),
      'SUMMARY:' + ev.title + ' - BMW CCA Cen Cal',
      'LOCATION:' + ((ev.venue ? ev.venue + ', ' : '') + (ev.address || '')).replace(/,/g, '\\,'),
      'DESCRIPTION:' + String(ev.blurb || '').replace(/,/g, '\\,'),
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
  }

  function mapUrl(ev) {
    return 'https://www.google.com/maps/search/?api=1&query=' +
           encodeURIComponent((ev.venue ? ev.venue + ' ' : '') + (ev.address || ''));
  }

  /* ---------------- rendering ---------------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function eventRow(ev) {
    var d = ev.date;
    var slug = ev.id + '-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return '' +
      '<article class="event-row">' +
        '<div class="event-date" aria-hidden="true">' +
          '<div class="event-date__mon">' + MON_SHORT[ev.date.getMonth()] + '</div>' +
          '<div class="event-date__day">' + ev.date.getDate() + '</div>' +
          '<div class="event-date__yr">' + ev.date.getFullYear() + '</div>' +
        '</div>' +
        '<div class="event-body">' +
          '<h3>' + esc(ev.title) + '</h3>' +
          '<p class="visually-hidden">' + esc(fmtLongDate(ev.date)) + '</p>' +
          '<div class="event-meta">' +
            '<span>' + esc(fmtLongDate(ev.date)) + '</span>' +
            '<span>' + esc(fmtTime(ev.start)) + ' to ' + esc(fmtTime(ev.end)) + '</span>' +
            '<span>' + esc(ev.venue) + '</span>' +
          '</div>' +
          (ev.blurb ? '<p>' + esc(ev.blurb) + '</p>' : '') +
          '<div class="event-meta" style="margin-top:10px">' +
            (ev.open ? '<span class="badge badge--recurring">' + esc(ev.open) + '</span>' : '') +
            (ev.cost ? '<span class="badge">' + esc(ev.cost) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="event-actions">' +
          '<a class="btn btn--ghost btn--sm" href="' + googleCalUrl(ev) + '" target="_blank" rel="noopener">' +
            'Add to Google' +
          '</a>' +
          '<a class="btn btn--ghost btn--sm" href="' + icsHref(ev) + '" download="' + slug + '.ics">' +
            'Download .ics' +
          '</a>' +
          '<a class="btn btn--ghost btn--sm" href="' + mapUrl(ev) + '" target="_blank" rel="noopener">Directions</a>' +
        '</div>' +
      '</article>';
  }

  function renderList(el, events) {
    if (!events.length) {
      el.innerHTML = '<div class="empty-state">No dates on the calendar right now. ' +
        'Kars &amp; Koffee still runs the 2nd Saturday of every month.</div>';
      return;
    }
    el.innerHTML = events.map(eventRow).join('');
  }

  /* ---------------- countdown ---------------- */

  function renderNextCard(card, ev) {
    if (!ev) return;
    var titleEl = card.querySelector('[data-next-title]');
    var metaEl = card.querySelector('[data-next-meta]');
    var linkEl = card.querySelector('[data-next-map]');
    var calEl = card.querySelector('[data-next-cal]');

    if (titleEl) titleEl.textContent = ev.title;
    if (metaEl) {
      metaEl.innerHTML = '<strong>' + esc(fmtLongDate(ev.date)) + '</strong><br>' +
        esc(fmtTime(ev.start)) + ' to ' + esc(fmtTime(ev.end)) + ' &middot; ' + esc(ev.venue);
    }
    if (linkEl) linkEl.href = mapUrl(ev);
    if (calEl) calEl.href = googleCalUrl(ev);

    var units = card.querySelectorAll('[data-unit]');
    function tick() {
      var diff = ev.date - new Date();
      if (diff < 0) diff = 0;
      var s = Math.floor(diff / 1000);
      var vals = {
        days: Math.floor(s / 86400),
        hours: Math.floor((s % 86400) / 3600),
        mins: Math.floor((s % 3600) / 60),
        secs: s % 60
      };
      for (var i = 0; i < units.length; i++) {
        var key = units[i].getAttribute('data-unit');
        var num = units[i].querySelector('.countdown__num');
        if (num) num.textContent = vals[key] < 10 ? '0' + vals[key] : String(vals[key]);
      }
    }
    tick();
    setInterval(tick, 1000);
    card.removeAttribute('hidden');
  }

  /* ---------------- annual anchors ---------------- */

  function annualCard(ev) {
    return '' +
      '<article class="card">' +
        (ev.image
          ? '<div class="card__media">' +
              '<img src="' + esc(ev.image) + '" alt="' + esc(ev.alt || ev.title) + '" loading="lazy" width="800" height="534">' +
              '<span class="card__tag">' + esc(ev.window) + '</span>' +
            '</div>'
          : '') +
        '<div class="card__body">' +
          '<h3 class="h4">' + esc(ev.title) + '</h3>' +
          '<p>' + esc(ev.blurb) + '</p>' +
          '<div class="card__foot">' +
            '<span>' + esc(ev.venue) + '</span>' +
            '<span>' + esc(ev.cost) + '</span>' +
            '<span>' + esc(ev.open) + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ---------------- boot the calendar ---------------- */

  function initCalendar() {
    var listEls = document.querySelectorAll('[data-events]');
    var cardEl = document.querySelector('[data-next-card]');
    var annualEl = document.querySelector('[data-annual]');
    var ruleEls = document.querySelectorAll('[data-rule-text]');
    if (!listEls.length && !cardEl && !annualEl) return;

    fetch('events.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var upcoming = buildUpcoming(data, 12);

        for (var i = 0; i < listEls.length; i++) {
          var limit = parseInt(listEls[i].getAttribute('data-events'), 10) || upcoming.length;
          renderList(listEls[i], upcoming.slice(0, limit));
        }

        if (cardEl) renderNextCard(cardEl, upcoming[0]);

        if (annualEl) {
          annualEl.innerHTML = (data.annual || []).map(annualCard).join('');
        }

        if (ruleEls.length && data.recurring && data.recurring[0]) {
          for (var j = 0; j < ruleEls.length; j++) {
            ruleEls[j].textContent = data.recurring[0].ruleText;
          }
        }
      })
      .catch(function () {
        for (var k = 0; k < listEls.length; k++) {
          listEls[k].innerHTML = '<div class="empty-state">The calendar could not load. ' +
            'Kars &amp; Koffee runs the 2nd Saturday of every month, 8 AM, at the Starbucks across from Woodward Park.</div>';
        }
      });
  }

  /* ---------------- gallery filter ---------------- */

  function initGallery() {
    var bar = document.querySelector('[data-filter-bar]');
    var grid = document.querySelector('[data-gallery]');
    if (!bar || !grid) return;

    var buttons = bar.querySelectorAll('.filter-btn');
    var tiles = grid.querySelectorAll('.tile');
    var count = document.querySelector('[data-gallery-count]');

    function apply(filter) {
      var shown = 0;
      for (var i = 0; i < tiles.length; i++) {
        var cat = tiles[i].getAttribute('data-cat');
        var show = filter === 'all' || cat === filter;
        tiles[i].hidden = !show;
        if (show) shown++;
      }
      if (count) count.textContent = shown + (shown === 1 ? ' photo' : ' photos');
    }

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].setAttribute('aria-pressed', String(buttons[i] === btn));
      }
      apply(btn.getAttribute('data-filter'));
    });

    apply('all');
  }

  /* ---------------- reveal on scroll ---------------- */

  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* ---------------- form validation ---------------- */

  function initForms() {
    var forms = document.querySelectorAll('form[data-validate]');

    Array.prototype.forEach.call(forms, function (form) {
      var fields = form.querySelectorAll('input[required], textarea[required], select[required]');

      function validate(input) {
        var wrap = input.closest('.field');
        var err = wrap ? wrap.querySelector('.error') : null;
        var msg = '';

        if (!input.value.trim()) {
          msg = 'This one is required.';
        } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
          msg = 'Check the email address.';
        }

        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (err) err.textContent = msg;
        return !msg;
      }

      Array.prototype.forEach.call(fields, function (input) {
        input.addEventListener('blur', function () { validate(input); });
        input.addEventListener('input', function () {
          if (input.getAttribute('aria-invalid') === 'true') validate(input);
        });
      });

      form.addEventListener('submit', function (e) {
        var ok = true;
        var firstBad = null;
        Array.prototype.forEach.call(fields, function (input) {
          if (!validate(input)) { ok = false; if (!firstBad) firstBad = input; }
        });
        if (!ok) {
          e.preventDefault();
          if (firstBad) firstBad.focus();
        }
      });
    });
  }

  /* ---------------- year stamp ---------------- */

  function initYear() {
    var els = document.querySelectorAll('[data-year]');
    for (var i = 0; i < els.length; i++) els[i].textContent = new Date().getFullYear();
  }

  /* ---------------- go ---------------- */

  function boot() {
    initNav();
    initCalendar();
    initGallery();
    initReveal();
    initForms();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
