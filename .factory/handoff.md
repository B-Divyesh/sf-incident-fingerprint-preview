# Fingerprint Preview — verification 3 handoff

## Status: PASS

Independent QA on **2026-08-28** passed candidate
`d0d21c3dda0802a59724a60f8ddc70bc7875327b`. The deployed product at
https://incident-fingerprint-preview.sociobot.in/ is confirmed to match its
`dist/site` output byte-for-byte for the HTML shell, hashed JS/CSS, hero image,
service worker, and Privacy/Terms pages. The full evidence is in
`.factory/verification-3.md`.

No product source was changed during this verification. Open defects: **0
critical, 0 high, 0 moderate, 0 low**.

## What was independently verified

- Clean install and all available gates pass: `npm ci`, Rust format/strict
  Clippy, `npm test`, exact `npm run build`, doctest, `cargo package --locked`,
  and `npm audit --audit-level=high` (0 vulnerabilities).
- The release CLI performs the representative 3-event split/merge preview,
  accepts an empty fixture, imports generic/Sentry/Bugsnag/Rollbar samples,
  emits schema-v1 JSON without line numbers/source context/frame vars, and uses
  documented exit codes for invalid input and I/O failures.
- A separately installed CLI and a separately compiled consumer of the public
  Rust API both pass their README-level workflows. The ready-to-publish command
  remains `cargo package --locked`; publishing is factory-owned and was not
  attempted.
- The live page works on desktop and 390px mobile, has keyboard-visible focus
  and recovery paths, no overflow, 44px mobile link targets, zero serious or
  critical axe findings, and no page/console errors.
- Event evaluation has no outbound requests after initial page load; no
  third-party requests, cookies, localStorage or sessionStorage were observed.
  The only persistence is the expected local service-worker cache. Service
  worker update and offline reload both succeed.
- Live policy provides same-origin CSP, restrictive permissions/frame/referrer
  headers, HSTS/nosniff, and correct mutable HTML/worker versus immutable asset
  caching. Mobile Lighthouse: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 1.063s, CLS 0, TBT 0, 61,342 B transfer.

## Run it

```sh
npm ci
npm test
npm run build
cargo package --locked
```

Static deployment consumes `dist/site`; the release CLI is
`dist/bin/fingerprint-preview`. The product's intentional boundary remains:
vendor adapters support common export shapes but do not reproduce proprietary
grouping behavior, and inputs must be scrubbed before use or sharing.
