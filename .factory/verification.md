# Independent verification — FAIL

**Verified:** 2026-08-28  
**Candidate:** `5cdb04f4cc071801fd8927a5ad45229c99ce9bf0`  
**Live URL:** https://incident-fingerprint-preview.sociobot.in/

## Verdict

**FAIL for deployment readiness.** The candidate itself builds and functions
correctly, and the live application is byte-for-byte the candidate build. The
live host does not apply the repository's required cache policy to immutable
assets, however. It serves every checked response with
`Cache-Control: public, must-revalidate, max-age=30`, including the hashed JS,
hashed CSS, and WebP. The shipped `site/public/_headers` requires one-year
immutable caching for `/assets/*` and the hero image. This violates the static
product caching contract and makes every repeat visit revalidate the shell and
assets.

## Clean-checkout build and package evidence

A detached, clean worktree at the candidate SHA was used at
`/tmp/incident-fingerprint-preview-verify`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 22 packages audited, 0 vulnerabilities |
| `cargo fmt --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm test` | PASS: 7 Rust unit, 2 CLI integration, 1 doctest, 5 evaluator tests, 11 Playwright passed / 1 intentional non-mobile skip |
| `npm run build` | PASS; produced `dist/site/` and `dist/bin/fingerprint-preview` |
| `cargo test --doc` | PASS |
| `cargo package --allow-dirty` | PASS; 17 files, 82.9 KiB unpacked / 23.4 KiB crate |
| Packed consumer CLI | PASS; unpacked `.crate`, `cargo install --path … --root …`, then ran `--help` and fixture `preview --json` |
| Packed consumer library | PASS; fresh `cargo new` consumer linked the unpacked crate and ran `RuleSet::parse` plus `preview_json` successfully |

The installed CLI returned the expected fixture summary: 3 events, 2 baseline
groups, 2 proposed groups, 1 split baseline group, and 1 merged proposed group.
It returned exit code 2 with useful messages for malformed JSON, an unknown
rule part, and an unknown adapter. An empty event array returned a valid,
versioned empty report.

## End-to-end product checks

- Desktop Chromium and 390×844 mobile: sample evaluation produced the expected
  split+merge output and enabled JSON export. No horizontal overflow on mobile.
- Browser-local error and recovery: malformed JSON, empty array, and invalid
  DSL each produced their relevant announced error/empty state; replacing them
  with a valid one-event fixture recovered successfully via Ctrl+Enter.
- File boundary: a 5,000,001-byte JSON file was rejected with the documented
  5 MB guidance; a subsequent small file evaluated successfully.
- Keyboard: the skip link is first in tab order and shows a 3px visible focus
  outline; the evaluator shortcut works. Reduced-motion media changes smooth
  scrolling to `auto` and transition/animation duration to 0.01 ms.
- Accessibility: axe WCAG 2 A/AA reported **0 serious/critical** violations
  after evaluation on both desktop and mobile. The live page has title,
  `lang=en`, one `<main>`, and one `<h1>`.
- PWA: a production local preview registered and controlled the service worker;
  after first online load, offline reload rendered the shell and offline banner
  with no errors. The worker version-cleans old caches, calls `skipWaiting`,
  and claims clients on activation.
- Privacy/network: request capture during desktop, mobile, and live use found
  no third-party outbound requests, analytics, storage, cookies, or uploads.
  The report tests confirm representative frames exclude line numbers and
  source variables/context.
- Console/page errors: none in local or live Chromium checks.

## Deployment identity, headers, budgets, and policies

The live root, JS, CSS, hero WebP, service worker, privacy page, and terms page
were SHA-256 identical to the candidate's production build. The live root
returned HTTP 200. HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
and `X-Content-Type-Options: nosniff` were present.

| Asset / measure | Evidence | Result |
| --- | --- | --- |
| JS | 11,129 B raw / 4,284 B gzip | PASS; below 200 KB |
| CSS | 16,997 B raw / 4,672 B gzip | PASS; below 50 KB |
| Hero WebP | 47,380 B | PASS; below 300 KB |
| Lighthouse mobile, local production preview | Performance 99; Accessibility 100; Best Practices 100; SEO 100; FCP 0.9 s; LCP 1.4 s; TBT 130 ms; CLS 0 | PASS |
| HTML and `sw.js` cache | `public, must-revalidate, max-age=30` | Acceptable revalidation policy |
| Hashed JS/CSS and WebP cache | `public, must-revalidate, max-age=30` | **FAIL**; expected `max-age=31536000, immutable` per `site/public/_headers` |
| Content-Security-Policy / Permissions-Policy | Absent from live response | Low-severity hardening gap |

## Defects

1. **Medium — live immutable-asset caching is not deployed.** The host ignores
   `site/public/_headers` for `/assets/*` and `/instrument-bench.webp`. This is
   reproducible with:

   ```sh
   curl -sSI https://incident-fingerprint-preview.sociobot.in/assets/index-BY6WMMA5.js
   ```

   Actual: `cache-control: public, must-revalidate, max-age=30`. Required by
   the repository contract: `public, max-age=31536000, immutable`.

2. **Low — live response omits CSP and Permissions-Policy.** There is no
   third-party runtime content and no observed injection path, so this is
   defense-in-depth rather than an observed exploit. Add a restrictive static
   CSP and a minimal Permissions-Policy at the deployment layer.

## Required next step

Correct the deployment/static-host header configuration, redeploy, and rerun
the live header checks. No product-code change is indicated by this QA run.
