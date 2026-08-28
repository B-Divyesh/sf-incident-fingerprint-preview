//! Offline incident fingerprint evaluation.
//!
//! The crate intentionally exposes one workflow: parse a [`RuleSet`], then
//! pass scrubbed JSON to [`preview_json`] or [`preview_json_with_adapter`].

use serde::Serialize;
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};
use std::error::Error;
use std::fmt::{self, Display};
use std::str::FromStr;

/// Event shape to prefer while importing JSON.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub enum Adapter {
    /// Detect fields per event. Best for mixed fixtures.
    #[default]
    Auto,
    Generic,
    Sentry,
    Bugsnag,
    Rollbar,
}

impl FromStr for Adapter {
    type Err = PreviewError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.to_ascii_lowercase().as_str() {
            "auto" => Ok(Self::Auto),
            "generic" => Ok(Self::Generic),
            "sentry" => Ok(Self::Sentry),
            "bugsnag" => Ok(Self::Bugsnag),
            "rollbar" => Ok(Self::Rollbar),
            _ => Err(PreviewError::new(format!(
                "unknown adapter '{value}'; use auto, generic, sentry, bugsnag, or rollbar"
            ))),
        }
    }
}

/// A parsed fingerprint expression with ordered fallback branches.
#[derive(Clone, Debug)]
pub struct RuleSet {
    branches: Vec<Vec<Part>>,
    source: String,
}

#[derive(Clone, Copy, Debug)]
enum Part {
    Message,
    ExceptionType,
    ErrorValue,
    InAppFrames,
    AllFrames,
}

impl RuleSet {
    /// Parse `+`-joined fingerprint parts and `??` fallback branches.
    pub fn parse(source: &str) -> Result<Self, PreviewError> {
        let compact = source
            .lines()
            .map(|line| line.split('#').next().unwrap_or("").trim())
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join(" ");
        if compact.is_empty() {
            return Err(PreviewError::new(
                "the rule is empty; add a part such as 'exception.type + frames.in_app'",
            ));
        }

        let mut branches = Vec::new();
        for (branch_index, raw_branch) in compact.split("??").enumerate() {
            let raw_branch = raw_branch.trim();
            if raw_branch.is_empty() {
                return Err(PreviewError::new(format!(
                    "fallback branch {} is empty",
                    branch_index + 1
                )));
            }
            let mut parts = Vec::new();
            for token in raw_branch.split('+').map(str::trim) {
                let part = match token {
                    "message" => Part::Message,
                    "exception.type" => Part::ExceptionType,
                    "error.value" => Part::ErrorValue,
                    "frames.in_app" => Part::InAppFrames,
                    "frames.all" => Part::AllFrames,
                    "" => {
                        return Err(PreviewError::new(format!(
                            "branch {} contains an empty part",
                            branch_index + 1
                        )));
                    }
                    _ => {
                        return Err(PreviewError::new(format!(
                            "unknown rule part '{token}'; supported parts: message, exception.type, error.value, frames.in_app, frames.all"
                        )));
                    }
                };
                parts.push(part);
            }
            branches.push(parts);
        }

        Ok(Self {
            branches,
            source: compact,
        })
    }

    /// Return the normalized rule used in reports.
    pub fn source(&self) -> &str {
        &self.source
    }

    fn evaluate(&self, event: &Event) -> Vec<String> {
        for branch in &self.branches {
            let mut values = Vec::new();
            let mut complete = true;
            for part in branch {
                let value = match part {
                    Part::Message => event.message.clone().filter(|v| !v.is_empty()),
                    Part::ExceptionType => event.exception_type.clone().filter(|v| !v.is_empty()),
                    Part::ErrorValue => event.error_value.clone().filter(|v| !v.is_empty()),
                    Part::InAppFrames => frame_fingerprint(&event.frames, true),
                    Part::AllFrames => frame_fingerprint(&event.frames, false),
                };
                if let Some(value) = value {
                    values.push(value);
                } else {
                    complete = false;
                    break;
                }
            }
            if complete && !values.is_empty() {
                return values;
            }
        }
        vec!["<ungroupable>".to_string()]
    }
}

/// Top-level report suitable for stable JSON output.
#[derive(Clone, Debug, Serialize)]
pub struct PreviewReport {
    pub schema_version: u8,
    pub rule: String,
    pub summary: Summary,
    pub groups: Vec<GroupReport>,
    pub warnings: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct Summary {
    pub event_count: usize,
    pub baseline_group_count: usize,
    pub proposed_group_count: usize,
    pub group_delta: isize,
    pub split_baseline_groups: usize,
    pub merged_proposed_groups: usize,
    pub stable_proposed_groups: usize,
}

#[derive(Clone, Debug, Serialize)]
pub struct GroupReport {
    pub proposed_group: String,
    pub fingerprint: Vec<String>,
    pub classification: GroupClassification,
    pub event_count: usize,
    pub baseline_groups: Vec<String>,
    pub event_ids: Vec<String>,
    pub representative_frame: Option<FrameSummary>,
}

#[derive(Clone, Copy, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum GroupClassification {
    Stable,
    Split,
    Merge,
    SplitAndMerge,
}

