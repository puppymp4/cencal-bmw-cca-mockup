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
See `how-to-update-events.md`.

## Design

The "Welcome" direction, chosen from four concepts (still viewable under `/concepts/`).
Dark, photo-led, one accent. Full-screen hero with art-directed crops: portrait viewports get
the full-frame portrait photo, landscape viewports get a 16:10 band, `srcset` covers 2x and 3x
phones and iPad portrait. Headline set in Clash Display Bold, everything else in Satoshi.

## Stack

Plain HTML, CSS and JavaScript. No build step, no dependencies. Deployed on Vercel with
`cleanUrls`, so links are `/events`, `/gallery`, `/join`, `/contact`.

```
index.html          home
events.html         next twelve dates + season anchors + venues
gallery.html        filterable photo grid (BMW / all makes)
join.html           membership explainer + merch
contact.html        form, direct contacts, officers, FAQ
404.html            custom not-found page
events.json         the only file you edit to change the calendar
styles.css          design system
main.js             calendar engine, nav, add-to-calendar menu, gallery filter, form validation
api/ics.js          Vercel function: serves a per-event .ics as text/calendar for Apple Calendar
assets/img/         optimised WebP images
concepts/           the four original homepage concepts, kept for reference
```

## Local preview

The calendar loads `/events.json` with `fetch` and links are root-absolute, so it needs a
server at the site root (not `file://`):

```bash
npx serve .
```

## Handoff notes

- Contact form posts to FormSubmit and currently delivers to **rift.clb.media@gmail.com**.
  Change the `action` in `contact.html` to the chapter's address.
- Every page is `noindex` and `robots.txt` disallows crawling while this is a proposal. Remove
  both, and the `.spec-note` block in each footer, when the chapter takes ownership.
- Photography is by chapter members, credited @OG559Photo and @CG559Photo. Confirm permission
  before going live on the chapter's own domain.
- `canonical` tags already point at cencalbmwcca.com.
