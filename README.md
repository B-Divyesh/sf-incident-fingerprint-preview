# Fingerprint Preview

Preview fingerprint splits and merges before changing production rules.
Fingerprint Preview is for engineers who tune incident grouping and want a
local check before alert volume changes.

The package is free and open source under the MIT License. It includes one
`fingerprint-preview` CLI binary, a small Rust library, and a browser
evaluator. It is not an incident tracker and does not copy proprietary vendor
grouping behavior.

## Try the sample

Run the installed CLI with its bundled three-event checkout sample:

```sh
fingerprint-preview demo
```

The command evaluates the sample, writes `events.json`, `rules.fp`, and
`report.json` to a new temporary directory, and prints that directory. It does
not read or change the current project.

The browser demo is available at
<https://incident-fingerprint-preview.sociobot.in/demo/>. It opens a populated
split and merge report in one click. The demo stays labeled and can be reset.
Starting for real returns to an empty workspace.

## Install

Build with a current stable Rust toolchain:

```sh
cargo install --path . --locked
fingerprint-preview --help
```

The package starts at version `0.1.0`.

## Preview your events

Create a scrubbed JSON array or an object containing an `events` array.
Existing groups may use `group_id`, `issue_id`, or `fingerprint`. The importer
reads generic frames and common Sentry, Bugsnag, and Rollbar event shapes.

```json
[
  {
    "id": "evt-checkout-1",
    "group_id": "checkout-errors",
    "message": "card declined for customer [redacted]",
    "exception": { "type": "PaymentError", "value": "card declined" },
    "frames": [
      { "function": "charge", "module": "checkout", "filename": "src/pay.rs", "in_app": true }
    ]
  }
]
```

Rules use one expression per line. Join parts with `+`. Separate fallback
branches with `??`. Comments begin with `#`.

```text
exception.type + frames.in_app
?? message
```

Supported parts are `message`, `exception.type`, `error.value`,
`frames.in_app`, and `frames.all`.

Run a preview:

```sh
fingerprint-preview preview --events fixtures/events.json --rules fixtures/rules.fp
fingerprint-preview preview --events fixtures/events.json --rules fixtures/rules.fp --json > report.json
```

The human report shows baseline parents, split or merge states, and one
representative frame. `--json` writes the versioned `PreviewReport` format for
scripts. Exit codes are `0` for success, `2` for invalid input, and `1` for
file or output errors.

## Use the Rust library

```rust
use incident_fingerprint_preview::{preview_json, RuleSet};

let events = r#"[{"id":"e1","group_id":"old","message":"boom",
  "exception":{"type":"TypeError"}}]"#;
let rules = RuleSet::parse("exception.type ?? message").unwrap();
let report = preview_json(events, &rules).unwrap();
assert_eq!(report.summary.event_count, 1);
```

## Browser privacy and offline use

The browser evaluator sends no event content, telemetry, or analytics. It uses
no accounts or cookies. Event JSON and rule edits stay in memory and disappear
on reload. The service worker caches public application files, not pasted
content. After the first visit, the demo reloads and evaluates offline.

Scrub every sample before import. Reports omit frame line numbers, source
context, arguments, and request data. Messages and filenames can still contain
sensitive values.

See the [privacy policy](https://incident-fingerprint-preview.sociobot.in/privacy/)
and [terms](https://incident-fingerprint-preview.sociobot.in/terms/).

## Develop, test, and package

Requirements are a current stable Rust toolchain, Node.js 22, and npm.

From a clean checkout:

```sh
npm ci
npm test
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --doc
cargo package --locked
```

`npm test` runs Rust tests, site tests, a production build, browser checks, and
every claim in `.factory/claims.json`. `npm run build` creates the static site
in `dist/site/` and the release CLI in `dist/bin/`.

For local browser work:

```sh
npm run dev
```

The factory deploys `dist/site/` to Azure Static Web Apps. Do not publish the
crate from a worker checkout; the factory owns registry credentials.

## License

MIT © 2026 Sociobot (Param Factory). See [LICENSE](LICENSE).
