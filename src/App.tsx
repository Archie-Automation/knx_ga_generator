import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceConfigurator } from './ui/DeviceConfigurator';
import { DeviceSelection } from './ui/DeviceSelection';
import { ExportPanel } from './ui/ExportPanel';
import { Overview } from './ui/Overview';
import { TemplateWizard } from './template/TemplateWizard';
import { Login } from './ui/Login';
import { LicenseProvider } from './context/LicenseContext';
import { LicenseGate } from './ui/LicenseGate';
import { StartScreen } from './ui/StartScreen';
import { DashboardLayout } from './ui/layout/DashboardLayout';
import { useAppStore } from './store';
import { translateTemplate } from './i18n/translations';
import { checkForUpdates } from './lib/updater';
import { supabase } from './lib/supabase';
import { registerDevice } from './lib/registerDevice';
import type { Language } from './i18n/translations';
import { generateGroupAddresses } from './generator';

type WizardStep = 'start' | 'template' | 'devices' | 'configure' | 'overview' | 'export';

function App() {
  const { step, setStep, username, template, setTemplate, currentTemplateId, currentProjectId, selectedCategories, devices, csvExported, pdfExported, setUsername, authPendingPasswordReset, setAuthPendingPasswordReset, loginScreenKey } = useAppStore();
  const { t, i18n } = useTranslation();

  // Check for app updates at start (Tauri only, when online)
  useEffect(() => {
    checkForUpdates().catch((err) => {
      console.warn('[App] Update check failed:', err);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  // Restore Supabase session on load and subscribe to auth changes
  useEffect(() => {
    const hash = window.location.hash;
    const isRecovery = hash.includes('type=recovery');
    
    let recoveryMode = isRecovery;
    if (isRecovery) {
      setAuthPendingPasswordReset(true);
    }

    // Initialize processes URL hash (email change, password recovery, etc.)
    supabase.auth.initialize().then(() =>
      supabase.auth.getSession()
    )
      .then(({ data: { session } }) => {
        if (recoveryMode) return;
        if (session?.user?.email) {
          setUsername(session.user.email);
        }
        // register-device is called from onAuthStateChange (INITIAL_SESSION / SIGNED_IN)
      })
      .catch((err) => {
        console.warn('Supabase auth init/session failed:', err);
      });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryMode = true;
        setAuthPendingPasswordReset(true);
        setTimeout(() => window.history.replaceState(null, '', window.location.pathname), 100);
      } else if (recoveryMode) {
        return;
      } else if (session?.user?.email) {
        setAuthPendingPasswordReset(false);
        setUsername(session.user.email);
        // Register device when user signs in (Bearer token + fingerprint/deviceName/appVersion)
        if (session?.access_token && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          registerDevice();
        }
      } else {
        setAuthPendingPasswordReset(false);
        setUsername('');
      }
    });
    return () => subscription.unsubscribe();
  }, [setUsername, setAuthPendingPasswordReset]);

  // Translate template when language changes
  useEffect(() => {
    if (template && template.teachByExampleConfig) {
      const lang = (i18n.language || 'nl') as Language;
      const translatedTemplate = translateTemplate(template, lang);
      // Only update if translation actually changed something
      const templateString = JSON.stringify(template);
      const translatedString = JSON.stringify(translatedTemplate);
      if (translatedString !== templateString) {
        setTemplate(translatedTemplate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]); // Only re-run when language changes (template is intentionally excluded to prevent loops)

  // Check completion status for each step
  const isTemplateCompleted = useMemo(() => {
    if (!template) return false;
    // Check if template has teachByExampleConfig with categories
    if (template.teachByExampleConfig?.categories && Object.keys(template.teachByExampleConfig.categories).length > 0) {
      return true;
    }
    // Check if template has any device configurations (not just defaults)
    const hasDevices = template.devices && (
      (template.devices.switch?.objects && template.devices.switch.objects.length > 0) ||
      (template.devices.dimmer && Array.isArray(template.devices.dimmer) && template.devices.dimmer.length > 0) ||
      (template.devices.blind?.objects && template.devices.blind.objects.length > 0) ||
      (template.devices.hvac?.objects && template.devices.hvac.objects.length > 0) ||
      (template.devices.fixed?.mainGroups && template.devices.fixed.mainGroups.some(mg => 
        mg.middleGroups.some(mg2 => mg2.subs.length > 0)
      ))
    );
    return hasDevices;
  }, [template]);

  const isDevicesCompleted = useMemo(() => {
    return selectedCategories.length > 0;
  }, [selectedCategories]);

  const isConfigureCompleted = useMemo(() => {
    const allDevices = Object.values(devices).flat();
    return allDevices.length > 0;
  }, [devices]);

  // Check if overview has information (rows generated or mainGroups exist)
  // Show info icon if there are group addresses or main groups in the overview
  const overviewHasInfo = useMemo(() => {
    if (!template) return false;
    
    // Generate rows to check if there are any group addresses
    const allDevices = Object.values(devices).flat();
    const rows = generateGroupAddresses(template, allDevices, i18n.language || 'nl');
    
    // Check if there are any rows (group addresses)
    if (rows.length > 0) return true;
    
    // Also check if there are fixed main groups with content
    if (template.devices?.fixed?.mainGroups) {
      const hasMainGroups = template.devices.fixed.mainGroups.some(mg => 
        mg.middleGroups && mg.middleGroups.some(mg2 => mg2.subs && mg2.subs.length > 0)
      );
      if (hasMainGroups) return true;
    }
    
    return false;
  }, [template, devices, i18n.language]);

  // Check if export has been done - we'll check if we're on export step or have been there
  // and we have devices configured (which means export is possible)
  const isExportCompleted = useMemo(() => {
    // If we're on export step or have been there (step is overview or export), and we have devices configured
    if ((step === 'export' || step === 'overview') && isConfigureCompleted) {
      return true;
    }
    return false;
  }, [step, isConfigureCompleted]);

  // Check if all 4 main functions are set to "not used" (enabled === 'none')
  // If so, disable devices and configure steps (make them blurred and not clickable)
  const allCategoriesNotUsed = useMemo(() => {
    if (!template?.teachByExampleConfig?.categories) return false;
    const config = template.teachByExampleConfig;
    const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
    return allCategories.every(cat => {
      const categoryConfig = config.categories?.[cat];
      if (!categoryConfig) return false; // Category must be present
      const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
      return configs.every(cfg => cfg.enabled === 'none');
    });
  }, [template]);

  // All hooks must be called before any conditional returns
  const steps = useMemo(() => {
    const allSteps = [
      { id: 'template', label: t('stepTemplate'), completed: isTemplateCompleted },
      { 
        id: 'devices', 
        label: t('stepDeviceSelection'), 
        completed: isDevicesCompleted,
        disabled: allCategoriesNotUsed // Disable if all categories are "not used"
      },
      { 
        id: 'configure', 
        label: t('stepConfiguration'), 
        completed: isConfigureCompleted,
        disabled: allCategoriesNotUsed // Disable if all categories are "not used"
      },
      { id: 'overview', label: t('stepOverview'), hasInfo: overviewHasInfo }, // Overview shows info icon instead of checkmark
      { 
        id: 'export', 
        label: t('stepExport'), 
        completed: isExportCompleted,
        // Show 2 export indicators (CSV and PDF) when a project or template is loaded
        exportExports: (currentProjectId || currentTemplateId) ? [csvExported, pdfExported] : undefined
      }
    ];
    
    return allSteps;
  }, [t, isTemplateCompleted, isDevicesCompleted, isConfigureCompleted, isExportCompleted, overviewHasInfo, currentProjectId, currentTemplateId, csvExported, pdfExported, allCategoriesNotUsed]);

  const pageTitle = t('appTitle');
  
  const pageSubtitle = step === 'start' && !currentTemplateId 
    ? t('appDescription')
    : step === 'template' 
    ? t('stepTemplate')
    : step === 'devices'
    ? t('stepDeviceSelection')
    : step === 'configure'
    ? t('stepConfiguration')
    : step === 'overview'
    ? t('stepOverview')
    : step === 'export'
    ? t('stepExport')
    : undefined;

  // Show steps if a project or template is open
  const showSteps = currentProjectId || currentTemplateId;
  
  console.log('[App] Rendering with step:', step, 'showSteps:', showSteps, 'currentProjectId:', currentProjectId, 'currentTemplateId:', currentTemplateId);

  if (!username || authPendingPasswordReset) {
    return <Login key={loginScreenKey} />;
  }

  return (
    <LicenseProvider>
    <LicenseGate>
    <DashboardLayout
      sidebarSteps={showSteps ? steps.map((s) => ({ id: s.id, label: s.label, completed: s.completed, hasInfo: s.hasInfo, exportExports: s.exportExports, disabled: s.disabled })) : undefined}
      activeStep={showSteps ? step : undefined}
      onStepSelect={(id) => {
        if (['template', 'devices', 'configure', 'overview', 'export'].includes(id)) {
          setStep(id as WizardStep);
        }
      }}
      title={pageTitle}
      subtitle={pageSubtitle}
      username={username}
    >
      {step === 'start' && !currentTemplateId && <StartScreen />}
      {step === 'template' && <TemplateWizard />}
      {step === 'devices' && <DeviceSelection />}
      {step === 'configure' && <DeviceConfigurator />}
      {step === 'overview' && <Overview />}
      {step === 'export' && <ExportPanel />}
    </DashboardLayout>
    </LicenseGate>
    </LicenseProvider>
  );
}

export default App;

