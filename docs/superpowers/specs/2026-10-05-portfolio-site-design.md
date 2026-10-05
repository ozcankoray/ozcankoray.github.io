# korayozcan.me — Personal Site & GitHub Profile Design

Date: 2026-10-05
Status: Draft, awaiting review

## 1. Goal

A personal brand site at `korayozcan.me` that holds projects, CV and writing, and grows over time. Secondary goals:

- **Hiring:** a recruiter reaches the current role, the CV and the best projects within 30 seconds.
- **Products:** live apps (Nerdi) get a visible showcase with an App Store link.

No positioning slogan. Identity line: **Koray Özcan — Computer Engineer**.

### Success criteria

- Home page shows name, current role, links (GitHub, LinkedIn, email, CV PDF) above the fold on desktop and mobile.
- Every page exists in TR and EN with equivalent content.
- Lighthouse ≥ 95 in Performance, Accessibility, Best Practices, SEO on home, a project page, `/cv` and a blog post.
- WCAG 2.2 AA color contrast in both themes.
- Served over HTTPS at `https://korayozcan.me`.

## 2. Content

### Sources

- Work experience: LinkedIn (authoritative, newer than the PDF).
- Education, projects, conferences: `Koray Özcan_CV.pdf`.

### Privacy

The phone number and home address never appear on the site or in the published CV PDF. Contact is email (`korayozcan33@gmail.com`) and LinkedIn only.

### Experience (newest first)

| Dates | Role | Company |
|---|---|---|
| 2026.08 → now | Junior Software Test Automation & Quality Engineer | Sompo Sigorta |
| 2026.04 → 2026.07 | Business Analyst (Intern) | Ödeal |
| 2025.01 → 2026.06 | Student Research Assistant | BFRC — Bahçeşehir University Financial Research Center |
| 2025.09 → 2025.12 | Software Engineer (Intern) | Kontrolmatik Technologies |
| 2025.04 → 2025.08 | Project & Service Management (Intern) | Eclit |
| 2024.09 → 2024.10 | IT Governance (Intern) | Sompo Sigorta |

Bullets are taken from LinkedIn and translated to Turkish.

### Education

- B.Sc. Computer Engineering (English), Bahçeşehir University, 2022–2026, GPA 3.27
- Minor in Economics (English), Bahçeşehir University, 2024–2026, GPA 3.50

### Other

- Programs: YÖK Data Analysis School (AI track); TÖDEB & Marmara University "Fintek Çırağı".
- Languages: Turkish (native), English (C1).

### Featured projects (exactly three)

