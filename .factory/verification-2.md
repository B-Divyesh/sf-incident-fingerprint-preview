# Independent verification 2 — FAIL

**Verified:** 2026-08-28  
**Candidate:** `09211518c80e3161db6b7adf9592e46ffddb0dad`  
**Live URL:** https://incident-fingerprint-preview.sociobot.in/  
**Work order:** `incident-fingerprint-preview-verify-2`

## Verdict

**FAIL.** The CLI/library, browser evaluator, production build, deployed PWA,
privacy boundary, caching repair, and response hardening all pass. The live
390px layout still misses the factory's explicit 44×44px minimum touch-target
baseline on six visible links. This is a medium-severity mobile accessibility
defect and prevents an unqualified definition-of-done result.

The earlier deployment-only caching failure is closed by fresh evidence. This
report does not rely on the builder's repair claim.

## Clean candidate and repository gates

The working tree was clean before testing and `HEAD` was the candidate SHA.
No product code was modified.

| Check | Fresh result |
| --- | --- |
| `npm ci` | PASS; 22 packages audited, 0 vulnerabilities |
| `cargo fmt --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm test` | PASS; 7 Rust unit, 2 CLI integration, 1 doctest, 7 site/config, 11 Playwright passed and 1 intentional project skip |
| `npm run build` | PASS; exact factory build produced `dist/site/` and `dist/bin/fingerprint-preview` |
| `cargo test --doc` | PASS; documented public API example compiled and ran |
| `cargo package --locked` | PASS; crate verification compiled; 17 files, 83.4 KiB unpacked / 23.6 KiB compressed |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |

There is no separate TypeScript typecheck or JavaScript lint command in the
repository. Vite compiled the TypeScript entry in the production build; Rust
formatting and strict Clippy are the available static gates.

## Packaged CLI and library

The generated crate was installed with `cargo install --path
target/package/incident-fingerprint-preview-0.1.0 --root <clean-dir> --locked`.
A separate clean `cargo init` consumer depended on the unpacked crate and ran
the documented `RuleSet::parse` + `preview_json` API successfully (`1 event / 1
group`). No registry publish was attempted.

- `--version` returned `fingerprint-preview 0.1.0`; `--help` described the DSL,
  local privacy boundary, subcommand, scripting output, and exit codes.
- The shipped three-event fixture returned a schema-v1 JSON report with 2
  baseline groups, 2 proposed groups, 1 split baseline, and 1 merged proposed
  group. It exposed both `split` and `split_and_merge` classifications.
- `[]` was a valid boundary state with zero events/groups and exit 0.
- Malformed JSON, `request.url`, and an unknown adapter produced specific
  recovery guidance and exit 2. A missing file produced exit 1.
- A stack frame containing line 42, `SECRET-CONTEXT`, and `SECRET-TOKEN`
  produced only module/function/filename/in-app fields; the sensitive detail
  did not appear in JSON output.
- The locked runtime dependency tree contains only Clap, Serde, and Serde JSON
  families; no network or telemetry client is present.

## Live end-to-end evidence

Fresh Chromium runs covered 1440×1000 desktop and 390×844 mobile.

- The sample evaluated on both viewports to 3 events, 2 baseline groups, 2
  proposed groups, and the expected split plus split+merge rows. There was no
  horizontal overflow (`scrollWidth == clientWidth`: 1440 and 390).
- Malformed JSON, empty array, and invalid DSL displayed field-specific errors
  or the designed empty state. Replacing a rejected 5,000,001-byte file with a
  one-event JSON file and pressing Ctrl+Enter recovered to `COMPLETE`.
- Keyboard-only traversal reached the skip link first, then the evaluator in a
  logical sequence. Enter ran the focused Evaluate button. The skip link and
  Evaluate button each had a visible 3px burnt-orange outline.
- Under `prefers-reduced-motion: reduce`, the query matched, root scrolling was
  `auto`, transition/animation durations were 0.01ms, and no animations ran.
- Axe WCAG 2 A/AA found **0 serious/critical** violations on evaluated desktop,
  evaluated mobile, Privacy, and Terms. Main, Privacy, and Terms each returned
  HTTP 200, a title, one `main`, and one `h1`; the main page had `lang="en"`
  and meaningful alt text.
