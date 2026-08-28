const PARTS = new Set(['message', 'exception.type', 'error.value', 'frames.in_app', 'frames.all']);

export function parseRule(source) {
  const clean = source
    .split('\n')
    .map((line) => line.split('#')[0].trim())
    .filter(Boolean)
    .join(' ');
  if (!clean) throw new Error("The rule is empty. Add a part such as 'exception.type + frames.in_app'.");
  return clean.split('??').map((branch, branchIndex) => {
    if (!branch.trim()) throw new Error(`Fallback branch ${branchIndex + 1} is empty.`);
    return branch.split('+').map((part) => {
      const token = part.trim();
      if (!token) throw new Error(`Branch ${branchIndex + 1} contains an empty part.`);
      if (!PARTS.has(token)) throw new Error(`Unknown rule part “${token}”. Use message, exception.type, error.value, frames.in_app, or frames.all.`);
      return token;
    });
  });
}

export function preview(source, ruleSource) {
  let data;
  try {
    data = JSON.parse(source);
  } catch (error) {
    throw new Error(`Event JSON is invalid: ${error.message}`);
  }
  const items = Array.isArray(data) ? data : data?.events;
  if (!Array.isArray(items)) throw new Error("Event JSON must be an array or an object containing an “events” array.");
  const branches = parseRule(ruleSource);
  const events = items.map((item, index) => normalizeEvent(item, index));
  const warnings = events.flatMap((event) => event.warning ? [event.warning] : []);

  const groups = new Map();
  const baselineChildren = new Map();
  for (const event of events) {
    const fingerprint = evaluate(event, branches);
    const proposedGroup = `fp-${stableHash(fingerprint)}`;
    if (!baselineChildren.has(event.baselineGroup)) baselineChildren.set(event.baselineGroup, new Set());
    baselineChildren.get(event.baselineGroup).add(proposedGroup);
    if (!groups.has(proposedGroup)) groups.set(proposedGroup, {
      proposed_group: proposedGroup,
      fingerprint,
      event_ids: [],
      baseline_groups: new Set(),
      representative_frame: event.frames.find((frame) => frame.in_app) || event.frames[0] || null
    });
    const group = groups.get(proposedGroup);
    group.event_ids.push(event.id);
    group.baseline_groups.add(event.baselineGroup);
  }

  let merged = 0;
  let stable = 0;
  const outputGroups = [...groups.values()].map((group) => {
    const baselineGroups = [...group.baseline_groups].sort();
    const split = baselineGroups.some((id) => baselineChildren.get(id).size > 1);
    const merge = baselineGroups.length > 1;
    if (merge) merged += 1;
    if (!split && !merge) stable += 1;
    return {
      proposed_group: group.proposed_group,
      fingerprint: group.fingerprint,
      classification: split && merge ? 'split_and_merge' : split ? 'split' : merge ? 'merge' : 'stable',
      event_count: group.event_ids.length,
      baseline_groups: baselineGroups,
      event_ids: group.event_ids,
      representative_frame: group.representative_frame
    };
  }).sort((a, b) => a.proposed_group.localeCompare(b.proposed_group));
  const baselineCount = new Set(events.map((event) => event.baselineGroup)).size;
  return {
    schema_version: 1,
    rule: ruleSource.split('\n').map((line) => line.split('#')[0].trim()).filter(Boolean).join(' '),
    summary: {
      event_count: events.length,
      baseline_group_count: baselineCount,
      proposed_group_count: outputGroups.length,
      group_delta: outputGroups.length - baselineCount,
      split_baseline_groups: [...baselineChildren.values()].filter((children) => children.size > 1).length,
      merged_proposed_groups: merged,
      stable_proposed_groups: stable
    },
    groups: outputGroups,
    warnings
  };
}

function normalizeEvent(item, index) {
  if (!item || Array.isArray(item) || typeof item !== 'object') throw new Error(`Event ${index + 1} must be a JSON object.`);
  const id = first(item, [['id'], ['event_id'], ['uuid']]) || `event-${index + 1}`;
  const message = first(item, [['message'], ['logentry', 'formatted'], ['error', 'message'], ['body', 'trace', 'exception', 'message']]);
  const exceptionType = first(item, [['exception', 'type'], ['exception', 'values', 0, 'type'], ['exceptions', 0, 'errorClass'], ['error', 'class'], ['body', 'trace', 'exception', 'class']]);
  const errorValue = first(item, [['exception', 'value'], ['exception', 'values', 0, 'value'], ['exceptions', 0, 'message'], ['error', 'value'], ['body', 'trace', 'exception', 'message']]);
  const rawFrames = firstValue(item, [['frames'], ['exception', 'values', 0, 'stacktrace', 'frames'], ['stacktrace', 'frames'], ['exceptions', 0, 'stacktrace'], ['body', 'trace', 'frames']]);
  const frames = Array.isArray(rawFrames) ? rawFrames.filter((frame) => frame && typeof frame === 'object').map((frame) => ({
    module: stringValue(frame.module ?? frame.package),
    function: stringValue(frame.function ?? frame.method),
    filename: stringValue(frame.filename ?? frame.file),
    in_app: Boolean(frame.in_app ?? frame.inProject ?? false)
  })) : [];
  let baselineGroup = first(item, [['group_id'], ['issue_id'], ['fingerprint'], ['grouping_hash']]);
  let warning = '';
  if (!baselineGroup) {
    baselineGroup = `inferred-${stableHash([exceptionType || message || id])}`;
    warning = `${id} has no baseline group; an inferred baseline was used.`;
  }
  return { id, baselineGroup, message, exceptionType, errorValue, frames, warning };
}

function evaluate(event, branches) {
  for (const branch of branches) {
    const values = [];
    let complete = true;
    for (const part of branch) {
      let value;
      if (part === 'message') value = event.message;
      if (part === 'exception.type') value = event.exceptionType;
      if (part === 'error.value') value = event.errorValue;
      if (part === 'frames.in_app') value = frameValue(event.frames.filter((frame) => frame.in_app));
      if (part === 'frames.all') value = frameValue(event.frames);
      if (!value) { complete = false; break; }
      values.push(value);
    }
    if (complete && values.length) return values;
  }
  return ['<ungroupable>'];
}

function frameValue(frames) {
  if (!frames.length) return '';
  return frames.map((frame) => `${frame.module || '?'}/${frame.function || '?'}/${frame.filename || '?'}`).join('>');
}

function first(object, paths) {
  const value = firstValue(object, paths);
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').join('-') || null;
  return stringValue(value);
}

function firstValue(object, paths) {
  for (const path of paths) {
    let value = object;
    for (const key of path) value = value?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function stringValue(value) {
  if (typeof value === 'string' && value) return value;
  if (typeof value === 'number') return String(value);
  return null;
}

function stableHash(parts) {
  let hash = 2166136261;
  for (const char of parts.join('\0')) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
