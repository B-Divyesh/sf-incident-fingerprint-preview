import './styles.css';
import { preview } from './evaluator.mjs';
import { SAMPLE_EVENTS, SAMPLE_RULE } from './sample.mjs';

const eventsInput = document.querySelector<HTMLTextAreaElement>('#events-input')!;
const rulesInput = document.querySelector<HTMLTextAreaElement>('#rules-input')!;
const runButton = document.querySelector<HTMLButtonElement>('#run-preview')!;
const exportButton = document.querySelector<HTMLButtonElement>('#export-report')!;
const results = document.querySelector<HTMLElement>('#results')!;
const announcer = document.querySelector<HTMLElement>('#result-announcer')!;
const machineStatus = document.querySelector<HTMLElement>('#machine-status')!;
const eventError = document.querySelector<HTMLElement>('#event-error')!;
const ruleError = document.querySelector<HTMLElement>('#rule-error')!;
const eventCount = document.querySelector<HTMLElement>('#event-count')!;
const fileInput = document.querySelector<HTMLInputElement>('#file-input')!;
let latestReport: ReturnType<typeof preview> | null = null;

eventsInput.value = SAMPLE_EVENTS;
rulesInput.value = SAMPLE_RULE;

function markEdited() {
  machineStatus.textContent = 'EDITED';
  exportButton.disabled = true;
  latestReport = null;
  eventError.textContent = '';
  ruleError.textContent = '';
  try {
    const parsed = JSON.parse(eventsInput.value);
    const items = Array.isArray(parsed) ? parsed : parsed?.events;
    eventCount.textContent = Array.isArray(items) ? `${items.length} event${items.length === 1 ? '' : 's'} loaded` : 'Input needs an events array';
  } catch {
    eventCount.textContent = 'JSON needs attention';
  }
}

function run() {
  machineStatus.textContent = 'EVALUATING';
  results.setAttribute('aria-busy', 'true');
  runButton.disabled = true;
  eventError.textContent = '';
  ruleError.textContent = '';
  window.requestAnimationFrame(() => {
    try {
      latestReport = preview(eventsInput.value, rulesInput.value);
      renderReport(latestReport);
      machineStatus.textContent = 'COMPLETE';
      exportButton.disabled = false;
      const summary = latestReport.summary;
      announcer.textContent = `Preview complete. ${summary.proposed_group_count} proposed groups; ${summary.split_baseline_groups} split baseline groups and ${summary.merged_proposed_groups} merged proposed groups.`;
    } catch (error) {
      latestReport = null;
      exportButton.disabled = true;
      machineStatus.textContent = 'CHECK INPUT';
      const message = error instanceof Error ? error.message : 'The preview could not be evaluated.';
      if (/rule|branch|part/i.test(message)) ruleError.textContent = `${message} Update the rule and evaluate again.`;
      else eventError.textContent = `${message} Correct the event fixture and evaluate again.`;
      results.innerHTML = `<div class="error-readout"><span aria-hidden="true">!</span><p><b>Evaluation stopped.</b> ${escapeHtml(message)}</p></div>`;
      announcer.textContent = `Evaluation stopped. ${message}`;
    } finally {
      results.setAttribute('aria-busy', 'false');
      runButton.disabled = false;
    }
  });
}

function renderReport(report: ReturnType<typeof preview>) {
  const summary = report.summary;
  const delta = summary.group_delta > 0 ? `+${summary.group_delta}` : String(summary.group_delta);
  const metrics = `<div class="metrics" role="list" aria-label="Grouping summary">
    <div role="listitem"><span>Events</span><b>${summary.event_count}</b></div>
    <div role="listitem"><span>Baseline groups</span><b>${summary.baseline_group_count}</b></div>
    <div role="listitem"><span>Proposed groups</span><b>${summary.proposed_group_count} <small>${delta}</small></b></div>
    <div role="listitem"><span>Changed</span><b>${summary.split_baseline_groups + summary.merged_proposed_groups}</b></div>
  </div>`;
  if (!report.groups.length) {
    results.innerHTML = `${metrics}<div class="empty-readout"><span aria-hidden="true">∅</span><p><b>The fixture is empty.</b> Add scrubbed event objects, then evaluate again.</p></div>`;
    return;
  }
  const groups = report.groups.map((group) => {
    const label = group.classification === 'split_and_merge' ? 'split + merge' : group.classification;
    const frame = group.representative_frame
      ? `${group.representative_frame.module || '?'}/${group.representative_frame.function || '?'}/${group.representative_frame.filename || '?'}${group.representative_frame.in_app ? ' · in-app' : ''}`
      : 'No representative frame';
    return `<article class="group-row ${escapeHtml(group.classification)}">
      <div class="group-kind"><span aria-hidden="true"></span><b>${escapeHtml(label)}</b></div>
      <div class="group-main"><h4>${escapeHtml(group.proposed_group)}</h4><code>${group.fingerprint.map(escapeHtml).join(' + ')}</code><p>${escapeHtml(frame)}</p></div>
      <div class="group-origin"><span>${group.event_count} event${group.event_count === 1 ? '' : 's'}</span><small>from ${group.baseline_groups.map(escapeHtml).join(', ')}</small></div>
    </article>`;
  }).join('');
  const warnings = report.warnings.length ? `<div class="warning-list"><b>Import notes</b><ul>${report.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul></div>` : '';
  results.innerHTML = metrics + groups + warnings;
}

function escapeHtml(value: unknown) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

eventsInput.addEventListener('input', markEdited);
rulesInput.addEventListener('input', markEdited);
runButton.addEventListener('click', run);
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    run();
  }
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (file.size > 5_000_000) {
    eventError.textContent = 'That file is larger than 5 MB. Use a smaller scrubbed sample.';
    fileInput.value = '';
    return;
  }
  eventsInput.value = await file.text();
  markEdited();
  eventsInput.focus();
  fileInput.value = '';
});

document.querySelector('#load-sample')!.addEventListener('click', () => {
  if (eventsInput.value !== SAMPLE_EVENTS && !window.confirm('Replace the current event fixture with the three-event sample?')) return;
  eventsInput.value = SAMPLE_EVENTS;
  rulesInput.value = SAMPLE_RULE;
  markEdited();
  eventsInput.focus();
});

exportButton.addEventListener('click', () => {
  if (!latestReport) return;
  const blob = new Blob([`${JSON.stringify(latestReport, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'fingerprint-preview-report.json';
  anchor.click();
  URL.revokeObjectURL(url);
  announcer.textContent = 'JSON report exported.';
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
  button.addEventListener('click', async () => {
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(button.dataset.copy || '');
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy unavailable';
    }
    window.setTimeout(() => { button.textContent = original; }, 1600);
  });
}

const offlineBanner = document.querySelector<HTMLElement>('#offline-banner')!;
function updateOnlineState() { offlineBanner.hidden = navigator.onLine; }
window.addEventListener('online', updateOnlineState);
window.addEventListener('offline', updateOnlineState);
updateOnlineState();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
