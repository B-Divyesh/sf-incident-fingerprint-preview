# Preview fingerprint splits and merges — review 2 handoff

## Status

**PASS** on 6 September 2026: **0 findings** at every severity and **0
untested public claims**.

## Release identity

- Live URL: https://incident-fingerprint-preview.sociobot.in/
- Demo: https://incident-fingerprint-preview.sociobot.in/demo/
- Implementation reviewed: `23f992623cd24a217e11a1b4c22f231aca1b4429`
- Documentation checkout: `6147c303c642ccb434d44bee4eb340005c51e5f4`
- Version: `0.1.0`
- Product class: static site plus local Rust CLI/library; no backend or database

The documentation checkout is later than the implementation. Fresh candidate
build bytes match the live product. This handoff and `.factory/review-2.md`
are report-only changes and need no deployment.

## What review 2 verified

- Fresh desktop and phone browsers stated the job, audience, first action, and
  facts before scrolling.
- One click opened the persistent, populated demo label and report. Reset
  restored the sample; Start for real opened an empty workspace.
- Malformed JSON, invalid rules, empty fixtures, 5 MB file limits, keyboard
  recovery, file recovery, JSON export, privacy, service-worker update, and
  offline demo reload worked.
- Keyboard focus, 44px targets, 200% reflow, reduced motion, titles, landmarks,
  legal pages, links, security headers, and designed HTTP 404 passed.
- Fresh axe WCAG 2 A/AA scans had zero violations across Home, Demo, Privacy,
  Terms, and 404 at desktop and phone sizes.
- A new clean clone ran all documented quality commands and every one of the
  19 declared claim commands. All passed.
- The packaged crate was installed in a new root; the documented library API
  ran in a fresh consumer project.

## Commands and results

```sh
npm ci
npm test
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --doc
cargo package --locked
npm audit --audit-level=high
```

All passed. `npm test` passed 7 library tests, 3 CLI integration tests, 1
doctest, 9 source/configuration tests, 2 production-output tests, 42 browser
tests, and 19 aggregate claim tests. The separate 19-claim run also passed.

The build produced `dist/site/` and `dist/bin/fingerprint-preview`.
Packaging verified an 18-file crate. Live mobile Lighthouse scored 100
Performance, 100 Accessibility, 100 Best Practices, and 100 SEO; FCP was
848 ms, LCP 1,050 ms, total blocking time 0 ms, CLS 0, and transfer 62,495
bytes.

## Reports and evidence

- Full report: `.factory/review-2.md`
- Evidence report copy: `/work/.evidence/qa-report.md`
- Machine result: `/work/.evidence/qa-result.json`
- Claim logs: `/work/.evidence/review2-claim-commands/`
- Live browser evidence: `/work/.evidence/review2-live-flow.json` and
  `/work/.evidence/review2-live-axe.json`
- Lighthouse: `/work/.evidence/review2-lighthouse.json`
- URL check: `/work/.evidence/review2-verify-url/verify.json`

## Earlier findings and next steps

All earlier cache-header, CSP, Permissions-Policy, mobile target, demo,
claims-registry, first-screen, 404, metadata, and editor-text findings remain
closed. The hidden native file input remains valid because its visible label is
the sized, focused control.

No in-scope gap remains. No product code, deployment, infrastructure, DNS,
billing, backend, or external service state was changed. The factory owner may
perform its normal registry review; this worker did not publish the crate.
