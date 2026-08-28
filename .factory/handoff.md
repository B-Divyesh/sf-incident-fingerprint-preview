# Fingerprint Preview v0.1.0 handoff

## What shipped

- A typed Rust library and `fingerprint-preview` CLI that import scrubbed JSON,
  parse the five-part fingerprint DSL with ordered fallbacks, calculate stable
  proposed group IDs, and report baseline splits, cross-group merges, stable
  groups, event membership, and privacy-reduced representative frames.
- Automatic plus explicit generic, Sentry, Bugsnag, and Rollbar adapters. The
  adapter boundary is stated honestly in the CLI, README, and site: this is not
  a reproduction of proprietary vendor grouping semantics.
- Human terminal output, versioned `--json` output, useful `--help`, documented
  exit codes, sample fixtures, library docs, unit/integration/doctests, and CI.
- A static Vite documentation site with a browser-local evaluator matching the
  CLI's rule and group-ID behavior, file/paste input, sample restore, error and
  empty states, Ctrl/Command+Enter, JSON export, offline status, service-worker
  shell caching, privacy and terms pages, and no tracking or persistence.
- A product-specific mid-century instrument-panel system and original generated
  bench illustration. The final WebP is 960×640 and 47,380 bytes; exact prompt
  and generation metadata are in `.factory/assets/instrument-bench.json`.

## Build and verification

Clean-clone setup and exact factory build:

```sh
npm ci
npm test
npm run build
```

`npm run build` produces the static deployment at `dist/site/index.html` and
the release CLI at `dist/bin/fingerprint-preview`.

Verified on 2026-08-28:

- `cargo fmt --check`: pass
- `cargo clippy --all-targets --all-features -- -D warnings`: pass
- `npm test`: pass (7 Rust unit tests, 2 CLI integration tests, 1 doctest,
  5 browser evaluator unit tests, and 11 Playwright desktop/mobile checks; one
  intentional non-mobile skip)
- Playwright: Chromium desktop and 390×844 mobile; valid/error/empty flows,
  keyboard run path, export availability, zero console errors, legal routes,
  no horizontal overflow
- axe-core WCAG 2 A/AA after evaluation: zero serious or critical violations
- `npm audit --audit-level=high`: zero vulnerabilities
- `cargo package --allow-dirty`: pass; 17 files, 83.0 KiB uncompressed / 23.4
  KiB compressed
- Static budgets: initial JS 11.1 KiB, CSS 17.0 KiB, hero WebP 47.4 KiB; no
  runtime fonts, CDN scripts, or analytics. Entire initial transfer measured
  by Lighthouse at 60 KiB.

Production-build Lighthouse mobile simulation on local preview:

| Category/metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| First contentful paint | 0.9 s |
| Largest contentful paint | 1.4 s |
| Total blocking time | 0 ms |
| Cumulative layout shift | 0 |

Ready-to-publish Rust package command (factory credentials required for an
actual publish):

```sh
cargo package
```

## Known gaps and next steps

- Vendor adapters intentionally read the first exception/trace in common event
  exports. Add adapter fixtures for other documented vendor variants as demand
  appears; never present them as exact hosted grouping engines.
- The tool can remove sensitive stack detail from its own report, but cannot
  prove that arbitrary messages or filenames were scrubbed. The required
  pre-import warning remains prominent.
- Registry publishing and platform release binaries are factory release work;
  no credentials or deployment infrastructure were touched here. Until the
  crate is published, the site uses the honest `cargo install --git …` command.
