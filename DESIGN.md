# Design reference for agents

Technical description of the current design of agustinlzn.com. Repository-only: this file is listed
in `.vercelignore` and must never be deployed.

The code is the source of truth. If this file and the code disagree, trust the code and update this
file in the same change. `README.md` covers file layout, local preview and deployment.

## 1. Intent and constraints

- One static page with an editorial, typographic look: a single serif, hairline rules, generous
  vertical space, no cards, no UI chrome.
- Personality comes from a few precise interactions (headline layers, hover reveals). Everything
  else stays quiet. Do not add decoration without a reason tied to the content.
- No framework, bundler or runtime dependencies. Plain HTML, CSS and ES5-style JavaScript (`var`,
  function expressions), with newer DOM APIs where guarded or widely supported.
- Self-hosted font. The only third-party script is Vercel Web Analytics.
- The visitor's location is inferred from the browser time zone only. Nothing is looked up or sent.
- Page copy is in English. Code comments are in English.

## 2. Page structure

Order in `index.html`:

1. `header.masthead`: `.byline` (home link, "Agustín L.") and `<address>` (location).
2. `h1.lede[data-headline]`: the headline.
3. `p.standfirst`: biography.
4. `ul.contact`: Book a call, LinkedIn, GitHub, Resume.
5. `p.reach`: email link and Copy button.
6. `p.clock.reveal#clock`: time-zone line.
7. `section.work`: `article.piece` entries (`h3`, `.meta`, description).
8. `footer.colophon`: `p.invite.reveal` and `p.updated` (month stamped by `build.js`).

`404.html` shares `styles.css`, the masthead, `.lede` and `.standfirst`. It loads neither `lede.js`
nor `main.js`, does not set the `js` class, and still uses `p.place` instead of `<address>`.

## 3. Layout

- `.page`: `max-width: 44rem`, centered, padding `2rem 1.5rem 3rem` (top is `2.5rem` from `52rem`).
- Measures: `.lede` 16em, `.standfirst` 34em, `.piece` 36em (unbounded from `52rem`).
- From `52rem`, `.piece` is a grid: `14rem` column for title and meta, `1fr` for the description.
- Breakpoints: `max-width: 19.9rem` (headline tail may wrap), `max-width: 26rem` (tighter contact
  row), `min-width: 52rem` (two-column work entries).
- Sections are separated by 1px `--rule` lines and space, not by boxes.
- Masthead and colophon are `space-between` flex rows. Both align text on the **baseline**, because
  the two sides differ in size. Do not switch to top or center alignment.

## 4. Typography

Source Serif 4, variable, roman and italic files, weights 200–900, with `font-optical-sizing: auto`.
Fallback: Georgia, Times New Roman, serif. Only the roman file is preloaded.

Size tokens exist only for sizes used more than once. The px values assume a 16px root; keep sizes
in `rem` so they follow the visitor's setting.

| Token | Value | Used by |
| --- | --- | --- |
| `--text-xs` | 0.8125rem (13px) | `.updated` |
| `--text-sm` | 0.9375rem (15px) | masthead, clock, copy button, work heading, meta, colophon |
| `--text-md` | 1.125rem (18px) | body |

Other sizes are literals: headline `clamp(2rem, 5.2vw, 3.1rem)`, standfirst `1.1875rem`, project
titles `1.75rem`, contact row on small phones `1rem`, `<address>` `0.65rem`. The headline "layers"
tags and reply use a system monospace at 10.5px and 12px.

| Weight | Used by |
| --- | --- |
| 250 | work descriptions |
| 300 | byline, standfirst, contact links, email, "Selected work", italic words in the `ink` headline |
| 400 | body, headline, meta and other secondary text |
| 500 | project titles, headline tags |

The thin weights are deliberate. Check legibility in dark mode before going thinner.

Italic marks secondary information: time-zone line, section label, meta, update stamp, Copy button.
`<address>` has no `font-style` rule, so the browser default applies to it.

Wrapping: `text-wrap: balance` on headings, `pretty` on paragraphs and list items.

## 5. Color

Components use only the semantic tokens: `--paper`, `--ink`, `--ink-soft`, `--muted`, `--rule`,
`--accent`, `--dust`. `--accent` is for links, focus and the "interface" selection. `--dust` (amber
or gold) is for the glow, the specks, the "API" highlight and the trace request.

Light mode: paper `#f5f6f8`, ink `#1b1e24`, ink-soft `#3a3e47`, muted `#6a6f79`, rule `#d6d9df`,
accent `#2c46a0`, dust `#c98200`.

Dark mode follows `prefers-color-scheme`. Each palette is defined once as `--d-*` variables, which
the dark rules map onto the semantic tokens.

| `data-dark` | Character | paper | ink | accent |
| --- | --- | --- | --- | --- |
| `forest` (**published**) | green-black, sage, mint | `#080d0b` | `#e9eee6` | `#93d6b0` |
| `slate` (CSS default) | cool grey, periwinkle | `#15171b` | `#e7e9ed` | `#93a8f5` |
| `ember` | warm charcoal, copper | `#0f0c0a` | `#f1e9dc` | `#e9a178` |
| `onyx` | near black, violet | `#030304` | `#f2f1ee` | `#c9b8ff` |

