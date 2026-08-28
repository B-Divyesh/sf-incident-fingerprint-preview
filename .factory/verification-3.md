# Independent verification 3 — PASS

**Verified:** 2026-08-28  
**Candidate:** `d0d21c3dda0802a59724a60f8ddc70bc7875327b`  
**Live URL:** https://incident-fingerprint-preview.sociobot.in/  
**Scope:** independent CLI/library and production web/PWA QA against the researched brief. No product source was changed.

## Verdict

**PASS.** The candidate is a usable offline what-if evaluator: it imports the
documented generic/Sentry/Bugsnag/Rollbar event shapes, evaluates the small DSL,
shows split/merge deltas and representative frames, produces a stable JSON
report, and keeps event processing local. The public deployment is byte-for-byte
the production-site output of this candidate for all served product resources
checked.

## Clean checkout and release gates

The checkout began clean and at the requested SHA. Fresh dependency installation
and all available repository gates passed:

```sh
npm ci
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm test
npm run build
cargo test --doc
cargo package --locked --allow-dirty
npm audit --audit-level=high
```

- `npm ci`: 22 packages audited; 0 vulnerabilities.
- `npm test`: 7 Rust library tests, 2 CLI integration tests, 1 Rust doctest,
  7 site/configuration tests, 1 production-output test, and Playwright's 12
  checks passed; 2 desktop-only mobile geometry checks were intentionally
  skipped.
- Exact `npm run build` passed and created `dist/site` plus
  `dist/bin/fingerprint-preview`.
- Strict format and Clippy checks passed. `cargo package --locked` verified a
  17-file crate (83.4 KiB unpacked, 23.6 KiB compressed).

## CLI, library, and job-to-be-done exercise

- The release binary's documented fixture returned schema version 1, 3 events,
  2 baseline groups, 2 proposed groups, one split baseline and one merged
  proposed group. It emitted in-app representative frames and did not serialize
  fixture line numbers or secret frame variables.
- Empty `[]` is a valid boundary state with zero events/groups. One-event
  Sentry, Bugsnag, and Rollbar fixture shapes each evaluated successfully with
  `exception.type + frames.all`.
- `--help` documents usage, offline/privacy boundary, DSL and exit codes.
  Invalid JSON and an empty rule exit 2 with recovery-oriented messages; a
  missing input file exits 1.
- The packaged CLI was installed into an isolated `CARGO_HOME`/installation
  root. Its installed `0.1.0` binary produced the same fixture report. A new
  separate Cargo consumer depending on the local package compiled and ran the
  README public API (`RuleSet::parse` + `preview_json`) and printed `1 1`.
  Registry publishing was not attempted.

## Live deployment identity and policy

The following fresh SHA-256 comparisons are exact matches between `dist/site`
from the candidate and the public URL:

| Resource | SHA-256 |
| --- | --- |
| `/` | `602bab601ca79f3f777fbd174ae81d50391761f7ac1fcede31256a0be1e92bf6` |
| `/assets/index-BY6WMMA5.js` | `8f18fcd09e4a8266a3b485e27b7281aa80eeabd0947d90e2345820589c1de5a9` |
| `/assets/style-B56w0lu5.css` | `dd1adec2ee80d27301fe48f6faf1f6a3c18b949ce5c883d297bc82f4669deea1` |
| `/instrument-bench.webp` | `beb30131a6e53f35c12c96082d05b8b6e486fd09ad31ba0c2eaf10fc05204cc2` |
| `/sw.js` | `95b3b377957271db360042061adcc0ba1de9cc2fcfddc87dbcfb20e4ee59fe1a` |
| `/privacy/` | `ae3b0acdfaa5a342c2a3b6299990d3f52d2b337da1cf20a83860d2b3576cd86b` |
| `/terms/` | `8b9035e60344821af44ab2eb94ffa6b7de6df6f704b606823e333781bd70a676` |

Fresh live headers: root HTML `public, must-revalidate, max-age=30`; hashed JS
and WebP `public, max-age=31536000, immutable`; worker
`public, max-age=0, must-revalidate`. The live response supplies CSP restricted
to `'self'`, `Permissions-Policy`, HSTS, `X-Frame-Options: DENY`, `nosniff`, and
`strict-origin-when-cross-origin` referrer policy.

## Browser, accessibility, privacy, and resilience

- Fresh Chromium checks passed at desktop 1440×1000 and mobile 390×844. Both
  completed the sample evaluation; mobile had no horizontal overflow. All six
  relevant mobile links measure at least 44px in both dimensions.
- Keyboard starts on the skip link, whose computed visible outline is solid,
  3px, `rgb(168, 63, 39)`. Ctrl+Enter reports malformed JSON and unknown rule
  parts with direct recovery guidance, then recovers to `COMPLETE`; the empty
  fixture and >5 MB upload boundary also show correct states.
- Live axe WCAG 2 A/AA scans after evaluation found **0 serious/critical**
  violations on each viewport. Root document checks: title, `lang=en`, one
  `main`, one `h1`, and zero images without `alt`. No page or console errors
  occurred.
- With reduced motion, the media query matches, computed transition duration is
  `0.00001s`, animation name is `none`, and scroll behavior is `auto`.
- Using an event value `QA-NETWORK-SECRET`, evaluation made zero requests after
  the page was idle; no request contained that value. There are no third-party
  requests, cookies, localStorage or sessionStorage entries. The only expected
  client persistence is the PWA shell cache `fingerprint-preview-v1`.
- Service worker update succeeds with controller `/sw.js`. A controlled offline
  reload displays the Offline mode banner and still evaluates to `COMPLETE`
  with no errors.

## Performance

Production output budgets: 11,129 B raw JS / 4,270 B gzip; 17,174 B raw CSS /
4,680 B gzip; 0 B fonts; 47,380 B WebP hero. All are within the specified
budgets. Fresh live mobile Lighthouse (Chromium) scored Performance 100,
Accessibility 100, Best Practices 100, SEO 100; FCP 1,018 ms, LCP 1,063 ms,
CLS 0, TBT 0, transfer 61,342 B.

## Defects

| Severity | Open defects | Evidence |
| --- | ---: | --- |
| Critical | 0 | None found. |
| High | 0 | None found. |
| Moderate | 0 | None found. |
| Low | 0 | None found. |

The tool intentionally does not claim exact proprietary grouping semantics and
still requires users to scrub arbitrary messages and filenames before sharing;
these are documented product boundaries, not verification defects.
