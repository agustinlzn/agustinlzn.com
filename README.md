# agustinlzn.com

Personal site: a single static page with contact details, links, work and projects.
No framework and no build step: plain HTML, CSS and a few lines of JavaScript.

## Files

- `index.html` — the page content.
- `styles.css` — styles. Colors are variables at the top of the file.
- `fonts/` — Source Serif 4 (variable, self-hosted, SIL Open Font License).
- `main.js` — the email link (assembled in JS so scrapers don't find the address in the HTML), its "Copy" button and the Rosario / New York clock.
- `404.html` — page shown for unknown URLs.
- `favicon.svg` — tab icon.
- `vercel.json` — Vercel settings (clean URLs).
- `agustin-lozano-resume.pdf` — the English resume linked from the page. **Add it here** (export the
  English Google Doc as PDF and save it with this exact name).

## Local preview

```sh
cd website
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (Vercel)

In the Vercel project for agustinlzn.com:

- Root Directory: `.` (repo root)
- Framework Preset: Other
- Build Command: none · Output Directory: `.`

Every push to the main branch redeploys the site.

## Keeping it current

The page mirrors the CVs but is not a copy. When the CVs change, update only what matters here:
job title, the one-line work descriptions, projects, and the resume PDF.
