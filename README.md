# Fingerprint Preview

An offline test bench for engineers changing error-grouping rules. Feed it
scrubbed Sentry-style, Bugsnag-style, Rollbar-style, or generic JSON events;
preview how a proposed fingerprint splits or merges the current groups; inspect
representative frames; then export a machine-readable report before rollout.

Fingerprint Preview is deliberately not an incident tracker and does not claim
to reproduce proprietary vendor grouping semantics. It never sends event data
over the network.

## Install

Download a release binary, or build with a current Rust toolchain:

```sh
cargo install --path .
fingerprint-preview --help
```

The package starts at `0.1.0` and exposes both the `fingerprint-preview` binary
and the small `incident_fingerprint_preview` Rust library.

## Usage

Create a redacted JSON array (or `{ "events": [...] }`). Existing group keys
may be provided as `group_id`, `issue_id`, or `fingerprint`. Stack data can use
generic `frames`, Sentry `exception.values[].stacktrace.frames`, Bugsnag
`exceptions[].stacktrace`, or Rollbar `body.trace.frames` shapes.

```json
[
  {
    "id": "evt-checkout-1",
    "group_id": "checkout-errors",
    "message": "card declined for customer [redacted]",
    "exception": { "type": "PaymentError", "value": "card declined" },
    "frames": [
      { "function": "charge", "module": "checkout", "filename": "src/pay.rs", "lineno": 42, "in_app": true }
    ]
  }
]
```

Rules use one expression per line. Parts are joined with `+`; the first
available branch separated by `??` wins. Comments begin with `#`.

```text
exception.type + frames.in_app
?? message
```

Supported parts are `message`, `exception.type`, `error.value`,
`frames.in_app`, and `frames.all`. Frame parts use normalized
`module/function/filename` values and never include line numbers, arguments, or
source context in output.

Preview the change:

```sh
fingerprint-preview preview --events fixtures/events.json --rules rules.fp
fingerprint-preview preview --events fixtures/events.json --rules rules.fp --json > report.json
```

The human report lists proposed groups, their baseline parents, the resulting
split/merge/stable classification, and one representative frame. `--json`
returns the typed `PreviewReport` format for CI. Exit codes are `0` for a valid
preview, `2` for input/rule errors, and `1` for unexpected I/O errors.

Library usage:

```rust
use incident_fingerprint_preview::{preview_json, RuleSet};

let events = r#"[{"id":"e1","group_id":"old","message":"boom",
  "exception":{"type":"TypeError"}}]"#;
let rules = RuleSet::parse("exception.type ?? message").unwrap();
let report = preview_json(events, &rules).unwrap();
assert_eq!(report.summary.event_count, 1);
```

## Web preview

The landing page includes a dependency-free live evaluator for pasting scrubbed
fixtures. Processing stays in the browser tab; the site has no analytics,
accounts, cookies, uploads, or third-party runtime assets.

```sh
npm install
npm run dev
npm run build:site   # outputs dist/site/index.html
```

## Develop and verify

```sh
npm install
npm test             # Rust + site unit tests + production build
npm run build         # CLI release binary + site -> dist/
cargo test --doc
cargo package --allow-dirty
```

The exact factory build command is `npm run build`; static deployment uses
`dist/site`. The static host is Azure Static Web Apps; its response policy is
versioned in `site/public/staticwebapp.config.json` and copied into that output
directory by the Vite build. It keeps hashed JS/CSS and the immutable hero
image for one year, while HTML and the service worker revalidate on every
request. CI is defined in `.github/workflows/ci.yml`.

## Privacy and security

Scrub before import. The evaluator omits source context, arguments, request
data, and frame line numbers from fingerprints and reports, but it cannot prove
that arbitrary messages or filenames are safe. Review fixtures before sharing
or committing them. See the live privacy and terms pages for the web surface.

## License

MIT © 2026 Sociobot (Param Factory). See [LICENSE](LICENSE).
