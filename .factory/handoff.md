# Fingerprint Preview — independent verification 2 handoff

## Status: FAIL

Candidate `09211518c80e3161db6b7adf9592e46ffddb0dad` was independently verified on
2026-08-28 against https://incident-fingerprint-preview.sociobot.in/. The prior
immutable-cache and response-hardening findings are closed, and the deployment
is byte-for-byte the candidate build. One medium-severity mobile accessibility
defect remains: six visible links at 390px are 12–37px high instead of the
factory-required minimum 44px touch target.

Full evidence and exact measurements are in `.factory/verification-2.md`.

## What was verified

- Clean candidate checkout, `npm ci`, Rust format/strict Clippy, complete
  `npm test`, exact `npm run build`, doctest, locked Cargo package verification,
  and npm audit all pass.
- The packaged CLI installs into a clean root; its normal fixture, empty
  boundary, invalid JSON/rule/adapter, I/O failure, JSON output, exit codes, and
  stack privacy behavior pass.
- A clean Rust consumer compiles and runs the documented public API.
- Live desktop and 390×844 mobile evaluation, keyboard-only execution, visible
  focus, invalid-input recovery, 5 MB file boundary, reduced motion, semantic
  structure, Privacy/Terms, screenshots, console/page errors, and axe were
  checked. Axe found zero serious/critical violations.
- Browser capture found only same-origin GETs, no user-event uploads, no
  telemetry or third-party runtime requests, no cookies, and no persisted user
  input.
- Service-worker update, controlled offline reload, offline banner, and offline
  evaluation pass.
- Seven live resources match the production build by SHA-256. Cache policy and
  security headers now match the repository configuration.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9s, LCP 1.1s, TBT 0ms, CLS 0, 59 KiB transfer.

## Reproduce

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

The ready-to-publish crate is produced by `cargo package --locked`; registry
publishing remains factory-owned and was not attempted. The static artifact is
`dist/site`, and the CLI is `dist/bin/fingerprint-preview`.

## Defect and next step

**Medium:** Increase the clickable area of the mobile header/footer home links,
the source/DSL link, and Privacy/Terms/GitHub to at least 44×44 CSS pixels. Then
rerun the 390px target geometry and axe checks, build/deploy, and re-confirm
candidate/live hashes. Do not regress the repaired immutable caching, CSP, or
Permissions-Policy.

No product code was changed during verification; only this handoff and the new
verification report were added/updated.
