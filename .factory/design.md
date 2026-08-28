# Visual thesis — the incident grouping comparator

## Direction

Fingerprint Preview is a **mid-century instrument panel**, not a dashboard. Its
job resembles bench-testing a circuit before connecting it to a live system:
sample events enter on the left, a rule is dialed in, and grouped traces leave
on the right. A warm enamel enclosure, engraved labels, paper readouts, brass
fasteners, restrained shadows, and hard alignment make the tool feel precise,
offline, and safe. Decoration must explain this flow.

This is intentionally a single-mode treatment. The painted cream panel is the
product metaphor; a dark reinterpretation would weaken it. Code and readouts
use dark recessed wells for local contrast.

## Tokens

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Background | `--canvas` | `#d9cfb7` | outer workbench |
| Surface | `--panel` | `#f4ecd8` | painted instrument enclosure |
| Raised surface | `--paper` | `#fffaf0` | event and report sheets |
| Text | `--ink` | `#17231f` | primary copy (13.5:1 on panel) |
| Muted | `--muted` | `#5d665e` | secondary copy (5.0:1 on panel) |
| Recess | `--well` | `#20312b` | code editor and terminal |
| Accent | `--orange` | `#a83f27` | primary controls and split state |
| Accent contrast | `--cream` | `#fff8e7` | text on accent (6.8:1) |
| Signal | `--amber` | `#d99b32` | active lamps and selected tracks |
| Success | `--green` | `#356b4c` | stable groups |
| Danger | `--danger` | `#9d3029` | errors and invalid rules |

Fine rules use `#778078` and never carry meaning alone. Split, merge, and
unchanged states always pair color with a word and distinct shape.

## Type and rhythm

- Display and prose: Georgia with a Times fallback, chosen for the editorial
  confidence of printed technical manuals.
- Controls, labels, code, and numbers: ui-monospace / SFMono-Regular / Consolas.
  Tabular figures keep deltas stable while rules change.
- Scale: 14, 16, 20, 25, 40, 56px. Body never drops below 16px.
- Spacing follows 4/8px increments. Panel padding is 24–48px, readout gaps
  16–24px, and all controls have at least a 44px target.

## Interaction grammar

Controls behave like physical switches: a 1px downward press, an amber state
lamp, and immediate readout feedback. Editing a rule moves the status from
`READY` to `EDITED`; evaluating moves it through `EVALUATING` to `COMPLETE`.
Errors appear beside the relevant input and in the annunciator, with a direct
recovery instruction. Keyboard shortcut `Ctrl/⌘ + Enter` runs the bench test.

On phones, the decorative calibration rail and secondary metadata disappear;
the workflow stacks in source → rule → report order. No critical control is
fixed to an edge or hidden behind a drawer.

## Motion

Panel entrances use opacity plus 8px vertical travel over 220ms. Result rows
settle in over 180ms. Button motion is 120ms and uses transforms only. Nothing
loops. Under `prefers-reduced-motion: reduce`, travel is removed, transitions
are effectively instant, and the signal lamp remains static.

## Original asset plan and provenance

- `site/public/instrument-bench.webp`: generated specifically for this product
  with `/opt/fleet/lib/gen-image.sh`, the factory `factory-image` deployment,
  then resized/encoded locally to WebP. It is a text-free wide illustration of
  an analog incident-grouping test bench: redacted stack traces feed brass
  selectors and emerge as split/merged paper channels. It supports the hero's
  pre-deploy test-bench metaphor. Generation metadata is retained beside the
  source during production; the optimized WebP is shipped. License: project
  asset under the repository MIT license. Machine-readable generation details
  are retained at `.factory/assets/instrument-bench.json`.
- Icons and signal marks are hand-made with CSS primitives; no icon library.

Exact image prompt: “Wide editorial product illustration for a developer tool
landing page, a 1960s mid-century laboratory instrument panel used to compare
incident fingerprints. Cream enamel console on a warm workbench, dark green
recessed display, brass selector knobs, amber indicator lamps. On the left,
abstract redacted stack-trace paper strips enter the machine; on the right they
emerge into three clearly separated paper channels, visually explaining split
and merge comparison. Crisp screenprint and gouache texture, subtle halftone,
precise industrial design, straight-on three-quarter view, generous negative
space, palette of cream, forest green, burnt orange, mustard and charcoal. No
people, no logos, no brand marks, no readable text, no gradients, no neon, no
generic laptop mockup, no watermark.”
