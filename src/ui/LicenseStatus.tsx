import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLicenseContext } from "../context/LicenseContext";
import { createCheckoutSession } from "../lib/createCheckoutSession";
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
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

function statusLabel(
  status: LicenseState["status"],
  t: (key: string) => string
): string {
  if (status === "active") return t("licenseActive");
  if (status === "trial") return t("licenseTrial");
  if (status === "expired") return t("licenseExpired");
  return t("noLicense");
}

export function LicenseStatus() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.split("-")[0] || "nl";
  const { license, loading, error, refetch, refetching, deviceLimitReached, deviceSwapCooldownDays, offlineUsingCache, offlineGraceEnd, trialActive, trialExportUsed, trialCsvExportUsed, trialPdfExportUsed } = useLicenseContext();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="license-status license-status-loading">
        <div className="sidebar-nav-label">{String(t("license"))}</div>
        <p className="license-status-text muted">{t("licenseChecking")}</p>
      </div>
    );
  }

  if (deviceLimitReached) {
    return (
      <div className="license-status license-status-error">
        <div className="sidebar-nav-label">{String(t("license"))}</div>
        <p className="license-status-text error">
          {t("deviceLimitReachedMessage")}
        </p>
        <p className="license-status-detail muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
          {deviceSwapCooldownDays != null
            ? t("deviceSwapCooldownMessage", { days: deviceSwapCooldownDays })
            : t("deviceLimitReachedHint")}
        </p>
      </div>
    );
  }

  if (error) {
    const isNetworkError = /failed to fetch|failed to send a request to the edge function|network error|load failed|connection refused|\[object object\]/i.test(
      String(error)
    );
    const genericHint = "Controleer je verbinding en probeer opnieuw. Zorg dat de app Supabase kan bereiken.";
    let displayMessage: string = isNetworkError ? t("licenseError") : (typeof error === "string" ? error : String(error ?? ""));
    if (displayMessage === "[object Object]") displayMessage = t("licenseError");
    if (/license-server|poort\s*3000|cd license-server/i.test(displayMessage)) {
      displayMessage = t("licenseError");
    }
    return (
      <div className="license-status license-status-error">
        <div className="sidebar-nav-label">{String(t("license"))}</div>
        <p className="license-status-text error" title={typeof error === "string" ? error : undefined}>
          {displayMessage}
        </p>
        {isNetworkError && (
          <p
            className="license-status-detail muted"
            style={{ fontSize: "0.75rem", marginTop: 4 }}
          >
            {genericHint}
          </p>
        )}
        <button
          type="button"
          className="button ghost"
          onClick={() => refetch()}
          style={{ fontSize: "0.75rem", marginTop: 4 }}
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  if (!license) {
    const handleBuyLicense = async () => {
      setCheckoutError(null);
      setCheckoutLoading(true);
      try {
        const result = await createCheckoutSession();
        if (result.url) {
          const opened = typeof window !== "undefined" && window.open ? window.open(result.url, "_blank") : null;
          if (!opened) window.location.href = result.url;
        } else {
          setCheckoutError(result.error ?? t("licenseCheckoutError"));
        }
      } catch (e) {
        setCheckoutError(e instanceof Error ? e.message : t("licenseCheckoutError"));
      } finally {
        setCheckoutLoading(false);
      }
    };
    const trialFullyUsed = trialCsvExportUsed && trialPdfExportUsed;
    const onTrial = trialActive && !trialFullyUsed;
    const trialLabel = trialFullyUsed
      ? t("licenseRequiredShort")
      : trialCsvExportUsed
        ? t("trialLabelPdfAvailable")
        : trialPdfExportUsed
          ? t("trialLabelCsvAvailable")
          : t("trialLabelBothAvailable");
    return (
      <div className="license-status">
        <div className="sidebar-nav-label">{String(t("license"))}</div>
        <p className={`license-status-text ${onTrial ? "ok" : "warn"}`}>
          {onTrial ? trialLabel : t("noLicense")}
        </p>
        {onTrial && (
          <p className="license-status-detail muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>
            {t("trialOneExportHint")}
          </p>
        )}
        <button
          type="button"
          className="button primary"
          onClick={handleBuyLicense}
          disabled={checkoutLoading}
          style={{ fontSize: "0.75rem", marginTop: 4, padding: "6px 12px" }}
        >
          {checkoutLoading ? t("upgradeModalLoading") : (t("licensePurchase") || t("upgradeModalBuyLicense"))}
        </button>
        {checkoutError && (
          <p className="license-status-detail" style={{ fontSize: "0.75rem", marginTop: 4, color: "var(--color-danger)" }}>
            {checkoutError}
          </p>
        )}
      </div>
    );
  }

  const status = license.status;
  const plan = license.plan;
  const validUntil = license.validUntil;
  const statusClass =
    status === "active" ? "ok" : status === "trial" ? "ok" : "error";

  const trialFullyUsed = trialCsvExportUsed && trialPdfExportUsed;
  const trialLabel = trialFullyUsed
    ? t("licenseRequiredShort")
    : trialCsvExportUsed
      ? t("trialLabelPdfAvailable")
      : trialPdfExportUsed
        ? t("trialLabelCsvAvailable")
        : t("trialLabelBothAvailable");
  const displayLabel =
    trialActive && !trialFullyUsed
      ? trialLabel
      : status === "expired" && (trialExportUsed || trialActive)
        ? t("licenseRequiredShort")
        : statusLabel(status, t);
  const displayLabelStr = typeof displayLabel === "string" ? displayLabel : String(displayLabel ?? t("noLicense"));

  return (
    <div className="license-status">
      <div className="sidebar-nav-label">{String(t("license"))}</div>
      <p className={`license-status-text ${statusClass}`}>
        {displayLabelStr}
      </p>
      {plan && (
        <p className="license-status-detail muted">
          {t("planLabel")}: {plan}
        </p>
      )}
      {validUntil && (
        <p className="license-status-detail muted">
          {status === "expired" ? t("wasValidUntil") : t("validUntil")}:{" "}
          {formatDate(validUntil, locale)}
        </p>
      )}
      {offlineUsingCache && offlineGraceEnd && (
        <p className="license-status-detail muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
          {t("licenseOfflineFromCache", { date: formatDate(offlineGraceEnd, locale) })}
        </p>
      )}
      <button
        type="button"
        className="button ghost"
        onClick={() => refetch()}
        disabled={refetching}
        style={{ fontSize: "0.75rem", marginTop: 4 }}
      >
        {refetching ? t("licenseValidating") : t("licenseValidate")}
      </button>
    </div>
  );
}
