# Review: preview incident fingerprint splits and merges

**Review date:** 2026-09-05  
**Verdict:** **FAIL**  
**Findings:** 6 total — 0 critical, 2 high, 3 moderate, 1 low  
**Untested public claims:** 16  
**Implementation reviewed:** `d9afe5f9ae0d19f76c26ea60c4609fa5a8433bdf`  
**Documentation checkout:** `27f4d210c4b1d0258bb15cb347d0da02cef1c3af`  
**Live URL:** https://incident-fingerprint-preview.sociobot.in/

## Verdict

**FAIL.** The CLI, library, browser evaluator, offline reload, export, privacy
boundary, and existing automated tests work. The product does not meet the
attached demo, claims, plain-words, route, and site-structure contracts. A PASS
requires zero findings and zero untested claims.

The live files match a clean production build byte for byte. The later commits
after `d9afe5f` only update reports, so `d9afe5f` is the implementation
candidate and `27f4d21` is the documentation SHA reviewed.

## First screen before scrolling

- Job shown: “Know which alerts move before the rule does.” This does not name
  the concrete job of previewing fingerprint splits and merges.
- Audience shown: none. The first screen does not say it is for engineers who
  tune incident-grouping rules.
- First action: “Run the sample.” It scrolls to the prefilled evaluator but does
  not run it. “Evaluate grouping” is a second action.
- The three facts are “Runs offline,” “No telemetry,” and “Vendor-aware JSON.”
  The required price fact is absent.

Evidence: `/work/.evidence/desktop-first-screen.png` and
`/work/.evidence/mobile-first-screen.png`.

## Findings

### 1. High — the required demo sandbox does not exist

The live `/demo` route returns HTTP 404. The CLI rejects
`fingerprint-preview --demo` with exit 2. The first-screen action only scrolls
to a prefilled form and needs a second click to show output. There is no
persistent “Demo — sample data, nothing is saved” label, “Reset demo,” “Start
for real,” separate demo storage namespace, or `.factory/demo.md`.

The browser evaluator does avoid real-data changes: evaluation made no network
request, and cookies, localStorage, sessionStorage, and IndexedDB remained
empty. That safe implementation does not replace the required explicit demo
mode and controls.

The landing-page terminal is static rather than a recording of the installed
binary. It shows `[merge]` for the two-event group, while the installed binary
reports `[split+merge]` for the shipped sample. This is not an accurate CLI
demo.

### 2. High — public claims have no claim registry or tagged tests

`.factory/claims.json` is missing, and `rg "@claim:"` finds no tagged tests.
There were therefore no declared claim commands to run. The normal suite tests
some behavior, and this review independently proved several claims, but none
has the required one-to-one registry entry and sandbox test.

The 16 untested claim categories are:

1. Works offline after the first visit.
2. Has no telemetry, analytics, or tracking.
3. Event content stays local and is never uploaded.
4. The web surface has no accounts or cookies.
5. Inputs are not saved or logged and reload discards them.
6. The service worker caches public files but not pasted input.
7. Generic, Sentry, Bugsnag, and Rollbar event shapes are supported.
8. Reports show group parents, split/merge/stable states, and a frame.
9. Reports omit line numbers, source context, arguments, and request data.
10. Browser export produces versioned JSON.
11. The CLI provides human and JSON output.
12. CLI exit codes are 0 for success, 2 for input, and 1 for I/O.
13. The documented Rust library example works.
14. The package produces a single CLI binary.
15. Hashed assets cache for one year while HTML and the worker revalidate.
16. The landing terminal represents the shipped sample CLI output.

The last claim is also false as displayed. The other claims were manually
checked where possible, but remain untested under the claims contract.

### 3. Moderate — the first screen and section copy do not use the required plain words

The headline is a metaphor and does not name the job. The audience is absent,
the primary action does not describe its actual result, and the three facts do
not include the free price. Labels and headings such as “Local grouping
laboratory,” “Live instrument,” “Calibrated workflow,” “Dial the fingerprint,”
and “Put the preview in review” use the instrument metaphor instead of naming
the section or action directly. `.factory/copy-audit.md` is also missing.

### 4. Moderate — the deliberate 404 response is a broken host page

An unknown path correctly returns HTTP 404, but the response is Azure Static
Web Apps’ default page rather than a product-designed 404. It has no `main`,
`h1`, product header, footer, or route back. Two images lack alt text. It also
attempts third-party CDN styles and scripts that fail under the response,
causing console errors. The defect is the broken page and missing required
structure, not the deliberate 404 status.

Evidence: `/work/.evidence/404-page.png`. The repository has no `404.html`, and
`staticwebapp.config.json` has no 404 response override.

### 5. Moderate — route metadata and the standard site skeleton are incomplete

The root, Privacy, and Terms pages have no canonical link, Open Graph metadata,
Twitter card metadata, or Apple touch icon. There is no 1200×630 share image.
Privacy and Terms have no footer. The root footer does not include “Built by
Param Factory” or a version/build id. The header does not provide the required
Demo and Privacy navigation, and the sitemap does not list a demo route.

Existing route titles, `lang`, one `h1`, and one `main` pass on `/`,
`/privacy/`, and `/terms/`. All links present on the root returned HTTP 200.

### 6. Low — some text and desktop click targets are below the stated minimums

At 390 px, the editable event and rule text is 12 px, with other labels at
11–15 px. This conflicts with the design record’s statement that body text
never drops below 16 px and makes the core JSON harder to read.

At desktop width, the Test bench, CLI, and Method navigation links measure
85×43, 25×43, and 51×43 CSS pixels. They miss the 44×44 click-target rule.
The earlier six mobile link failures are fixed; their current mobile dimensions
are at least 44×44. The hidden file input is not counted because its visible
100×44 label receives the designed focus outline.

