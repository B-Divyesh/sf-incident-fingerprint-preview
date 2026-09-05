# Demo sandbox

## Browser

- URL: `https://incident-fingerprint-preview.sociobot.in/demo/`
- Entry: select **Try it with sample data** on the first screen.
- Sample: three scrubbed checkout incidents in two baseline groups. The bundled
  rule creates one split and one split-plus-merge result.
- Reset: select **Reset demo** in the persistent demo banner.
- Exit: select **Start for real**. This opens an empty workspace.

The browser demo keeps event JSON, rules, and reports only in page memory. It
does not use localStorage, sessionStorage, IndexedDB, OPFS, cookies, or a
backend. Because no product data is persisted, there is no shared real-data
namespace to reach. Cache Storage contains only public application files.
Leaving or reloading the demo reconstructs the bundled sample.

## CLI

Run:

```sh
fingerprint-preview demo
```

The binary compiles `fixtures/events.json` and `fixtures/rules.fp` into the
artifact. Each run creates a unique `fingerprint-preview-demo-*` directory
under the operating system temporary directory. It writes the two inputs and
`report.json` there, prints the path, and does not read or write the current
project.
