# Preview fingerprint splits and merges — verification 4

**Verdict: PASS**

**Verified:** 6 September 2026  
**Findings:** 0 total — 0 critical, 0 high, 0 moderate, 0 low  
**Untested public claims:** 0  
**Implementation candidate:** `23f992623cd24a217e11a1b4c22f231aca1b4429`  
**Documentation base reviewed:** `42b9dadea2ca84a7b281c6434ec41ddf1195c921`  
**Live URL:** https://incident-fingerprint-preview.sociobot.in/

## Verdict

**PASS.** The live product and packaged Rust artifact complete the researched
job. Engineers can preview how a proposed fingerprint splits and merges a
scrubbed incident sample before changing a production rule. This independent
run found zero defects at every severity and left zero public claims untested.

The implementation and documentation SHAs differ because `42b9dad` records
the prior repair verification. The live site matches a clean production build
of implementation `23f9926` byte for byte. This verification report is a later
report-only change and does not require a new product image.

## First screen before scrolling

Fresh 1440×1000 desktop and 390×844 phone contexts showed the same information
before any scroll:

- Job: “Preview fingerprint splits and merges before rollout.”
- Audience: “For engineers tuning incident grouping rules before they change
  alert volume.”
- First action: “Try it with sample data.”
- Result beside the action: “Opens a populated split and merge report.”
- Facts: free and open source, works offline after the first visit, and no
  telemetry or event uploads.

The job, audience, and action all fit inside both first viewports. The wording
uses the same terms as the evaluator and README. The catalog line is 82
characters, starts with “Preview,” and contains no banned marketing word.

Evidence: `/work/.evidence/desktop-first-screen-4.png` and
`/work/.evidence/phone-first-screen-4.png`.

## One-click sample and real-data separation

Selecting the first action opened `/demo/#bench` and immediately showed three
sample events, two baseline groups, two proposed groups, one split, and one
split-plus-merge result. The report included parent groups and the
representative `checkout/charge/src/pay.rs` frame.

The “Demo — sample data, nothing is saved” label remained visible at the end
of the page. “Reset demo” restored the three-event report after an empty-state
edit. “Start for real” opened an empty evaluator with no demo label. Browser
back returned to a fresh sample. Cookies, localStorage, sessionStorage, and
IndexedDB remained empty. Every observed browser request was a same-origin GET;
no product write or third-party request occurred.

Evidence: `/work/.evidence/desktop-populated-demo-4.png`,
`/work/.evidence/phone-populated-demo-4.png`, and
`/work/.evidence/live-browser-verification-4.json`.

## Declared claims

The registry contains 19 unique claims and 19 unique `@claim:` tests. Each
exact `test` command from `.factory/claims.json` was run separately in the
detached clean checkout after `npm ci`.

| Claim | Result | Evidence log |
| --- | --- | --- |
| `demo-sandbox` | PASS | `verify4-claim-demo-sandbox.log` |
| `offline-reload` | PASS | `verify4-claim-offline-reload.log` |
| `local-processing` | PASS | `verify4-claim-local-processing.log` |
| `no-accounts-cookies` | PASS | `verify4-claim-no-accounts-cookies.log` |
| `input-not-saved` | PASS | `verify4-claim-input-not-saved.log` |
| `public-cache-only` | PASS | `verify4-claim-public-cache-only.log` |
| `vendor-imports` | PASS | `verify4-claim-vendor-imports.log` |
| `report-deltas` | PASS | `verify4-claim-report-deltas.log` |
| `report-redaction` | PASS | `verify4-claim-report-redaction.log` |
| `json-export` | PASS | `verify4-claim-json-export.log` |
| `cli-output` | PASS | `verify4-claim-cli-output.log` |
| `cli-exit-codes` | PASS | `verify4-claim-cli-exit-codes.log` |
| `library-consumer` | PASS | `verify4-claim-library-consumer.log` |
| `single-cli-binary` | PASS | `verify4-claim-single-cli-binary.log` |
| `terminal-recording` | PASS | `verify4-claim-terminal-recording.log` |
| `cli-demo` | PASS | `verify4-claim-cli-demo.log` |
| `free-open-source` | PASS | `verify4-claim-free-open-source.log` |
| `keyboard-run` | PASS | `verify4-claim-keyboard-run.log` |
| `file-size-recovery` | PASS | `verify4-claim-file-size-recovery.log` |

The logs are under `/work/.evidence/claim-commands-4/`. A fresh cross-check of
the live page, legal pages, CLI help, and README found no false, incomplete,
missing, or unlisted public claim. Product limits such as no exact proprietary
vendor semantics are stated as limits, not promises.

