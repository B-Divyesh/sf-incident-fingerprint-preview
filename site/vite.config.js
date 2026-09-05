import { resolve } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { defineConfig } from 'vite';

function demoPage() {
  return {
    name: 'fingerprint-preview-demo-page',
    async writeBundle(options) {
      const outputDirectory = options.dir;
      if (!outputDirectory) throw new Error('The site output directory is missing.');
      const indexPath = resolve(outputDirectory, 'index.html');
      const source = (await readFile(indexPath, 'utf8'))
        .replace('<title>Fingerprint Preview — preview grouping changes</title>', '<title>Demo — Fingerprint Preview</title>')
        .replaceAll('content="Fingerprint Preview — preview grouping changes"', 'content="Demo — Fingerprint Preview"')
        .replace('href="https://incident-fingerprint-preview.sociobot.in/"', 'href="https://incident-fingerprint-preview.sociobot.in/demo/"')
        .replace('content="https://incident-fingerprint-preview.sociobot.in/"', 'content="https://incident-fingerprint-preview.sociobot.in/demo/"');
      const demoDirectory = resolve(outputDirectory, 'demo');
      await mkdir(demoDirectory, { recursive: true });
      await writeFile(resolve(demoDirectory, 'index.html'), source);
    }
  };
}

export default defineConfig({
  root: resolve(import.meta.dirname),
  base: '/',
  plugins: [demoPage()],
  build: {
    outDir: resolve(import.meta.dirname, '../dist/site'),
    emptyOutDir: true,
    target: 'es2022',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
        privacy: resolve(import.meta.dirname, 'privacy/index.html'),
        terms: resolve(import.meta.dirname, 'terms/index.html')
      }
    }
  }
});
