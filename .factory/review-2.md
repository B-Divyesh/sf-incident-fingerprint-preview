# Review: preview fingerprint splits and merges

**Review date:** 2026-09-06  
**Verdict:** **PASS**  
**Findings:** **0** at every severity  
**Untested public claims:** **0**  
**Implementation reviewed:** `23f992623cd24a217e11a1b4c22f231aca1b4429`  
**Documentation checkout:** `6147c303c642ccb434d44bee4eb340005c51e5f4`  
**Live URL:** https://incident-fingerprint-preview.sociobot.in/

## Verdict

**PASS.** The live product, clean implementation checkout, installed CLI, and
fresh library consumer passed the required paths. All 19 declared claim
commands passed separately. There are no findings and no untested public
claims.

The implementation is `23f9926`. The later documentation checkout is
`6147c30`; it contains reports only. A fresh production build from the
implementation matched the live Home, Demo, Privacy, Terms, designed 404,
JavaScript, CSS, service worker, hero image, and social image bytes.

## First screen before scrolling

Fresh 1440×1000 desktop and 390×844 phone browsers both showed the same
complete first screen at scroll position zero:

- Job: “Preview fingerprint splits and merges before rollout.”
- Audience: “For engineers tuning incident grouping rules before they change
  alert volume.”
- First action: “Try it with sample data”; the adjacent text says it opens a
  populated split and merge report.
- Facts: free and open source, works offline after the first visit, and no
  telemetry or event uploads.

The action opened `/demo/#bench` in one click. It showed three checkout events,
two baseline groups, two proposed groups, one split and one split-plus-merge.
The persistent label said “Demo — sample data, nothing is saved.” Reset restored
the sample and Start for real opened an empty event workspace. No console error
occurred in either browser.

## Clean implementation checks

A new remote clone was detached at `23f9926`. After the documented `npm ci`,
the following commands passed:

```sh
npm test
npm run build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --doc
cargo package --locked
npm audit --audit-level=high
```

`npm test` passed 7 library tests, 3 CLI integration tests, 1 doctest, 9
source/configuration tests, 2 built-output tests, 42 desktop/phone browser
tests, and all 19 aggregate claim tests. `npm run build` produced `dist/site/`
and `dist/bin/fingerprint-preview`. Packaging verified the 18-file crate, and
the audit found zero vulnerabilities.

The 19 exact commands from `.factory/claims.json` were then run one at a time.
Every command passed: demo sandbox, offline reload, local processing, no
accounts/cookies, input discard, public-cache-only, vendor imports, report
deltas, redaction, JSON export, CLI output and exit codes, fresh library
consumer, single installed binary, terminal recording, CLI demo, free MIT
distribution, keyboard run, and file-size recovery. Logs are under
`/work/.evidence/review2-claim-commands/`.

The built package was exercised by those consumer claims in a new Cargo project
and a new install root. It installed one `fingerprint-preview` executable and
the documented library API ran successfully. The bundled CLI sample produced
the expected three-event report and writes only to its named temporary
directory.

## Live paths and product checks

- Normal path: the one-click sample rendered its populated split/merge report
  on desktop and phone.
- Invalid and recovery paths: malformed JSON gave a specific JSON error;
  `request.url` gave a supported-rule-parts error; valid input and
  Ctrl/Command+Enter recovered to `COMPLETE`.
- Boundary path: a 5,000,001-byte file was rejected with the 5 MB guidance;
  a following small file loaded successfully. An empty array showed the useful
  empty result.
- Privacy: a unique event marker made no outgoing request. All observed
  requests were same-origin GETs. There were no cookies, localStorage,
  sessionStorage, or IndexedDB entries. A separate cache inspection found the
  marker in no Cache Storage response; the service-worker cache held public
  files only.
- Offline and update: the live service worker updated successfully. In a new
  context, `/demo/` reloaded offline, showed the offline notice, and retained
  the complete sample report.
- Keyboard and motion: Tab first focused the skip link with a 3px outline; the
  fresh browser suite passed keyboard, focus, touch target, 200% reflow, and
  reduced-motion checks.
- Accessibility: `verify-url.sh` passed the live home page. Fresh axe WCAG
  2 A/AA scans had zero violations for Home, Demo, Privacy, Terms, and the
  designed 404 on desktop and phone. Each page had `lang=en`, one `h1`, one
  `main`, header, footer, and no horizontal overflow.
- Routes and links: Home, Demo, Privacy, and Terms returned 200. All ten
  discovered internal and repository links returned 200 after redirects. The
  unknown path returned the expected HTTP 404 and a complete product page with
  “Return home”; its navigation 404 console message is expected, not a broken
  page.
- Performance: fresh live mobile Lighthouse scored 100 Performance, 100
  Accessibility, 100 Best Practices, and 100 SEO. FCP was 848 ms, LCP 1,050
  ms, total blocking time 0 ms, CLS 0, and transfer 62,495 bytes.

This static CLI/site product has no backend, tenant, database, health endpoint,
or API rate allowance. Tenant isolation, restart persistence, and 429/
`Retry-After` checks do not apply.

## Earlier finding disposition

| Earlier finding or note | Current disposition |
| --- | --- |
| Immutable assets revalidated after 30 seconds | **Closed.** Live hashed JavaScript and CSS use `max-age=31536000, immutable`. |
| CSP and Permissions-Policy absent | **Closed.** Current live responses send both policies, plus nosniff and strict referrer policy. |
| Six mobile links below 44×44 px | **Closed.** Fresh desktop and phone suites pass all visible target checks. |
| Hidden 1×1 native file input | **Not a defect.** Its visible file label is the usable target and receives the designed focus ring. |
| No browser or CLI demo sandbox | **Closed.** The browser and installed CLI demos passed their exact sandbox claims. |
| Claims registry and tagged tests missing | **Closed.** Nineteen registered claims map one-to-one to passing outcome tests. |
| First screen did not state job, audience, or outcome | **Closed.** Both fresh first screens state all three before scrolling. |
| Broken host 404 | **Closed.** The deliberate 404 has product structure, title, exits, and no axe violation. |
| Missing route metadata or site skeleton | **Closed.** All public routes have distinct titles, metadata, shared header/footer, legal pages, and working links. |
| Small editor text and desktop targets | **Closed.** Fresh browser checks pass their 16px text and 44px target tests. |
| Verification 3 reported zero findings before strict review 1 | **Superseded, then confirmed.** Strict review 1 found six gaps; the fresh checks above confirm their repairs. |

## Evidence

- `/work/.evidence/review2-desktop-first-screen.png`
- `/work/.evidence/review2-phone-first-screen.png`
- `/work/.evidence/review2-live-flow.json`
- `/work/.evidence/review2-invalid-recovery.json`
- `/work/.evidence/review2-live-axe.json`
- `/work/.evidence/review2-link-crawl.json`
- `/work/.evidence/review2-lighthouse.json`
- `/work/.evidence/review2-verify-url/verify.json`
- `/work/.evidence/review2-claim-commands/`
- `/work/.evidence/review2-npm-test.log`

No product code, deployment, infrastructure, DNS, billing, backend, or
external service state was changed by this review.

