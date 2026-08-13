# thai-journal 📝

A free note-taking web app inspired by the *feel* of tablet note apps — notes,
handwriting, PDF markup, and flashcards — with an original design, palette,
icons, and branding. Everything is saved locally on your device (localStorage +
IndexedDB): no account, no cloud, no tracking.

## Features

- **Notebooks** — a shelf of color-coded notebook covers with 5 cover patterns
  (solid, gradient, dots, stripes, grid) and a star emblem; create, rename, delete.
- **Notes** — rich-text editor (headings, bold/italic/underline, lists, colored
  text), color coding, starring favorites, and search across all notes. The
  editor is a paper sheet with a floating tool dock.
- **Sketch** — a handwriting pad with a **mode-based bottom bar**: Pen,
  Select (drag a loop to grab a group, then move / duplicate / delete it), Hand
  (pan the page), Text (tap to place and type), Stickers (emoji palette), and
  Image (insert a photo). Pen mode has highlighter + eraser, a 10-color palette,
  adjustable stroke size, undo/redo, and PNG export. A **paper library** offers
  13 paper styles with live previews: blank, lined, narrow lined, wide lined,
  handwriting guide, small grid, large grid, dot grid, graph paper, Cornell,
  checklist, weekly planner, and monthly calendar.
- **File I/O** — export any note to a `.json` file (with its sketch and paper
  style) and import it back, in the note editor. Everything stays on-device.
- **PDF markup** — import a PDF and annotate it page by page with the same pens
  and highlighters. Documents stay on your device.
- **Flashcards** — build decks of question/answer cards and study them with a
  flip-card session, progress tracking, and a session summary.
- **Dark mode** — toggle in the sidebar or the settings screen; your choice is remembered.
- **Mobile-first** — on phones the app is a proper smartphone app: a top bar and a
  bottom tab bar (Notes · Sketch · Cards · Settings), with the notes storage home
  screen and a settings storage screen. On laptops the layout expands into the
  sidebar navigation and wider grids.
- **Settings storage** — theme, data export (JSON backup), reset demo, and
  clear-all-data with confirmation.

## Run locally

```bash
npm install
npm run dev      # development server at http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## Install on your iPhone (add to Home Screen)

The app is a **PWA**: it ships a service worker (offline app shell), an app
manifest, and iOS home-screen meta tags, so it launches like a real app and
works with no connection.

1. Host the site (see below) and open it in Safari.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Launch it from your home screen — it opens full-screen, and all your data
   (notes, sketches, decks) is stored offline on the device. Note: iOS may ask
   you to confirm the notification permission when first launching an installed
   PWA.

Everything you write — notes, sketches, PDFs, flashcard decks — is saved
locally on the device (localStorage + IndexedDB). No account or internet needed
after install.

## Publish as a website

The build output in `dist/` is a fully static site (HTML + JS + CSS + icons),
so it can be hosted anywhere. The Vite config uses `base: "./"`, so it also
works from a sub-path. For the PWA to install, the site must be served over
**HTTPS** (or `localhost`) — GitHub Pages, Netlify, Vercel, and Cloudflare Pages
all provide this for free.

### GitHub Pages

```bash
npm run build
git add dist
git commit -m "Build site"
git subtree push --prefix dist origin gh-pages
```

Or push the whole repo and enable Pages from the `main` branch root — either
works since the app is a static SPA.

### Netlify / Vercel / Cloudflare Pages

1. Connect your repo (or drag-and-drop the `dist/` folder).
2. Build command: `npm run build`
3. Publish directory: `dist`

That's it — no server, database, or environment variables needed. Users' data
is saved in their own browser.

## Tech

- React 18 + Vite 5
- [pdf.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- Canvas-based drawing with pointer events (works with mouse and touch)
- localStorage (notes/notebooks/decks) + IndexedDB (PDF files)
- Service worker (offline app shell) + web app manifest (installable PWA)

## Notes on the design

This project was built as an **original** take on a note-taking app — original
name, logo, colors, icons, and layout. It does not copy any third-party app's
branding or assets.
