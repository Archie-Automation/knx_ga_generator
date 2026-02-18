import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ask } from "@tauri-apps/plugin-dialog";
import { useLicenseContext } from "../context/LicenseContext";
import { useAppStore } from "../store";
import { supabase } from "../lib/supabase";
import { getDeviceInfo } from "../lib/deviceInfo";
import { createCheckoutSession } from "../lib/createCheckoutSession";
import { DeviceService } from "../services/DeviceService";
import { DeviceList } from "./DeviceList";
import { isTauri } from "../lib/updater";
import type { LicenseState } from "../services/types";

const LOCALE_MAP: Record<string, string> = {
  nl: "nl-NL",
  en: "en-GB",
  de: "de-DE",
  es: "es-ES",
  fr: "fr-FR",
};

function formatDate(isoString: string | null, locale: string): string {
  if (!isoString) return "–";
  try {
    const d = new Date(isoString);
    const localeTag = LOCALE_MAP[locale] || locale || "nl-NL";
    return d.toLocaleDateString(localeTag, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function statusLabel(status: LicenseState["status"], t: (key: string) => string): string {
  if (status === "active") return t("licenseActive");
  if (status === "trial") return t("licenseTrial");
  if (status === "expired") return t("licenseExpired");
  return t("noLicense");
}

function getTrialLabel(
  trialCsvExportUsed: boolean,
  trialPdfExportUsed: boolean,
  t: (key: string) => string
): string {
  if (trialCsvExportUsed && trialPdfExportUsed) return t("licenseRequiredShort");
  if (trialCsvExportUsed) return t("trialLabelPdfAvailable");
  if (trialPdfExportUsed) return t("trialLabelCsvAvailable");
  return t("trialLabelBothAvailable");
}

export interface DeviceRow {
  id: string;
  user_id: string;
  /** Hashed fingerprint from backend – used only for matching current device; never shown in UI. */
  device_hash: string;
  device_name: string | null;
  app_version: string | null;
  created_at: string;
  last_seen: string;
}

export function LicenseAndDevices() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.split("-")[0] || "nl";
  const signOutAuth = useAppStore((s) => s.signOutAuth);
  const { license, loading: licenseLoading, refetch, refetching, offlineUsingCache, offlineGraceEnd, trialActive, trialExportUsed, trialCsvExportUsed, trialPdfExportUsed } = useLicenseContext();
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(null);
  const [currentDeviceHostname, setCurrentDeviceHostname] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    setDevicesError(null);
    setDevicesLoading(true);
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      setDevices([]);
      setDevicesLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("devices")
      .select("id, user_id, device_hash, device_name, app_version, created_at, last_seen")
      .eq("user_id", session.user.id)
      .order("last_seen", { ascending: false });
    if (error) {
      setDevicesError(error.message);
      // Keep previous devices so list stays visible when offline
    } else {
      setDevices((data as DeviceRow[]) ?? []);
    }
    setDevicesLoading(false);
  }, []);

  useEffect(() => {
    getDeviceInfo()
      .then((info) => {
        setCurrentFingerprint(info.fingerprint ?? null);
        setCurrentDeviceHostname(info.deviceName?.trim() || null);
      })
      .catch(() => {
        setCurrentFingerprint(null);
        setCurrentDeviceHostname(null);
      });
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleDelete = async (device: DeviceRow) => {
    const isCurrent = currentFingerprint != null && device.device_hash === currentFingerprint;
    const message = t("deviceDeleteConfirmMessage") || t("deviceDeleteCooldownWarning");
    const title = t("deviceDeleteConfirmTitle") || t("delete");
    const okLabel = t("deviceDeleteConfirmYes") || t("delete");
    const cancelLabel = t("deviceDeleteConfirmNo") || t("cancel");

    let confirmed: boolean;
    if (isTauri()) {
      confirmed = await ask(message, {
        title,
        kind: "warning",
        okLabel,
        cancelLabel,
      });
    } else {
      confirmed = window.confirm(message);
    }
    if (!confirmed) return;

    setDeletingId(device.id);
    const wasOnlyDevice = devices.length === 1;
    const { error } = await supabase.from("devices").delete().eq("id", device.id);
    setDeletingId(null);
    if (error) {
      setDevicesError(error.message);
    } else {
      setDevices((prev) => prev.filter((d) => d.id !== device.id));
      // Bepaal op het moment van verwijderen of dit het huidige apparaat was (fingerprint nu ophalen)
      let isCurrentDevice = wasOnlyDevice;
      if (!isCurrentDevice) {
        try {
          const info = await getDeviceInfo();
          const fp = (info.fingerprint ?? "").trim();
          const stored = (device.device_hash ?? "").trim();
          isCurrentDevice = stored === fp;
        } catch {
          // Als we fingerprint niet kunnen ophalen: uitloggen als het het enige apparaat was
          isCurrentDevice = wasOnlyDevice;
        }
      }
      if (isCurrentDevice) {
        await signOutAuth();
      }
    }
  };

  const handleBuyLicense = async () => {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const result = await createCheckoutSession();
      if (result.error) {
        setCheckoutError(result.error);
        return;
      }
      if (result.url) {
        const opened = typeof window !== "undefined" && window.open ? window.open(result.url, "_blank") : null;
        if (!opened) window.location.href = result.url;
        return;
      }
      setCheckoutError(t("licenseCheckoutError") || "Kon geen betaallink ophalen.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isCurrentDevice = (device: DeviceRow) =>
    currentFingerprint != null && device.device_hash === currentFingerprint;

  const handleRename = useCallback(async (device: DeviceRow, newName: string) => {
    try {
      await DeviceService.updateDeviceName(device.id, newName.trim() || null);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === device.id ? { ...d, device_name: newName.trim() || null } : d
        )
      );
    } catch (e) {
      setDevicesError(e instanceof Error ? e.message : "Rename failed");
    }
  }, []);

  const smallStyle = { fontSize: "0.8125rem" }; // 13px, in proportion with rest of UI
  const hasActiveLicense = !!license && (license.status === "active" || license.status === "trial");

  const buyLicenseButton = (
    <button
      type="button"
      className="button primary"
      onClick={handleBuyLicense}
      disabled={checkoutLoading || hasActiveLicense}
      style={{ fontSize: "0.8125rem", padding: "8px 16px" }}
    >
      {checkoutLoading ? (t("upgradeModalLoading") || "Bezig…") : (t("upgradeModalBuyLicense") || "Licentie kopen")}
    </button>
  );

  return (
    <div className="license-and-devices-content" style={smallStyle}>
      {/* License status */}
      <section style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 6, fontSize: "0.8125rem" }}>{t("licenseStatus")}</div>
        {licenseLoading ? (
          <p className="muted" style={{ margin: 0 }}>{t("licenseChecking")}</p>
        ) : license ? (
          <div>
            <p className={license.status === "active" || license.status === "trial" ? "ok" : "error"} style={{ margin: "0 0 4px 0" }}>
              {trialActive && !(trialCsvExportUsed && trialPdfExportUsed)
                ? getTrialLabel(trialCsvExportUsed, trialPdfExportUsed, t)
                : license.status === "expired" && (trialExportUsed || trialActive)
                  ? t("licenseRequiredShort")
                  : statusLabel(license.status, t)}
              {license.plan && license.status === "active" && ` · ${t("planLabel")}: ${license.plan}`}
            </p>
            <p className="small muted" style={{ margin: "0 0 8px 0" }}>
              {license.status === "expired" ? t("wasValidUntil") : t("validUntil")}:{" "}
              {formatDate(license.validUntil, locale)}
            </p>
            {offlineUsingCache && offlineGraceEnd && (
              <p className="small muted" style={{ margin: "0 0 8px 0" }}>
                {t("licenseOfflineFromCache", { date: formatDate(offlineGraceEnd, locale) })}
              </p>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" className="button ghost" onClick={() => refetch()} disabled={refetching} style={{ fontSize: "0.8125rem", padding: "6px 12px" }}>
                {refetching ? t("licenseValidating") : t("licenseValidate")}
              </button>
              <span
                style={{
                  display: "inline-block",
                  filter: hasActiveLicense ? "blur(3px)" : "none",
                  opacity: hasActiveLicense ? 0.8 : 1,
                  pointerEvents: hasActiveLicense ? "none" : "auto",
                }}
              >
                {buyLicenseButton}
              </span>
            </div>
            {checkoutError && !hasActiveLicense && (
              <p className="small" style={{ margin: "8px 0 0 0", color: "var(--color-danger)" }}>{checkoutError}</p>
            )}
          </div>
        ) : (
          <div>
            <p className={trialActive && !(trialCsvExportUsed && trialPdfExportUsed) ? "ok" : "muted"} style={{ margin: "0 0 4px 0" }}>
              {trialActive && !(trialCsvExportUsed && trialPdfExportUsed)
                ? getTrialLabel(trialCsvExportUsed, trialPdfExportUsed, t)
                : t("noLicense")}
            </p>
            {trialActive && !(trialCsvExportUsed && trialPdfExportUsed) && (
              <p className="small muted" style={{ margin: "0 0 8px 0" }}>{t("trialOneExportHint")}</p>
            )}
            <p className="small muted" style={{ margin: "0 0 12px 0" }}>
              {t("licenseBuyInfo") || "Koop een licentie om projecten en sjablonen te gebruiken en op maximaal 2 apparaten in te loggen."}
            </p>
            {buyLicenseButton}
            {checkoutError && (
              <p className="small" style={{ margin: "8px 0 0 0", color: "var(--color-danger)" }}>{checkoutError}</p>
            )}
          </div>
        )}
      </section>

      {/* Devices: list shows user-facing display names only. Current device is matched by
          hashed fingerprint (device_hash) from backend; we never show or expose raw fingerprints. */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div className="label" style={{ fontSize: "0.8125rem" }}>{t("licenseDevicesList")}</div>
          <button
            type="button"
            className="button ghost"
            onClick={() => loadDevices()}
            disabled={devicesLoading}
            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
          >
            {devicesLoading ? "…" : t("refresh")}
          </button>
        </div>
        <p className="small muted" style={{ margin: "0 0 8px 0" }}>
          {t("licenseDevicesListHint")}
        </p>
        {devices.length >= 2 && (
          <p className="small muted" style={{ margin: "0 0 8px 0", color: "var(--color-text-secondary)" }}>
            {t("deviceLimitReachedMessage")} {t("deviceLimitReachedHint")}
          </p>
        )}
        {devicesError && (
          <p className="small muted" style={{ marginBottom: 8 }}>
            {devices.length > 0
              ? t("licenseDevicesOfflineHint")
              : t("licenseDevicesLoadError")}
          </p>
        )}
        {devicesLoading ? (
          <p className="muted" style={{ margin: 0 }}>{t("licenseChecking")}</p>
        ) : devices.length === 0 && !devicesError ? (
          <p className="muted" style={{ margin: 0 }}>{t("licenseNoDevices")}</p>
        ) : devices.length === 0 ? (
          null
        ) : (
          <DeviceList
            devices={devices}
            currentFingerprint={currentFingerprint}
            currentDeviceHostname={currentDeviceHostname ?? "Desktop"}
            currentDeviceLabel={t("licenseThisDevice")}
            unknownDeviceLabel={t("licenseDeviceUnknown")}
            formatLastSeen={(iso) => `${t("licenseLastSeen")}: ${formatDate(iso, locale)}`}
            onRename={handleRename}
            renameButtonLabel={t("licenseRenameDevice")}
            renderActions={(device) => {
              const current = isCurrentDevice(device);
              return (
                <button
                  type="button"
                  className="button ghost danger"
                  disabled={deletingId === device.id}
                  onClick={() => handleDelete(device)}
                  style={{ fontSize: "0.8125rem", padding: "6px 12px" }}
                  title={current ? t("licenseDeleteCurrentDeviceHint") : undefined}
                >
                  {deletingId === device.id ? t("licenseRemoving") : t("delete")}
                </button>
              );
            }}
          />
        )}
      </section>
    </div>
  );
}
