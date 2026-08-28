use clap::{Parser, Subcommand};
use incident_fingerprint_preview::{
    Adapter, GroupReport, PreviewReport, RuleSet, preview_json_with_adapter,
};
use std::fs;
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    name = "fingerprint-preview",
    version,
    about = "Preview incident fingerprint splits and merges before rollout",
    long_about = "Evaluate proposed fingerprint rules against locally scrubbed event JSON.\nNo event data leaves this process; output omits source context and frame line numbers.",
    after_help = "Rule example:\n  exception.type + frames.in_app ?? message\n\nExit codes:\n  0 valid preview, 2 invalid input/rule, 1 I/O failure"
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Evaluate a fixture and print split/merge deltas.
    Preview {
        /// Path to a scrubbed JSON array or {"events": [...]} object.
        #[arg(short, long)]
        events: PathBuf,
        /// Path to a fingerprint rule file.
        #[arg(short, long)]
        rules: PathBuf,
        /// Input shape: auto, generic, sentry, bugsnag, or rollbar.
        #[arg(short, long, default_value = "auto")]
        adapter: String,
        /// Emit the versioned JSON report instead of a terminal report.
        #[arg(long)]
        json: bool,
    },
}

fn main() {
    let code = match run() {
        Ok(()) => 0,
        Err((code, message)) => {
            eprintln!("fingerprint-preview: {message}");
            code
        }
    };
    std::process::exit(code);
}

fn run() -> Result<(), (i32, String)> {
    let cli = Cli::parse();
    match cli.command {
        Command::Preview {
            events,
            rules,
            adapter,
            json,
        } => {
            let event_json = fs::read_to_string(&events)
                .map_err(|error| (1, format!("could not read {}: {error}", events.display())))?;
            let rule_source = fs::read_to_string(&rules)
                .map_err(|error| (1, format!("could not read {}: {error}", rules.display())))?;
            let rules = RuleSet::parse(&rule_source).map_err(|error| (2, error.to_string()))?;
            let adapter = adapter
                .parse::<Adapter>()
                .map_err(|error| (2, error.to_string()))?;
            let report = preview_json_with_adapter(&event_json, &rules, adapter)
                .map_err(|error| (2, error.to_string()))?;
            if json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&report)
                        .map_err(|error| (1, format!("could not encode report: {error}")))?
                );
            } else {
                print_human(&report);
            }
        }
    }
    Ok(())
}

fn print_human(report: &PreviewReport) {
    println!("FINGERPRINT PREVIEW");
    println!("Rule    {}", report.rule);
    println!(
        "Groups  {} baseline -> {} proposed ({:+})",
        report.summary.baseline_group_count,
        report.summary.proposed_group_count,
        report.summary.group_delta
    );
    println!(
        "Delta   {} split baseline / {} merged proposed / {} stable proposed",
        report.summary.split_baseline_groups,
        report.summary.merged_proposed_groups,
        report.summary.stable_proposed_groups
    );
    if report.groups.is_empty() {
        println!("\nNo events in the fixture. Add scrubbed event objects and run again.");
    }
    for group in &report.groups {
        print_group(group);
    }
    for warning in &report.warnings {
        eprintln!("warning: {warning}");
    }
}

fn print_group(group: &GroupReport) {
    println!(
        "\n[{}] {}  {} event(s)",
        group.classification, group.proposed_group, group.event_count
    );
    println!("  from         {}", group.baseline_groups.join(", "));
    println!("  fingerprint  {}", group.fingerprint.join(" + "));
    println!("  events       {}", group.event_ids.join(", "));
    if let Some(frame) = &group.representative_frame {
        println!(
            "  frame        {}/{}/{}{}",
            frame.module.as_deref().unwrap_or("?"),
            frame.function.as_deref().unwrap_or("?"),
            frame.filename.as_deref().unwrap_or("?"),
            if frame.in_app { " [in-app]" } else { "" }
        );
    }
}
