import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createCheckoutSession } from '../lib/createCheckoutSession';
import { useLicenseContext } from '../context/LicenseContext';

interface LicenseRequiredMessageProps {
  onClose?: () => void;
}

/**
 * Shown when user tries to use projects/export without a valid license (trial used or domain limit).
 */
export function LicenseRequiredMessage({ onClose }: LicenseRequiredMessageProps) {
  const { t } = useTranslation();
  const { trialExportUsed, domainTrialAllowed } = useLicenseContext();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isDomainLimit = !domainTrialAllowed && !trialExportUsed;
  const message = isDomainLimit
    ? (t('trialDomainLimitMessage') || t('trialUsedOrLimitMessage'))
    : (t('trialUsedOrLimitMessage') || t('licenseRequiredMessage'));

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

  return (
    <div className="card no-hover" style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 16, fontSize: '1.25rem' }}>{t('licenseRequiredTitle')}</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="button primary"
          onClick={handleBuyLicense}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? t('upgradeModalLoading') : (t('upgradeModalBuyLicense') || t('licensePurchase'))}
        </button>
        {checkoutError && (
          <p style={{ fontSize: "0.875rem", color: "var(--color-danger)", marginTop: 8 }}>{checkoutError}</p>
        )}
        {onClose && (
          <button type="button" className="button secondary" onClick={onClose}>
            {t('licenseRequiredClose')}
          </button>
        )}
      </div>
    </div>
  );
}
