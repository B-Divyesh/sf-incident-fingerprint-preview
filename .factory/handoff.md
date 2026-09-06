# Fingerprint Preview — repair 3 handoff

## Status: PASS

Repair completed on **6 September 2026**. All six findings from strict review
1 are closed. The 16 previously untested claim categories are covered by the
19-entry claims registry, with one outcome test per entry. No open product
defect remains from the current or earlier review history.

## Product and release identity

- Live product: https://incident-fingerprint-preview.sociobot.in/
- Demo: https://incident-fingerprint-preview.sociobot.in/demo/
- Implementation SHA: `23f992623cd24a217e11a1b4c22f231aca1b4429`
- Implementation commits: `d62c530` and `23f9926`
- Deployment ID: `c29a5285-f39e-466f-b813-5a835cb471e0`
- Version: `0.1.0`
- Deployment class: static Azure Static Web App; no backend or product database

The implementation SHA is the deployed product. This handoff is a later
documentation-only commit and does not require a new product image.

## What changed

- Added a real one-click `/demo/` sandbox. It loads and evaluates the bundled
  sample, keeps the required sample-data label visible, resets, and exits to an
  empty real workspace. It writes no browser product data.
- Added `fingerprint-preview demo`. It uses compiled-in fixtures, writes a
  report only to a unique operating-system temporary directory, and prints the
  directory path.
- Added `.factory/claims.json` with 19 claims and 19 uniquely tagged outcome
  tests. The tests cover the browser, offline path, privacy boundary, report,
  installed CLI, fresh Rust consumer, terminal recording, and recovery paths.
- Replaced the first screen and section labels with plain job and audience
  language. Added the free, offline, and no-upload facts and documented every
  landing sentence in `.factory/copy-audit.md`.
- Added a product 404 with the correct HTTP 404 status, complete route-specific
  metadata, canonical and social metadata, a 1200×630 share image, touch icon,
  consistent navigation/footer, and `/demo/` in the sitemap.
- Raised core mobile text to at least 16 px and interactive targets to at least
  44 px. Preserved keyboard focus, reduced motion, skip navigation, semantic
  landmarks, and screen-reader status announcements.
- Added the self-hosted CLI recording and matched it to the installed binary's
  sample output. Asset provenance is recorded in `.factory/design.md`.
- Updated the service worker so the complete demo shell and hashed assets work
  offline while pasted event content remains outside Cache Storage.
- Rewrote README usage, demo, privacy, clean setup, testing, package, and
  deployment guidance. Added `.factory/demo.md` and the required catalog text.

## Strict review finding disposition

| Review 1 finding | Disposition |
| --- | --- |
| No demo sandbox or CLI demo | **Closed.** `/demo/` and `fingerprint-preview demo` pass browser and installed-artifact tests. |
| No claims registry or tagged tests | **Closed.** 19 registry entries map one-to-one to 19 outcome tests; every declared command passes separately. |
| Metaphorical, incomplete first screen | **Closed.** The first viewport names the preview job, engineers, first action, result, price, offline behavior, and privacy boundary. |
| Broken host 404 | **Closed.** Unknown paths return a designed product page with HTTP 404, landmarks, navigation, and no serious or critical axe issue. |
| Missing route metadata and site structure | **Closed.** Home, Demo, Privacy, Terms, and 404 have distinct titles and complete metadata, headers, and footers. |
| Small mobile text and desktop click targets | **Closed.** Automated 390 px text/overflow and desktop/mobile target measurements pass. |

Earlier immutable-cache, CSP, Permissions-Policy, and six-link mobile target
findings remain closed. The visually hidden file input remains valid because
its visible 100×44 label receives the designed focus indicator.

## Clean-checkout verification

A fresh clone at the implementation SHA ran newly installed dependencies:

```sh
npm ci
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm test
npm run build
cargo package --locked
npm audit --audit-level=high
```

Results:

- Rust: 7 library tests, 3 CLI integration tests, and 1 doctest passed.
- Site/configuration: 9 source/config tests and 2 built-output tests passed.
- Browser: 38 passed across desktop and 390 px mobile; 4 intentional
  project-specific skips. Home, Demo, Privacy, Terms, and 404 axe checks found
  no serious or critical issue.
- Claims: all 19 passed in the aggregate suite. Every exact command from
  `.factory/claims.json` was then run separately from the same clean checkout;
  all 19 passed.
- Build: `dist/site/` and `dist/bin/fingerprint-preview` were produced.
- Package: 18 files, 87.8 KiB unpacked and 24.6 KiB compressed; package
  verification passed.
- Consumer checks: the packed CLI installed into an isolated root and ran its
  demo; a new Cargo project compiled and ran the documented library API.
- Dependency audit: zero vulnerabilities.

Registry publication was not performed, as required by the library-publishing
contract. The package is ready for the factory owner to publish with
`cargo publish --locked` after its normal registry review.

## Live verification

- Fresh desktop and phone contexts state the job, audience, and first action
  before scrolling. `/demo/` immediately shows three events, two baseline
  groups, two proposed groups, one split, and one split-plus-merge result.
- The demo label remains visible after scrolling. Reset restores the sample;
  Start for real opens an empty workspace. Browser storage and cookies remain
  empty, and no third-party or write request occurs.
- Malformed JSON, empty input, an unknown rule part, and the >5 MB boundary
  show useful outcomes and recover with a valid sample.
- Keyboard, focus, reduced motion, offline reload, service-worker update,
  links, route titles, legal pages, and the designed HTTP 404 pass.
- `/opt/fleet/lib/verify-url.sh` reports HTTP 200, a valid title, `lang=en`, one
  `h1`, one `main`, complete image labels, and zero console errors.
- Candidate and live bytes match for Home, Demo, Privacy, Terms, 404, service
  worker, hero/share images, and current hashed JS/CSS.
- Live headers retain the same-origin CSP, Permissions-Policy, HSTS, frame
  denial, nosniff, strict referrer policy, immutable asset caching, and HTML
  and worker revalidation.

The deliberate top-level 404 produces Chromium's expected failed-navigation
console entry. The rendered 404 has no failed subresource, missing structure,
or accessibility defect.

## Performance

Live mobile Lighthouse: Performance **100**, Accessibility **100**, Best
Practices **100**, SEO **100**. FCP is 968 ms, LCP 1,061 ms, TBT 44 ms, CLS 0,
and transfer is 62,465 bytes.

Built budgets: JS 12,373 bytes raw / 4.79 KiB gzip; CSS 19,558 bytes raw /
5.02 KiB gzip; hero 47,380 bytes; social image 37,950 bytes; no font download.

## Evidence

Repair evidence is under `/work/.evidence/`, including:

- `qa-report.md` and `qa-result.json`
- `live-browser-repair-3.json`, `live-privacy-404-repair-3.json`, and
  `live-links-repair-3.json`
- `lighthouse-repair-3.json`
- `verify-url-repair-3-final/verify.json`
- desktop, phone, populated-demo, and 404 screenshots
- `catalog-description.txt`

## Known boundaries

There are no known defects in scope. Users must scrub messages and filenames
before sharing fixtures. Vendor adapters read documented event shapes but do
not claim exact proprietary grouping semantics. This free product has no paid
offer, account, backend, database, or external AI dependency.