1. **KAP Fund Analytics** (capstone): a containerized FastAPI + SvelteKit + TimescaleDB app. A deterministic PyMuPDF pipeline parses unstructured KAP fund PDFs into structured time series. Repo is private, so there is no GitHub link.
2. **Nerdi: Research Papers**: iOS app, live on the App Store (https://apps.apple.com/us/app/nerdi-research-papers/id6813826387). A few real papers a day from OpenAlex, with original abstracts and no AI summaries; 12 fields; Nerdi Plus subscription. Links: App Store, privacy/support pages (public `nerdio` repo).
3. **Food Inflation Tracker**: collects prices from the marketfiyati.org.tr API on a schedule and computes TÜİK-style food inflation. Repo is private, so there is no GitHub link.

No other projects appear on the site.

Each project page follows the same structure: Problem → Approach → Architecture (inline SVG diagram) → Results / what I learned → Links. Screenshots are supplied by Koray; until they exist, a styled placeholder is used, never a fake image.

### About text and first blog post

Drafted together during implementation. The blog launches with zero or one post; the section hides when it has no posts.

## 3. Visual design: "B3 — Graphite + Lime"

A split layout: a fixed intro column on the left and scrolling content on the right. Mono details give it an engineering tone.

- **Dark theme (default when the OS prefers dark):** background `#0e0f0f`, surface border `#2a2d2a`, text `#c8cbc8`, strong text `#f2f4f2`, muted `#8a8f8a`, faint `#5d625d`, accent lime `#c6f432`.
- **Light theme:** off-white paper background, near-black text, and the accent deepened to an olive that passes AA on white. Exact values are fixed during implementation and verified by the contrast check.
- **Type:** Inter (UI and body), JetBrains Mono (dates, labels, tags, nav numbers). Both self-hosted and subset with Latin + Turkish glyphs.
- **Details:** sharp corners; the current item gets a 2px lime left border; tags are written as `[java]`; dates as `2026.08 → now`; nav reads `01 ▸ about`.
- **Mobile (< 900px):** one column; the intro is not sticky; the section nav is hidden.
- **Motion:** only subtle hover/focus transitions and active-nav changes, all disabled under `prefers-reduced-motion`.

## 4. Information architecture

| Route (TR default) | EN route | Content |
|---|---|---|
| `/` | `/en/` | Split home: 01 about, 02 experience (current role expanded, others compact, link to CV), 03 projects (3 cards), 04 writing (latest 3; hidden if empty) |
| `/projeler/[slug]` | `/en/projects/[slug]` | Project case study |
| `/cv` | `/en/cv` | Full web CV, print stylesheet, PDF download (TR and EN PDFs) |
| `/yazilar` | `/en/writing` | Dated post list |
| `/yazilar/[slug]` | `/en/writing/[slug]` | Post, max ~68ch reading width |
| `/404` | — | Bilingual 404 |

Left column on every page: name, role line, short intro, nav (home only), links, language switch, theme toggle.

## 5. Technical architecture

- **Framework:** Astro 5, static output, TypeScript strict. No UI framework.
- **Styling:** plain CSS with tokens in `src/styles/tokens.css`. Theme comes from `prefers-color-scheme` and can be overridden with a toggle via `data-theme` on `<html>`. The override is saved in `localStorage`; reads and writes are wrapped in try/catch.
- **Content:**
  - `src/content/projects/{tr,en}/*.md`: frontmatter `title, summary, year, stack[], links{appStore?, site?, repo?}, status ('live' | 'complete'), order, cover?`.
  - `src/content/blog/{tr,en}/*.md(x)`: `title, description, date, draft`.
  - `src/data/cv.ts`: typed experience/education/programs/languages with `{ tr, en }` strings.
  - `src/i18n/ui.ts`: UI strings, plus `t(lang, key)` and `localizedPath(lang, route)` helpers.
  - Schemas are validated with Zod in `src/content.config.ts`; the build fails on invalid content.
- **i18n:** Astro i18n routing with `defaultLocale: 'tr'`, `locales: ['tr','en']`, and `prefixDefaultLocale: false`. The language switch maps to the equivalent page through a route table, so slugs can differ per language. Each page has `<link rel="alternate" hreflang>` tags and `x-default`.
- **JS (inline and small):** theme toggle, plus IntersectionObserver-based active nav on the home page.
- **SEO:** a `<Seo>` component (title, description, canonical, OG/Twitter), OG images generated at build time (satori + resvg) per page, `@astrojs/sitemap`, `@astrojs/rss` per language, and JSON-LD `Person` on home.
- **Analytics:** none at launch.
- **CV PDF:** generated from `/cv` with the print stylesheet (Playwright `page.pdf()` script, run manually), committed to `public/cv/`.

## 6. Deployment

- The local folder becomes the source of the existing public repo `ozcankoray/ozcankoray.github.io`. That repo currently holds only `CNAME`; contents are confirmed before replacing them, and the push needs Koray's approval.
- GitHub Actions (`withastro/action` + `actions/deploy-pages`) build and deploy on push to `main`.
- Pages build type switches from legacy to workflow. `public/CNAME` = `korayozcan.me`. "Enforce HTTPS" is turned on once the certificate is issued.
- DNS is already pointing (Pages status: built). It is verified, not changed.

## 7. GitHub profile (light touch)

- New public repo `ozcankoray/ozcankoray` with a profile README: name and role, 2–3 line intro, the three projects (one line each, linking to their site pages), and links to the site, LinkedIn and CV. No stats widgets, no badge walls.
- Profile fields: bio (one line), website `https://korayozcan.me`, location Istanbul.
- Pins: `ozcankoray.github.io`, `nerdio`, `KorayOzcan_testAutomation`, plus any other public repo Koray chooses.
- `nerdio` and `ozcankoray.github.io` get clean descriptions and topics.
- No repo is deleted, archived or made public as part of this work.

## 8. Testing & quality

- **Vitest:** `cv.ts` integrity (dates ordered, every string has tr + en), `localizedPath` / route table round-trips, and the content schema accepts the real files.
- **Playwright (against `astro preview`):** every route renders in TR and EN with a 200 status and the correct `lang` attribute; the language switch lands on the equivalent page; internal links have no 404s; the theme toggle persists; no horizontal scroll at 360px width.
- **Accessibility:** axe check in Playwright on key pages; visible focus styles; skip link; semantic landmarks.
- **Lighthouse:** run manually (or with `web-perf`) before launch against the targets in §1.

## 9. Out of scope

- Comments, newsletter, CMS, analytics, contact form.
- Making private repos public.
- Writing more than one blog post.
- Screenshots and design assets for projects (Koray supplies them; placeholders until then).
