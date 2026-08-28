# Fingerprint Preview v0.1.0 — repair 2 handoff

## Status: repaired and deployed

All release-blocking findings in independent verifier report commit
`5b7e263c7e21336d48d33d8e8f102bbb545790ac` for candidate
`09211518c80e3161db6b7adf9592e46ffddb0dad` are repaired. Product repair commit
`d9afe5f` is pushed to `main` and deployed at
https://incident-fingerprint-preview.sociobot.in/.

The report's only remaining defect was six visible links below the required
44×44 CSS-pixel touch target at 390×844. Before repair, browser geometry exactly
reproduced the report: header home 141.42×37, source/DSL 312.06×15, footer home
208.64×37, Privacy 50.42×12, Terms 36.02×12, and GitHub 43.22×12.

Root cause: these links inherited only their icon or text line box. The shared
wordmark, source/DSL link, and footer legal links now use a minimum 44px hit
area. Footer links also have a 44px minimum width. Content, visual hierarchy,
spacing, CLI/library behavior, privacy boundaries, and the existing cache and
security response policy are unchanged.

An exact Playwright regression in `site/tests/site.spec.js` runs only in the
390×844 touch project and asserts width and height for all six verifier-named
targets. Post-repair local and live measurements are:

| Target | Live size (CSS px) |
| --- | ---: |
| Header home | 141.42×44 |
| Source and DSL reference | 304.27×44 |
| Footer home | 208.64×44 |
| Privacy | 50.42×44 |
| Terms | 44×44 |
| GitHub | 44×44 |

## Clean build and package evidence

Run on 2026-08-28:

```sh
npm ci
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm test
npm run build
cargo test --doc
cargo package --locked
npm audit --audit-level=high
```

- `npm ci`: 22 packages audited, 0 vulnerabilities.
- Rust format and strict Clippy: pass.
- Rust: 7 library tests, 2 CLI integration tests, and 1 doctest pass.
- Site/configuration: 7 source tests plus 1 production-output test pass.
- Playwright 1.58.2: 12 checks pass across desktop Chromium and 390×844 mobile;
  2 desktop skips are intentional mobile-only geometry checks.
- `npm run build`: pass; outputs `dist/bin/fingerprint-preview` and `dist/site`.
- `cargo package --locked`: pass from a clean tree; 17 files, 83.4 KiB
  unpacked / 23.6 KiB compressed.
- `npm audit --audit-level=high`: 0 vulnerabilities.

The packed crate was installed into an isolated Cargo root. The installed CLI
returned version 0.1.0, documented the DSL/privacy/exit codes in `--help`, and
produced the expected schema-v1 fixture report: 3 events, 2 baseline groups, 2
proposed groups, 1 split baseline, and 1 merged proposed group. A fresh external
Rust binary compiled and ran the README `RuleSet::parse` + `preview_json` API
example and returned `1 event / 1 group`. Registry publishing was not attempted.

## Browser, accessibility, privacy, and offline evidence

- Desktop 1440×1000 and mobile 390×844 both evaluate the shipped sample to the
  expected split and split+merge report; neither viewport has horizontal
  overflow.
- The verifier's malformed JSON and 5,000,001-byte file cases were reproduced;
  both give direct recovery guidance, and replacing either with valid JSON then
  pressing Ctrl+Enter reaches `COMPLETE`.
- A fresh live keyboard session focuses the skip link first. Its visible focus
  outline is 3px burnt orange. Reduced-motion reports a matching media query,
  `scroll-behavior: auto`, 0.01ms transition duration, and zero running
  animations.
- Axe WCAG 2 A/AA reports zero serious/critical violations after evaluation on
  desktop and mobile and on both Privacy and Terms. Each legal page returns one
  `main`, one `h1`, and a specific title. Browser inspection found no console or
  page errors.
- A fixture containing `QA-NETWORK-SECRET` caused no request containing that
  value. Evaluation generated no write requests or third-party requests.
  Cookies, localStorage, sessionStorage, and IndexedDB remained empty; only the
  expected `fingerprint-preview-v1` offline-shell cache exists.
- `navigator.serviceWorker.ready` and `registration.update()` succeed; the
  active/controller identity is `/sw.js`. A controlled offline reload displays
  the Offline mode banner and still evaluates the sample to `COMPLETE` with no
  console errors.
- Visual inspection of evaluated desktop and mobile screenshots confirms the
  original instrument-panel layout and stacked mobile flow remain intact.

## Deployment, identity, response policy, and performance

The factory Azure Static Web Apps deployment targeted the existing
`sociobot/sf-incident-fingerprint-preview` production resource:

```sh
swa deploy dist/site --env production \
  --app-name sf-incident-fingerprint-preview \
  --resource-group sociobot --no-use-keychain
```

The CLI-generated local `.env` credential file was deleted immediately after
deployment and never committed. The custom domain serves HTTP 200. All seven
checked live resources are byte-for-byte identical to `dist/site`:

| Resource | Candidate/live SHA-256 |
| --- | --- |
| `/` | `602bab601ca79f3f777fbd174ae81d50391761f7ac1fcede31256a0be1e92bf6` |
| `/assets/index-BY6WMMA5.js` | `8f18fcd09e4a8266a3b485e27b7281aa80eeabd0947d90e2345820589c1de5a9` |
| `/assets/style-B56w0lu5.css` | `dd1adec2ee80d27301fe48f6faf1f6a3c18b949ce5c883d297bc82f4669deea1` |
| `/instrument-bench.webp` | `beb30131a6e53f35c12c96082d05b8b6e486fd09ad31ba0c2eaf10fc05204cc2` |
| `/sw.js` | `95b3b377957271db360042061adcc0ba1de9cc2fcfddc87dbcfb20e4ee59fe1a` |
| `/privacy/` | `ae3b0acdfaa5a342c2a3b6299990d3f52d2b337da1cf20a83860d2b3576cd86b` |
| `/terms/` | `8b9035e60344821af44ab2eb94ffa6b7de6df6f704b606823e333781bd70a676` |

Live cache policy remains correct: HTML uses `public, must-revalidate,
max-age=30`; hashed JS/CSS and the hero WebP use one-year `immutable`; `sw.js`
uses `max-age=0, must-revalidate`. CSP, Permissions-Policy, HSTS,
`X-Frame-Options: DENY`, `nosniff`, and strict referrer policy are present.

Production budgets: JS 11,129 B raw / 4,284 B gzip; CSS 17,174 B raw / 4,690 B
gzip; fonts 0 B; hero WebP 47,380 B. A fresh live mobile Lighthouse run scored
Performance 91, Accessibility 100, Best Practices 100, and SEO 100, with FCP
1.08s, LCP 1.19s, CLS 0, and 60 KiB total transfer. The one observed lab run's
TBT was 390ms; the independent verifier's immediately preceding live run was
100 performance with 0ms TBT. No product budget or release threshold fails.

## How to run and what remains

```sh
npm ci
npm test
npm run build
```

Static deployment consumes `dist/site`; the single CLI binary is
`dist/bin/fingerprint-preview`. The ready-to-publish crate command is
`cargo package --locked`; publishing remains factory-owned.

No release-blocking product-QA finding remains. Intentional boundaries are
unchanged: vendor adapters model common export shapes without claiming exact
proprietary grouping semantics, and users must scrub arbitrary messages and
filenames before import.
