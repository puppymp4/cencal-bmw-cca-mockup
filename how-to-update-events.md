# How to update the calendar

You only ever edit one file: **`events.json`**. Save it, push it, done. No other file needs touching.

---

## The important part

**You do not need to add Kars & Koffee dates. Ever.**

It is defined once, as a rule:

```json
"recurring": [
  {
    "id": "kars-and-koffee",
    "title": "Kars & Koffee",
    "rule": { "nth": 2, "weekday": 6 },
    "ruleText": "2nd Saturday of every month",
    "start": "08:00",
    "end": "12:00",
    ...
  }
]
```

`"nth": 2, "weekday": 6` means the 2nd Saturday. Weekdays are `0` Sunday through `6` Saturday.
The site works out the next twelve dates every time somebody loads the page.

If the meet ever moves to, say, the 3rd Sunday, change two numbers:

```json
"rule": { "nth": 3, "weekday": 0 },
"ruleText": "3rd Sunday of every month",
```

Change `ruleText` to match, because that sentence is printed on the home and events pages.

---

## Adding a one-off event with a confirmed date

Put it in the `"dated"` array. It will slot into the calendar in date order alongside
Kars & Koffee, with working Google Calendar, .ics and directions links.

```json
"dated": [
  {
    "id": "euro-car-show-2027",
    "title": "Euro Car Show",
    "date": "2027-06-13",
    "start": "08:00",
    "end": "13:00",
    "venue": "Clovis Community College",
    "address": "Entrance on International between Willow and Chestnut, Clovis, CA",
    "blurb": "Our annual European show. Awards across multiple categories.",
    "open": "Open to the public",
    "cost": "$20 entry"
  }
]
```

Rules:

- `date` must be `YYYY-MM-DD`.
- `start` and `end` must be 24-hour `HH:MM`. 8 AM is `"08:00"`, 1 PM is `"13:00"`.
- `id` must be unique. Adding the year is the easy way.
- Separate multiple events with a comma between the `}` and the next `{`.

Events disappear from the list by themselves once their end time has passed. You never have to
delete old ones, though it keeps the file tidy.

---

## The season anchors

The `"annual"` array holds the four yearly events shown as cards with photos. These are for
events whose date is not fixed yet. They show a window ("June", "Spring") instead of a date.

When a date gets locked in, you can either leave the anchor card alone and add a proper entry to
`"dated"`, or do both. Both is best: the card sells the event, the dated entry gives people a
calendar link.

---

## Before you save

Paste the file into [jsonlint.com](https://jsonlint.com) and hit validate. A single missing comma
will stop the whole calendar from loading, and the page will fall back to a plain message saying
Kars & Koffee runs the second Saturday of every month.

---

## Quick reference

| I want to... | Do this |
|---|---|
| Change the monthly meet time | Edit `start` / `end` in `recurring` |
| Move the meet to a different weekend | Edit `rule.nth` and `rule.weekday`, then `ruleText` |
| Change the meet location | Edit `venue` and `address` in `recurring` |
| Announce this year's car show date | Add an entry to `dated` |
| Add a brand new annual event | Add an entry to `annual` |
| Cancel a one-off | Delete its entry from `dated` |