## Functional verification

### Clean checkout and declared commands

A detached clean worktree at documentation SHA `27f4d21` was used. After
`npm ci`, these commands passed:

```text
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm test
npm run build
cargo test --doc
cargo package --locked
npm audit --audit-level=high
```

`npm test` passed 7 Rust unit tests, 2 CLI integration tests, 1 doctest, 7 site
tests, 1 built-output test, and 12 Playwright checks; 2 project-specific checks
were intentionally skipped. `npm run build` produced `dist/site` and
`dist/bin/fingerprint-preview`. The audit found no high-severity dependency
vulnerability.

### Installed CLI and library

- Exact documented installation, `cargo install --path .`, passed in a new
  installation root.
- The shipped three-event fixture produced schema 1, 3 events, 2 baseline
  groups, 2 proposed groups, 1 split baseline, and 1 merged proposed group.
- `--help` documents the DSL and exit codes. A missing file exits 1. Invalid
  input and rule tests exit 2. Empty input is a valid zero-group report.
- `cargo package --locked` produced and verified the crate.
- A new Cargo consumer compiled the packed library and ran the README API,
  printing `1 1` for one event and one proposed group.
- `fingerprint-preview --demo` is missing, as recorded in finding 1.

### Live browser paths

- Fresh Chromium contexts covered 1440×1000 desktop and 390×844 phone sizes.
- The populated browser sample produced the same 3-event, 2-to-2 result and a
  schema-v1 JSON download.
- Malformed JSON, an empty array, an unknown rule part, and a 5,000,001-byte
  file each showed specific guidance. A following valid input recovered to
  `COMPLETE`.
- “Restore sample” asks before overwriting changed input and restores the three
  shipped events.
- Keyboard traversal starts at the skip link, shows a 3 px visible focus ring,
  reaches the file label and controls, and has no trap. Ctrl+Enter evaluates.
- Reduced-motion mode matches, removes animation, makes transitions effectively
  instant, and uses automatic scrolling.
- Root, Privacy, Terms, and evaluated desktop/mobile pages have zero axe WCAG
  2 A/AA violations. The default 404 has one critical image-alt violation with
  two affected nodes.
- `/opt/fleet/lib/verify-url.sh` passed the live root with no console errors.

### Privacy, offline, and updates

Evaluation generated zero requests. No request included event content. There
were no cookies or local/session/IndexedDB entries. Cache Storage contained
only `fingerprint-preview-v1`. The privacy page directs questions to the public
repository and warns users not to attach fixtures.

The active service worker is `/sw.js`; `registration.update()` passed. After a
fresh context went offline, reload showed the offline notice and the sample
still evaluated to `COMPLETE`.

This is a static CLI/site product. Tenant isolation, server restart
persistence, health, and 429/Retry-After checks are not applicable.

### Live identity, headers, and performance

Fresh build and live SHA-256 values match for `/`, Privacy, Terms, hashed JS,
hashed CSS, the hero image, and the service worker. Representative values:

| Resource | SHA-256 |
| --- | --- |
| `/` | `602bab601ca79f3f777fbd174ae81d50391761f7ac1fcede31256a0be1e92bf6` |
| JS | `8f18fcd09e4a8266a3b485e27b7281aa80eeabd0947d90e2345820589c1de5a9` |
| CSS | `dd1adec2ee80d27301fe48f6faf1f6a3c18b949ce5c883d297bc82f4669deea1` |
| hero image | `beb30131a6e53f35c12c96082d05b8b6e486fd09ad31ba0c2eaf10fc05204cc2` |
| service worker | `95b3b377957271db360042061adcc0ba1de9cc2fcfddc87dbcfb20e4ee59fe1a` |

Live headers provide the repository CSP, Permissions-Policy, HSTS, nosniff,
frame denial, and referrer policy. Hashed assets use one-year immutable cache;
the worker revalidates.

Production output is 11,129 B JS, 17,174 B CSS, 47,380 B hero WebP, and no
font download. Fresh live mobile Lighthouse scored Performance 100,
Accessibility 100, Best Practices 100, and SEO 100. LCP was 1.062 s, CLS 0,
TBT 0, and total transfer 60,884 B.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Immutable assets revalidated after 30 seconds | **Closed.** Live JS/CSS/image responses now use `max-age=31536000, immutable`. |
| CSP and Permissions-Policy absent | **Closed.** Both are present on current live product responses. |
| Six mobile links below 44×44 | **Closed.** All six now measure at least 44×44 at 390 px. |
| Hidden file input has 1×1 geometry | **Still not a defect.** Its visible 100×44 label receives a visible focus outline. |
| Verification 3 reported zero findings | **Superseded by this review.** The product remains functionally stable, but the attached demo, claims, plain-words, and site-structure contracts expose the six findings above. |

## Evidence

- `/work/.evidence/live-browser-audit.json`
- `/work/.evidence/live-recovery-audit.json`
- `/work/.evidence/lighthouse.json`
- `/work/.evidence/desktop-first-screen.png`
- `/work/.evidence/desktop-populated-output.png`
- `/work/.evidence/mobile-first-screen.png`
- `/work/.evidence/mobile-populated-output.png`
- `/work/.evidence/404-page.png`
- `/work/.evidence/verify.json`

## Required next step

Implement the demo and claims contracts first, then replace the first-screen
copy and complete the 404, metadata, route skeleton, and size fixes. Add exact
claim-tagged tests and rerun this review from a clean checkout. No deployment
change was made by this review.
