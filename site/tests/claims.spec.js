import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const repository = resolve(import.meta.dirname, '../..');
const binary = resolve(repository, 'dist/bin/fingerprint-preview');
const fixtureEvents = resolve(repository, 'fixtures/events.json');
const fixtureRules = resolve(repository, 'fixtures/rules.fp');

function runCli(args, options = {}) {
  return spawnSync(binary, args, { encoding: 'utf8', ...options });
}

function demoDirectory(output) {
  const match = output.match(/^Demo files  (.+)$/m);
  return match?.[1];
}

async function ensureControlled(page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) {
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  }
}

test('@claim:demo-sandbox one click opens and resets an isolated populated demo', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByLabel('01 Event sample')).toHaveValue('');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo\/#bench$/);
  await expect(page).toHaveTitle('Demo — Fingerprint Preview');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#event-count')).toHaveText('3 sample events');
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  await expect(page.getByText('split + merge', { exact: true })).toBeVisible();

  await page.getByLabel('01 Event sample').fill('[]');
  await page.getByRole('button', { name: 'Evaluate grouping' }).click();
  await expect(page.getByText('The fixture is empty.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#event-count')).toHaveText('3 events loaded');
  await expect(page.getByText('split + merge', { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();

  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel('01 Event sample')).toHaveValue('');
  await expect(page.locator('#demo-banner')).toBeHidden();
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

test('@claim:offline-reload demo reloads and evaluates without a network', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('/demo/');
    await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
    await ensureControlled(page);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('You are offline.')).toBeVisible();
    await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
    await expect(page.getByText('split + merge', { exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:local-processing evaluator sends no content, telemetry, or analytics', async ({ page, context }) => {
  const requests = [];
  page.on('request', (request) => requests.push({ url: request.url(), method: request.method(), data: request.postData() || '' }));
  await page.goto('/demo/');
  const productOrigin = new URL(page.url()).origin;
  const marker = 'QA-NETWORK-MARKER-48371';
  await page.getByLabel('01 Event sample').fill(JSON.stringify([{ id: 'local', group_id: 'old', message: marker }]));
  await page.getByLabel('02 Fingerprint rule').fill('message');
  await page.getByRole('button', { name: 'Evaluate grouping' }).click();
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  expect(requests.every(({ url }) => new URL(url).origin === productOrigin)).toBe(true);
  expect(requests.every(({ method }) => method === 'GET')).toBe(true);
  expect(JSON.stringify(requests)).not.toContain(marker);
  expect(await context.cookies()).toEqual([]);
});

test('@claim:no-accounts-cookies complete browser paths create no account or cookie state', async ({ page, context }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo/');
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.getByLabel('01 Event sample').fill('[{"message":"one"}]');
  await page.getByRole('button', { name: 'Evaluate grouping' }).click();
  expect(await context.cookies()).toEqual([]);
  expect(requests.some((url) => /login|logout|account|oauth|session/i.test(new URL(url).pathname))).toBe(false);
});

test('@claim:input-not-saved reload discards real event and rule edits', async ({ page }) => {
  const marker = 'QA-RELOAD-MARKER-60219';
  await page.goto('/');
  await page.getByLabel('01 Event sample').fill(JSON.stringify([{ message: marker }]));
  await page.getByLabel('02 Fingerprint rule').fill('message # edited marker');
  await page.getByRole('button', { name: 'Evaluate grouping' }).click();
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  await page.reload();
  await expect(page.getByLabel('01 Event sample')).toHaveValue('');
  await expect(page.getByLabel('02 Fingerprint rule')).not.toHaveValue(/edited marker/);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('@claim:public-cache-only service worker caches public files and never pasted content', async ({ page }) => {
  const marker = 'QA-CACHE-MARKER-91427';
  await page.goto('/demo/');
  const productOrigin = new URL(page.url()).origin;
  await ensureControlled(page);
  await page.getByLabel('01 Event sample').fill(JSON.stringify([{ message: marker }]));
  await page.getByLabel('02 Fingerprint rule').fill('message');
  await page.getByRole('button', { name: 'Evaluate grouping' }).click();
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const records = [];
    for (const name of names) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        records.push({ name, url: request.url, body: await response.text() });
      }
    }
    return records;
  });
  expect(cached.length).toBeGreaterThan(3);
  expect(cached.every(({ url }) => new URL(url).origin === productOrigin)).toBe(true);
  expect(JSON.stringify(cached)).not.toContain(marker);
  expect(cached.some(({ url }) => new URL(url).pathname === '/demo/')).toBe(true);
});

test('@claim:vendor-imports generic and vendor fixtures produce representative frames', async ({ page }) => {
  const fixtures = [
    ['generic', { id: 'g', group_id: 'old', exception: { type: 'GenericError' }, frames: [{ module: 'generic', function: 'run', filename: 'generic.rs', in_app: true }] }, 'generic/run/generic.rs'],
    ['sentry', { event_id: 's', issue_id: 'old', exception: { values: [{ type: 'SentryError', stacktrace: { frames: [{ module: 'sentry', function: 'send', filename: 'sentry.py', in_app: true }] } }] } }, 'sentry/send/sentry.py'],
    ['bugsnag', { id: 'b', group_id: 'old', exceptions: [{ errorClass: 'BugsnagError', stacktrace: [{ package: 'bugsnag', method: 'notify', file: 'bugsnag.js', inProject: true }] }] }, 'bugsnag/notify/bugsnag.js'],
    ['rollbar', { uuid: 'r', fingerprint: 'old', body: { trace: { exception: { class: 'RollbarError' }, frames: [{ package: 'rollbar', method: 'capture', file: 'rollbar.rb' }] } } }, 'rollbar/capture/rollbar.rb']
  ];
  await page.goto('/demo/');
  for (const [name, fixture, frame] of fixtures) {
    await page.getByLabel('01 Event sample').fill(JSON.stringify([fixture]));
    await page.getByLabel('02 Fingerprint rule').fill('exception.type + frames.all');
    await page.getByRole('button', { name: 'Evaluate grouping' }).click();
    await expect(page.locator('#results'), `${name} frame`).toContainText(frame);
    await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  }
});

test('@claim:report-deltas sample report explains counts, changes, parents, and frames', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  const report = page.locator('#results');
  await expect(report).toContainText('Baseline groups');
  await expect(report).toContainText('Proposed groups');
  await expect(report).toContainText('split + merge');
  await expect(report).toContainText('split');
  await expect(report).toContainText('from checkout-errors, payment-retries');
  await expect(report).toContainText('checkout/charge/src/pay.rs · in-app');
});

