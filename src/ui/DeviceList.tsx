/**
 * DeviceList – display-only vertical list of user devices with friendly names.
 *
 * Security (backend-only; never shown in UI):
 * - device_hash / fingerprint: used only to determine which row is "this device"
 *   (currentFingerprint === device.device_hash). Never rendered.
 * - Machine IDs and raw user-agent strings are never exposed to the user.
 *
 * Display:
 * - We show only human-readable device names. Empty device_name → unknownDeviceLabel.
 * - Legacy rows may have a user-agent string as device_name (e.g. "Mozilla/5.0 …").
 *   For the *current* device we replace that by calling the Rust get_device_display_name
 *   (hostname). For other devices we show unknownDeviceLabel instead of the raw UA.
 * - Optional "last seen" line when formatLastSeen is provided.
 *
 * Integration: Tauri + React + TypeScript. Pass devices and currentFingerprint
 * from getDeviceInfo().fingerprint.
 */

import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { DeviceRow } from "../services/types";

/** Props for the DeviceList component. */
export interface DeviceListProps {
  /** Devices from backend. Each has device_name (shown) and device_hash (backend-only, never shown). */
  devices: DeviceRow[];
  /**
   * Current app instance fingerprint from getDeviceInfo().fingerprint.
   * Used only to match the current device for highlight/badge; never displayed.
   */
  currentFingerprint: string | null;
  /** Label shown next to the current device, e.g. "This device". */
  currentDeviceLabel: string;
  /**
   * Optional. Hostname for the current device (e.g. from getDeviceInfo().deviceName).
   * When provided, used immediately for the current device when device_name is a user-agent string.
   */
  currentDeviceHostname?: string | null;
  /** Shown when device_name is empty or when we hide a legacy user-agent (other devices). */
  unknownDeviceLabel: string;
  /** Optional. If provided, a "last seen" line is shown under the name using this formatter. */
  formatLastSeen?: (isoString: string | null) => string;
  /** Optional. If provided, rendered on the right side of each row (e.g. Delete button). */
  renderActions?: (device: DeviceRow) => ReactNode;
  /** Optional. If provided, shows a rename button; callback receives device and new name. */
  onRename?: (device: DeviceRow, newName: string) => void | Promise<void>;
  /** Optional. Label for the rename button. */
  renameButtonLabel?: string;
}

/**
 * Returns true if the string looks like a browser user-agent (e.g. "Mozilla/5.0 …").
 * We never show these as device name; always replace with hostname or "Desktop".
 */
function looksLikeUserAgent(name: string | null | undefined): boolean {
  if (!name || typeof name !== "string") return false;
  const s = name.trim();
  if (s.length < 10) return false;
  return (
    s.startsWith("Mozilla/") ||
    s.startsWith("Opera/") ||
    s.includes("AppleWebKit") ||
    s.includes(" (KHTML, like Gecko) ") ||
    s.includes("Chrome/") ||
    s.includes("Safari/") ||
    s.includes("Firefox/") ||
    s.includes("Edg/") ||
    (s.length > 50 && (s.includes("Windows NT") || s.includes("Win64")))
  );
}

/** True when this row is the current app instance (match by fingerprint only; fingerprint never shown). */
function isCurrentDevice(
  device: DeviceRow,
  currentFingerprint: string | null
): boolean {
  return (
    currentFingerprint != null && device.device_hash === currentFingerprint
  );
}

/**
 * Resolves display name for one device. Never returns raw user-agent or device_hash.
 * - Current device: empty/UA-like → use hostname or "Desktop".
 * - Other device: empty/UA-like → use unknownDeviceLabel (never current device's hostname).
 * - Otherwise: device_name from DB.
 */
function getDisplayName(
  device: DeviceRow,
  unknownLabel: string,
  isCurrent: boolean,
  currentDeviceHostname: string | null
): string {
  const raw = device.device_name?.trim();
  const hasGoodName = raw && raw.length <= 60 && !looksLikeUserAgent(raw);
  if (hasGoodName) return raw;
  if (isCurrent) {
    const hostname = (currentDeviceHostname && currentDeviceHostname.trim()) ? currentDeviceHostname.trim() : "Desktop";
    return hostname;
  }
  return unknownLabel;
}