impl Display for GroupClassification {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Self::Stable => "stable",
            Self::Split => "split",
            Self::Merge => "merge",
            Self::SplitAndMerge => "split+merge",
        })
    }
}

/// A deliberately narrow frame representation: no line number, source, vars,
/// arguments, URLs, or request context can enter the output.
#[derive(Clone, Debug, Serialize)]
pub struct FrameSummary {
    pub module: Option<String>,
    pub function: Option<String>,
    pub filename: Option<String>,
    pub in_app: bool,
}

#[derive(Clone, Debug)]
struct Event {
    id: String,
    baseline_group: String,
    message: Option<String>,
    exception_type: Option<String>,
    error_value: Option<String>,
    frames: Vec<FrameSummary>,
}

#[derive(Debug)]
pub struct PreviewError(String);

impl PreviewError {
    fn new(message: impl Into<String>) -> Self {
        Self(message.into())
    }
}

impl Display for PreviewError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl Error for PreviewError {}

/// Parse automatically detected scrubbed event JSON and evaluate it.
///
/// ```
/// use incident_fingerprint_preview::{preview_json, RuleSet};
/// let rules = RuleSet::parse("exception.type ?? message").unwrap();
/// let report = preview_json(
///     r#"[{"id":"e1","group_id":"old","message":"boom","exception":{"type":"TypeError"}}]"#,
///     &rules,
/// ).unwrap();
/// assert_eq!(report.summary.proposed_group_count, 1);
/// ```
pub fn preview_json(json: &str, rules: &RuleSet) -> Result<PreviewReport, PreviewError> {
    preview_json_with_adapter(json, rules, Adapter::Auto)
}

/// Parse a particular vendor shape and evaluate it without network access.
pub fn preview_json_with_adapter(
    json: &str,
    rules: &RuleSet,
    adapter: Adapter,
) -> Result<PreviewReport, PreviewError> {
    let value: Value = serde_json::from_str(json)
        .map_err(|error| PreviewError::new(format!("event JSON is invalid: {error}")))?;
    let items = if let Some(array) = value.as_array() {
        array
    } else if let Some(array) = value.get("events").and_then(Value::as_array) {
        array
    } else {
        return Err(PreviewError::new(
            "event JSON must be an array or an object containing an 'events' array",
        ));
    };

    let mut events = Vec::with_capacity(items.len());
    let mut warnings = Vec::new();
    for (index, item) in items.iter().enumerate() {
        if !item.is_object() {
            return Err(PreviewError::new(format!(
                "event {} must be a JSON object",
                index + 1
            )));
        }
        events.push(parse_event(item, index, adapter, &mut warnings));
    }
    Ok(evaluate(events, rules, warnings))
}

fn parse_event(value: &Value, index: usize, adapter: Adapter, warnings: &mut Vec<String>) -> Event {
    let id = first_string(value, &[&["id"], &["event_id"], &["uuid"]])
        .unwrap_or_else(|| format!("event-{}", index + 1));
    let message = first_string(
        value,
        &[
            &["message"],
            &["logentry", "formatted"],
            &["error", "message"],
            &["body", "trace", "exception", "message"],
        ],
    );
    let exception_type = first_string(
        value,
        &[
            &["exception", "type"],
            &["exception", "values", "0", "type"],
            &["exceptions", "0", "errorClass"],
            &["error", "class"],
            &["body", "trace", "exception", "class"],
        ],
    );
    let error_value = first_string(
        value,
        &[
            &["exception", "value"],
            &["exception", "values", "0", "value"],
            &["exceptions", "0", "message"],
            &["error", "value"],
            &["body", "trace", "exception", "message"],
        ],
    );
    let frames = parse_frames(value, adapter);
    let baseline_group = first_string(
        value,
        &[
            &["group_id"],
            &["issue_id"],
            &["fingerprint"],
            &["grouping_hash"],
        ],
    )
    .unwrap_or_else(|| {
        warnings.push(format!(
            "{id} has no baseline group; an inferred baseline was used"
        ));
        let inferred = exception_type
            .clone()
            .or_else(|| message.clone())
            .unwrap_or_else(|| id.clone());
        format!("inferred-{}", short_hash(&[inferred]))
    });

    Event {
        id,
        baseline_group,
        message,
        exception_type,
        error_value,
        frames,
    }
}

