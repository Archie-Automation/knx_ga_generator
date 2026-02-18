import { useMemo, useState, useEffect } from 'react';
import { DeviceCategory } from '../types/common';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';

export const DeviceSelection = () => {
  const { selectedCategories, toggleCategory, setStep, currentProjectId, saveProject, username, template, setSelectedCategories } = useAppStore();
  const [showProjectNameDialog, setShowProjectNameDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const { t } = useTranslation();
  const canContinue = useMemo(() => selectedCategories.length > 0, [selectedCategories]);

  // Check if project name is needed when component mounts
  useEffect(() => {
    // If there's a template but no project, ask for project name
    if (template && !currentProjectId && username) {
      setShowProjectNameDialog(true);
    }
  }, [template, currentProjectId, username]);

  const handleSaveProjectName = () => {
    if (!projectName.trim()) {
      alert(t('projectNameRequired'));
      return;
    }
    try {
      saveProject(projectName.trim());
      setProjectName('');
      setShowProjectNameDialog(false);
    } catch (err) {
      alert(t('projectSaveError'));
      console.error(err);
    }
  };

  const labels: Record<Exclude<DeviceCategory, 'central'>, string> = useMemo(() => ({
    switch: t('switch'),
    dimmer: t('dimmer'),
    blind: t('blind'),
    hvac: t('hvac')
  }), [t]);

  // Filter categories to only show those that are used in the template (not set to "not used")
  const availableCategories = useMemo(() => {
    const allCategories: Exclude<DeviceCategory, 'central'>[] = ['switch', 'dimmer', 'blind', 'hvac'];
    
    // If template has teachByExampleConfig, filter based on enabled status
    if (template?.teachByExampleConfig?.categories) {
      const config = template.teachByExampleConfig;
      const categoryMapping: Record<string, Exclude<DeviceCategory, 'central'>> = {
        'switching': 'switch',
        'dimming': 'dimmer',
        'shading': 'blind',
        'hvac': 'hvac'
      };
      
      return allCategories.filter(category => {
        // Find the corresponding category key in teachByExampleConfig
        const configKey = Object.entries(categoryMapping).find(([_, value]) => value === category)?.[0] as 'switching' | 'dimming' | 'shading' | 'hvac' | undefined;
        if (!configKey) return true; // If no mapping found, show it (fallback)
        
        const categoryConfig = config.categories?.[configKey];
        if (!categoryConfig) {
          // Special case: if switching is not configured but dimming is linked to switching, show switching
          if (category === 'switch') {
            const dimmingConfig = config.categories?.dimming;
            if (dimmingConfig) {
              const dimmingConfigs = Array.isArray(dimmingConfig) ? dimmingConfig : [dimmingConfig];
              return dimmingConfigs.some(cfg => cfg.linkedToSwitching === true);
            }
          }
          return false; // Category not configured, don't show
        }
        
        const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
        // Only show if at least one config is NOT set to "not used"
        const isEnabled = configs.some(cfg => cfg.enabled !== 'none');
        
        // Special case: if switching is not enabled but dimming is linked to switching, show switching anyway
        if (category === 'switch' && !isEnabled) {
          const dimmingConfig = config.categories?.dimming;
          if (dimmingConfig) {
            const dimmingConfigs = Array.isArray(dimmingConfig) ? dimmingConfig : [dimmingConfig];
            return dimmingConfigs.some(cfg => cfg.linkedToSwitching === true);
          }
        }
        
        return isEnabled;
      });
    }
    
    // If no teachByExampleConfig, show all categories (legacy template)
    return allCategories;
  }, [template]);

  // Sync selectedCategories when availableCategories changes (e.g. template switch)
  // Filter to only available, ensure minimum 1. Do NOT force all selected on user toggle.
  useEffect(() => {
    if (availableCategories.length === 0) return;
    const current = useAppStore.getState().selectedCategories;
    const filtered = current.filter((c) => availableCategories.includes(c));
    const next = filtered.length === 0 ? availableCategories : filtered;
    setSelectedCategories(next);
  }, [availableCategories, setSelectedCategories]);

  // Check if dimmer is linked to switching (same group addresses)
  const isDimmerLinkedToSwitch = useMemo(() => {
    const dimmingConfig = template?.teachByExampleConfig?.categories?.dimming;
    if (!dimmingConfig) return false;
    const configs = Array.isArray(dimmingConfig) ? dimmingConfig : [dimmingConfig];
    return configs.some((cfg) => cfg.linkedToSwitching === true);
  }, [template]);

  const handleCategoryToggle = (category: Exclude<DeviceCategory, 'central'>) => {
    const checked = selectedCategories.includes(category);
    if (checked) {
      // Unchecking: minimum 1 must stay
      if (selectedCategories.length <= 1) return;
      // When unchecking switch: if dimmer is linked and selected, uncheck both (same addresses)
      if (category === 'switch' && isDimmerLinkedToSwitch && selectedCategories.includes('dimmer')) {
        const after = selectedCategories.filter((c) => c !== 'switch' && c !== 'dimmer');
        if (after.length === 0) return; // Would leave 0, keep minimum 1
        setSelectedCategories(after);
        return;
      }
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      // Checking: when adding dimmer and linked, also add switch (dimmer needs switch addresses)
      if (category === 'dimmer' && isDimmerLinkedToSwitch && !selectedCategories.includes('switch')) {
        setSelectedCategories([...selectedCategories, 'switch', 'dimmer']);
        return;
      }
      toggleCategory(category);
    }
  };

  const isSingleCategory = availableCategories.length === 1;

  // Don't show content if project name dialog is open
  if (showProjectNameDialog) {
    return (
      <div className="card">
        <h3>{t('deviceSelectionTitle')}</h3>
        <div style={{ marginTop: 16, padding: 16, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 16 }}>
          <h4 style={{ marginTop: 0 }}>{t('saveProject')}</h4>
          <p style={{ marginBottom: 16 }}>
            {t('projectNameRequiredForDevices')}
          </p>
          <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t('projectNamePlaceholder')}
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveProjectName();
                if (e.key === 'Escape') {
                  setShowProjectNameDialog(false);
                  setStep('template');
                }
              }}
              autoFocus
            />
            <button onClick={handleSaveProjectName} disabled={!projectName.trim()}>
              {t('save')}
            </button>
            <button onClick={() => {
              setShowProjectNameDialog(false);
              setStep('template');
            }} className="secondary">
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex-between">
        <h3>{t('deviceSelectionTitle')}</h3>
        <span className="badge" style={{
          opacity: isSingleCategory ? 0.5 : 1,
          filter: isSingleCategory ? 'blur(1.5px)' : 'none'
        }}>
          {t('deviceSelectionHint')}
        </span>
      </div>
      <div className="grid grid-2">
        {availableCategories.map((category) => {
          const checked = selectedCategories.includes(category);
          const isDisabled = isSingleCategory;
          return (
            <label
              key={category}
              className="card"
              style={{ 
                borderColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
                cursor: isDisabled ? 'not-allowed' : 'pointer'
              }}
            >
              <div className="flex-between">
                <div>
                  <div className="label">{labels[category]}</div>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isDisabled}
                  onChange={() => {
                    if (!isDisabled) {
                      handleCategoryToggle(category);
                    }
                  }}
                  style={{
                    accentColor: 'var(--color-primary)',
                    width: '18px',
                    height: '18px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                    filter: isDisabled ? 'blur(1.5px)' : 'none'
                  }}
                />
              </div>
            </label>
          );
        })}
      </div>
      <div className="flex" style={{ marginTop: 10 }}>
        <button
          className="button primary"
          disabled={!canContinue}
          onClick={() => setStep('configure')}
        >
          {t('nextConfiguration')}
        </button>
      </div>
    </div>
  );
};