## Clean checkout and package checks

A new remote clone was detached at implementation `23f9926`; `git status`
remained clean after verification. Documented prerequisites were present as
Node.js 22.23.2, npm 10.9.8, rustc 1.98.0, and cargo 1.98.0.

| Command | Result |
| --- | --- |
| `npm ci` | PASS; 22 packages audited, 0 vulnerabilities |
| `cargo fmt --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm test` | PASS |
| `npm run build` | PASS; produced `dist/site/` and `dist/bin/fingerprint-preview` |
| `cargo test --doc` | PASS; one public API example |
| `cargo package --locked` | PASS; 18 files, 87.8 KiB unpacked, 24.6 KiB compressed |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |

The aggregate test run passed 7 library tests, 3 CLI integration tests, 1
doctest, 9 source/config tests, 2 built-output tests, 38 desktop/phone browser
checks with 4 intentional project-specific skips, and all 19 claim tests.

The verified crate was then installed from `target/package/` into a new install
root. It installed exactly one executable named `fingerprint-preview`.
`--version`, `--help`, the bundled demo, human output, and schema-1 JSON output
worked. The installed sample reported 3 events, 2 baseline groups, 2 proposed
groups, 1 split baseline group, and 1 merged proposed group. Malformed input
exited 2; a missing file exited 1. A separate new Cargo project compiled and
ran the packaged library API, printing `1 1`. No registry publish was attempted.

## Normal, invalid, boundary, and recovery paths

- The normal browser and installed CLI paths produced the realistic sample
  split and merge result.
- Malformed JSON named the JSON problem and recovered after valid content.
- An unknown `request.url` rule part listed the rule error and recovered after
  changing the rule to `message`.
- An empty event array showed the useful empty state.
- A 5,000,001-byte file showed the 5 MB limit; a small file then loaded and
  evaluated successfully.
- Ctrl+Enter evaluated the current content and restored `COMPLETE` after an
  error.
- JSON export was versioned and excluded source context, arguments, request
  data, frame line numbers, and a unique excluded-field marker.

## Accessibility, keyboard, and layout

Fresh desktop and phone runs covered the landing page, populated demo, Privacy,
Terms, and designed 404. Every route has `lang=en`, one `h1`, one `main`, a
header, a footer, complete image text, and an ordered heading outline.

Playwright axe WCAG 2 A/AA integration found zero violations of any impact on
the tested desktop and phone pages. `/opt/fleet/lib/verify-url.sh` also found a
valid title, language, main landmark, image labels, and zero console errors.

The skip link is first in tab order and has a visible 3 px focus ring. All
visible interactive targets measured at least 44×44 px. Core evaluator text
measured at least 16 px. The hidden file input focuses its visible 120.7×44 px
label, which receives a solid 3 px orange outline on desktop and phone. There
was no keyboard trap or horizontal overflow. At a 720 CSS-pixel viewport,
equivalent to 200% zoom on the tested 1440 px desktop, the complete demo
reflowed with no horizontal overflow and all 25 interactive controls retained
non-zero geometry.

The status announcer and field errors use live regions with native buttons,
links, textareas, file input, and details controls. No dialog or custom widget
needs separate focus management. With reduced motion requested, the media
query matched, transition duration was effectively zero, animation was none,
and scrolling was automatic.

## Offline, privacy, and service worker

The active controller and registration both resolved to `/sw.js`, and
`registration.update()` succeeded. A dedicated fresh context then went
offline and reloaded `/demo/`. The offline notice appeared, the status remained
`COMPLETE`, and the sample split-plus-merge report remained usable.

A separate privacy run inserted the unique marker
`VERIFY4-PRIVATE-EVENT-73915`. No request contained the marker. Every request
was a same-origin GET. Cache Storage contained only same-origin public files
and no marker. No cookies or product browser database appeared. Inputs in the
real workspace disappeared on reload, as the registered claim proves.

This is a static site and local CLI/library. It has no backend, tenant,
database, account, health endpoint, server restart state, or live API rate
allowance. Tenant isolation, SQLite restart persistence, and 429/Retry-After
checks are therefore not applicable.

## Routes, links, metadata, and expected 404

Home, Demo, Privacy, and Terms returned 200. An unknown path returned HTTP 404
and rendered the complete product page with “Return home” and “Try sample
data.” That deliberate 404 status is expected and is not a defect. It had no
failed subresource, missing landmark, console error, or axe violation.