fn parse_frames(value: &Value, adapter: Adapter) -> Vec<FrameSummary> {
    let paths: &[&[&str]] = match adapter {
        Adapter::Generic => &[&["frames"]],
        Adapter::Sentry => &[
            &["exception", "values", "0", "stacktrace", "frames"],
            &["stacktrace", "frames"],
        ],
        Adapter::Bugsnag => &[&["exceptions", "0", "stacktrace"]],
        Adapter::Rollbar => &[&["body", "trace", "frames"]],
        Adapter::Auto => &[
            &["frames"],
            &["exception", "values", "0", "stacktrace", "frames"],
            &["stacktrace", "frames"],
            &["exceptions", "0", "stacktrace"],
            &["body", "trace", "frames"],
        ],
    };
    let array = paths
        .iter()
        .find_map(|path| at_path(value, path).and_then(Value::as_array));
    array
        .into_iter()
        .flatten()
        .filter_map(|frame| {
            if !frame.is_object() {
                return None;
            }
            Some(FrameSummary {
                module: first_string(frame, &[&["module"], &["package"]]),
                function: first_string(frame, &[&["function"], &["method"]]),
                filename: first_string(frame, &[&["filename"], &["file"]]),
                in_app: frame
                    .get("in_app")
                    .or_else(|| frame.get("inProject"))
                    .and_then(Value::as_bool)
                    .unwrap_or(false),
            })
        })
        .collect()
}

fn evaluate(events: Vec<Event>, rules: &RuleSet, warnings: Vec<String>) -> PreviewReport {
    #[derive(Default)]
    struct Proposed {
        fingerprint: Vec<String>,
        event_ids: Vec<String>,
        baseline_groups: BTreeSet<String>,
        representative_frame: Option<FrameSummary>,
    }

    let mut proposed: BTreeMap<String, Proposed> = BTreeMap::new();
    let mut baseline_children: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    let baseline_groups: BTreeSet<_> = events
        .iter()
        .map(|event| event.baseline_group.clone())
        .collect();

    for event in &events {
        let fingerprint = rules.evaluate(event);
        let key = format!("fp-{}", short_hash(&fingerprint));
        baseline_children
            .entry(event.baseline_group.clone())
            .or_default()
            .insert(key.clone());
        let group = proposed.entry(key).or_default();
        group.fingerprint = fingerprint;
        group.event_ids.push(event.id.clone());
        group.baseline_groups.insert(event.baseline_group.clone());
        if group.representative_frame.is_none() {
            group.representative_frame = event
                .frames
                .iter()
                .find(|frame| frame.in_app)
                .or_else(|| event.frames.first())
                .cloned();
        }
    }

    let split_baseline_groups = baseline_children
        .values()
        .filter(|children| children.len() > 1)
        .count();
    let mut merged_proposed_groups = 0;
    let mut stable_proposed_groups = 0;
    let groups = proposed
        .into_iter()
        .map(|(key, group)| {
            let split = group.baseline_groups.iter().any(|baseline| {
                baseline_children
                    .get(baseline)
                    .is_some_and(|children| children.len() > 1)
            });
            let merge = group.baseline_groups.len() > 1;
            let classification = match (split, merge) {
                (false, false) => {
                    stable_proposed_groups += 1;
                    GroupClassification::Stable
                }
                (true, false) => GroupClassification::Split,
                (false, true) => {
                    merged_proposed_groups += 1;
                    GroupClassification::Merge
                }
                (true, true) => {
                    merged_proposed_groups += 1;
                    GroupClassification::SplitAndMerge
                }
            };
            GroupReport {
                proposed_group: key,
                fingerprint: group.fingerprint,
                classification,
                event_count: group.event_ids.len(),
                baseline_groups: group.baseline_groups.into_iter().collect(),
                event_ids: group.event_ids,
                representative_frame: group.representative_frame,
            }
        })
        .collect::<Vec<_>>();

    let proposed_group_count = groups.len();
    let baseline_group_count = baseline_groups.len();
    PreviewReport {
        schema_version: 1,
        rule: rules.source.clone(),
        summary: Summary {
            event_count: events.len(),
            baseline_group_count,
            proposed_group_count,
            group_delta: proposed_group_count as isize - baseline_group_count as isize,
            split_baseline_groups,
            merged_proposed_groups,
            stable_proposed_groups,
        },
        groups,
        warnings,
    }
}

fn frame_fingerprint(frames: &[FrameSummary], in_app_only: bool) -> Option<String> {
    let values = frames
        .iter()
        .filter(|frame| !in_app_only || frame.in_app)
        .map(|frame| {
            format!(
                "{}/{}/{}",
                frame.module.as_deref().unwrap_or("?"),
                frame.function.as_deref().unwrap_or("?"),
                frame.filename.as_deref().unwrap_or("?")
            )
        })
        .collect::<Vec<_>>();
    (!values.is_empty()).then(|| values.join(">"))
}

