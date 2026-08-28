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
