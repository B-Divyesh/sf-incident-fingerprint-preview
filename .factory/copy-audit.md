# Landing-page copy audit

Audited 5 September 2026. Counts treat slash-separated shortcuts and product
names as the words a person reads. No sentence exceeds 22 words. No sentence
uses a banned marketing word.

| Landing-page sentence or standalone line | Words | Result |
| --- | ---: | --- |
| You are offline. | 3 | Pass |
| The evaluator still works, but external links may not. | 9 | Pass |
| Demo — sample data, nothing is saved. | 6 | Pass |
| The report uses three bundled checkout events. | 7 | Pass |
| Preview fingerprint splits and merges before rollout. | 7 | Pass |
| For engineers tuning incident grouping rules before they change alert volume. | 11 | Pass |
| Opens a populated split and merge report. | 7 | Pass |
| Free and open source. | 5 | Pass |
| Works offline after your first visit. | 6 | Pass |
| No telemetry or event uploads. | 5 | Pass |
| Sample event paths before and after one proposed rule. | 9 | Pass |
| Paste a redacted fixture or load a local file. | 9 | Pass |
| Nothing is uploaded, saved, or logged. | 6 | Pass |
| No report yet. | 3 | Pass |
| Load scrubbed events, then evaluate the rule. | 7 | Pass |
| Scrub first. | 2 | Pass |
| Reports exclude line numbers, source context, arguments, and request data. | 10 | Pass |
| Messages and filenames may still contain sensitive values. | 8 | Pass |
| Export a representative event set, remove customer data, and retain existing group IDs. | 13 | Pass |
| Combine stable exception and frame fields with an explicit fallback. | 10 | Pass |
| Check each baseline split and cross-group merge before rollout. | 9 | Pass |
| It reads common Sentry, Bugsnag, and Rollbar JSON shapes. | 9 | Pass |
| It does not copy any vendor’s private grouping logic. | 9 | Pass |
| The package provides one CLI binary and a typed Rust library. | 11 | Pass |
| Add scrubbed fixtures and versioned reports to rule reviews. | 9 | Pass |
| The recording uses the same bundled fixture as the browser demo. | 11 | Pass |
| Preview fingerprint splits and merges before production. | 7 | Pass |

## Terminology

| Concept | One term used |
| --- | --- |
| Input collection | event sample |
| Proposed grouping expression | fingerprint rule |
| Current grouping | baseline group |
| Simulated grouping | proposed group |
| Local try-out state | demo |
| Generated result | report |
| Existing group divided by the rule | split |
| Existing groups combined by the rule | merge |
