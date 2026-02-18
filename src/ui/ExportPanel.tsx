import { useMemo, useState } from 'react';
import { buildEtsCsv, getCsvBytes } from '../export/csv';
import { saveFileWithDialog } from '../lib/saveFile';
import { generateGroupAddresses, convertToHierarchicalOverview } from '../generator';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../i18n/useTranslation'; // Keep for lang access temporarily
import { generateInstallerPDF } from '../export/pdf';
import { useLicenseContext } from '../context/LicenseContext';
import { UpgradeModal } from './UpgradeModal';
import { InstallerPDFModal } from './InstallerPDFModal';

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle', flexShrink: 0 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const ExportPanel = () => {
  const { devices, template, setStep, username, currentProjectId, getProjects, setCsvExported, setPdfExported, nameOptions } = useAppStore();
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { hasActiveLicense, trialActive, trialCsvExportUsed, trialPdfExportUsed, consumeTrialExport } = useLicenseContext();
  const canExportCsv = hasActiveLicense || (trialActive && !trialCsvExportUsed);
  const canExportPdf = hasActiveLicense || (trialActive && !trialPdfExportUsed);
  const trialFullyUsed = trialActive && trialCsvExportUsed && trialPdfExportUsed;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showInstallerPDFModal, setShowInstallerPDFModal] = useState(false);

  const allDevices = useMemo(() => Object.values(devices).flat(), [devices]);
  
  // For CSV: use filtered rows (with nameOptions)
  const csvRows = useMemo(() => {
    if (!template) return [];
    return generateGroupAddresses(template, allDevices, lang, nameOptions);
  }, [template, allDevices, lang, nameOptions]);
  
  // For PDF: use original rows (without nameOptions filtering)
  const pdfRows = useMemo(() => {
    if (!template) return [];
    return generateGroupAddresses(template, allDevices, lang);
  }, [template, allDevices, lang]);

  const hierarchicalOverview = useMemo(() => {
    if (!template || csvRows.length === 0) return null;
    return convertToHierarchicalOverview(csvRows, template, lang, allDevices);
  }, [template, csvRows, lang, allDevices]);

  // Get project name if there's a current project
  const projectName = useMemo(() => {
    if (currentProjectId && username) {
      const projects = getProjects();
      const project = projects.find(p => p.id === currentProjectId);
      return project?.name || template?.name || 'Project';
    }
    return template?.name || 'Project';
  }, [currentProjectId, username, getProjects, template]);

  const handleExportCSV = async () => {
    if (!canExportCsv) {
      setShowUpgradeModal(true);
      return;
    }
    if (!template || !hierarchicalOverview) return;
    const csv = buildEtsCsv(hierarchicalOverview, template, lang);
    const ok = await saveFileWithDialog(getCsvBytes(csv), `${projectName}-ets.csv`);
    if (ok) {
      setCsvExported(true);
      const shouldConsume = trialActive && !trialCsvExportUsed;
      console.log('[ExportPanel] CSV saved. trialActive:', trialActive, 'trialCsvExportUsed:', trialCsvExportUsed, 'hasActiveLicense:', hasActiveLicense, '→ consume:', shouldConsume);
      if (!shouldConsume && import.meta.env.VITE_DEBUG_LICENSE === "true") {
        alert(`Debug: consume niet uitgevoerd.\ntrialActive=${trialActive} trialCsvExportUsed=${trialCsvExportUsed} hasActiveLicense=${hasActiveLicense}\n\nMet licentie: trial telt niet. Test met een trial-account.`);
      }
      if (shouldConsume) {
        try {
          await consumeTrialExport('csv');
          console.log('[ExportPanel] Trial CSV export consumed OK');
        } catch (err) {
          console.error('[ExportPanel] consumeTrialExport(csv) failed:', err);
          alert((err instanceof Error ? err.message : String(err)));
        }
      }
    }
  };

  const handleExportPDFClick = () => {
    if (!canExportPdf) {
      setShowUpgradeModal(true);
      return;
    }
    if (!template) return;
    setShowInstallerPDFModal(true);
  };

  const handleInstallerPDFGenerate = async (options: {
    floorDistributorMode?: import('../types/common').FloorDistributorMode;
    floorDistributorActuators?: import('../types/common').FloorDistributorActuatorData[];
    climateZones?: Array<{ id: string; roomAddress: string; roomName: string; channelName: string }>;
    roomSwitchSensorData?: import('../types/common').RoomSwitchSensorData[];
  }) => {
    if (!template) return;
    const blob = await generateInstallerPDF(
      allDevices,
      pdfRows,
      lang,
      projectName,
      username,
      options
    );
    if (!blob) return;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const ok = await saveFileWithDialog(bytes, `${projectName}-installer.pdf`);
    if (ok) {
      setPdfExported(true);
      const shouldConsume = trialActive && !trialPdfExportUsed;
      console.log('[ExportPanel] PDF saved. trialActive:', trialActive, 'trialPdfExportUsed:', trialPdfExportUsed, 'hasActiveLicense:', hasActiveLicense, '→ consume:', shouldConsume);
      if (!shouldConsume && import.meta.env.VITE_DEBUG_LICENSE === "true") {
        alert(`Debug: consume niet uitgevoerd.\ntrialActive=${trialActive} trialPdfExportUsed=${trialPdfExportUsed} hasActiveLicense=${hasActiveLicense}\n\nMet licentie: trial telt niet. Test met een trial-account.`);
      }
      if (shouldConsume) {
        try {
          await consumeTrialExport('pdf');
          console.log('[ExportPanel] Trial PDF export consumed OK');
        } catch (err) {
          console.error('[ExportPanel] consumeTrialExport(pdf) failed:', err);
          alert((err instanceof Error ? err.message : String(err)));
        }
      }
    }
  };

  return (
    <div className="card">
      <div className="flex-between">
        <h3>5) {t('export')}</h3>
        <button className="button ghost" onClick={() => setStep('overview')}>
          {t('back')}
        </button>
      </div>
      {!template ? (
        <div className="danger small">{t('noTemplate')}</div>
      ) : csvRows.length === 0 ? (
        <div className="small danger">{t('noGAsFound')}</div>
      ) : (
        <>
          <div className="grid grid-2">
            <div className="card">
              <div className="label">CSV</div>
              <div className="small">
                {t('csvDescription')}
              </div>
              <div className="small">{t('columns')}: Adres;Naam</div>
            </div>
            <div className="card">
              <div className="label">{t('installerPDF')}</div>
              <div className="small" style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {t('installerPdfClimateSwitchesOptional')}
              </div>
              <div>{projectName}</div>
            </div>
          </div>
          <div className="flex" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className={canExportCsv ? 'button primary' : 'button primary export-locked'}
              onClick={handleExportCSV}
              disabled={!canExportCsv}
              title={!canExportCsv ? t('upgradeModalTitle') : undefined}
            >
              {!canExportCsv && <LockIcon />}
              {t('exportCSV')}
            </button>
            <button
              className={canExportPdf ? 'button primary' : 'button primary export-locked'}
              onClick={handleExportPDFClick}
              disabled={!canExportPdf}
              title={!canExportPdf ? t('upgradeModalTitle') : undefined}
            >
              {!canExportPdf && <LockIcon />}
              {t('generateInstallerPDF')}
            </button>
          </div>
          <UpgradeModal
            open={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            message={trialFullyUsed || (trialActive === false && !hasActiveLicense) ? (t('trialUsedOrLimitMessage') || undefined) : undefined}
          />
          <InstallerPDFModal
            open={showInstallerPDFModal}
            onClose={() => setShowInstallerPDFModal(false)}
            onGenerate={handleInstallerPDFGenerate}
            devices={allDevices}
          />
        </>
      )}
    </div>
  );
};

