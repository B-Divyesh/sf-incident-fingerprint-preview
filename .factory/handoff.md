# Preview fingerprint splits and merges — verification 4 handoff

## Status

**PASS** on 6 September 2026 with **0 findings** at every severity and **0
untested public claims**.

Independent verification covered the live phone and desktop product, clean
source checkout, packaged Rust artifact, fresh library consumer, all 19 claim
commands, accessibility, privacy, offline/update behavior, routes, links,
legal pages, designed 404, response headers, candidate identity, and mobile
Lighthouse.

## Release identity

- Live URL: https://incident-fingerprint-preview.sociobot.in/
- Demo: https://incident-fingerprint-preview.sociobot.in/demo/
- Implementation reviewed and deployed:
  `23f992623cd24a217e11a1b4c22f231aca1b4429`
- Documentation base reviewed:
  `42b9dadea2ca84a7b281c6434ec41ddf1195c921`
- Version: `0.1.0`
- Product class: static site plus local Rust CLI/library; no backend or database

The documentation base is later than the implementation. Candidate/live byte
checks prove the public product still serves implementation `23f9926`. This
handoff and `.factory/verification-4.md` are report-only changes and do not
require deployment.

## What this verification did

- Opened the live site in fresh 1440×1000 desktop and 390×844 phone browsers.
- Confirmed the job, audience, first action, result, and three facts before
  scrolling.
- Entered the one-click sample, inspected the populated split/merge report,
  kept the sample label visible, reset it, and started with an empty real
  workspace.
- Proved there were no product cookies, saved browser input, third-party
  requests, uploads, or real-data writes.
- Exercised malformed JSON, empty input, unknown rule part, 5 MB boundary,
  keyboard recovery, file recovery, and JSON export.
- Checked keyboard focus, 44 px targets, 16 px core text, 200% desktop-zoom
  reflow, reduced motion, live regions, route structure, and axe on phone and
  desktop.
- Updated the service worker, reloaded offline, and evaluated the sample.
- Crawled links; checked route titles, metadata, Privacy, Terms, sitemap,
  robots, security headers, and the deliberate designed HTTP 404.
- Built the detached implementation from a fresh remote clone and ran every
  declared quality gate plus every claim command separately.
- Installed the packaged crate into a new root and ran a separate consumer
  project against the packaged library.
- Compared live bytes with the candidate build for all important product
  resources.

## Verification results

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

All commands passed. `npm test` passed 7 library tests, 3 CLI integration
tests, 1 doctest, 9 source/config tests, 2 output tests, 38 browser checks with
4 intentional project skips, and 19 aggregate claim tests. All 19 exact claim
commands also passed when run one at a time.

`npm run build` produced `dist/site/` and
`dist/bin/fingerprint-preview`. `cargo package --locked` verified an 18-file
crate at 87.8 KiB unpacked and 24.6 KiB compressed. The clean installed package
contained one runnable binary, and the fresh library consumer printed `1 1`.

Live mobile Lighthouse: Performance **100**, Accessibility **100**, Best
Practices **100**, SEO **100**; FCP 1.1 s, LCP 1.1 s, TBT 0 ms, CLS 0, transfer
61 KiB.

Built budgets: 12,405-byte JavaScript / 4,792 bytes gzip; 19,558-byte CSS /
5,034 bytes gzip; 47,380-byte hero; no font download.

## Reports and evidence

- Full report: `.factory/verification-4.md`
- Evidence report copy: `/work/.evidence/qa-report.md`
- Machine result: `/work/.evidence/qa-result.json`
- Live browser results: `/work/.evidence/live-browser-verification-4.json`
- Claim command logs: `/work/.evidence/claim-commands-4/`
- Lighthouse: `/work/.evidence/lighthouse-verification-4.json`
- URL verification: `/work/.evidence/verify-url-4/verify.json`
- Screenshots: `/work/.evidence/*-4.png`

## Earlier findings

All six strict review 1 findings remain closed: demo, claims registry,
first-screen wording, product 404, route metadata/site structure, and text or
target sizing. Earlier immutable-cache, CSP, Permissions-Policy, and mobile
link-size findings also remain closed. The hidden native file input remains
valid because its visible 120.7×44 px label receives a 3 px focus ring.

## Known gaps and next steps

No in-scope defect or untested public claim remains. No code, infrastructure,
DNS, billing, backend, or deployment was changed. The crate is ready for the
factory owner’s normal registry review; this worker did not publish it.
