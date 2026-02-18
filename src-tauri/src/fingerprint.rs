//! Device fingerprinting for license and device binding.
//!
//! Security design:
//! - Only a **hashed** fingerprint (SHA-256) is ever exposed to the frontend or database.
//! - Raw machine IDs and installation UUIDs are never sent over the wire.
//! - Fingerprint is stable across app restarts and preferably survives reinstalls (via machine ID).

use sha2::{Digest, Sha256};
use std::env;

/// Key in the persistent store for the installation UUID (created on first launch).
pub const INSTALL_UUID_KEY: &str = "install_uuid";
/// Key for fallback machine ID when the OS machine ID cannot be read (e.g. sandbox, permission).
pub const MACHINE_ID_FALLBACK_KEY: &str = "machine_id_fallback";

/// Returns the OS machine identifier when available.
///
/// Platform sources (aligned with your requirements):
/// - **Windows**: `MachineGuid` from `HKLM\SOFTWARE\Microsoft\Cryptography`
/// - **macOS**: `IOPlatformUUID` from IOKit
/// - **Linux**: `/etc/machine-id` or `/var/lib/dbus/machine-id`
///
/// Uses the `machine-uid` crate. Returns `None` if the ID cannot be retrieved
/// (e.g. permission denied, file missing, sandbox).
pub fn get_os_machine_id() -> Option<String> {
    machine_uid::get().ok()
}

/// Returns soft identifiers used only to strengthen the fingerprint.
/// These are non-invasive and do not uniquely identify a user.
/// - OS: e.g. "windows", "macos", "linux"
/// - Arch: e.g. "x86_64", "aarch64"
pub fn get_soft_identifiers() -> (String, String) {
    let os = env::consts::OS.to_string();
    let arch = env::consts::ARCH.to_string();
    (os, arch)
}

/// Builds the deterministic string that will be hashed.
/// Order and format are fixed so the same inputs always produce the same hash.
/// When use_install_uuid is false (we have a real OS machine ID), the fingerprint
/// survives reinstalls on the same physical machine.
fn build_fingerprint_input(
    machine_id: &str,
    install_uuid: Option<&str>,
    hostname: &str,
    os: &str,
    arch: &str,
) -> String {
    match install_uuid {
        Some(uuid) => format!("{}::{}::{}::{}::{}", machine_id, uuid, hostname, os, arch),
        None => format!("{}::::{}::{}::{}", machine_id, hostname, os, arch),
    }
}

/// Hashes the fingerprint input with SHA-256 and returns lowercase hex.
/// Only this hashed value should ever leave the app (frontend / Supabase).
pub fn hash_fingerprint_input(input: &str) -> String {
    let hash = Sha256::digest(input.as_bytes());
    hash.iter().map(|b| format!("{:02x}", b)).collect::<String>()
}

/// Computes the device fingerprint hash from components.
/// When has_os_machine_id is true, install_uuid can be None so the fingerprint
/// survives reinstalls on the same physical machine.
/// Hostname ensures different PCs get different fingerprints even if machine_id is shared (e.g. VM clones).
pub fn compute_fingerprint_hash(
    machine_id: &str,
    install_uuid: Option<&str>,
    hostname: &str,
    os: &str,
    arch: &str,
) -> String {
    let input = build_fingerprint_input(machine_id, install_uuid, hostname, os, arch);
    hash_fingerprint_input(&input)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fingerprint_deterministic() {
        let h1 = compute_fingerprint_hash("mid", Some("iuid"), "pc1", "windows", "x86_64");
        let h2 = compute_fingerprint_hash("mid", Some("iuid"), "pc1", "windows", "x86_64");
        assert_eq!(h1, h2);
        assert_eq!(h1.len(), 64);
    }

    #[test]
    fn fingerprint_changes_with_input() {
        let h1 = compute_fingerprint_hash("mid1", Some("iuid"), "pc1", "windows", "x86_64");
        let h2 = compute_fingerprint_hash("mid2", Some("iuid"), "pc1", "windows", "x86_64");
        assert_ne!(h1, h2);
    }

    #[test]
    fn fingerprint_survives_reinstall() {
        let h1 = compute_fingerprint_hash("mid", None, "pc1", "windows", "x86_64");
        let h2 = compute_fingerprint_hash("mid", None, "pc1", "windows", "x86_64");
        assert_eq!(h1, h2);
    }
}
