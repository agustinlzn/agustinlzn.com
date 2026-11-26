# agustinlzn.com

Personal site: a single static page with contact details, links, work and projects.
No framework: plain HTML, CSS and a few lines of JavaScript. The only build step stamps the deploy month and year (`build.js`).

## Files

- `index.html` — the page content.
- `styles.css` — styles. Colors are variables at the top of the file, with a dark set that follows the visitor's system setting (`prefers-color-scheme`).
- `fonts/` — Source Serif 4 (variable, self-hosted, SIL Open Font License).
- `main.js` — the email link (assembled in JS so scrapers don't find the address in the HTML), its "Copy" button and the time-zone line under the email (Argentina time plus how many hours our 9-to-6 working days overlap, from the browser time zone; Argentine visitors get "Hi, fellow Argentine" instead, unknown zones fall back to New York).
  The line animates in word by word after a short delay (`--enter-delay` in `styles.css`). On
  hover over its 64px-tall box, or on a tap on the text on touch screens, it slides right with a
  word-by-word blur to reveal the avatar, over a trail of amber dust (`--dust`).
- `avatar.webp` — the illustrated portrait shown at 64×64 when hovering or tapping the time-zone line.
- `og-image.jpg` — the preview shown when the link is shared (Open Graph tags in `index.html`). If you
  replace it with a different size, update `og:image:width` and `og:image:height`.
- `lede.js` — the home headline treatments (see **Headline** below).
- `dev.js` — dev dock for local previews only (see below). Not deployed: listed in `.vercelignore`.
- `404.html` — page shown for unknown URLs.
- `favicon.svg` — tab icon.
- `vercel.json` — Vercel settings: clean URLs, and `node build.js` as the build command.
- `build.js` — the only build step: stamps the deploy month and year into the footer's "Updated Nov 2026" (`<time id="updated">` in `index.html`). Locally the date committed in the HTML is shown.
- `agustin-lozano-resume.pdf` — the English resume linked from the page. To update it, export the
  English Google Doc as PDF and replace this file keeping the exact name.

## Headline

The published treatment is one setting, the `data-headline` attribute of the `<h1>` in `index.html`.
Change it, commit and push to deploy it.

| Value | What it does |
| --- | --- |
| `classic` | Plain text, no animation. |
| `ink` | Words rise from a mask, "end to end" in italic, and letters get heavier under the pointer. |
| `trace` | A line joins "interface" and "API", with a request and its response travelling along it. |
| `layers` | "interface" is selected like in a design tool and "API" answers `200 OK`. Hover or tap for guides and a JSON reply. |

The dev dock previews any of them without changing the setting. The greeting under the email waits
longer or shorter for each one (`--enter-delay` in `styles.css`). `trace` and `layers` look for the
words "interface" and "API", and `ink` italicises words 4 to 6, so check them if the sentence changes.

## Analytics

Vercel Web Analytics, loaded with the two `<script>` tags in the `<head>` of `index.html` and
`404.html` (no npm package: there is no bundler). It must be enabled in the Vercel project
(Analytics tab). The script only exists on Vercel, so it 404s on a local preview; that is harmless.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

On localhost a **Dev** dock appears in the bottom-right corner (loaded by `main.js` only there). It
forces light or dark mode, sets the visitor's time zone and a fixed date (to check daylight saving)
for the time-zone line, and can hide the Copy button as if the clipboard were unavailable. Its settings
are kept in `localStorage` across reloads; **Reset** goes back to the real ones.

## Deploy (Vercel)

In the Vercel project for agustinlzn.com:

- Root Directory: `.` (repo root)
- Framework Preset: Other
- Build Command and Output Directory come from `vercel.json` (`node build.js`, `.`)

Every push to the main branch redeploys the site.

## Keeping it current

The page mirrors the CVs but is not a copy. When the CVs change, update only what matters here:
job title, the one-line work descriptions, projects, and the resume PDF.