- To publish a palette, set `data-dark` on `<html>` in **both** `index.html` and `404.html`, and
  update the dark `theme-color` meta in `index.html`. `main.js` also syncs that meta at runtime.
- `data-theme="light|dark"` forces a mode. Only the local dev dock sets it.
- The one hard-coded UI color is the green status dot in the `layers` headline (`#35b27a`).

Links: inherited color, 1px underline in 45% accent, offset `0.22em`; hover turns text and underline
to accent. Focus: 2px accent outline, 3px offset.

## 6. Headline (`lede.js`)

`data-headline` on the `<h1>` picks the published treatment: `classic`, `ink`, `trace` or `layers`
(**published**). Styles live in `styles.css`.

- The HTML holds the plain sentence. JS splits it into word spans, sets `aria-label` to the original
  text and hides the decorated tree with `aria-hidden`.
- `layers` sequence: words rise from blur; a cursor drags a selection frame over "interface" and a
  size tag appears; "API" gets a code-like highlight and a `200 OK` tag. It ends at about 3.1s.
- Tag values are measured: frame size, and the page response time (omitted at 1000ms or more). The
  JSON reply is static copy.
- Hover shows guides on "interface" and the JSON reply on "API". On touch, tap toggles and an
  outside tap closes.
- "interface to the API." is kept on one line so the tags do not cover other text. The standfirst
  gets extra top margin in this treatment.
- `layers` and `trace` depend on the words "interface" and "API". `ink` italicizes by word position.
  Recheck all three if the sentence changes.

## 7. Time-zone line

- Shows Argentina time and the overlap of two 9:00–18:00 working days.
- Argentine time zones get "Hi, fellow Argentine 🇦🇷". Unknown zones fall back to New York.
- Entrance: each word rises from blur, 800ms, 80ms stagger. It waits for the headline through
  `--enter-delay`: classic 1.4s, ink 2.2s, trace 2.4s, layers 3.2s.
- It refreshes every 30s. A time-only change must not replay the entrance (`.is-still`).
- The HTML fallback sentence is hidden until JS is ready, and shows after 4s if it never is.

## 8. Reveal component (time-zone line and footer invitation)

Markup: `.reveal` > `img.reveal-avatar` + `.reveal-text`. `main.js` injects `.reveal-dust` with 22
specks. The box is at least 64px tall, and its right padding (`--avatar-space`, 4.75rem) is reserved
so that the shifted text does not overflow. The padding applies on every screen size.

| State | Trigger | Visual |
| --- | --- | --- |
| rest | default | plain text |
| `.is-peek` | mouse enters | words light up left to right, glow at 55%; **nothing moves** |
| `.is-open` | mouse stays `DWELL` (400ms), or touch tap on the text | text shifts right with a per-word blur, avatar pops in, glow and dust |

Rules that must survive refactors:

- After the mouse leaves, an open box stays open for `LINGER` (220ms). Re-entering cancels closing.
- The open timer does not run while the mouse is on a link. An already open box stays open.
- On touch there is no peek or dwell. Only the text opens it, tapping a link leaves the state
  unchanged, and tapping elsewhere closes it.
- The box stays still and only its children move, which prevents hover flicker.
- In static text each link is a single `.word`, so it keeps its underline; trailing punctuation is
  glued to it. See `wrapWords`.
- The hover blur and peek use `element.animate`, so they never restart the CSS entrance.
- Only mouse and touch open it; there is no keyboard trigger. The content stays readable without it.

## 9. Motion

- Two-stage rhythm: a quiet acknowledgement first, the larger effect only on intent.
- Common easings: `cubic-bezier(0.22, 1, 0.36, 1)` for movement and
  `cubic-bezier(0.34, 1.56, 0.64, 1)` for the avatar's overshoot.
- Motion must not reflow surrounding text. Prefer transform, opacity and filter.
- `prefers-reduced-motion`: CSS animations and transitions are disabled, and JS checks the query
  before calling `element.animate` or running the `ink` and `trace` loops. The universal CSS rule
  does not match pseudo-elements, so the `.reveal::before` glow can still fade. New JS motion needs
  its own check.

## 10. Assets and sharing

- `avatar.webp`: 300×343, transparent, fitted (`object-fit: contain`) in a 64×64 box. Do not crop or
  stretch it.
- `og-image.jpg`: 1200×630 with avatar, name, role and headline only, set large for thumbnails. It
  uses the `slate` colors, which differ from the published `forest` palette. When replacing it, raise
  `?v=` in `og:image` and check its width, height and alt tags. Its generator is not in the repo.

## 11. Local design tools

On localhost, `main.js` loads `dev.js` (not deployed). The dock previews headline, light or dark
mode, dark palette, time zone, date and the clipboard-less state. Previews are stored in
`localStorage` and never change published settings. A new headline or palette option must be added to
both the implementation and the dock.

## 12. Checks for design changes

- Widths 320, 375, 900 and 1200px: no horizontal scroll, no overlapping headline tags.
- Light and dark mode.
- Mouse quick pass, dwell and approach to a footer link; touch tap and outside tap.
- Reduced motion.
- A real phone for touch behavior and thin-weight legibility; simulated events are not enough.