/**
 * Renders a vertical list of devices. Only friendly names are displayed.
 * Current device: light background, left border, "This device" badge.
 * Legacy user-agent names are replaced with hostname (current device) or fallback (others).
 */
export function DeviceList({
  devices,
  currentFingerprint,
  currentDeviceLabel,
  currentDeviceHostname: currentDeviceHostnameProp,
  unknownDeviceLabel,
  formatLastSeen,
  renderActions,
  onRename,
  renameButtonLabel = "Rename",
}: DeviceListProps) {
  const [fetchedHostname, setFetchedHostname] = useState<string | null>(null);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const currentDevice = devices.find((d) =>
    isCurrentDevice(d, currentFingerprint)
  );
  const currentNeedsHostname =
    currentDevice != null && looksLikeUserAgent(currentDevice.device_name);

  useEffect(() => {
    if (!currentNeedsHostname || currentDeviceHostnameProp != null) {
      setFetchedHostname(null);
      return;
    }
    let cancelled = false;
    invoke<string>("get_device_display_name")
      .then((hostname) => {
        if (!cancelled && hostname?.trim()) {
          setFetchedHostname(hostname.trim());
        }
      })
      .catch(() => {
        if (!cancelled) setFetchedHostname(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currentNeedsHostname, currentDeviceHostnameProp]);

  const currentDeviceHostname =
    currentDeviceHostnameProp ?? fetchedHostname;

  const displayNameFor = useCallback(
    (device: DeviceRow) =>
      getDisplayName(
        device,
        unknownDeviceLabel,
        isCurrentDevice(device, currentFingerprint),
        currentDeviceHostname
      ),
    [unknownDeviceLabel, currentFingerprint, currentDeviceHostname]
  );

  const handleStartRename = (device: DeviceRow) => {
    setEditingDeviceId(device.id);
    setEditingName(displayNameFor(device) || "");
  };

  const handleSaveRename = async (device: DeviceRow) => {
    const trimmed = editingName.trim();
    if (trimmed && onRename) {
      await onRename(device, trimmed);
    }
    setEditingDeviceId(null);
    setEditingName("");
  };

  const handleCancelRename = () => {
    setEditingDeviceId(null);
    setEditingName("");
  };

  if (!Array.isArray(devices) || devices.length === 0) return null;

  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {devices.map((device) => {
        const isCurrent = isCurrentDevice(device, currentFingerprint);
        const name = displayNameFor(device);
        const isEditing = editingDeviceId === device.id;

        return (
          <li
            key={device.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              backgroundColor: isCurrent
                ? "var(--color-surface-alt, rgba(0,0,0,0.03))"
                : undefined,
              borderLeft: isCurrent
                ? "3px solid var(--color-primary, #0066cc)"
                : undefined,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Only friendly name + optional badge; no device_hash, machine ID, or user-agent. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {isEditing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(device);
                        if (e.key === "Escape") handleCancelRename();
                      }}
                      onBlur={() => handleSaveRename(device)}
                      autoFocus
                      placeholder={renameButtonLabel}
                      style={{
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        padding: "4px 8px",
                        border: "1px solid var(--color-border)",
                        borderRadius: 4,
                        minWidth: 120,
                        maxWidth: 200,
                      }}
                    />
                    <button
                      type="button"
                      className="button ghost"
                      style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                      onClick={() => handleCancelRename()}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                      {name}
                    </span>
                    {onRename && (
                      <button
                        type="button"
                        className="button ghost"
                        style={{ fontSize: "0.75rem", padding: "2px 6px", opacity: 0.7 }}
                        onClick={() => handleStartRename(device)}
                        title={renameButtonLabel}
                      >
                        ✎
                      </button>
                    )}
                  </>
                )}
                {isCurrent && !isEditing && (
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: 4,
                      backgroundColor: "var(--color-primary, #0066cc)",
                      color: "var(--color-on-primary, #fff)",
                    }}
                  >
                    {currentDeviceLabel}
                  </span>
                )}
              </div>
              {formatLastSeen != null && device.last_seen != null && (
                <div
                  className="small muted"
                  style={{ fontSize: "0.75rem", marginTop: 2 }}
                >
                  {formatLastSeen(device.last_seen)}
                </div>
              )}
            </div>
            {renderActions != null && (
              <div style={{ flexShrink: 0 }}>{renderActions(device)}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
