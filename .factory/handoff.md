# Fingerprint Preview — review 1 handoff

## Status: FAIL

Review 1 on **2026-09-05** found **6 defects**: 0 critical, 2 high, 3
moderate, and 1 low. It also found **16 untested public claims** because the
required `.factory/claims.json` and `@claim:` tests are absent.

The full report is `.factory/review-1.md`. No product source, deployment, DNS,
infrastructure, or secrets were changed.

## Candidate and live identity

- Implementation reviewed: `d9afe5f9ae0d19f76c26ea60c4609fa5a8433bdf`
- Documentation checkout: `27f4d210c4b1d0258bb15cb347d0da02cef1c3af`
- Live URL: https://incident-fingerprint-preview.sociobot.in/
- Fresh build and live hashes match for the HTML pages, JS, CSS, hero image,
  and service worker.

## Main blockers

- No `/demo`, CLI demo command, one-click populated result, persistent demo
  label, demo reset/start controls, isolated namespace, or demo documentation.
- No claims registry or claim-tagged tests; 16 public claim categories remain
  untested under the claims contract.
- The first screen does not plainly name the job or audience.
- Unknown routes use a broken Azure default 404 page.
- Required metadata and the standard header/footer structure are incomplete.
- Some core mobile text and desktop navigation targets are below the stated
  size minimums.

## What passed

From a detached clean checkout after `npm ci`:

```sh
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm test
npm run build
cargo test --doc
cargo package --locked
npm audit --audit-level=high
```

The installed CLI, packed Rust library consumer, populated browser output,
JSON export, invalid/boundary/recovery paths, keyboard use, mobile layout,
reduced motion, axe checks on product pages, privacy boundary, service-worker
update, offline reload, links, live headers, and performance budgets passed.
Lighthouse scored 100 in all four categories with 1.062 s LCP, zero CLS/TBT,
and 60,884 B transfer.

Earlier caching, security-header, and six-link mobile target defects are closed
with fresh evidence. The hidden file input remains acceptable because its
visible 100×44 label receives the focus indication.

## Evidence and next step

Required evidence is under `/work/.evidence/`. Repair the six findings in
`.factory/review-1.md`, add one sandbox test for every registered public claim,
redeploy, and perform a fresh independent review. A successful command run does
not change this product verdict from **FAIL**.
