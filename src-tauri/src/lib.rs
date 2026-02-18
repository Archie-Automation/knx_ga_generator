mod fingerprint;

use std::sync::Arc;
use tauri::Manager;

use fingerprint::{
    compute_fingerprint_hash, get_soft_identifiers, get_os_machine_id,
    INSTALL_UUID_KEY, MACHINE_ID_FALLBACK_KEY,
};

/// Returns the machine ID to use for fingerprinting: OS machine ID when available,
/// otherwise a persistent fallback stored in the app store (so fingerprint stays stable).
fn get_machine_id_with_fallback(
    store: &tauri_plugin_store::Store<tauri::Wry>,
) -> Result<String, String> {
    if let Some(id) = get_os_machine_id() {
        return Ok(id);
    }
    if let Some(stored) = store
        .get(MACHINE_ID_FALLBACK_KEY)
        .and_then(|v| v.as_str().map(String::from))
    {
        return Ok(stored);
    }
    let fallback = uuid::Uuid::new_v4().to_string();
    store.set(MACHINE_ID_FALLBACK_KEY, fallback.clone());
    store.save().map_err(|e| e.to_string())?;
    Ok(fallback)
}

/// Gets or creates the installation UUID (first launch). Stored locally only.
fn get_or_create_install_uuid(
    store: &tauri_plugin_store::Store<tauri::Wry>,
) -> Result<String, String> {
    match store
        .get(INSTALL_UUID_KEY)
        .and_then(|v| v.as_str().map(String::from))
    {
        Some(s) => Ok(s),
        None => {
            let u = uuid::Uuid::new_v4().to_string();
            store.set(INSTALL_UUID_KEY, u.clone());
            store.save().map_err(|e| e.to_string())?;
            Ok(u)
        }
    }
}

/// Returns a display-friendly device name (e.g. hostname) for the UI only.
/// Not used in fingerprinting; safe to expose.
/// Uses fallbacks so this never fails in release/sandbox (e.g. Windows build).
#[tauri::command]
fn get_device_display_name() -> Result<String, String> {
    if let Ok(h) = hostname::get() {
        let s = h.to_string_lossy().into_owned();
        if !s.trim().is_empty() {
            return Ok(s);
        }
    }
    #[cfg(windows)]
    if let Ok(name) = std::env::var("COMPUTERNAME") {
        let s = name.trim().to_string();
        if !s.is_empty() {
            return Ok(s);
        }
    }
    Ok("Desktop".to_string())
}

/// Returns a stable, hashed device fingerprint for this installation.
///
/// Safe to expose to the frontend: only a SHA-256 hash is returned. Raw machine ID,
/// installation UUID, hostname, and soft identifiers are never sent.
///
/// Fingerprint is built from:
/// - OS machine ID (Windows MachineGuid, macOS IOPlatformUUID, Linux machine-id), or fallback
/// - Installation UUID (generated on first launch, stored locally)
/// - Hostname (ensures different PCs get different fingerprints)
/// - Soft identifiers: OS name and CPU architecture (for stability, not for identification)
#[tauri::command]
fn get_device_fingerprint(
    store: tauri::State<'_, Arc<tauri_plugin_store::Store<tauri::Wry>>>,
) -> Result<String, String> {
    let hostname = get_device_display_name().unwrap_or_else(|_| "Desktop".to_string());
    let (os, arch) = get_soft_identifiers();

    if let Some(os_machine_id) = fingerprint::get_os_machine_id() {
        // Real OS machine ID: fingerprint survives reinstalls on same physical machine
        Ok(fingerprint::compute_fingerprint_hash(
            &os_machine_id,
            None,
            &hostname,
            &os,
            &arch,
        ))
    } else {
        // Fallback: use stored machine_id + install_uuid (fingerprint changes on reinstall)
        let machine_id = get_machine_id_with_fallback(store.as_ref())?;
        let install_uuid = get_or_create_install_uuid(store.as_ref())?;
        Ok(fingerprint::compute_fingerprint_hash(
            &machine_id,
            Some(&install_uuid),
            &hostname,
            &os,
            &arch,
        ))
    }
}

/// Writes content to a user-chosen path (path must come from save dialog).
#[tauri::command]
fn save_file(path: String, content_base64: String) -> Result<(), String> {
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&content_base64)
        .map_err(|e| e.to_string())?;
    std::fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .setup(|app| {
      let store = tauri_plugin_store::StoreBuilder::new(app, "app-store.json")
        .build()
        .map_err(|e| e.to_string())?;
      app.manage(store);
      if cfg!(debug_assertions) {
        let _ = app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        );
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![get_device_fingerprint, get_device_display_name, save_file])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
