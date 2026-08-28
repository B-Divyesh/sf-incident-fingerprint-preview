# Fingerprint Preview v0.1.0 repair handoff

## Repair status

Repaired the release-blocking finding from independent verification commit
`b342b93e7716bdab53de2e2c9b5da1867f22643a` against candidate
`5cdb04f4cc071801fd8927a5ad45229c99ce9bf0`.

Root cause: the static deployment is Azure Static Web Apps, which does not
consume the Cloudflare/Netlify-style `site/public/_headers` file. Consequently
the live host applied its 30-second default cache policy to hash-named JS, CSS,
and the immutable hero image.

Repair:

- Added `site/public/staticwebapp.config.json`, copied to the root of
  `dist/site/`, with Azure Static Web Apps route policies: `/assets/*` and
  `/instrument-bench.webp` receive `Cache-Control: public, max-age=31536000,
  immutable`; HTML and `sw.js` revalidate.
- Added a restrictive same-origin Content-Security-Policy and a minimal
  Permissions-Policy at the Azure deployment layer, resolving the verifier's
  low-severity hardening gap too.
- Kept the same security policy in `_headers` for any compatible static-host
  preview; this does not alter application code or product behaviour.
- Added exact regression coverage that checks every cache/security directive
  and confirms Vite copies the Azure configuration into the production output.

## Verification evidence

Run from a clean dependency install on 2026-08-28:

```sh
npm ci
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm test
npm run build
cargo test --doc
cargo package --allow-dirty
npm audit --audit-level=high
```

Results:

- `npm ci`: 22 packages audited, 0 vulnerabilities.
- `cargo fmt --check` and strict `cargo clippy`: pass.
- `npm test`: 7 Rust library tests, 2 CLI integration tests, 1 doctest,
  7 site/configuration tests, and 11 Playwright checks pass; 1 intentionally
  non-mobile keyboard test is skipped. Playwright covers Chromium desktop and
  390×844 mobile, keyboard evaluation, export, error recovery, no horizontal
  overflow, legal routes, and axe WCAG 2 A/AA (no serious/critical violations).
- Production output test passes and verifies
  `dist/site/staticwebapp.config.json` exactly matches the source response
  policy. Built JS is 11.13 KB raw / 4.27 KB gzip and CSS is 17.00 KB raw /
  4.66 KB gzip; the original 47.38 KB WebP asset remains below budget.
- `cargo test --doc` and `cargo package --allow-dirty` pass (17 packaged
  files, 83.4 KiB unpacked / 23.6 KiB compressed).
- Packed consumer verification: installed the package from
  `target/package/incident-fingerprint-preview-0.1.0`, ran `--help`, evaluated
  the documented fixture with `preview --json` (3 events, 2 proposed groups),
  and compiled/ran a fresh Rust consumer using `RuleSet::parse` and
  `preview_json`.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- GitHub Actions installs the pinned Playwright Chromium binary before `npm
  test`, so the clean-clone CI browser suite has the same dependency it uses
  locally.

The previous live response was reproduced before repair: the root, hashed JS,
and hero image all returned `Cache-Control: public, must-revalidate,
max-age=30`. After the repair commit is pushed, Azure Static Web Apps deploys
the native configuration in `dist/site/`; rerun the live header commands below
to confirm the CDN edge has completed rollout.

```sh
curl -sSI https://incident-fingerprint-preview.sociobot.in/assets/<hashed>.js
curl -sSI https://incident-fingerprint-preview.sociobot.in/instrument-bench.webp
```

Both must include `cache-control: public, max-age=31536000, immutable`; the
root and `sw.js` must retain a revalidation policy. The live response should
also include the configured `content-security-policy` and
`permissions-policy` headers.

## What ships

- Typed Rust library and `fingerprint-preview` CLI for locally evaluating the
  documented five-part fingerprint DSL against scrubbed generic, Sentry,
  Bugsnag, and Rollbar event exports.
- Browser-local static evaluator with sample/file input, split/merge report,
  JSON export, errors and empty states, Ctrl/Command+Enter, service-worker
  offline shell, and no telemetry, uploads, accounts, cookies, or third-party
  runtime assets.
- Static landing/docs site in the existing mid-century instrument-panel visual
  system. Asset provenance is retained in `.factory/assets/instrument-bench.json`.

## Build, package, and deploy

```sh
npm ci
npm test
npm run build
```

The CLI is at `dist/bin/fingerprint-preview`; the static Azure Static Web Apps
artifact is `dist/site`. Do not publish from this repository. The factory can
produce the ready-to-publish crate with:

```sh
cargo package
```

Deployment is static: publish `dist/site` with the included
`staticwebapp.config.json` at its root. It is required for the cache and
security policy; do not omit or relocate it.

## Known gaps / next steps

- Vendor adapters intentionally use common event-export shapes and do not
  claim exact proprietary grouping semantics.
- The evaluator removes known stack detail but cannot prove arbitrary messages
  or filenames are safe; the pre-import scrub warning remains required.
- Registry publishing and release binaries remain factory-owned. No registry
  credentials were used during this repair.