All five page types have distinct titles under 60 characters, descriptions
under 155 characters, canonical URLs, Open Graph metadata, Twitter card
metadata, favicon, and Apple touch icon. The linked 1200×630 social image is
the product asset. Every unique internal asset/page link and both GitHub links
returned 200 after redirects. `robots.txt` and `sitemap.xml` returned 200; the
sitemap includes every public route.

Evidence: `/work/.evidence/designed-404-4.png`,
`/work/.evidence/verify-url-4/verify.json`, and
`/work/.evidence/live-browser-verification-4.json`.

## Candidate identity, response policy, and performance

SHA-256 values matched between the clean candidate build and live bytes for
Home, Demo, Privacy, Terms, 404, service worker, current hashed JavaScript and
CSS, hero image, social image, and Apple touch icon. Representative matches:

| Resource | SHA-256 |
| --- | --- |
| Home | `4c03458cca5a8f44ba0fa2ff244c7e32f0dfaeff1406283b9bfe10540f4b01bd` |
| Demo | `8646e1c0c10001a2587a871a6538f187b75d3332b9d90afcc1de55bb8666fe38` |
| JavaScript | `982fd4e2b5d3ee95b4a8559952244787421624230cfb28ad898446dc1c22209e` |
| CSS | `0ef11cf9c429b1622878cf4897e252e4f043ca3b0672fc5e71cd3023531e7b23` |
| Service worker | `2a6a2a01d0db237e994e8b7204598fafd5f92572c3261f5d09b717454e6e2a26` |
| Hero image | `beb30131a6e53f35c12c96082d05b8b6e486fd09ad31ba0c2eaf10fc05204cc2` |

Live headers include the same-origin CSP, frame denial, Permissions-Policy,
HSTS, nosniff, and strict referrer policy. HTML revalidates. The service worker
uses `max-age=0, must-revalidate`. Hashed JavaScript/CSS use one-year immutable
caching.

Built budgets pass: JavaScript is 12,405 bytes raw / 4,792 bytes gzip; CSS is
19,558 bytes raw / 5,034 bytes gzip; the hero is 47,380 bytes; the share image
is 37,950 bytes; there is no font download.

Fresh live mobile Lighthouse scored Performance **100**, Accessibility **100**,
Best Practices **100**, and SEO **100**. FCP was 1.1 s, LCP 1.1 s, total
blocking time 0 ms, CLS 0, and total transfer 61 KiB.

Evidence: `/work/.evidence/lighthouse-verification-4.json`.

## Earlier finding disposition

| Earlier finding or note | Current independent disposition |
| --- | --- |
| No browser or CLI demo sandbox | **Closed.** One-click `/demo/` and installed `fingerprint-preview demo` both passed, including reset, label, empty real workspace, and temporary output. |
| No claims registry or tagged tests; 16 untested categories | **Closed.** The 19-entry registry maps one-to-one to 19 outcome tests; all 19 exact commands passed separately. |
| Metaphorical or incomplete first screen | **Closed.** Job, audience, actual first action, result, price, offline behavior, and privacy boundary are visible before scrolling on phone and desktop. |
| Broken host 404 | **Closed.** Unknown paths return the designed product page with deliberate HTTP 404, full structure, working exits, and zero axe issue. |
| Missing route metadata and site structure | **Closed.** All routes have distinct complete metadata, common header/footer, legal pages, sitemap entry, and live 200 links. |
| Small mobile editor text and desktop click targets | **Closed.** Core text is at least 16 px and all tested targets are at least 44×44 px. |
| Immutable assets revalidated after 30 seconds | **Closed.** Current hashed assets use `max-age=31536000, immutable`. |
| CSP and Permissions-Policy absent | **Closed.** Both are present on current live responses. |
| Six mobile links below 44×44 px | **Closed.** All live phone links and controls pass the target measurement. |
| Hidden 1×1 file input | **Not a defect.** Its visible 120.7×44 px label receives a designed 3 px focus ring when the native input is focused. |
| Verification 3 reported zero findings before strict review 1 | **Superseded, then confirmed.** Strict review 1 exposed six contract gaps; all six now have fresh closing evidence above. |

## Scope decisions

No paid path exists, so no Sociobot billing check applies. No AI step is an
obvious missing part of this deterministic, privacy-sensitive rule evaluator;
the product already supplies the implied import and export paths. Adding a
network model would not improve the stated pre-rollout comparison job and
would weaken the local processing boundary. This is not a finding.

## Findings

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 0 |
| **Total** | **0** |

Untested public claims: **0**.

## Known product boundaries

No in-scope defect remains. Users must scrub messages and filenames before
sharing fixtures. Vendor adapters accept documented shapes but do not claim
exact proprietary grouping behavior. These are disclosed boundaries, not
verification findings.