fn short_hash(parts: &[String]) -> String {
    let mut hash = 0xcbf29ce484222325_u64;
    for part in parts {
        for byte in part.as_bytes().iter().chain(std::iter::once(&0_u8)) {
            hash ^= u64::from(*byte);
            hash = hash.wrapping_mul(0x100000001b3);
        }
    }
    format!("{hash:016x}")
}

fn first_string(value: &Value, paths: &[&[&str]]) -> Option<String> {
    paths.iter().find_map(|path| match at_path(value, path)? {
        Value::String(text) if !text.is_empty() => Some(text.clone()),
        Value::Number(number) => Some(number.to_string()),
        Value::Array(values) => {
            let joined = values
                .iter()
                .filter_map(Value::as_str)
                .collect::<Vec<_>>()
                .join("-");
            (!joined.is_empty()).then_some(joined)
        }
        _ => None,
    })
}

fn at_path<'a>(mut value: &'a Value, path: &[&str]) -> Option<&'a Value> {
    for key in path {
        value = if let Ok(index) = key.parse::<usize>() {
            value.as_array()?.get(index)?
        } else {
            value.get(key)?
        };
    }
    Some(value)
}

#[cfg(test)]
mod tests {
    use super::*;

    const EVENTS: &str = r#"[
      {"id":"a","group_id":"old","message":"x","exception":{"type":"A"},"frames":[{"function":"one","filename":"a.rs","in_app":true,"lineno":99,"vars":{"secret":"no"}}]},
      {"id":"b","group_id":"old","message":"x","exception":{"type":"B"},"frames":[{"function":"two","filename":"b.rs","in_app":true}]},
      {"id":"c","group_id":"other","message":"x","exception":{"type":"B"},"frames":[{"function":"two","filename":"b.rs","in_app":true}]}
    ]"#;

    #[test]
    fn finds_split_and_merge() {
        let rules = RuleSet::parse("exception.type").unwrap();
        let report = preview_json(EVENTS, &rules).unwrap();
        assert_eq!(report.summary.split_baseline_groups, 1);
        assert_eq!(report.summary.merged_proposed_groups, 1);
        assert_eq!(report.summary.proposed_group_count, 2);
    }

    #[test]
    fn fallback_uses_message_without_in_app_frames() {
        let rules = RuleSet::parse("exception.type + frames.in_app ?? message").unwrap();
        let report = preview_json(
            r#"[{"id":"a","group_id":"old","message":"fallback"}]"#,
            &rules,
        )
        .unwrap();
        assert_eq!(report.groups[0].fingerprint, vec!["fallback"]);
    }

    #[test]
    fn rejects_unknown_parts_helpfully() {
        let error = RuleSet::parse("request.url").unwrap_err().to_string();
        assert!(error.contains("unknown rule part"));
        assert!(error.contains("frames.in_app"));
    }

    #[test]
    fn exported_frame_excludes_sensitive_detail() {
        let report = preview_json(EVENTS, &RuleSet::parse("message").unwrap()).unwrap();
        let json = serde_json::to_string(&report).unwrap();
        assert!(!json.contains("lineno"));
        assert!(!json.contains("secret"));
    }

    #[test]
    fn imports_sentry_bugsnag_and_rollbar_frames() {
        let sentry = r#"[{"id":"s","group_id":"g","exception":{"values":[{"type":"S","stacktrace":{"frames":[{"function":"s","in_app":true}]}}]}}]"#;
        let bugsnag = r#"[{"id":"b","group_id":"g","exceptions":[{"errorClass":"B","stacktrace":[{"method":"b","inProject":true}]}]}]"#;
        let rollbar = r#"[{"id":"r","group_id":"g","body":{"trace":{"exception":{"class":"R"},"frames":[{"method":"r"}]}}}]"#;
        let rules = RuleSet::parse("exception.type + frames.all").unwrap();
        for input in [sentry, bugsnag, rollbar] {
            assert_eq!(preview_json(input, &rules).unwrap().groups.len(), 1);
        }
    }

    #[test]
    fn empty_array_is_a_valid_empty_state() {
        let report = preview_json("[]", &RuleSet::parse("message").unwrap()).unwrap();
        assert_eq!(report.summary.event_count, 0);
        assert!(report.groups.is_empty());
    }

    #[test]
    fn group_hash_is_stable_across_implementations() {
        assert_eq!(short_hash(&["hello".to_string()]), "a9bc8acca21f39b1");
    }
}
