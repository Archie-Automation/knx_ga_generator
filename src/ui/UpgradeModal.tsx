import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createCheckoutSession } from "../lib/createCheckoutSession";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** Override message (e.g. trial used / domain limit). */
  message?: string;
}

/**
 * Modal shown when the user tries to use a Pro feature (e.g. export) without an active license.
 * Offers a button to open Stripe Checkout to purchase a license.
 */
export function UpgradeModal({ open, onClose, message }: UpgradeModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleBuyLicense = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await createCheckoutSession();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) {
        const opened = typeof window !== "undefined" && window.open ? window.open(result.url, "_blank") : null;
        if (!opened) window.location.href = result.url;
        return;
      }
      setError("Could not start checkout");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card no-hover" style={{ maxWidth: 420, margin: "auto" }}>
        <h2 id="upgrade-modal-title" style={{ marginBottom: 12, fontSize: "1.25rem" }}>
          {t("upgradeModalTitle")}
        </h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
          {message ?? t("upgradeModalMessage")}
        </p>
        {error && (
          <p className="small danger" style={{ marginBottom: 16 }}>
            {error}
          </p>
        )}
        <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button primary"
            onClick={handleBuyLicense}
            disabled={loading}
          >
            {loading ? t("upgradeModalLoading") : t("upgradeModalBuyLicense")}
          </button>
          <button type="button" className="button ghost" onClick={onClose}>
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