test('@claim:report-redaction exported report excludes sensitive frame and request fields', async ({ page }) => {
  const marker = 'QA-EXCLUDED-DETAIL-38149';
  const event = [{
    id: 'safe', group_id: 'old', message: 'safe message',
    frames: [{ module: 'app', function: 'run', filename: 'app.rs', in_app: true, lineno: 42, context_line: marker, vars: { token: marker }, args: [marker] }],
    request: { url: marker, data: marker }
  }];
  await page.goto('/demo/');
  await page.getByLabel('01 Event sample').fill(JSON.stringify(event));
  await page.getByLabel('02 Fingerprint rule').fill('frames.in_app');
  await page.getByRole('button', { name: 'Evaluate grouping' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const report = JSON.parse(readFileSync(await download.path(), 'utf8'));
  const output = JSON.stringify(report);
  expect(output).not.toContain(marker);
  expect(output).not.toContain('lineno');
  expect(output).not.toContain('request');
  expect(report.groups[0].representative_frame.filename).toBe('app.rs');
});

test('@claim:json-export browser download is a versioned sample grouping report', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('fingerprint-preview-report.json');
  const report = JSON.parse(readFileSync(await download.path(), 'utf8'));
  expect(report.schema_version).toBe(1);
  expect(report.summary).toMatchObject({ event_count: 3, baseline_group_count: 2, proposed_group_count: 2 });
});

test('@claim:cli-output built CLI emits useful human and JSON reports', async () => {
  const args = ['preview', '--events', fixtureEvents, '--rules', fixtureRules];
  const human = runCli(args);
  const json = runCli([...args, '--json']);
  expect(human.status).toBe(0);
  expect(human.stdout).toContain('Groups  2 baseline -> 2 proposed (+0)');
  expect(human.stdout).toContain('[split+merge]');
  expect(json.status).toBe(0);
  const report = JSON.parse(json.stdout);
  expect(report.schema_version).toBe(1);
  expect(report.summary.merged_proposed_groups).toBe(1);
});

test('@claim:cli-exit-codes CLI distinguishes success, input errors, and file errors', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'fp-exit-'));
  try {
    const badEvents = resolve(directory, 'bad.json');
    const badRules = resolve(directory, 'bad.fp');
    writeFileSync(badEvents, '{bad');
    writeFileSync(badRules, 'request.url');
    expect(runCli(['preview', '--events', fixtureEvents, '--rules', fixtureRules]).status).toBe(0);
    expect(runCli(['preview', '--events', badEvents, '--rules', fixtureRules]).status).toBe(2);
    expect(runCli(['preview', '--events', fixtureEvents, '--rules', badRules]).status).toBe(2);
    expect(runCli(['preview', '--events', resolve(directory, 'missing.json'), '--rules', fixtureRules]).status).toBe(1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('@claim:library-consumer documented API runs in a fresh Cargo project', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'fp-consumer-'));
  try {
    mkdirSync(resolve(directory, 'src'));
    writeFileSync(resolve(directory, 'Cargo.toml'), `[package]\nname = "fp-claim-consumer"\nversion = "0.1.0"\nedition = "2024"\n\n[dependencies]\nincident-fingerprint-preview = { path = ${JSON.stringify(repository)} }\n`);
    writeFileSync(resolve(directory, 'src/main.rs'), `use incident_fingerprint_preview::{preview_json, RuleSet};\nfn main() {\n let events = r#"[{"id":"e1","group_id":"old","message":"boom","exception":{"type":"TypeError"}}]"#;\n let rules = RuleSet::parse("exception.type ?? message").unwrap();\n let report = preview_json(events, &rules).unwrap();\n println!("{} {}", report.summary.event_count, report.summary.proposed_group_count);\n}\n`);
    const output = execFileSync('cargo', ['run', '--quiet'], { cwd: directory, encoding: 'utf8', timeout: 120_000 });
    expect(output.trim()).toBe('1 1');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('@claim:single-cli-binary package installs one named runnable binary', async () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'fp-install-'));
  try {
    const installRoot = resolve(directory, 'install');
    execFileSync('cargo', ['install', '--path', repository, '--root', installRoot, '--locked', '--quiet'], { timeout: 120_000 });
    const installed = readdirSync(resolve(installRoot, 'bin'));
    expect(installed).toEqual(['fingerprint-preview']);
    expect(execFileSync(resolve(installRoot, 'bin/fingerprint-preview'), ['--version'], { encoding: 'utf8' }).trim()).toBe('fingerprint-preview 0.1.0');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('@claim:terminal-recording self-hosted cast matches the built CLI demo', async ({ request }) => {
  const response = await request.get('/cli-demo.cast');
  expect(response.ok()).toBe(true);
  const lines = (await response.text()).trim().split('\n');
  const castOutput = lines.slice(1).map((line) => JSON.parse(line)).filter((entry) => entry[1] === 'o').map((entry) => entry[2]).join('').replace(/\r/g, '').replace(/^\$ fingerprint-preview demo\n/, '');
  const actual = runCli(['demo']);
  expect(actual.status).toBe(0);
  const normalize = (value) => value.replace(/^Demo files  \/tmp\/fingerprint-preview-demo-[^\n]+$/m, 'Demo files  <temporary-directory>').trimEnd();
  expect(normalize(castOutput)).toBe(normalize(actual.stdout));
  const directory = demoDirectory(actual.stdout);
  if (directory) rmSync(directory, { recursive: true, force: true });
});

test('@claim:cli-demo bundled demo writes a valid report only in a named temporary directory', async () => {
  const workingDirectory = mkdtempSync(resolve(tmpdir(), 'fp-demo-cwd-'));
  try {
    expect(readdirSync(workingDirectory)).toEqual([]);
    const result = runCli(['demo'], { cwd: workingDirectory });
    expect(result.status).toBe(0);
    expect(readdirSync(workingDirectory)).toEqual([]);
    const directory = demoDirectory(result.stdout);
    expect(directory).toBeTruthy();
    expect(resolve(directory).startsWith(resolve(workingDirectory))).toBe(false);
    const report = JSON.parse(readFileSync(resolve(directory, 'report.json'), 'utf8'));
    expect(report.summary).toMatchObject({ event_count: 3, baseline_group_count: 2, proposed_group_count: 2 });
    expect(readFileSync(resolve(directory, 'events.json'), 'utf8')).toBe(readFileSync(fixtureEvents, 'utf8'));
    rmSync(directory, { recursive: true, force: true });
  } finally {
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test('@claim:free-open-source full demo has no billing gate and distribution includes MIT terms', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo/');
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  await expect(page.getByRole('button', { name: 'Export JSON' })).toBeEnabled();
  expect(requests.some((url) => /billing|checkout|payment/i.test(url))).toBe(false);
  const metadata = JSON.parse(execFileSync('cargo', ['metadata', '--no-deps', '--format-version', '1'], { cwd: repository, encoding: 'utf8' }));
  expect(metadata.packages[0].license).toBe('MIT');
  expect(readFileSync(resolve(repository, 'LICENSE'), 'utf8')).toContain('Permission is hereby granted, free of charge');
});

test('@claim:keyboard-run keyboard shortcut evaluates current real input', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('01 Event sample').fill('[{"id":"one","group_id":"old","message":"boom"}]');
  await page.getByLabel('02 Fingerprint rule').fill('message');
  await page.getByLabel('01 Event sample').press('Control+Enter');
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  await expect(page.locator('#results')).toContainText('1');
  await expect(page.locator('#results')).toContainText('stable');
});

test('@claim:file-size-recovery oversized file is rejected and a smaller file then evaluates', async ({ page }) => {
  await page.goto('/');
  const file = page.locator('#file-input');
  await file.setInputFiles({ name: 'too-large.json', mimeType: 'application/json', buffer: Buffer.alloc(5_000_001, 32) });
  await expect(page.locator('#event-error')).toContainText('larger than 5 MB');
  await file.setInputFiles({ name: 'small.json', mimeType: 'application/json', buffer: Buffer.from('[{"id":"one","group_id":"old","message":"recovered"}]') });
  await page.getByLabel('02 Fingerprint rule').fill('message');
  await page.getByRole('button', { name: 'Evaluate grouping' }).click();
  await expect(page.locator('#machine-status')).toHaveText('COMPLETE');
  await expect(page.locator('#event-count')).toHaveText('1 event loaded');
});
