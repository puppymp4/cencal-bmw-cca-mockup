# BMW CCA Central California Chapter, site rebuild

A concept redesign of [cencalbmwcca.com](https://www.cencalbmwcca.com) for the Cen Cal chapter of the
BMW Car Club of America. Built by [Rift Media](https://riftmedia.cc).

**Contact:** contact@mail.cencalbmwcca.com / [@bmwccacencal](https://instagram.com/bmwccacencal)
**Chapter mail:** PO Box 3285, Clovis, CA 93613-3285
**Monthly meet:** Kars & Koffee, 2nd Saturday, 8 AM to noon, Starbucks at 9423 N Fort Washington Rd, Fresno

---

## The problem this solves

The live Squarespace site last updated in June 2024. Every calendar on it ends with the
December 2024 toy drive. Kars & Koffee never stopped running, but for roughly 21 months anyone
who found the chapter online saw a club that looked dead.

So the calendar here does not depend on anyone typing dates in. **Kars & Koffee is defined as a
rule, not a list**: second Saturday of every month, 8 AM to noon. The page computes the next
twelve occurrences at load. It will still be correct in 2030 with nobody touching it.

The four annual events (Euro Car Show, Buttonwillow driving school, Legends of the Autobahn,
December toy drive) are listed as season anchors with their venue and cost, and are labelled as
dates announced each season, which is true and does not go stale either.

## Stack

Plain HTML, CSS and JavaScript. No build step, no framework, no dependencies.
Drop it on any static host. Deployed on Vercel.

```
index.html          home
events.html         full calendar + season anchors
gallery.html        filterable photo grid (BMW / all makes)
join.html           membership explainer
contact.html        form + officers
404.html            custom not-found page
events.json         the only file you edit to change the calendar
styles.css          design system
main.js             calendar engine, nav, gallery filter, form validation
assets/img/         38 optimised WebP images (2.9 MB total)
```

## Local preview

The calendar loads `events.json` with `fetch`, so it needs a real server. Opening `index.html`
straight off the disk will show the fallback message.

```bash
npx serve .
# or
python -m http.server 8000
```

## Changing the calendar

See `how-to-update-events.md`. Short version: `events.json` is the only file to touch.

## Design

Palette and motif come from the chapter's own logo: the Sierra ridgeline, the valley crop rows,
and the blue river arc, on an asphalt-dark base with the BMW M tri-stripe used as a keyline.
Type is Archivo (variable width axis) with JetBrains Mono for dates and stats.

Checked against the Rift Media UI/UX Pro Max pre-launch gate:

- No horizontal overflow at 320 / 360 / 375 / 390 / 428 / 768 / 1024 / 1440 / 1920
- WCAG AA contrast passes on every text node on every page
- One h1 per page, no heading level skips
- All images have alt text and intrinsic width/height (no layout shift)
- Touch targets 44px minimum
- Keyboard: skip link, visible focus rings, focus trap in the mobile menu, Esc to close
- `prefers-reduced-motion` respected throughout
- Every page under the 3 MB weight budget

## Notes for handoff

- The contact form posts to FormSubmit and currently delivers to **rift.clb.media@gmail.com**.
  Change the `action` in `contact.html` to the chapter's address at handoff.
- The `.spec-note` block in each footer is the concept-build disclosure. Remove it when the
  chapter takes ownership.
- Photography is by chapter members, credited @OG559Photo and @CG559Photo in the footer and
  on the gallery page. Confirm permission before going live on the chapter's own domain.
- `sitemap.xml` and `robots.txt` point at the preview subdomain. Repoint both to
  cencalbmwcca.com at handoff, and update the `canonical` tags (they already point at the
  real domain).
