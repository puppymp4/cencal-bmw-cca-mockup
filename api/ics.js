// GET /api/ics?title=&start=YYYYMMDDTHHMMSS&end=YYYYMMDDTHHMMSS&loc=&desc=&uid=&file=
// Serves a single-event .ics as text/calendar so iOS and macOS open it straight in Calendar.
// Times are Pacific (America/Los_Angeles) with an embedded VTIMEZONE so DST is handled.

export const config = { runtime: "edge" };

export default function handler(request) {
  var q = Object.fromEntries(new URL(request.url).searchParams);
  var clean = function (s) { return String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim().slice(0, 400); };
  var esc = function (s) { return clean(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,'); };
  var stampOk = function (s) { return /^\d{8}T\d{6}$/.test(String(s || '')); };

  if (!stampOk(q.start) || !stampOk(q.end)) {
    return new Response("start and end must look like 20261010T080000", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  var title = esc(q.title || 'BMW CCA Cen Cal');
  var file = (clean(q.file) || 'event').replace(/[^a-z0-9-]/gi, '-').toLowerCase() + '.ics';
  var uid = (clean(q.uid) || q.start).replace(/[^a-z0-9-]/gi, '-') + '@cencalbmwcca.com';
  var now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BMW CCA Cen Cal Chapter//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:America/Los_Angeles',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0800',
    'TZOFFSETTO:-0700',
    'TZNAME:PDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0700',
    'TZOFFSETTO:-0800',
    'TZNAME:PST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    'UID:' + uid,
    'DTSTAMP:' + now,
    'DTSTART;TZID=America/Los_Angeles:' + q.start,
    'DTEND;TZID=America/Los_Angeles:' + q.end,
    'SUMMARY:' + title,
    q.loc ? 'LOCATION:' + esc(q.loc) : null,
    q.desc ? 'DESCRIPTION:' + esc(q.desc) : null,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean);

  return new Response(lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=\"" + file + "\"",
      "Cache-Control": "public, max-age=86400"
    }
  });
}