- No console errors or uncaught page errors occurred on desktop, mobile,
  Privacy, Terms, PWA update, or offline evaluation.
- Visual inspection confirmed the product-specific instrument-panel treatment
  and usable stacked mobile workflow.

## Privacy and browser requests

Request capture during real evaluation saw only same-origin GET requests. It
saw no POST/PUT requests and no request containing an injected
`QA-NETWORK-SECRET` event value. Cookies, localStorage, sessionStorage, and
IndexedDB were empty. Cache Storage contained only the expected
`fingerprint-preview-v1` offline shell. There were no third-party fonts,
scripts, analytics, telemetry, or uploads.

## PWA and offline behavior

`navigator.serviceWorker.ready` succeeded; `registration.update()` completed;
the active worker and controller were both `/sw.js`. After Chromium was put
offline, reload rendered the shell, showed the explicit Offline mode banner,
and evaluated the sample to the same 3-event/2-group result without errors.

## Deployment identity, policies, caching, and budgets

The deployed root, hashed JS, hashed CSS, hero WebP, service worker, Privacy,
and Terms were SHA-256 identical to the fresh candidate production build.
Representative pairs:

| Resource | Candidate/live SHA-256 |
| --- | --- |
| `/` | `5108a6e96543d929e6a94cbdf4efda9e6eba66bfa4a3afc77ef0fb6bc108651e` |
| `/assets/index-BY6WMMA5.js` | `8f18fcd09e4a8266a3b485e27b7281aa80eeabd0947d90e2345820589c1de5a9` |
| `/assets/style-d6VWJxLT.css` | `6f2be6a30e0b5e255e8859893d4722a2beaef4570bdc30605afc2e2ae24955f3` |
| `/instrument-bench.webp` | `beb30131a6e53f35c12c96082d05b8b6e486fd09ad31ba0c2eaf10fc05204cc2` |
| `/sw.js` | `95b3b377957271db360042061adcc0ba1de9cc2fcfddc87dbcfb20e4ee59fe1a` |

Live response checks now show:

- HTML: `public, must-revalidate, max-age=30`.
- Hashed JS/CSS and hero WebP: `public, max-age=31536000, immutable`.
- `sw.js`: `public, max-age=0, must-revalidate`.
- CSP is restrictive and same-origin; Permissions-Policy disables sensitive
  capabilities. HSTS, `X-Frame-Options: DENY`, `nosniff`, and strict referrer
  policy are present. This closes both findings from the first verification.

| Budget / measurement | Result |
| --- | --- |
| Initial JS | 11,129 B raw / 4.27 KB gzip — PASS (≤200 KB) |
| CSS | 16,997 B raw / 4.66 KB gzip — PASS (≤50 KB) |
| Fonts | 0 B — PASS (≤120 KB) |
| Hero WebP | 47,380 B — PASS (≤300 KB) |
| Lighthouse live mobile | Performance 100, Accessibility 100, Best Practices 100, SEO 100 |
| Lighthouse metrics | FCP 0.9s, LCP 1.1s, TBT 0ms, CLS 0, total transfer 59 KiB — PASS |

## Defects

1. **Medium — six visible mobile links miss the required 44px touch-target
   height.** At a 390×844 touch viewport, browser geometry measured the header
   home link at 141×37, the source/DSL link at 312×15, the footer home link at
   209×37, and Privacy/Terms/GitHub at 50×12, 36×12, and 43×12 respectively.
   These links are operable and axe reports no serious/critical issue, but they
   do not meet the attached accessibility/design contract's explicit ≥44×44
   CSS-pixel target. Increase their clickable padding/min-height without
   reducing current spacing or changing the visual hierarchy.

No high- or critical-severity defects were found. The visually hidden file
input's 1×1 geometry is not counted: its visible `Load JSON` label is 44px high
and receives the designed focus indication.

## Required next step

Expand the six mobile link hit areas to at least 44px in both dimensions, rerun
the 390px geometry check plus axe, rebuild, redeploy, and repeat candidate/live
identity verification. The caching/security deployment repair should remain
unchanged.
