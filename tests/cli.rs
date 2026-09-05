use std::process::Command;

#[test]
fn documented_fixture_runs_as_json() {
    let output = Command::new(env!("CARGO_BIN_EXE_fingerprint-preview"))
        .args([
            "preview",
            "--events",
            "fixtures/events.json",
            "--rules",
            "fixtures/rules.fp",
            "--json",
        ])
        .output()
        .unwrap();
    assert!(output.status.success());
    let value: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(value["summary"]["event_count"], 3);
    assert_eq!(value["schema_version"], 1);
}

#[test]
fn invalid_rule_uses_exit_code_two() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("bad.fp");
    std::fs::write(&path, "request.url").unwrap();
    let status = Command::new(env!("CARGO_BIN_EXE_fingerprint-preview"))
        .arg("preview")
        .arg("--events")
        .arg("fixtures/events.json")
        .arg("--rules")
        .arg(path)
        .status()
        .unwrap();
    assert_eq!(status.code(), Some(2));
}

#[test]
fn demo_runs_the_shipped_sample_in_a_temporary_directory() {
    let output = Command::new(env!("CARGO_BIN_EXE_fingerprint-preview"))
        .arg("demo")
        .output()
        .unwrap();
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("1 split baseline / 1 merged proposed"));
    assert!(stdout.contains("[split+merge]"));
    assert!(stdout.contains("Nothing was read from or written to your project."));

    let directory = stdout
        .lines()
        .find_map(|line| line.strip_prefix("Demo files  "))
        .map(std::path::PathBuf::from)
        .expect("demo output should name its temporary directory");
    let report: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(directory.join("report.json")).unwrap())
            .unwrap();
    assert_eq!(report["summary"]["event_count"], 3);
    assert_eq!(report["summary"]["proposed_group_count"], 2);
    assert_eq!(
        std::fs::read_to_string(directory.join("events.json")).unwrap(),
        std::fs::read_to_string("fixtures/events.json").unwrap()
    );
    std::fs::remove_dir_all(directory).unwrap();
}
