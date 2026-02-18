import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  TeachByExampleTemplateConfig,
  TeachByExampleCategoryConfig,
  ExampleAddress,
  CategoryUsage,
  FixedMainGroupTemplate,
  TemplateConfig
} from '../types/common';
import { analyzeGroupPattern } from '../generator/patternAnalyzer';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../i18n/useTranslation';
import { translateObjectName, getStandardObjectName } from '../i18n/translations';
import { translateGroupNameForDisplay, getStandardExtraObjectName, translateExtraObjectNameForDisplay } from '../i18n/userInputTranslations';
import { uid } from '../utils/id';
import { FixedGroupAddressesSection } from './TemplateWizard';
import { buildDefaultTemplate as buildDefaultTemplateFn, useAppStore } from '../store';
import { DPTSelector } from '../ui/DPTSelector';

interface TeachByExampleWizardProps {
  initialConfig?: TeachByExampleTemplateConfig;
  onSave: (config: TeachByExampleTemplateConfig) => void;
  onCancel?: (config?: TeachByExampleTemplateConfig) => void; // Optional config parameter to save before canceling
  onReturnToOverview?: () => void; // Callback to return to overview (when editing existing template)
  startFromOverview?: boolean; // If true, always start from overview step even if all configured
  startCategory?: 'switching' | 'dimming' | 'shading' | 'hvac'; // If set, start wizard with this category
}

// Default object definitions per category
const SWITCHING_OBJECTS = [
  { name: 'aan / uit', dpt: 'DPT1.001', defaultEnabled: true },
  { name: 'aan / uit status', dpt: 'DPT1.002', defaultEnabled: true }
];

const DIMMING_OBJECTS = [
  { name: 'aan / uit', dpt: 'DPT1.001', defaultEnabled: true },
  { name: 'dimmen', dpt: 'DPT3.007', defaultEnabled: true },
  { name: 'waarde', dpt: 'DPT5.001', defaultEnabled: true },
  { name: 'aan / uit status', dpt: 'DPT1.011', defaultEnabled: true },
  { name: 'waarde status', dpt: 'DPT5.001', defaultEnabled: true }
];

const SHADING_OBJECTS = [
  { name: 'omhoog/omlaag', dpt: 'DPT1.008', defaultEnabled: true },
  { name: 'stop', dpt: 'DPT1.010', defaultEnabled: true },
  { name: 'positie', dpt: 'DPT5.001', defaultEnabled: true },
  { name: 'positie status', dpt: 'DPT5.001', defaultEnabled: true },
  { name: 'lamellen positie', dpt: 'DPT5.003', defaultEnabled: true },
  { name: 'lamellen positie status', dpt: 'DPT5.003', defaultEnabled: true }
];

const HVAC_OBJECTS = [
  { name: 'gemeten temperatuur 1', dpt: 'DPT9.001', defaultEnabled: true },
  { name: 'gemeten temperatuur 2', dpt: 'DPT9.001', defaultEnabled: true },
  { name: 'gewenste temperatuur', dpt: 'DPT9.001', defaultEnabled: true },
  { name: 'ingestelde temperatuur', dpt: 'DPT9.001', defaultEnabled: true },
  { name: 'modus', dpt: 'DPT20.102', defaultEnabled: true },
  { name: 'modus status', dpt: 'DPT20.102', defaultEnabled: true },
  { name: 'verschuiving gewenste temperatuur', dpt: 'DPT6.010', defaultEnabled: true },
  { name: 'verschuiving gewenste temperatuur status', dpt: 'DPT6.010', defaultEnabled: true },
  { name: 'melding verwarmen', dpt: 'DPT1.001', defaultEnabled: true },
  { name: 'melding koelen', dpt: 'DPT1.001', defaultEnabled: true },
  { name: 'ventiel sturing', dpt: 'DPT5.001', defaultEnabled: true, allowedDPTs: ['DPT5.001', 'DPT1.001'] },
  { name: 'ventiel sturing status', dpt: 'DPT5.001', defaultEnabled: true, allowedDPTs: ['DPT5.001', 'DPT1.001'] }
];

type CategoryKey = 'switching' | 'dimming' | 'shading' | 'hvac';

// Helper to normalize category config to array format
const normalizeCategoryConfig = (category: TeachByExampleCategoryConfig | TeachByExampleCategoryConfig[] | undefined): TeachByExampleCategoryConfig[] => {
  if (!category) return [];
  if (Array.isArray(category)) return category;
  return [category];
};

// Helper to get category config as array
const getCategoryConfigs = (config: TeachByExampleTemplateConfig, categoryKey: CategoryKey): TeachByExampleCategoryConfig[] => {
  const category = config.categories[categoryKey];
  return normalizeCategoryConfig(category);
};

// Helper to update category configs
const updateCategoryConfigs = (
  config: TeachByExampleTemplateConfig,
  categoryKey: CategoryKey,
  updater: (configs: TeachByExampleCategoryConfig[]) => TeachByExampleCategoryConfig[]
): TeachByExampleTemplateConfig => {
  const currentConfigs = getCategoryConfigs(config, categoryKey);
  const updatedConfigs = updater(currentConfigs);
  
  return {
    ...config,
    categories: {
      ...config.categories,
      [categoryKey]: updatedConfigs.length === 1 ? updatedConfigs[0] : updatedConfigs
    }
  };
};

export const TeachByExampleWizard = ({ initialConfig, onSave, onCancel, onReturnToOverview, startFromOverview = false, startCategory }: TeachByExampleWizardProps) => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  
  // Debug: log language changes
  useEffect(() => {
    console.log(`[TeachByExampleWizard] Language changed to: "${lang}"`);
  }, [lang]);
  
  // Helper function to translate group name if it matches a category name in any language
  const translateGroupName = useCallback((groupName: string | undefined, categoryKey: CategoryKey, groupIndex: number): string => {
    if (!groupName) {
      const categoryName = {
        switching: t('switch'),
        dimming: t('dimmer'),
        shading: t('blind'),
        hvac: t('hvac')
      }[categoryKey];
      const result = groupIndex === 0 ? categoryName : `${categoryName} ${groupIndex + 1}`;
      // Always return lowercase
      return result.toLowerCase();
    }
    
    const groupNameLower = groupName.toLowerCase();
    
    // Get category names in all languages
    const categoryNames = {
      switching: ['schakelen', 'switch', 'interruptor', 'interrupteur', 'schalter'],
      dimming: ['dimmen', 'dimmer', 'regulador', 'variateur', 'dimmer'],
      shading: ['jalouzie', 'rolluik', 'blind', 'persiana', 'store', 'jalousie', 'rollo', 'rolladen'],
      hvac: ['klimaat', 'hvac', 'climate', 'clima', 'climat', 'klima']
    }[categoryKey] || [];
    
    // Get current translated category name
    const currentCategoryName = {
      switching: t('switch'),
      dimming: t('dimmer'),
      shading: t('blind'),
      hvac: t('hvac')
    }[categoryKey];
    
    // Check if groupName matches any category name variant (with or without number)
    for (const catName of categoryNames) {
      const catNameLower = catName.toLowerCase();
      // Check exact match or with number
      if (groupNameLower === catNameLower || 
          groupNameLower === `${catNameLower} 1` ||
          groupNameLower === `${catNameLower} 2` ||
          groupNameLower === `${catNameLower} 3` ||
          groupNameLower.startsWith(`${catNameLower} `)) {
        // Extract number if present
        const match = groupNameLower.match(/^.+?(\s+\d+)?$/);
        if (match) {
          const numberPart = match[1] || '';
          const result = groupIndex === 0 ? currentCategoryName : `${currentCategoryName}${numberPart}`;
          // Always return lowercase
          return result.toLowerCase();
        } else {
          const result = groupIndex === 0 ? currentCategoryName : `${currentCategoryName} ${groupIndex + 1}`;
          // Always return lowercase
          return result.toLowerCase();
        }
      }
    }
    
    // If no match found, return the original group name with original capitalization
    return groupName;
  }, [t, lang]);
  const { template, setTemplate, currentTemplateId, currentProjectId, checkTemplateChanges, sortGroups } = useAppStore();
  
  // Helper function to get object name from template configuration based on main/middle and category
  const getObjectNameFromTemplate = useCallback((main: number, middle: number, categoryKey: CategoryKey): string | null => {
    if (!template?.devices) return null;
    
    let objects: any[] = [];
    
    // Get objects based on category
    if (categoryKey === 'switching' && template.devices.switch?.objects) {
      objects = template.devices.switch.objects;
    } else if (categoryKey === 'dimming' && template.devices.dimmer) {
      const dimmerConfig = Array.isArray(template.devices.dimmer) ? template.devices.dimmer[0] : template.devices.dimmer;
      if (dimmerConfig?.objects) {
        objects = dimmerConfig.objects;
      }
    } else if (categoryKey === 'shading' && template.devices.blind?.objects) {
      objects = template.devices.blind.objects;
    } else if (categoryKey === 'hvac' && template.devices.hvac?.objects) {
      objects = template.devices.hvac.objects;
    }
    
    // Find object with matching main and middle
    const foundObject = objects.find(obj => obj.main === main && obj.middle === middle);
    return foundObject?.name || null;
  }, [template]);
  
  // Debug: log initialConfig to see what we're getting
  console.log('TeachByExampleWizard - initialConfig:', initialConfig);
  console.log('TeachByExampleWizard - startFromOverview:', startFromOverview);
  
  const [config, setConfig] = useState<TeachByExampleTemplateConfig>(
    initialConfig || {
      templateName: '',
      categories: {}
    }
  );
  const [currentCategory, setCurrentCategory] = useState<CategoryKey | null>(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(0); // Track which group is being edited
  const isInWizardFlowRef = useRef(false); // Track if we're in the middle of the wizard flow to prevent resetting
  const cameFromFinalOverviewRef = useRef(false); // Track if we came from finalOverview to go back there after analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Track if we're currently analyzing
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null); // Track if user is editing group name
  const [editingObjectNames, setEditingObjectNames] = useState<Record<string, string>>({}); // Track editing object names: key = `${category}-${groupIndex}-${addressIndex}`
  
  // Reset editing state when category or group index changes
  useEffect(() => {
    console.log('[TBE-GN] Reset editingGroupName → null (category or group index changed)', { currentCategory, currentGroupIndex });
    setEditingGroupName(null);
    setEditingObjectNames({});
  }, [currentCategory, currentGroupIndex]);
  
  // Determine initial step based on config state
  const getInitialStep = (): 'overview' | 'usage' | 'example' | 'analysis' | 'finalAnalysis' | 'finalOverview' => {
    // If no initialConfig is provided, always start from overview (new configuration)
    if (!initialConfig) return 'overview';
    
    const configToCheck = initialConfig || config;
    if (!configToCheck) return 'overview';
    
    // Check if categories object is empty or doesn't exist (new template without any configuration)
    // An empty object {} is truthy, so we need to check Object.keys().length
    if (!configToCheck.categories || Object.keys(configToCheck.categories).length === 0) {
      return 'overview'; // Start from overview for new templates
    }
    
    // Check if all categories are fully configured
    const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as CategoryKey[];
    
    // First check if there are any configured categories at all
    const hasAnyConfiguredCategories = allCategories.some(cat => {
      const configs = getCategoryConfigs(configToCheck, cat);
      return configs.length > 0 && configs.some(cfg => {
        if (cfg.enabled !== undefined) return true;
        if (cat === 'dimming' && cfg.linkedToSwitching) return true;
        return cfg.pattern !== undefined;
      });
    });
    
    // If no categories are configured at all, start from overview
    if (!hasAnyConfiguredCategories) {
      return 'overview';
    }
    
    // Check if all categories are fully configured
    const allConfigured = allCategories.every(cat => {
      const configs = getCategoryConfigs(configToCheck, cat);
      if (configs.length === 0) return true;
      // Check if all groups in this category are fully configured
      return configs.every(cfg => {
        if (cfg.enabled === 'none') return true;
        if (cat === 'dimming' && cfg.linkedToSwitching) return true;
        return cfg.pattern !== undefined;
      });
    });
    
    // If all configured, show final overview
    if (allConfigured) return 'finalOverview';
    return 'overview';
  };
  
  // If startFromOverview is true, check if we should start from finalOverview
  const getInitialStepForStartFromOverview = (configToCheck: TeachByExampleTemplateConfig | undefined): 'overview' | 'finalOverview' => {
    if (!startFromOverview || !configToCheck) return 'overview';
    
    // Check if there's any category configuration (even if not all are configured)
    // Don't just check for template name, but also for actual category configuration
    if (configToCheck && configToCheck.categories && Object.keys(configToCheck.categories).length > 0) {
      // Check if at least one category has been configured (has pattern, enabled, or usage set)
      const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as CategoryKey[];
      const hasAnyConfiguration = allCategories.some(cat => {
        const configs = getCategoryConfigs(configToCheck, cat);
        if (configs.length === 0) return false;
        // Check if any group in this category has been configured (pattern, enabled, or usage)
        return configs.some(cfg => {
          // If enabled is set (even 'none'), it means the category has been processed
          if (cfg.enabled !== undefined) return true;
          if (cat === 'dimming' && cfg.linkedToSwitching) return true;
          // If pattern exists, it's been analyzed
          if (cfg.pattern !== undefined) return true;
          // If usage is set, it's been configured
          if (cfg.usage !== undefined) return true;
          return false;
        });
      });
      
      // If any category has been configured, show final overview (editable overview)
      if (hasAnyConfiguration) {
        return 'finalOverview';
      }
    }
    // If there's only a template name but no category configuration, show overview
    return 'overview';
  };
  
  // Calculate the correct initial step based on props
  const calculateInitialStep = (): 'overview' | 'usage' | 'example' | 'analysis' | 'finalAnalysis' | 'finalOverview' => {
    if (startFromOverview && initialConfig) {
      // Check if there's any category configuration - if so, show finalOverview
      // Don't just check for template name, but also for actual category configuration
      if (initialConfig.categories && Object.keys(initialConfig.categories).length > 0) {
        const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as CategoryKey[];
        const hasAnyConfiguration = allCategories.some(cat => {
          const configs = getCategoryConfigs(initialConfig, cat);
          if (configs.length === 0) return false;
          return configs.some(cfg => {
            if (cfg.enabled !== undefined) return true;
            if (cat === 'dimming' && cfg.linkedToSwitching) return true;
            if (cfg.pattern !== undefined) return true;
            if (cfg.usage !== undefined) return true;
            return false;
          });
        });
        
        if (hasAnyConfiguration) {
          console.log('TeachByExampleWizard: Setting initial step to finalOverview because hasAnyConfiguration');
          return 'finalOverview';
        }
      }
      
      // If there's only a template name but no category configuration, show overview
      console.log('TeachByExampleWizard: Setting initial step to overview (no category configuration found)');
      return 'overview';
    }
    
    if (!initialConfig) {
      console.log('TeachByExampleWizard: Setting initial step to overview (no initialConfig)');
      return 'overview';
    }
    
    const step = getInitialStep();
    console.log('TeachByExampleWizard: Setting initial step to', step, '(normal flow)');
    return step;
  };
  
  const [step, setStep] = useState<'overview' | 'usage' | 'example' | 'analysis' | 'finalAnalysis' | 'finalOverview'>(() => calculateInitialStep());
  
  // Force update step when initialConfig or startFromOverview changes
  // BUT: Don't reset step if we're actively going through the wizard
  useEffect(() => {
    // Never change step when we've just added an extra group – user must stay in edit screen to adjust main/middle/sub/increments (avoid duplicate addresses)
    if (justAddedExtraGroupRef.current) {
      justAddedExtraGroupRef.current = false;
      return;
    }
    // Don't reset if we're actively going through the wizard
    // This prevents the step from being reset when user clicks "Start Wizard"
    if (isInWizardFlowRef.current) {
      // Only allow reset if we're going back to overview or finalOverview (user finished or cancelled)
      if (step !== 'overview' && step !== 'finalOverview') {
        console.log('TeachByExampleWizard: Skipping step update - user is in wizard flow');
        return;
      }
    }
    
    // Also don't reset if we're in usage, example, or analysis steps (user is actively configuring)
    if (step === 'usage' || step === 'example' || step === 'analysis' || step === 'finalAnalysis') {
      console.log('TeachByExampleWizard: Skipping step update - user is in wizard step:', step);
      return;
    }
    
    // Don't reset if we're already in finalOverview - user has completed the wizard
    // This prevents the wizard from restarting after completing all categories
    if (step === 'finalOverview') {
      console.log('TeachByExampleWizard: Skipping step update - user is in finalOverview');
      return;
    }
    
    const newStep = calculateInitialStep();
    if (newStep !== step) {
      console.log('TeachByExampleWizard: Updating step from', step, 'to', newStep);
      setStep(newStep);
    }
  }, [startFromOverview, initialConfig, step]);
  
  // Safety check: If we're in overview but should be in finalOverview, redirect immediately
  // This must be a separate useEffect (always called) to avoid conditional hook calls
  // BUT: Don't redirect if user is actively going through the wizard
  useEffect(() => {
    // Don't redirect if user is actively in wizard flow
    if (isInWizardFlowRef.current && (step === 'usage' || step === 'example' || step === 'analysis')) {
      return;
    }
    
    if (step === 'overview' && startFromOverview && initialConfig && initialConfig.templateName && initialConfig.templateName.trim() !== '') {
      // Check if there's any category configuration
      if (initialConfig.categories && Object.keys(initialConfig.categories).length > 0) {
        const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as CategoryKey[];
        const hasAnyConfiguration = allCategories.some(cat => {
          const configs = getCategoryConfigs(initialConfig, cat);
          if (configs.length === 0) return false;
          return configs.some(cfg => {
            if (cfg.enabled !== undefined) return true;
            if (cat === 'dimming' && cfg.linkedToSwitching) return true;
            if (cfg.pattern !== undefined) return true;
            if (cfg.usage !== undefined) return true;
            return false;
          });
        });
        
        if (hasAnyConfiguration) {
          console.log('TeachByExampleWizard: Safety check - redirecting from overview to finalOverview');
          setStep('finalOverview');
        }
      }
    }
  }, [step, startFromOverview, initialConfig]);
  
  // If startCategory is provided, start the wizard with that category
  useEffect(() => {
    if (startCategory && (step === 'overview' || step === 'finalOverview')) {
      console.log('TeachByExampleWizard: Starting wizard with category:', startCategory);
      isInWizardFlowRef.current = true;
      // If we're editing from overview (startFromOverview is true), mark that we came from overview
      if (startFromOverview) {
        cameFromFinalOverviewRef.current = true;
      }
      setCurrentCategory(startCategory);
      
      // Automatically select "full" (volledig gebruiken) and go directly to example step
      // This replaces the usage selection screen
      const configs = getCategoryConfigs(config, startCategory);
      const categoryConfig = configs.length > 0 ? configs[0] : null;
      
      // If category is not configured or enabled is 'none', initialize with 'full'
      if (!categoryConfig || categoryConfig.enabled === 'none' || !categoryConfig.exampleAddresses || categoryConfig.exampleAddresses.length === 0) {
        // Initialize with default objects (same logic as handleUsageSelect('full'))
        let defaultObjects: typeof SWITCHING_OBJECTS;
        if (startCategory === 'switching') {
          defaultObjects = SWITCHING_OBJECTS;
        } else if (startCategory === 'dimming') {
          defaultObjects = DIMMING_OBJECTS;
        } else if (startCategory === 'shading') {
          defaultObjects = SHADING_OBJECTS;
        } else {
          defaultObjects = HVAC_OBJECTS;
        }
        
        const exampleAddresses = defaultObjects.map(obj => ({
          objectName: obj.name.toLowerCase(),
          main: 0,
          middle: 0,
          sub: 0,
          dpt: obj.dpt,
          enabled: obj.defaultEnabled,
          mainIncrement: 0,
          middleIncrement: 0,
          subIncrement: 0
        }));
        
        const categoryName = {
          switching: 'schakelen',
          dimming: 'dimmen',
          shading: 'jalouzie',
          hvac: 'klimaat'
        }[startCategory];
        
        const newCategoryConfig: TeachByExampleCategoryConfig = {
          id: categoryConfig?.id || uid(),
          groupName: categoryConfig?.groupName || categoryName,
          enabled: 'full',
          exampleAddresses
        };
        
        setConfig(prev => ({
          ...prev,
          categories: {
            ...prev.categories,
            [startCategory]: newCategoryConfig
          }
        }));
      }
      
      // Go directly to example step
      setStep('example');
    }
  }, [startCategory, step, startFromOverview, config]);
  
  // Initialize fixedAddresses from initialConfig if available
  const getInitialFixedAddresses = (): FixedMainGroupTemplate[] => {
    if (initialConfig && (initialConfig as any).fixedAddresses) {
      return (initialConfig as any).fixedAddresses;
    }
    // Also check template.devices.fixed if available
    if (template?.devices?.fixed?.mainGroups) {
      return template.devices.fixed.mainGroups;
    }
    const defaultTemplate = buildDefaultTemplateFn();
    return defaultTemplate.devices.fixed?.mainGroups || [];
  };
  
  const [fixedAddresses, setFixedAddresses] = useState<FixedMainGroupTemplate[]>(getInitialFixedAddresses());
  const isUpdatingFromCallback = useRef(false);
  
  // Sync fixedAddresses with template when it changes
  // Create a string representation of main group numbers for comparison
  const templateMainGroupsKey = useMemo(() => {
    const mainGroups = template?.devices?.fixed?.mainGroups;
    if (!mainGroups || mainGroups.length === 0) return '';
    return mainGroups.map(mg => `${mg.main}:${mg.id}`).sort().join('|');
  }, [template?.devices?.fixed?.mainGroups]);
  
  useEffect(() => {
    // Skip sync if we just updated from the callback
    if (isUpdatingFromCallback.current) {
      isUpdatingFromCallback.current = false;
      console.log('[TeachByExampleWizard] Skipping sync - just updated from callback');
      return;
    }
    
    const templateMainGroups = template?.devices?.fixed?.mainGroups;
    const templateMainGroupsLength = templateMainGroups?.length || 0;
    const currentFixedAddressesLength = fixedAddresses.length;
    
    console.log('[TeachByExampleWizard] Syncing fixedAddresses:', {
      templateMainGroupsLength,
      currentFixedAddressesLength,
      templateMainGroupsKey
    });
    
    // Always sync if template has mainGroups and they differ from current state
    if (templateMainGroups && templateMainGroupsLength > 0) {
      // Check if they're actually different (by comparing the key which includes IDs)
      const currentMainGroupsKey = fixedAddresses.map(mg => `${mg.main}:${mg.id}`).sort().join('|');
      
      if (templateMainGroupsKey !== currentMainGroupsKey || templateMainGroupsLength !== currentFixedAddressesLength) {
        console.log('[TeachByExampleWizard] Syncing fixedAddresses from template', {
          templateKey: templateMainGroupsKey,
          currentKey: currentMainGroupsKey,
          templateLength: templateMainGroupsLength,
          currentLength: currentFixedAddressesLength
        });
        
        // Log all middle group names before sync
        templateMainGroups.forEach(mg => {
          mg.middleGroups?.forEach(mgInner => {
            console.log('[TeachByExampleWizard] useEffect sync: About to set - mainGroup', mg.main, 'middleGroup', mgInner.middle, 'name =', mgInner.name);
          });
        });
        
        setFixedAddresses(templateMainGroups);
        console.log('[TeachByExampleWizard] useEffect: setFixedAddresses called from sync');
      } else {
        console.log('[TeachByExampleWizard] fixedAddresses already in sync');
      }
    } else if (initialConfig && (initialConfig as any).fixedAddresses && (initialConfig as any).fixedAddresses.length > 0) {
      setFixedAddresses((initialConfig as any).fixedAddresses);
    } else if (fixedAddresses.length === 0) {
      // If no fixed addresses exist, initialize with default
      const defaultFixed = buildDefaultTemplateFn().devices.fixed?.mainGroups || [];
      if (defaultFixed.length > 0) {
        setFixedAddresses(defaultFixed);
      }
    }
  }, [templateMainGroupsKey, initialConfig, fixedAddresses.length]);
  
  // Debug: log when fixedAddresses changes
  useEffect(() => {
    console.log('[TeachByExampleWizard] fixedAddresses state changed:', fixedAddresses.length, fixedAddresses.map(mg => mg.main));
  }, [fixedAddresses]);
  
  // Debug: log when config group names change (detect overwrites)
  const configGroupNamesRef = useRef<string>('');
  useEffect(() => {
    const snip = (c: typeof config) => {
      if (!c?.categories) return '{}';
      const o: Record<string, string[]> = {};
      (['switching', 'dimming', 'shading', 'hvac'] as const).forEach(k => {
        const v = (c.categories as any)[k];
        const arr = Array.isArray(v) ? v : (v ? [v] : []);
        o[k] = arr.map((x: any) => x?.groupName ?? '').filter(Boolean);
      });
      return JSON.stringify(o);
    };
    const next = snip(config);
    if (configGroupNamesRef.current && configGroupNamesRef.current !== next) {
      console.log('[TBE-GN] config group names CHANGED', { prev: configGroupNamesRef.current, next });
    }
    configGroupNamesRef.current = next;
  }, [config]);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string>('');
  
  // Helper function to convert TeachByExample config to TemplateConfig
  // We'll use the convertTeachByExampleToTemplate from TemplateWizard, but for now just update the template
  const convertConfigToTemplate = useCallback((config: TeachByExampleTemplateConfig, existingTemplate?: TemplateConfig): TemplateConfig => {
    const currentTemplate = existingTemplate || template;
    if (!currentTemplate) return template || {} as TemplateConfig;
    
    // Create updated template with teachByExampleConfig
    const updated: TemplateConfig = {
      ...currentTemplate,
      teachByExampleConfig: config,
      // Preserve fixed addresses if present
      devices: {
        ...currentTemplate.devices,
        fixed: fixedAddresses.length > 0 ? { mainGroups: fixedAddresses } : currentTemplate.devices.fixed
      }
    };
    
    return updated;
  }, [template, fixedAddresses]);
  
  // Detect changes and update templateHasChanges flag
  // Use a ref to prevent the effect from running when we update the template ourselves
  const isInternalUpdateRef = useRef(false);
  const skipSyncRef = useRef(false); // Skip overwriting config when we just saved (group name, add group)
  const justAddedExtraGroupRef = useRef(false); // Stay in example step after add; user must adjust main/middle/sub/increments
  const lastConfigRef = useRef<string>('');
  const lastFixedAddressesRef = useRef<string>('');
  const lastTemplateNameRef = useRef<string>('');

  // Save template name immediately when it changes (even if other fields haven't changed)
  // BUT only if we're not in the overview step (to prevent screen switching)
  // AND don't save if we're actively in the wizard flow (usage, example, analysis)
  // AND only for existing templates - new templates should not auto-save
  // The template name will be saved when the user completes the wizard for new templates
  useEffect(() => {
    // Don't save template name if we're still in overview step - wait until user starts wizard
    if (step === 'overview') {
      return;
    }
    
    // Don't save if we're actively going through the wizard flow
    // This prevents the template update from triggering step resets
    // The template name will be saved when the wizard is completed
    if (step === 'usage' || step === 'example' || step === 'analysis' || step === 'finalAnalysis') {
      // Just update the ref to track the name, but don't save to template yet
      if (config.templateName && config.templateName.trim() !== '') {
        lastTemplateNameRef.current = config.templateName;
      }
      return;
    }
    
    // Only auto-save template name for existing templates (not new ones)
    // Check if it's an existing template by seeing if initialConfig has a templateName
    const isExistingTemplate = Boolean(
      initialConfig?.templateName && 
      initialConfig.templateName.trim() !== '' &&
      initialConfig.categories &&
      Object.keys(initialConfig.categories).length > 0
    );
    
    // Don't auto-save new templates - only save when wizard is completed or user explicitly saves
    if (!isExistingTemplate) {
      return;
    }
    
    if (!config.templateName || config.templateName.trim() === '') {
      return;
    }
    
    // Only save if template name actually changed
    if (config.templateName === lastTemplateNameRef.current) {
      return;
    }
    
    lastTemplateNameRef.current = config.templateName;
    
    // Convert current config to template and save immediately
    const currentTemplate = convertConfigToTemplate(config, template);
    
    // Mark as internal update to prevent loop
    isInternalUpdateRef.current = true;
    
    // Update the template in store immediately when template name changes
    setTemplate(currentTemplate);
    
    // Only check for changes for existing templates (not new ones)
    // New templates will have templateHasChanges set based on completion status
    // Note: isExistingTemplate was already declared above, reuse it
    if (isExistingTemplate) {
      // Check for changes and update templateHasChanges flag for existing templates
      checkTemplateChanges(currentTemplate);
    } else {
      // For new templates, only mark as changed when fully configured
      // This will be handled by the other useEffect
      useAppStore.setState({ templateHasChanges: false });
    }
    
    // Reset internal update flag after a short delay
    setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.templateName, step, initialConfig]);

  useEffect(() => {
    console.log('[TBE-GN] Config→template effect ran:', { step, hasInitial: !!initialConfig, hasTemplate: !!template });
    // Skip change detection on initial mount or when initialConfig is not set yet
    if (!initialConfig || !template) return;
    
    // Skip if this is an internal update (to prevent infinite loops)
    if (isInternalUpdateRef.current) {
      console.log('[TBE-GN] Config→template SKIP (isInternalUpdateRef)');
      return;
    }
    
    // Don't update template if we're actively in the wizard flow
    // This prevents the template update from triggering step resets
    // Only allow updates in finalOverview for existing templates (when editing)
    if (step === 'usage' || step === 'example' || step === 'analysis' || step === 'finalAnalysis') {
      console.log('[TBE-GN] Config→template SKIP (wizard step)');
      return;
    }
    
    // Only auto-save for existing templates (not new ones)
    // Check if it's an existing template by seeing if initialConfig has a templateName
    const isExistingTemplate = Boolean(
      initialConfig?.templateName && 
      initialConfig.templateName.trim() !== '' &&
      initialConfig.categories &&
      Object.keys(initialConfig.categories).length > 0
    );
    
    // Don't auto-save new templates - only save when wizard is completed or user explicitly saves
    if (!isExistingTemplate) {
      // For new templates, check if fully configured before setting templateHasChanges
      const fullyConfigured = isConfigFullyConfigured();
      const hasTemplateName = config.templateName && config.templateName.trim() !== '';
      // Only set to false if NOT fully configured
      if (!fullyConfigured || !hasTemplateName) {
        useAppStore.setState({ templateHasChanges: false });
      }
      // If fully configured, don't set to false - let other logic handle it
      return;
    }
    
    // Serialize current state to compare
    const currentConfigStr = JSON.stringify(config);
    const currentFixedAddressesStr = JSON.stringify(fixedAddresses);
    
    // Only update if something actually changed
    if (currentConfigStr === lastConfigRef.current && currentFixedAddressesStr === lastFixedAddressesRef.current) {
      console.log('[TBE-GN] Config→template SKIP (no change)');
      return;
    }
    
    // Update refs
    lastConfigRef.current = currentConfigStr;
    lastFixedAddressesRef.current = currentFixedAddressesStr;
    
    console.log('[TBE-GN] Config→template CONVERTING and setTemplate', {
      configGroupNames: (() => {
        const c = config?.categories;
        if (!c) return {};
        return Object.fromEntries(
          (['switching', 'dimming', 'shading', 'hvac'] as const).map(k => {
            const v = c[k];
            const arr = Array.isArray(v) ? v : (v ? [v] : []);
            return [k, arr.map((x: any) => x?.groupName).filter(Boolean)];
          })
        );
      })(),
      fixedMainNames: fixedAddresses?.map(mg => mg.name) ?? []
    });
    // Convert current config to template
    const currentTemplate = convertConfigToTemplate(config, template);
    
    // Mark as internal update to prevent loop
    isInternalUpdateRef.current = true;
    
    // Update the template in store so change detection works
    // This will trigger the red border and save button when there are changes
    setTemplate(currentTemplate);
    
    // Check for changes and update templateHasChanges flag
    // Only set changes for existing templates (new templates will be marked as changed when completed)
    checkTemplateChanges(currentTemplate);
    
    // For new templates, set templateHasChanges based on whether template is fully configured
    // This is needed because setTemplate triggers checkTemplateChanges which might set it incorrectly
    if (!isExistingTemplate) {
      const fullyConfigured = isConfigFullyConfigured();
      
      // Only mark as changed if fully configured (template name not required)
      // Set immediately (not in setTimeout) so it takes effect
      if (fullyConfigured) {
        useAppStore.setState({ templateHasChanges: true });
      } else {
        setTimeout(() => {
          useAppStore.setState({ templateHasChanges: false });
        }, 50);
      }
    }
    
    // Reset internal update flag after a short delay
    setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 100);
  }, [config, fixedAddresses, checkTemplateChanges, convertConfigToTemplate, template, initialConfig, setTemplate, step]);

  // Helper to check if config is fully configured (same logic as in TemplateWizard)
  const isConfigFullyConfigured = useCallback((): boolean => {
    if (!config || !config.categories) return false;
    
    const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
    return allCategories.every(cat => {
      const categoryConfig = config.categories[cat];
      if (!categoryConfig || (Array.isArray(categoryConfig) && categoryConfig.length === 0)) {
        return true; // Category not used
      }
      
      const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
      return configs.every(cfg => {
        if (cfg.enabled === 'none') return true;
        if (cat === 'dimming' && cfg.linkedToSwitching) return true;
        return cfg.pattern !== undefined;
      });
    });
  }, [config]);

  // Update templateHasChanges flag based on configuration status
  // For new templates: only mark as changed when fully configured
  // For existing templates: mark as changed when there are actual changes
  useEffect(() => {
    // Skip if this is an internal update (to prevent infinite loops)
    if (isInternalUpdateRef.current) {
      return;
    }
    
    if (!template) return;
    
    // Check if it's a new template (no initialConfig with templateName)
    const isNewTemplate = !(
      initialConfig?.templateName && 
      initialConfig.templateName.trim() !== '' &&
      initialConfig.categories &&
      Object.keys(initialConfig.categories).length > 0
    );
    
    if (isNewTemplate) {
      // For new templates, only mark as changed when configuration is fully completed
      const fullyConfigured = isConfigFullyConfigured();
      
      // Template name is not required - if all categories are fully configured, template is ready to save
      // Template name can be added when saving
      const shouldMarkAsChanged = fullyConfigured;
      
      // Explicitly set templateHasChanges based on whether template is fully configured
      // If fully configured, mark as changed so user can save it
      // If not fully configured, don't mark as changed to prevent red border during configuration
      useAppStore.setState({ templateHasChanges: shouldMarkAsChanged });
    }
    // For existing templates, change detection is handled in the other useEffect above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, isConfigFullyConfigured, initialConfig, step]);
  
  // Also check when we're on finalOverview step and template is fully configured
  useEffect(() => {
    if (step === 'finalOverview' && template && !currentTemplateId) {
      const fullyConfigured = isConfigFullyConfigured();
      
      if (fullyConfigured) {
        useAppStore.setState({ templateHasChanges: true });
      }
    }
  }, [step, template, currentTemplateId, isConfigFullyConfigured, config]);

  // Initialize templateHasChanges based on template configuration status
  useEffect(() => {
    if (!template) {
      useAppStore.setState({ templateHasChanges: false });
      return;
    }
    
    if (!initialConfig) {
      // If there's no initialConfig, check if current config is fully configured
      const fullyConfigured = isConfigFullyConfigured();
      useAppStore.setState({ templateHasChanges: fullyConfigured });
      return;
    }
    
    // Check if it's a new template
    const isNewTemplate = !(
      initialConfig?.templateName && 
      initialConfig.templateName.trim() !== '' &&
      initialConfig.categories &&
      Object.keys(initialConfig.categories).length > 0
    );
    
    if (isNewTemplate) {
      // For new templates, check if fully configured (template name not required)
      const fullyConfigured = isConfigFullyConfigured();
      useAppStore.setState({ templateHasChanges: fullyConfigured });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Sync config with initialConfig when it changes (e.g., when loading a different template)
  useEffect(() => {
    console.log('[TBE-GN] Sync effect (initialConfig):', { step, skipSync: skipSyncRef.current, isInternal: isInternalUpdateRef.current });
    // NEVER overwrite config when user is in edit screen (example step) – group names (incl. extra groups) must persist
    if (step === 'usage' || step === 'example' || step === 'analysis' || step === 'finalAnalysis') {
      console.log('[TBE-GN] Sync effect SKIP (wizard step – keep config)');
      return;
    }
    // Don't overwrite config when we've just updated the template ourselves (group name blur, add group).
    // Otherwise we'd overwrite with stale initialConfig and names would "jump back" / new groups disappear.
    if (skipSyncRef.current || isInternalUpdateRef.current) {
      console.log('[TBE-GN] Sync effect SKIP (skipSync or isInternal)');
      skipSyncRef.current = false;
      return;
    }
    
    // Don't reset if we're actively going through the wizard
    if (isInWizardFlowRef.current && (step === 'usage' || step === 'example' || step === 'analysis')) {
      console.log('[TBE-GN] Sync effect SKIP (in wizard flow)');
      return;
    }
    
    // Don't reset if we're already in finalOverview - user has completed the wizard
    // This prevents the wizard from restarting after completing all categories
    if (step === 'finalOverview') {
      console.log('[TBE-GN] Sync effect SKIP (finalOverview)');
      return;
    }
    
    if (initialConfig) {
      console.log('[TBE-GN] Sync effect OVERWRITING config with initialConfig', {
        groupNames: (() => {
          const c = (initialConfig as any).categories;
          if (!c) return {};
          return Object.fromEntries(
            (['switching', 'dimming', 'shading', 'hvac'] as const).map(k => {
              const v = c[k];
              const arr = Array.isArray(v) ? v : (v ? [v] : []);
              return [k, arr.map((x: any) => x?.groupName).filter(Boolean)];
            })
          );
        })()
      });
      setConfig(initialConfig);
      
      // If startFromOverview is true, don't update step here - let the other useEffect handle it
      if (!startFromOverview) {
        // Use the normal flow
        const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as CategoryKey[];
        const allConfigured = allCategories.every(cat => {
          const configs = getCategoryConfigs(initialConfig, cat);
          if (configs.length === 0) return true;
          // Check if all groups in this category are fully configured
          return configs.every(cfg => {
            if (cfg.enabled === 'none') return true;
            if (cat === 'dimming' && cfg.linkedToSwitching) return true;
            return cfg.pattern !== undefined;
          });
        });
        
        const newStep = allConfigured ? 'finalOverview' : 'overview';
        if (newStep !== step) {
          setStep(newStep);
        }
      }
      
      // Update fixedAddresses if present in initialConfig
      if ((initialConfig as any).fixedAddresses) {
        setFixedAddresses((initialConfig as any).fixedAddresses);
      }
      
      // If dimming is linked to switching, copy pattern from switching
      const dimmingConfigs = getCategoryConfigs(initialConfig, 'dimming');
      const switchingConfigs = getCategoryConfigs(initialConfig, 'switching');
      if (dimmingConfigs.length > 0 && switchingConfigs.length > 0) {
        const switchingPattern = switchingConfigs[0].pattern;
        dimmingConfigs.forEach((dimmingCfg, idx) => {
          if (dimmingCfg.linkedToSwitching && switchingPattern && !dimmingCfg.pattern) {
            setConfig(prev => {
              const updatedConfigs = getCategoryConfigs(prev, 'dimming');
              if (updatedConfigs.length > idx) {
                updatedConfigs[idx] = { ...updatedConfigs[idx], pattern: switchingPattern };
                return {
                  ...prev,
                  categories: {
                    ...prev.categories,
                    dimming: updatedConfigs.length === 1 ? updatedConfigs[0] : updatedConfigs
                  }
                };
              }
              return prev;
            });
          }
        });
      }
    }
  }, [initialConfig, startFromOverview, step, getInitialStepForStartFromOverview]);
  
  // Ensure fixedAddresses is initialized when entering finalOverview step
  useEffect(() => {
    if (step === 'finalOverview' && fixedAddresses.length === 0) {
      const defaultTemplate = buildDefaultTemplateFn();
      const defaultFixed = defaultTemplate.devices.fixed?.mainGroups || [];
      if (defaultFixed.length > 0) {
        setFixedAddresses(defaultFixed);
      }
    }
  }, [step, fixedAddresses.length]);
  
  // Check if all categories are fully configured (have patterns analyzed)
  const areAllCategoriesFullyConfigured = (): boolean => {
    const allCategories = getAllCategories();
    return allCategories.every(cat => {
      const configs = getCategoryConfigs(config, cat);
      if (configs.length === 0) return true; // Not using this category is fine
      
      // Check if all groups in this category are fully configured
      return configs.every(cfg => {
        if (cfg.enabled === 'none') return true; // Not using this group is fine
        if (cat === 'dimming' && cfg.linkedToSwitching) {
          // For linked dimming, check if switching has a pattern
          const switchingConfigs = getCategoryConfigs(config, 'switching');
          const switchingCategory = switchingConfigs.length > 0 ? switchingConfigs[0] : null;
          return switchingCategory?.pattern !== undefined;
        }
        // Group needs to have pattern analyzed
        return cfg.pattern !== undefined;
      });
    });
  };

  const updateCategory = (key: CategoryKey, updates: Partial<TeachByExampleCategoryConfig>, groupIndex?: number) => {
    setConfig(prev => {
      const configs = getCategoryConfigs(prev, key);
      
      // If groupIndex is provided, update specific group
      if (groupIndex !== undefined && configs.length > groupIndex) {
        const updatedConfigs = [...configs];
        updatedConfigs[groupIndex] = {
          ...updatedConfigs[groupIndex],
          ...updates
        };
        return {
          ...prev,
          categories: {
            ...prev.categories,
            [key]: updatedConfigs.length === 1 ? updatedConfigs[0] : updatedConfigs
          }
        };
      }
      
      // Otherwise, update first group (backwards compatibility)
      if (configs.length === 0) {
        // Create new config
        return {
          ...prev,
          categories: {
            ...prev.categories,
            [key]: updates as TeachByExampleCategoryConfig
          }
        };
      }
      
      const updatedConfigs = [...configs];
      updatedConfigs[0] = {
        ...updatedConfigs[0],
        ...updates
      };
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [key]: updatedConfigs.length === 1 ? updatedConfigs[0] : updatedConfigs
        }
      };
    });
  };

  const handleAddExtraGroup = () => {
    if (!currentCategory) return;
    
    const configs = getCategoryConfigs(config, currentCategory);
    if (configs.length === 0) return;
    
    const baseName = currentCategory === 'switching' ? t('switch') : 
                     currentCategory === 'dimming' ? t('dimmer') : 
                     currentCategory === 'shading' ? t('blind') : 
                     t('hvac');
    
    const first = configs[0];
    const hasExtraObjects = first.extraObjects && first.extraObjects.length > 0;
    
    let newGroup: TeachByExampleCategoryConfig;
    
    if (hasExtraObjects && first.exampleAddresses && first.exampleAddresses.length > 0) {
      // Copy first group completely: exampleAddresses, extraObjects, main/middle/sub, increments, pattern
      const exampleAddresses: ExampleAddress[] = first.exampleAddresses.map(addr => ({ ...addr }));
      const extraObjects = (first.extraObjects ?? []).map(obj => ({ ...obj, id: uid() }));
      const pattern = first.pattern ? {
        ...first.pattern,
        middleGroups: first.pattern.middleGroups ? [...first.pattern.middleGroups] : undefined,
        extraMainGroups: first.pattern.extraMainGroups
          ? first.pattern.extraMainGroups.map(x => ({ main: x.main, middle: x.middle }))
          : undefined
      } : undefined;
      newGroup = {
        id: uid(),
        groupName: `${baseName} ${configs.length + 1}`.toLowerCase(),
        enabled: 'full',
        exampleAddresses,
        extraObjects,
        pattern,
        linkedToSwitching: first.linkedToSwitching,
        unusedName: first.unusedName
      };
    } else {
      // No extra objects in first group: create new group with default objects
      let defaultObjects: typeof SWITCHING_OBJECTS;
      if (currentCategory === 'switching') {
        defaultObjects = SWITCHING_OBJECTS;
      } else if (currentCategory === 'dimming') {
        defaultObjects = DIMMING_OBJECTS;
      } else if (currentCategory === 'shading') {
        defaultObjects = SHADING_OBJECTS;
      } else {
        defaultObjects = HVAC_OBJECTS;
      }
      newGroup = {
        id: uid(),
        groupName: `${baseName} ${configs.length + 1}`.toLowerCase(),
        enabled: 'full',
        exampleAddresses: defaultObjects.map(obj => ({
          objectName: obj.name.toLowerCase(),
          main: 0,
          middle: 0,
          sub: 0,
          dpt: obj.dpt,
          enabled: obj.defaultEnabled,
          mainIncrement: 0,
          middleIncrement: 0,
          subIncrement: 0
        }))
      };
    }
    
    const updatedConfigs = [...configs, newGroup];
    const newIndex = updatedConfigs.length - 1;
    const updatedConfig: TeachByExampleTemplateConfig = {
      ...config,
      categories: {
        ...config.categories,
        [currentCategory]: updatedConfigs.length === 1 ? updatedConfigs[0] : updatedConfigs
      }
    };
    
    justAddedExtraGroupRef.current = true;
    isInWizardFlowRef.current = true;
    skipSyncRef.current = true;
    setConfig(updatedConfig);
    setCurrentGroupIndex(newIndex);
    setStep('example');
    if (template) {
      const currentTemplate = convertConfigToTemplate(updatedConfig, template);
      setTemplate(currentTemplate);
    }
  };

  const handleDeleteGroup = () => {
    if (!currentCategory) return;
    
    const configs = getCategoryConfigs(config, currentCategory);
    if (configs.length <= 1) {
      alert('Je moet ten minste één groep behouden. Als je deze groep niet wilt gebruiken, selecteer "Niet gebruiken" in de usage step.');
      return;
    }
    
    const groupName = translateGroupName(configs[currentGroupIndex]?.groupName, currentCategory, currentGroupIndex);
    if (!confirm(t('confirmDeleteGroup').replace('{name}', groupName))) {
      return;
    }
    
    setConfig(prev => {
      const updatedConfigs = configs.filter((_, idx) => idx !== currentGroupIndex);
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [currentCategory]: updatedConfigs.length === 1 ? updatedConfigs[0] : updatedConfigs
        }
      };
    });
    
    // Set to first group if current group was deleted
    if (currentGroupIndex >= configs.length - 1) {
      setCurrentGroupIndex(0);
    }
  };

  // Effect to ensure dimming exampleAddresses are initialized when linkedToSwitching is true
  useEffect(() => {
    if (step === 'example' && currentCategory === 'dimming') {
      const dimmingCategory = config.categories.dimming;
      if (dimmingCategory && 
          dimmingCategory.linkedToSwitching === true && 
          (!dimmingCategory.exampleAddresses || dimmingCategory.exampleAddresses.length === 0)) {
        const switchingCategory = config.categories.switching;
        let exampleAddresses: ExampleAddress[] = [];
        
        if (switchingCategory && switchingCategory.exampleAddresses.length > 0) {
          // Copy addresses from switching
          exampleAddresses = switchingCategory.exampleAddresses.map(addr => ({ ...addr }));
        } else {
          // Initialize with dimming objects
          exampleAddresses = DIMMING_OBJECTS.map(obj => ({
            objectName: obj.name.toLowerCase(),
            main: 0,
            middle: 0,
            sub: 0,
            dpt: obj.dpt,
            enabled: obj.defaultEnabled,
            mainIncrement: 0,
            middleIncrement: 0,
            subIncrement: 0
          }));
        }
        
        updateCategory('dimming', { exampleAddresses });
      }
    }
  }, [step, currentCategory, config.categories.dimming?.linkedToSwitching, config.categories.switching?.exampleAddresses]);

  // Effect to reset subIncrement from +1 to 0 when all middle groups are the same
  // Note: This does NOT apply to HVAC or switching - they can use +1 even if all middle groups are the same
  useEffect(() => {
    if (step === 'example' && currentCategory && (currentCategory === 'switching' || currentCategory === 'dimming' || currentCategory === 'shading' || currentCategory === 'hvac')) {
      // Skip this effect for HVAC and switching - they can use +1 even if all middle groups are the same
      if (currentCategory === 'hvac' || currentCategory === 'switching') return;
      
      const configs = getCategoryConfigs(config, currentCategory);
      const category = configs[currentGroupIndex] || configs[0];
      if (!category || !category.exampleAddresses || category.exampleAddresses.length === 0) return;

      // Check if all middle groups are the same
      const middleGroups = category.exampleAddresses.map(addr => addr.middle);
      const uniqueMiddleGroups = [...new Set(middleGroups)];
      const allMiddleGroupsSame = uniqueMiddleGroups.length === 1;

      if (allMiddleGroupsSame) {
        // Reset any +1 subIncrement values to 0
        const hasSubIncrement1 = category.exampleAddresses.some(addr => (addr.subIncrement ?? 0) === 1);
        if (hasSubIncrement1) {
          const updatedAddresses = category.exampleAddresses.map(addr => ({
            ...addr,
            subIncrement: (addr.subIncrement ?? 0) === 1 ? 0 : addr.subIncrement
          }));
          updateCategory(currentCategory, { exampleAddresses: updatedAddresses }, currentGroupIndex);
        }

        // Also check and reset extra objects
        if (category.extraObjects && category.extraObjects.length > 0) {
          const allMiddleGroups = [
            ...category.exampleAddresses.map(addr => addr.middle),
            ...category.extraObjects.map(obj => obj.middle)
          ];
          const uniqueAllMiddleGroups = [...new Set(allMiddleGroups)];
          const allMiddleGroupsSameIncludingExtra = uniqueAllMiddleGroups.length === 1;

          if (allMiddleGroupsSameIncludingExtra) {
            const hasExtraSubIncrement1 = category.extraObjects.some(obj => (obj.subIncrement ?? 0) === 1);
            if (hasExtraSubIncrement1) {
              const updatedExtraObjects = category.extraObjects.map(obj => ({
                ...obj,
                subIncrement: (obj.subIncrement ?? 0) === 1 ? 0 : obj.subIncrement
              }));
              updateCategory(currentCategory, { extraObjects: updatedExtraObjects }, currentGroupIndex);
            }
          }
        }
      }
    }
  }, [step, currentCategory, currentGroupIndex, config.categories, updateCategory]);

  // Helper to get all categories in order
  const getAllCategories = (): CategoryKey[] => {
    return ['switching', 'dimming', 'shading', 'hvac'];
  };

  // Helper to get next category that needs configuration
  // Returns the next category that either:
  // 1. Hasn't been configured yet (no enabled set)
  // 2. Is enabled but doesn't have a pattern yet
  const getPreviousCategory = (current: CategoryKey | null): CategoryKey | null => {
    if (!current) return null;
    const categories: CategoryKey[] = ['switching', 'dimming', 'shading', 'hvac'];
    const currentIndex = categories.indexOf(current);
    if (currentIndex <= 0) return null;
    return categories[currentIndex - 1];
  };

  const getNextCategory = (current: CategoryKey | null): CategoryKey | null => {
    const allCategories = getAllCategories();
    
    // If no current category, return first category that needs configuration
    if (!current) {
      for (const cat of allCategories) {
        const configs = getCategoryConfigs(config, cat);
        // If no configs at all, this category hasn't been started yet
        if (configs.length === 0) return cat;
        
        // Check if category needs configuration (not configured, or enabled but no pattern)
        const needsConfig = configs.some(cfg => {
          // If enabled is not set, category hasn't been configured yet
          if (cfg.enabled === undefined) return true;
          // If enabled is 'none', category is done (skip it)
          if (cfg.enabled === 'none') return false;
          // If dimming is linked to switching, check if switching has pattern
          if (cat === 'dimming' && cfg.linkedToSwitching) {
            const switchingConfigs = getCategoryConfigs(config, 'switching');
            // If switching has pattern, dimming is done (linked dimming doesn't need its own pattern)
            return !switchingConfigs.some(sc => sc.pattern !== undefined);
          }
          // If enabled but no pattern, needs configuration
          return cfg.pattern === undefined;
        });
        if (needsConfig) return cat;
      }
      return null; // All categories are configured
    }
    
    // Find next category that needs configuration
    const currentIndex = allCategories.indexOf(current);
    if (currentIndex === -1) return null;
    
    // Start from next category
    for (let i = currentIndex + 1; i < allCategories.length; i++) {
      const cat = allCategories[i];
      const configs = getCategoryConfigs(config, cat);
      // If no configs at all, this category hasn't been started yet
      if (configs.length === 0) return cat;
      
      // Check if category needs configuration
      const needsConfig = configs.some(cfg => {
        // If enabled is not set, category hasn't been configured yet
        if (cfg.enabled === undefined) return true;
        // If enabled is 'none', category is done (skip it)
        if (cfg.enabled === 'none') return false;
        // If dimming is linked to switching, check if switching has pattern
        if (cat === 'dimming' && cfg.linkedToSwitching) {
          const switchingConfigs = getCategoryConfigs(config, 'switching');
          // If switching has pattern, dimming is done
          return !switchingConfigs.some(sc => sc.pattern !== undefined);
        }
        // If enabled but no pattern, needs configuration
        return cfg.pattern === undefined;
      });
      if (needsConfig) return cat;
    }
    
    return null; // No more categories need configuration
  };

  // Helper to check if category is configured
  const isCategoryConfigured = (key: CategoryKey): boolean => {
    const configs = getCategoryConfigs(config, key);
    if (configs.length === 0) return false;
    // Category is configured if at least one group has enabled set (even if 'none')
    return configs.some(cfg => cfg.enabled !== undefined);
  };

  // Helper to check if all categories are configured
  const areAllCategoriesConfigured = (): boolean => {
    const allCategories = getAllCategories();
    return allCategories.every(cat => isCategoryConfigured(cat));
  };

  // Helper to get configured categories that need example addresses
  const getCategoriesNeedingExamples = (): CategoryKey[] => {
    return getAllCategories().filter(cat => {
      const configs = getCategoryConfigs(config, cat);
      if (configs.length === 0) return false;
      // Check if any group needs examples (not configured or no pattern)
      return configs.some(cfg => {
        if (cfg.enabled === 'none') return false;
        if (cat === 'dimming' && cfg.linkedToSwitching) return false;
        // Check if pattern is analyzed (meaning example addresses are filled and analyzed)
        return !cfg.pattern;
      });
    });
  };

  const handleCategoryClick = (key: CategoryKey) => {
    isInWizardFlowRef.current = true;
    setCurrentCategory(key);
    
    // Automatically select "full" (volledig gebruiken) and go directly to example step
    const configs = getCategoryConfigs(config, key);
    const categoryConfig = configs.length > 0 ? configs[0] : null;
    
    // If category is not configured or enabled is 'none', initialize with 'full'
    if (!categoryConfig || categoryConfig.enabled === 'none' || !categoryConfig.exampleAddresses || categoryConfig.exampleAddresses.length === 0) {
      // Initialize with default objects (same logic as handleUsageSelect('full'))
      let defaultObjects: typeof SWITCHING_OBJECTS;
      if (key === 'switching') {
        defaultObjects = SWITCHING_OBJECTS;
      } else if (key === 'dimming') {
        defaultObjects = DIMMING_OBJECTS;
      } else if (key === 'shading') {
        defaultObjects = SHADING_OBJECTS;
      } else {
        defaultObjects = HVAC_OBJECTS;
      }
      
      const exampleAddresses = defaultObjects.map(obj => ({
        objectName: obj.name.toLowerCase(),
        main: 0,
        middle: 0,
        sub: 0,
        dpt: obj.dpt,
        enabled: obj.defaultEnabled,
        mainIncrement: 0,
        middleIncrement: 0,
        subIncrement: 0
      }));
      
      const categoryName = {
        switching: 'schakelen',
        dimming: 'dimmen',
        shading: 'jalouzie',
        hvac: 'klimaat'
      }[key];
      
      const newCategoryConfig: TeachByExampleCategoryConfig = {
        id: categoryConfig?.id || uid(),
        groupName: categoryConfig?.groupName || categoryName,
        enabled: 'full',
        exampleAddresses
      };
      
      setConfig(prev => ({
        ...prev,
        categories: {
          ...prev.categories,
          [key]: newCategoryConfig
        }
      }));
    }
    
    // Go directly to example step
    setStep('example');
  };

  const handleUsageSelect = (usage: CategoryUsage) => {
    if (!currentCategory) return;
    
    isInWizardFlowRef.current = true;
    
    const categoryName = {
      switching: t('switch'),
      dimming: t('dimmer'),
      shading: t('blind'),
      hvac: t('hvac')
    }[currentCategory];
    
    // If setting to "not used", check if there are devices configured for this category
    if (usage === 'none') {
      const { devices } = useAppStore.getState();
      const categoryMapping: Record<CategoryKey, 'switch' | 'dimmer' | 'blind' | 'hvac'> = {
        switching: 'switch',
        dimming: 'dimmer',
        shading: 'blind',
        hvac: 'hvac'
      };
      const deviceCategory = categoryMapping[currentCategory];
      const categoryDevices = devices[deviceCategory];
      
      // Check if there are devices configured
      if (categoryDevices && categoryDevices.length > 0) {
        // Show warning that devices will be removed
        const warningMessage = t('confirmRemoveDevicesWhenNotUsed')?.replace('{category}', categoryName) || 
          `Als je "${categoryName}" instelt op "niet gebruiken", worden alle ${categoryName} devices verwijderd uit de Configuratie. Weet je zeker dat je door wilt gaan?`;
        
        if (!confirm(warningMessage)) {
          // User cancelled, don't proceed
          return;
        }
        
        // Remove all devices for this category
        const { removeDevice } = useAppStore.getState();
        categoryDevices.forEach(device => {
          removeDevice(deviceCategory, device.id);
        });
      }
    }
    
    const categoryConfig: TeachByExampleCategoryConfig = {
      id: uid(),
      groupName: categoryName.toLowerCase(),
      enabled: usage,
      exampleAddresses: [],
      // Explicitly remove pattern when setting to 'none'
      ...(usage === 'none' ? { pattern: undefined } : {})
    };

    // Initialize with default objects if enabled
    if (usage !== 'none') {
      let defaultObjects: typeof SWITCHING_OBJECTS;
      if (currentCategory === 'switching') {
        defaultObjects = SWITCHING_OBJECTS;
      } else if (currentCategory === 'dimming') {
        defaultObjects = DIMMING_OBJECTS;
      } else if (currentCategory === 'shading') {
        defaultObjects = SHADING_OBJECTS;
      } else {
        defaultObjects = HVAC_OBJECTS;
      }

      categoryConfig.exampleAddresses = defaultObjects.map(obj => ({
        objectName: obj.name.toLowerCase(),
        main: 0,
        middle: 0,
        sub: 0,
        dpt: obj.dpt,
        enabled: obj.defaultEnabled,
        mainIncrement: 0,
        middleIncrement: 0,
        subIncrement: 0
      }));
    }

    // Set as first group - create updated config
    const updatedConfig: TeachByExampleTemplateConfig = {
      ...config,
      categories: {
        ...config.categories,
        [currentCategory]: categoryConfig
      }
    };
    setConfig(updatedConfig);
    setCurrentGroupIndex(0);
    
    // Automatically navigate to example step if usage is not 'none'
    if (usage !== 'none') {
      setStep('example');
    } else {
      // If usage is 'none', automatically go to next category
      const nextCategory = getNextCategory(currentCategory);
      if (nextCategory) {
        setCurrentCategory(nextCategory);
        setStep('usage');
      } else {
        // All categories done
        // All categories are analyzed (including 'none' = "not used" = analyzed as not used)
        // Automatically save template when all categories are fully analyzed
        if (template) {
          const currentTemplate = convertConfigToTemplate(updatedConfig, template);
          setTemplate(currentTemplate);
          
          // Check if all categories are fully configured (analyzed)
          const fullyConfigured = (() => {
            if (!updatedConfig || !updatedConfig.categories) return false;
            const categoryKeys = Object.keys(updatedConfig.categories);
            if (categoryKeys.length === 0) return false;
            
            const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
            return allCategories.every(cat => {
              const categoryConfig = updatedConfig.categories[cat];
              if (!categoryConfig || (Array.isArray(categoryConfig) && categoryConfig.length === 0)) {
                return true; // Category not used
              }
              const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
              return configs.every(cfg => {
                if (cfg.enabled === 'none') return true; // Analyzed as "not used"
                if (cat === 'dimming' && cfg.linkedToSwitching) return true;
                return cfg.pattern !== undefined;
              });
            });
          })();
          
          if (fullyConfigured) {
            // All categories are analyzed - automatically save the template
            const templateName = updatedConfig.templateName?.trim() || template?.name || 'Nieuw Template';
            
            // Only auto-save if there's a template name or if it's a new template (has currentTemplateId from initial creation)
            if (templateName || currentTemplateId) {
              try {
                const { saveTemplateAs, username } = useAppStore.getState();
                if (username) {
                  // Auto-save the template when all categories are analyzed
                  const templateId = saveTemplateAs(templateName, currentTemplate);
                  useAppStore.setState({ 
                    currentTemplateId: templateId,
                    templateHasChanges: false 
                  });
                } else {
                  // No username, just mark as having changes
                  useAppStore.setState({ templateHasChanges: true });
                }
              } catch (err) {
                console.error('Error auto-saving template:', err);
                // If auto-save fails, still mark as having changes so user can save manually
                useAppStore.setState({ templateHasChanges: true });
              }
            } else {
              // No template name, just mark as having changes
              useAppStore.setState({ templateHasChanges: true });
            }
          }
        }
        
        // If we're editing from overview (startFromOverview is true), return to overview
        if (startFromOverview && onReturnToOverview) {
          onReturnToOverview();
          setCurrentCategory(null);
          isInWizardFlowRef.current = false;
        } else {
          // Otherwise, go to final overview (normal wizard flow)
          setStep('finalOverview');
          setCurrentCategory(null);
          isInWizardFlowRef.current = false;
        }
      }
    }
  };

  // Helper function to get all addresses from all categories and groups, including fixed addresses
  const getAllAddresses = (excludeCategory?: CategoryKey, excludeGroupIndex?: number, excludeAddressIndex?: number, excludeFixedMainId?: string, excludeFixedMiddleId?: string, excludeFixedSubId?: string): Array<{ main: number; middle: number; sub: number; category?: CategoryKey; groupIndex?: number; addressIndex?: number; groupName?: string; objectName?: string; isFixed?: boolean; fixedMainId?: string; fixedMiddleId?: string; fixedSubId?: string }> => {
    const allAddresses: Array<{ main: number; middle: number; sub: number; category?: CategoryKey; groupIndex?: number; addressIndex?: number; groupName?: string; objectName?: string; isFixed?: boolean; fixedMainId?: string; fixedMiddleId?: string; fixedSubId?: string }> = [];
    
    // Add addresses from Teach by Example categories
    getAllCategories().forEach(catKey => {
      const configs = getCategoryConfigs(config, catKey);
      configs.forEach((cfg, groupIdx) => {
        if (cfg.enabled === 'none') return;
        if (cfg.exampleAddresses) {
          cfg.exampleAddresses.forEach((addr, addrIdx) => {
            // Skip if this is the address being edited
            if (catKey === excludeCategory && groupIdx === excludeGroupIndex && addrIdx === excludeAddressIndex) {
              return;
            }
            // Only include addresses that are not all zeros
            if (addr.main !== 0 || addr.middle !== 0 || addr.sub !== 0) {
              allAddresses.push({
                main: addr.main,
                middle: addr.middle,
                sub: addr.sub,
                category: catKey,
                groupIndex: groupIdx,
                addressIndex: addrIdx,
                groupName: cfg.groupName,
                objectName: addr.objectName
              });
            }
          });
        }
      });
    });
    
    // Add fixed addresses
    fixedAddresses.forEach(mainGroup => {
      mainGroup.middleGroups.forEach(middleGroup => {
        middleGroup.subs.forEach(sub => {
          // Skip if this is the fixed address being edited
          if (mainGroup.id === excludeFixedMainId && middleGroup.id === excludeFixedMiddleId && sub.id === excludeFixedSubId) {
            return;
          }
          allAddresses.push({
            main: mainGroup.main,
            middle: middleGroup.middle,
            sub: sub.sub,
            isFixed: true,
            fixedMainId: mainGroup.id,
            fixedMiddleId: middleGroup.id,
            fixedSubId: sub.id,
            groupName: `${t('fixedGroupAddressesLabel')} - ${mainGroup.name || `${t('mainGroupName')} ${mainGroup.main}`}`,
            objectName: sub.name
          });
        });
      });
    });
    
    return allAddresses;
  };

  // Helper function to check if an address already exists
  const isAddressDuplicate = (main: number, middle: number, sub: number, excludeCategory?: CategoryKey, excludeGroupIndex?: number, excludeAddressIndex?: number, excludeFixedMainId?: string, excludeFixedMiddleId?: string, excludeFixedSubId?: string): { isDuplicate: boolean; existingLocation?: string } => {
    if (main === 0 && middle === 0 && sub === 0) {
      return { isDuplicate: false }; // Zero addresses are allowed (not filled in yet)
    }
    
    const allAddresses = getAllAddresses(excludeCategory, excludeGroupIndex, excludeAddressIndex, excludeFixedMainId, excludeFixedMiddleId, excludeFixedSubId);
    const duplicate = allAddresses.find(addr => 
      addr.main === main && addr.middle === middle && addr.sub === sub
    );
    
    if (duplicate) {
      let location: string;
      if (duplicate.isFixed) {
        location = duplicate.groupName || t('fixedGroupAddressesLabel');
        if (duplicate.objectName) {
          location += ` - ${translateObjectName(duplicate.objectName, lang)}`;
        }
      } else if (duplicate.category) {
        const categoryName = {
          switching: t('switch'),
          dimming: t('dimmer'),
          shading: t('blind'),
          hvac: t('hvac')
        }[duplicate.category];
        location = categoryName;
        if (duplicate.groupName) {
          // Translate group name if it matches default pattern
          const defaultGroupName = (duplicate.groupIndex === 0 || duplicate.groupIndex === undefined) ? categoryName : `${categoryName} ${(duplicate.groupIndex || 0) + 1}`;
          const displayGroupName = duplicate.groupName.toLowerCase() === defaultGroupName.toLowerCase() ? defaultGroupName : duplicate.groupName;
          location += ` - ${displayGroupName}`;
        }
        if (duplicate.objectName) {
          location += ` - ${translateObjectName(duplicate.objectName, lang)}`;
        }
      } else {
        location = 'Onbekende locatie';
      }
      return { isDuplicate: true, existingLocation: location };
    }
    
    return { isDuplicate: false };
  };

  const handleExampleAddressChange = (index: number, field: keyof ExampleAddress, value: any) => {
    if (!currentCategory) return;
    
    isInWizardFlowRef.current = true; // Mark that we're in the wizard flow
    
    const configs = getCategoryConfigs(config, currentCategory);
    const category = configs[currentGroupIndex] || configs[0];
    if (!category) return;

    // Validate and clamp values to valid ranges
    let validatedValue = value;
    if (field === 'main') {
      validatedValue = Math.max(0, Math.min(31, Number(value) || 0));
    } else if (field === 'middle') {
      validatedValue = Math.max(0, Math.min(7, Number(value) || 0));
    } else if (field === 'sub') {
      validatedValue = Math.max(0, Math.min(255, Number(value) || 0));
    } else if (field === 'mainIncrement') {
      validatedValue = Number(value) === 1 ? 1 : 0;
    } else if (field === 'middleIncrement') {
      validatedValue = Number(value) === 1 ? 1 : 0;
    } else if (field === 'subIncrement') {
      const numValue = Number(value);
      // Allow 0, 1 (for switching), 5 (for dimming), 10 (100 removed)
      // For HVAC, also allow 1 even if all middle groups are the same
      const allowedValues = currentCategory === 'switching' 
        ? [0, 1, 10]
        : currentCategory === 'dimming'
        ? [0, 1, 5, 10]
        : currentCategory === 'hvac'
        ? [0, 1, 10]
        : [0, 1, 10];
      validatedValue = allowedValues.includes(numValue) ? numValue : 0;
    }

    const newAddresses = [...category.exampleAddresses];
    
    // If changing an increment value, apply it to all objects in the same group
    if (field === 'mainIncrement' || field === 'middleIncrement' || field === 'subIncrement') {
      newAddresses.forEach((addr, idx) => {
        newAddresses[idx] = {
          ...addr,
          [field]: validatedValue
        };
      });
    } else if (field === 'main' || field === 'middle' || field === 'sub') {
      // For main, middle, or sub: check if this applies to dimming, shading, or hvac
      const shouldAutoSync = currentCategory === 'dimming' || currentCategory === 'shading' || currentCategory === 'hvac';
      
      if (shouldAutoSync) {
        // Only auto-fill if the user is editing object 0 (first) or 1 (second)
        // This allows users to edit individual objects after auto-fill without triggering auto-fill again
        const isEditingFirstOrSecondObject = index === 0 || index === 1;
        
        if (isEditingFirstOrSecondObject) {
          // First, update the current object
          newAddresses[index] = {
            ...newAddresses[index],
            [field]: validatedValue
          };
          
          // Get all objects (both exampleAddresses and extraObjects) for checking
          const extraObjects = category.extraObjects || [];
          const allObjects = [
            ...newAddresses.map(addr => ({ value: addr[field] as number, type: 'example' as const })),
            ...extraObjects.map(obj => ({ value: obj[field] as number, type: 'extra' as const }))
          ];
          
          // Check only the first 2 object fields
          // If they are the same, ALWAYS apply to all fields (even if more than 7 objects for middle)
          // If they are consecutive (e.g., 1, 2), continue numbering (3, 4, 5, etc.)
          // For middle group: don't auto-number consecutive values if there are more than 7 objects total
          const totalObjects = allObjects.length;
          const isMiddleField = field === 'middle';
          const tooManyForAutoNumbering = isMiddleField && totalObjects > 7;
          
          if (allObjects.length >= 2) {
            const firstValue = allObjects[0]?.value;
            const secondValue = allObjects[1]?.value;
            
            // Only check if both first values are non-zero
            if (firstValue > 0 && secondValue > 0) {
              if (firstValue === secondValue) {
                // Same values: ALWAYS apply to all fields (even if more than 7 objects for middle)
                newAddresses.forEach((addr, idx) => {
                  newAddresses[idx] = {
                    ...addr,
                    [field]: firstValue
                  };
                });
                
                const newExtraObjects = extraObjects.map(obj => ({
                  ...obj,
                  [field]: firstValue
                }));
                
                updateCategory(currentCategory, { exampleAddresses: newAddresses, extraObjects: newExtraObjects }, currentGroupIndex);
                return; // Early return since we already updated
              } else if (!tooManyForAutoNumbering && Math.abs(secondValue - firstValue) === 1) {
                // Consecutive values: continue numbering from the minimum
                // But only if not too many objects for middle field
                const startValue = Math.min(firstValue, secondValue);
                
                newAddresses.forEach((addr, idx) => {
                  newAddresses[idx] = {
                    ...addr,
                    [field]: startValue + idx
                  };
                });
                
                const newExtraObjects = extraObjects.map((obj, idx) => ({
                  ...obj,
                  [field]: startValue + newAddresses.length + idx
                }));
                
                updateCategory(currentCategory, { exampleAddresses: newAddresses, extraObjects: newExtraObjects }, currentGroupIndex);
                return; // Early return since we already updated
              }
            }
          }
          // If no pattern detected, just update the current object
          updateCategory(currentCategory, { exampleAddresses: newAddresses }, currentGroupIndex);
          return;
        } else {
          // User is editing object 3, 4, 5, etc. - just update that specific object without auto-fill
          newAddresses[index] = {
            ...newAddresses[index],
            [field]: validatedValue
          };
        }
      } else {
        // For switching, only update the specific object
        newAddresses[index] = {
          ...newAddresses[index],
          [field]: validatedValue
        };
      }
    } else if (field === 'objectName') {
      // For objectName, convert to standard Dutch name (e.g., "on/off" -> "aan / uit")
      const standardName = getStandardObjectName(String(value || '').trim());
      newAddresses[index] = {
        ...newAddresses[index],
        objectName: standardName
      };
    } else {
      // For other fields, only update the specific object
      newAddresses[index] = {
        ...newAddresses[index],
        [field]: validatedValue
      };
    }

    updateCategory(currentCategory, { exampleAddresses: newAddresses }, currentGroupIndex);
    
    // Link group name to main group name in template when main group number changes
    if (field === 'main' && validatedValue > 0 && template && template.devices?.fixed?.mainGroups) {
      const configs = getCategoryConfigs(config, currentCategory);
      const currentConfig = configs[currentGroupIndex];
      if (currentConfig && currentConfig.groupName) {
        const groupName = currentConfig.groupName.trim();
        const updatedMainGroups = template.devices.fixed.mainGroups.map(mg => {
          if (mg.main === validatedValue) {
            return { ...mg, name: groupName };
          }
          return mg;
        });
        // Check if main group doesn't exist, create it
        // BUT: Don't create main groups 3 (shading) or 4 (HVAC) automatically
        // These should only be created when the category is actually configured
        const mainGroupExists = updatedMainGroups.some(mg => mg.main === validatedValue);
        if (!mainGroupExists && validatedValue !== 3 && validatedValue !== 4) {
          const newMainGroup: FixedMainGroupTemplate = {
            id: uid(),
            main: validatedValue,
            name: groupName,
            middleGroups: []
          };
          updatedMainGroups.push(newMainGroup);
        }
        setTemplate({
          ...template,
          devices: {
            ...template.devices,
            fixed: {
              ...template.devices.fixed,
              mainGroups: updatedMainGroups
            }
          }
        });
        setFixedAddresses(updatedMainGroups);
      }
    }
  };

  const handleAnalyze = () => {
    if (!currentCategory) return;
    
    // For new templates (not editing from overview), reset the cameFromFinalOverviewRef
    // This ensures we always go to next category, not back to overview
    if (!startFromOverview) {
      cameFromFinalOverviewRef.current = false;
    }
    
    // Set analyzing state to show loading indicator
    setIsAnalyzing(true);
    
    const allConfigs = getCategoryConfigs(config, currentCategory);
    
    // Get category name for fallback
    const categoryNameMap: Record<CategoryKey, string> = {
      switching: t('switch'),
      dimming: t('dimmer'),
      shading: t('blind'),
      hvac: t('hvac')
    };
    const categoryName = categoryNameMap[currentCategory];
    
    // Validate and analyze all groups in this category
    const errors: string[] = [];
    const groupsToAnalyze: Array<{ index: number; addresses: any[] }> = [];
    
    // First, validate all groups
    for (let groupIdx = 0; groupIdx < allConfigs.length; groupIdx++) {
      const category = allConfigs[groupIdx];
      
      // Skip disabled groups
      if (category.enabled === 'none') continue;
      // Note: dimming linked to switching should still be analyzed - pattern will be copied from switching if needed
      
      // Don't skip if already analyzed - allow re-analysis when user makes changes
      // The pattern will be updated with the new analysis
      
      // Check if group has addresses
      if (!category.exampleAddresses || category.exampleAddresses.length === 0) {
        const defaultGroupName = groupIdx === 0 ? categoryName : `${categoryName} ${groupIdx + 1}`;
        const displayGroupName = translateGroupName(category.groupName, currentCategory, groupIdx);
        errors.push(`${displayGroupName}: Geen voorbeeldadressen gevonden. Vul eerst de adressen in.`);
        continue;
      }
      
      // Validate addresses for this group
      const addresses = category.exampleAddresses;
      const usedAddresses = new Map<string, { groupName: string; objectName: string }>();
      
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        const objectName = addr.objectName || `Object ${i + 1}`;
        const defaultGroupName = groupIdx === 0 ? categoryName : `${categoryName} ${groupIdx + 1}`;
        const groupName = translateGroupName(category.groupName, currentCategory, groupIdx);

        // Validate main group
        if (isNaN(addr.main) || addr.main < 0 || addr.main > 31) {
          errors.push(`${groupName} - ${objectName}: ${t('mainGroupMustBeBetween').replace('{current}', addr.main.toString())}`);
        }

        // Validate middle group
        if (isNaN(addr.middle) || addr.middle < 0 || addr.middle > 7) {
          errors.push(`${groupName} - ${objectName}: ${t('middleGroupMustBeBetween').replace('{current}', addr.middle.toString())}`);
        }

        // Validate sub group
        if (isNaN(addr.sub) || addr.sub < 0 || addr.sub > 255) {
          errors.push(`${groupName} - ${objectName}: ${t('subGroupMustBeBetween').replace('{current}', addr.sub.toString())}`);
        }

        // Validate DPT
        if (!addr.dpt || addr.dpt.trim() === '') {
          errors.push(`${groupName} - ${objectName}: DPT moet ingevuld zijn`);
        }

        // Check for zero values (which might indicate not filled in)
        if (addr.main === 0 && addr.middle === 0 && addr.sub === 0) {
          errors.push(`${groupName} - ${objectName}: ${t('allAddressValuesZero')}`);
          continue;
        }
        
        // Check for duplicates within the same group
        const addressKey = `${addr.main}/${addr.middle}/${addr.sub}`;
        if (usedAddresses.has(addressKey)) {
          const existing = usedAddresses.get(addressKey)!;
          errors.push(`${groupName} - ${objectName}: ${t('groupAddressAlreadyUsed').replace('{address}', addressKey).replace('{objectName}', existing.objectName)}`);
        } else {
          usedAddresses.set(addressKey, { groupName, objectName });
        }
        
        // Check for duplicates across all categories and groups
        const duplicateCheck = isAddressDuplicate(addr.main, addr.middle, addr.sub, currentCategory, groupIdx, i);
        if (duplicateCheck.isDuplicate) {
          errors.push(`${groupName} - ${objectName}: Groepsadres ${addressKey} bestaat al in ${duplicateCheck.existingLocation}. Groepsadressen moeten uniek zijn.`);
        }
        
        // Validate that each enabled object has at least one increment value
        if (addr.enabled !== false) {
          const mainInc = addr.mainIncrement ?? 0;
          const middleInc = addr.middleIncrement ?? 0;
          const subInc = addr.subIncrement ?? 0;
          
          if (mainInc === 0 && middleInc === 0 && subInc === 0) {
            errors.push(`${groupName} - ${objectName}: ${t('fillIncrementForExtraDevices')}`);
          }
        }
      }
      
      // Validate extra objects if they exist
      if (category.extraObjects && category.extraObjects.length > 0) {
        for (let i = 0; i < category.extraObjects.length; i++) {
          const extraObj = category.extraObjects[i];
          const objectName = extraObj.name || `${t('extraObject')} ${i + 1}`;
          const defaultGroupName = groupIdx === 0 ? categoryName : `${categoryName} ${groupIdx + 1}`;
          const groupName = translateGroupName(category.groupName, currentCategory, groupIdx);

          // Validate main group
          if (isNaN(extraObj.main) || extraObj.main < 0 || extraObj.main > 31) {
            errors.push(`${groupName} - ${objectName}: ${t('mainGroupMustBeBetween').replace('{current}', extraObj.main.toString())}`);
          }

          // Validate middle group
          if (isNaN(extraObj.middle) || extraObj.middle < 0 || extraObj.middle > 7) {
            errors.push(`${groupName} - ${objectName}: ${t('middleGroupMustBeBetween').replace('{current}', extraObj.middle.toString())}`);
          }

          // Validate sub group
          if (isNaN(extraObj.sub) || extraObj.sub < 0 || extraObj.sub > 255) {
            errors.push(`${groupName} - ${objectName}: ${t('subGroupMustBeBetween').replace('{current}', extraObj.sub.toString())}`);
          }

          // Check for zero values
          if (extraObj.main === 0 && extraObj.middle === 0 && extraObj.sub === 0) {
            errors.push(`${groupName} - ${objectName}: ${t('allAddressValuesZero')}`);
            continue;
          }

          // Check for duplicates within the same group (including example addresses)
          const addressKey = `${extraObj.main}/${extraObj.middle}/${extraObj.sub}`;
          if (usedAddresses.has(addressKey)) {
            const existing = usedAddresses.get(addressKey)!;
            errors.push(`${groupName} - ${objectName}: ${t('groupAddressAlreadyUsed').replace('{address}', addressKey).replace('{objectName}', existing.objectName)}`);
          } else {
            usedAddresses.set(addressKey, { groupName, objectName });
          }

          // Check for duplicates across all categories and groups
          const duplicateCheck = isAddressDuplicate(extraObj.main, extraObj.middle, extraObj.sub, currentCategory, groupIdx, undefined, undefined, undefined, undefined, undefined);
          if (duplicateCheck.isDuplicate) {
            errors.push(`${groupName} - ${objectName}: Groepsadres ${addressKey} bestaat al in ${duplicateCheck.existingLocation}. Groepsadressen moeten uniek zijn.`);
          }
          
          // Validate increment values for extra objects
          if ((extraObj.mainIncrement ?? 0) === 0 && 
              (extraObj.middleIncrement ?? 0) === 0 && 
              (extraObj.subIncrement ?? 0) === 0) {
            errors.push(`${groupName} - ${objectName}: ${t('extraObjectsNeedIncrement')}`);
          }
        }
      }
      
      // If validation passed, add to groups to analyze
      const enabledAddresses = addresses.filter(addr => addr.enabled !== false);
      if (enabledAddresses.length > 0) {
        groupsToAnalyze.push({ index: groupIdx, addresses: enabledAddresses });
      } else {
        const defaultGroupName = groupIdx === 0 ? categoryName : `${categoryName} ${groupIdx + 1}`;
        const displayGroupName = translateGroupName(category.groupName, currentCategory, groupIdx);
        errors.push(`${displayGroupName}: Geen ingeschakelde adressen gevonden. Schakel ten minste één adres in.`);
      }
    }

    if (errors.length > 0) {
      alert(`Fout bij valideren:\n\n${errors.join('\n')}`);
      return;
    }
    
    if (groupsToAnalyze.length === 0) {
      alert('Geen groepen gevonden om te analyseren. Vul eerst de adressen in voor ten minste één groep.');
      return;
    }

    try {
      // Analyze all groups and update config directly
      let analyzedCount = 0;
      let updatedConfigWithPatterns = { ...config };
      
      for (const group of groupsToAnalyze) {
        const pattern = analyzeGroupPattern(group.addresses);
        
        // Preserve extraMainGroups, nextMainGroup and nextMiddleGroup if they exist in the current pattern
        const configs = getCategoryConfigs(updatedConfigWithPatterns, currentCategory);
        const currentCategoryConfig = configs.length > group.index ? configs[group.index] : null;
        const preservedPattern = {
          ...pattern,
          ...(currentCategoryConfig?.pattern?.extraMainGroups && { extraMainGroups: currentCategoryConfig.pattern.extraMainGroups }),
          ...(currentCategoryConfig?.pattern?.nextMainGroup !== undefined && { nextMainGroup: currentCategoryConfig.pattern.nextMainGroup }),
          ...(currentCategoryConfig?.pattern?.nextMiddleGroup !== undefined && { nextMiddleGroup: currentCategoryConfig.pattern.nextMiddleGroup })
        };
        
        updateCategory(currentCategory, { pattern: preservedPattern }, group.index);
        
        // Also update the local config copy immediately so it's available for saving
        if (configs.length > group.index) {
          const updatedConfigs = [...configs];
          updatedConfigs[group.index] = {
            ...updatedConfigs[group.index],
            pattern: preservedPattern
          };
          updatedConfigWithPatterns = {
            ...updatedConfigWithPatterns,
            categories: {
              ...updatedConfigWithPatterns.categories,
              [currentCategory]: updatedConfigs.length === 1 ? updatedConfigs[0] : updatedConfigs
            }
          };
        }
        analyzedCount++;
      }
      
      // If this is switching and dimming is linked to switching, also update dimming pattern
      if (currentCategory === 'switching') {
        const dimmingConfigs = getCategoryConfigs(updatedConfigWithPatterns, 'dimming');
        const switchingConfigs = getCategoryConfigs(updatedConfigWithPatterns, 'switching');
        const firstSwitchingPattern = switchingConfigs.find(cfg => cfg.pattern)?.pattern;
        
        if (firstSwitchingPattern) {
          dimmingConfigs.forEach((dimmingCfg, idx) => {
            if (dimmingCfg.linkedToSwitching) {
              updateCategory('dimming', { pattern: firstSwitchingPattern }, idx);
              
              // Also update the local config copy
              const updatedDimmingConfigs = [...dimmingConfigs];
              updatedDimmingConfigs[idx] = {
                ...updatedDimmingConfigs[idx],
                pattern: firstSwitchingPattern
              };
              updatedConfigWithPatterns = {
                ...updatedConfigWithPatterns,
                categories: {
                  ...updatedConfigWithPatterns.categories,
                  dimming: updatedDimmingConfigs.length === 1 ? updatedDimmingConfigs[0] : updatedDimmingConfigs
                }
              };
            }
          });
        }
      }
      
      // If this is dimming and linked to switching, copy pattern from switching if available
      if (currentCategory === 'dimming') {
        const dimmingConfigs = getCategoryConfigs(updatedConfigWithPatterns, 'dimming');
        const switchingConfigs = getCategoryConfigs(updatedConfigWithPatterns, 'switching');
        const firstSwitchingPattern = switchingConfigs.find(cfg => cfg.pattern)?.pattern;
        
        // For dimming groups that are linked to switching, use switching pattern if available
        // Otherwise, use the analyzed pattern from dimming addresses
        dimmingConfigs.forEach((dimmingCfg, idx) => {
          if (dimmingCfg.linkedToSwitching && firstSwitchingPattern) {
            // Use switching pattern
            const updatedDimmingConfigs = [...dimmingConfigs];
            updatedDimmingConfigs[idx] = {
              ...updatedDimmingConfigs[idx],
              pattern: firstSwitchingPattern
            };
            updatedConfigWithPatterns = {
              ...updatedConfigWithPatterns,
              categories: {
                ...updatedConfigWithPatterns.categories,
                dimming: updatedDimmingConfigs.length === 1 ? updatedDimmingConfigs[0] : updatedDimmingConfigs
              }
            };
            // Also update via updateCategory
            updateCategory('dimming', { pattern: firstSwitchingPattern }, idx);
          }
          // If not linked or no switching pattern, the analyzed pattern from above is already set
        });
      }
      
      // Show success message if multiple groups were analyzed
      if (analyzedCount > 1) {
        alert(`Alle ${analyzedCount} groepen zijn succesvol geanalyseerd!`);
      }
      
      // Save the config to the store so TemplateWizard can see the updated state
      // This ensures the wizard continues to render instead of switching to overview
      const updatedConfig: TeachByExampleTemplateConfig = {
        ...updatedConfigWithPatterns,
        fixedAddresses: fixedAddresses as any
      };
      
      // All groups in this category are analyzed, go to next category
      const nextCategory = getNextCategory(currentCategory);
      console.log('handleAnalyze: currentCategory:', currentCategory, 'nextCategory:', nextCategory);
      
      // If current category is HVAC (last category), always go to finalOverview
      if (currentCategory === 'hvac') {
        console.log('handleAnalyze: HVAC is last category, going to overview');
        
        // Update config state first to ensure patterns are saved
        setConfig(updatedConfig);
        
        // If we're editing an existing template (startFromOverview is true), return to overview component
        if (startFromOverview && onReturnToOverview) {
          // Save the updated config to template first
          if (template) {
            const updatedTemplate = {
              ...template,
              teachByExampleConfig: updatedConfig
            };
            setTemplate(updatedTemplate);
            
            // Auto-save the template if editing an existing template
            const { currentTemplateId, username, saveUserTemplate } = useAppStore.getState();
            if (currentTemplateId && username) {
              try {
                saveUserTemplate();
                console.log('handleAnalyze: Template auto-saved after HVAC analysis (returning to overview)');
              } catch (err) {
                console.error('handleAnalyze: Error auto-saving template:', err);
              }
            }
          }
          
          // Return to overview component
          onReturnToOverview();
          setIsAnalyzing(false);
          return;
        }
        
        // Otherwise, go to finalOverview step (normal wizard flow)
        console.log('handleAnalyze: HVAC is last category, going to finalOverview');
        // Set step and category FIRST before updating template
        // This prevents useEffect from resetting the step
        setStep('finalOverview');
        setCurrentCategory(null);
        isInWizardFlowRef.current = false;
        setIsAnalyzing(false);
        
        // Update template in store AFTER setting step to prevent useEffect from resetting
        if (template) {
          const updatedTemplate = {
            ...template,
            teachByExampleConfig: updatedConfig
          };
          // Use setTimeout to delay template update until after step is set
          setTimeout(() => {
            setTemplate(updatedTemplate);
            
            // Auto-save the template if editing an existing template
            const { currentTemplateId, username, saveUserTemplate } = useAppStore.getState();
            if (currentTemplateId && username) {
              try {
                saveUserTemplate();
                console.log('handleAnalyze: Template auto-saved after HVAC analysis (going to finalOverview)');
              } catch (err) {
                console.error('handleAnalyze: Error auto-saving template:', err);
              }
            }
          }, 50);
        }
        return; // Exit early to prevent further processing
      }
      
      // Update template in store with the updated config
      if (template) {
        const updatedTemplate = {
          ...template,
          teachByExampleConfig: updatedConfig
        };
        setTemplate(updatedTemplate);
        
        // If editing an existing template (has currentTemplateId), auto-save it
        const { currentTemplateId, username, saveUserTemplate } = useAppStore.getState();
        if (currentTemplateId && username) {
          // Save the template automatically after analysis
          try {
            saveUserTemplate();
            console.log('handleAnalyze: Template auto-saved after analysis');
          } catch (err) {
            console.error('handleAnalyze: Error auto-saving template:', err);
            // Don't show error to user, just log it - template is still updated in store
          }
        }
      }
      
      // Check if we came from finalOverview using the ref FIRST
      // When coming from finalOverview, we want to go back there after analysis ONLY if all categories are done
      // BUT: If there's a next category, we should continue to that category, not go back to overview
      // For new templates (startFromOverview is false), always continue to next category
      console.log('handleAnalyze: Debug - cameFromFinalOverviewRef.current:', cameFromFinalOverviewRef.current, 'startFromOverview:', startFromOverview, 'nextCategory:', nextCategory);
      
      // If we came from overview but there's a next category, reset the flag and continue to next category
      // This ensures we don't go back to overview prematurely during the wizard flow
      if (cameFromFinalOverviewRef.current && nextCategory) {
        console.log('handleAnalyze: Resetting cameFromFinalOverviewRef - continuing to next category:', nextCategory);
        cameFromFinalOverviewRef.current = false;
      }
      
      // If no next category, all categories are done
      if (!nextCategory) {
        console.log('handleAnalyze: All categories done');
        
        // If we're editing an existing template (startFromOverview is true) AND we came from overview,
        // return to overview component so user can see the updated template
        if (cameFromFinalOverviewRef.current && startFromOverview && onReturnToOverview) {
          console.log('handleAnalyze: Going back to overview (came from overview, all categories done)');
          // Save the updated config to template first
          if (template) {
            const updatedTemplate = {
              ...template,
              teachByExampleConfig: updatedConfig
            };
            setTemplate(updatedTemplate);
          }
          
          // Return to overview component
          onReturnToOverview();
          setIsAnalyzing(false);
          return;
        }
        
        // Otherwise, if we're in the normal wizard flow (not editing from overview),
        // go to finalOverview step
        if (!startFromOverview || !cameFromFinalOverviewRef.current) {
          console.log('handleAnalyze: All categories done, going to finalOverview');
          setStep('finalOverview');
          setCurrentCategory(null);
          isInWizardFlowRef.current = false;
          setIsAnalyzing(false);
          return;
        }
        
        // If we're editing from overview but don't have onReturnToOverview, just stay in analysis view
        // User can manually navigate back to overview
        console.log('handleAnalyze: All categories done, staying in analysis view');
        setIsAnalyzing(false);
        return;
      }
      
      // Go to next category usage step (normal wizard flow)
      console.log('handleAnalyze: Going to next category:', nextCategory);
      setCurrentCategory(nextCategory);
      setStep('usage');
      setCurrentGroupIndex(0);
      isInWizardFlowRef.current = true; // Keep wizard flow active
      setIsAnalyzing(false);
    } catch (error) {
      setIsAnalyzing(false);
      alert(`Fout bij analyseren: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  };

  const handleAddExtraObject = () => {
    if (!currentCategory) return;
    
    const configs = getCategoryConfigs(config, currentCategory);
    const category = configs[currentGroupIndex] || configs[0];
    if (!category) return;

    const extraObjects = category.extraObjects || [];
    // Take main and middle from first exampleAddress if available
    const firstExample = category.exampleAddresses && category.exampleAddresses.length > 0 
      ? category.exampleAddresses[0] 
      : null;
    
    const newObject = {
      id: uid(),
      name: '',
      dpt: '',
      main: firstExample?.main ?? 0,
      middle: firstExample?.middle ?? 0,
      sub: 0,
      mainIncrement: 0,
      middleIncrement: 0,
      subIncrement: 0
    };

    updateCategory(currentCategory, {
      extraObjects: [...extraObjects, newObject]
    }, currentGroupIndex);
  };

  // Overview step - skip this if startFromOverview is false (new template from StartScreen)
  // In that case, go directly to the wizard
  if (step === 'overview') {
    // If we're starting a new template (not from overview), skip this screen and go directly to wizard
    if (!startFromOverview) {
      // Set the flag FIRST to prevent useEffect from resetting the step
      isInWizardFlowRef.current = true;
      setCurrentCategory('switching');
      setStep('usage');
      return null; // Return null while transitioning
    }
    
    // If we're in overview but should be in finalOverview, redirect immediately
    // This check is done in a useEffect hook (see above) to avoid conditional hook calls
    
    return (
      <div className="card no-hover">
        <h3>Teach by Example Wizard</h3>
        <p>{t('configureAddressStructure')}</p>

        <div style={{ marginTop: 24 }}>
          <h4>Hoofd Functies</h4>
          <p className="small" style={{ marginTop: 8, marginBottom: 16 }}>
            {t('startWizard')}
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className="button primary"
              onClick={() => {
                // Set the flag FIRST to prevent useEffect from resetting the step
                isInWizardFlowRef.current = true;
                setCurrentCategory('switching');
                setStep('usage');
                // Keep the flag set for a short time to ensure the step doesn't get reset
                setTimeout(() => {
                  // The flag will be reset when we reach finalOverview or when user cancels
                }, 100);
              }}
              style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}
            >
              {t('startWizard')}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          {areAllCategoriesConfigured() && getCategoriesNeedingExamples().length === 0 ? (
            <>
              <button 
                className="button primary" 
                onClick={() => {
                  // Check if all categories are fully configured
                  if (areAllCategoriesFullyConfigured()) {
                    // Show final analysis step
                    setStep('finalAnalysis');
                  } else {
                    // Show final analysis step
                    setStep('finalAnalysis');
                  }
                }}
              >
                {t('analyzeStructure')}
              </button>
              {onCancel && (
                <button className="button ghost" onClick={() => {
                  // Save current config before canceling
                  onCancel(config);
                }}>
                  {t('cancel')}
                </button>
              )}
            </>
          ) : (
            <>
              {onCancel && (
                <button className="button ghost" onClick={() => {
                  // Save current config before canceling
                  onCancel(config);
                }}>
                  {t('cancel')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Final analysis step - show complete structure
  if (step === 'finalAnalysis') {
    return (
      <div className="card">
        <h3>Groepsadressen Structuur Geanalyseerd</h3>
        <p>De volledige groepsadressen structuur is geanalyseerd. Hieronder ziet u een overzicht per functiegroep:</p>
        
        <div style={{ marginTop: 24 }}>
          {getAllCategories().map((catKey) => {
            const categoryConfigs = getCategoryConfigs(config, catKey);
            if (categoryConfigs.length === 0) return null;
            
            // Render all groups for this category
            return categoryConfigs.map((category, groupIdx) => {
              if (category.enabled === 'none') return null;
              if (catKey === 'dimming' && category.linkedToSwitching) return null;
              
              const categoryName = {
                switching: t('switch'),
                dimming: t('dimmer'),
                shading: t('blind'),
                hvac: t('hvac')
              }[catKey];
              
              const pattern = category.pattern;
              
              return (
                <div key={`${catKey}-${groupIdx}-${category.id || groupIdx}`} className="card" style={{ marginTop: 16 }}>
                  <h4>{categoryName}</h4>
                  {pattern ? (
                    <div style={{ marginTop: 12 }}>
                      <ul style={{ marginTop: 8 }}>
                        <li>{t('mainGroupFixed').replace('{main}', pattern.fixedMain.toString())}</li>
                        <li>{t('middleGroupPattern')}: {pattern.middleGroupPattern === 'same' ? t('middleGroupPatternSame') : t('middleGroupPatternDifferent')}</li>
                        <li>{t('subGroupPattern')} {
                          pattern.subGroupPattern === 'increment' ? t('incrementing') :
                          pattern.subGroupPattern === 'offset' ? t('offset').replace('{value}', String(pattern.offsetValue || 0)) :
                          t('sequence')
                        }</li>
                        <li>{t('objectsPerDevice').replace('{count}', pattern.objectsPerDevice.toString())}</li>
                        {pattern.startSub && <li>{t('startSubGroupLabel').replace('{sub}', pattern.startSub.toString())}</li>}
                        {/* Show maximum zones for HVAC */}
                        {catKey === 'hvac' && (() => {
                          // Get start middle group and increment from first example address
                          const startMiddle = category.exampleAddresses?.[0]?.middle ?? 0;
                          const middleIncrement = category.exampleAddresses?.[0]?.middleIncrement ?? 0;
                          
                          // Only show if middle increment is +1
                          if (middleIncrement === 1) {
                            // Zones per main group = 8 - startMiddle
                            // If startMiddle is 0: 8 - 0 = 8 zones (middengroep 0-7)
                            // If startMiddle is 1: 8 - 1 = 7 zones (middengroep 1-7)
                            const zonesPerMainGroup = 8 - startMiddle;
                            // Count zones from first main group
                            let totalZones = zonesPerMainGroup;
                            
                            // Add zones from each extra main group if they exist
                            if (pattern.extraMainGroups && pattern.extraMainGroups.length > 0) {
                              return (
                                <li>
                                  {t('extraMainGroupsForZones')} {pattern.extraMainGroups.map(g => `${g.main}/${g.middle}`).join(', ')}
                                  {(() => {
                                    pattern.extraMainGroups!.forEach(extraGroup => {
                                      const extraStartMiddle = extraGroup.middle;
                                      const extraZonesPerGroup = 8 - extraStartMiddle;
                                      totalZones += extraZonesPerGroup;
                                    });
                                    return ` (max ${totalZones} zones, ${t('seeTemplateSettings') || 'zie instellingen template'})`;
                                  })()}
                                </li>
                              );
                            } else {
                              // No extra main groups, just show max zones for first main group
                              return (
                                <li>
                                  {t('maximumNumberOfZones')}: {totalZones} ({t('seeTemplateSettings') || 'zie instellingen template'})
                                </li>
                              );
                            }
                          }
                          return null;
                        })()}
                      </ul>
                    </div>
                  ) : (
                    <div className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {t('patternNotAnalyzed')}
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <button className="button ghost" onClick={() => {
            if (startFromOverview) {
              setStep('overview');
              setCurrentCategory(null);
            } else {
              // If we started directly without overview, go back to previous category or cancel
              const prevCategory = getPreviousCategory(currentCategory);
              if (prevCategory) {
                setCurrentCategory(prevCategory);
                setStep('analysis');
              } else {
                // No previous category, cancel wizard
                if (onCancel) {
                  // Save current config before canceling
                  onCancel(config);
                }
              }
            }
          }}>
            {t('back')}
          </button>
          <button className="button primary" onClick={() => {
            // Go to final overview where user can save with template name
            setStep('finalOverview');
          }}>
            {t('continueToOverview')}
          </button>
        </div>
      </div>
    );
  }

  // Usage selection step - automatically redirect to example with "full" enabled
  if (step === 'usage' && currentCategory) {
    // Automatically select "full" (volledig gebruiken) and go directly to example step
    const configs = getCategoryConfigs(config, currentCategory);
    const currentCategoryConfig = configs.length > 0 ? configs[0] : null;
    
    // If category is not configured or enabled is 'none', initialize with 'full'
    if (!currentCategoryConfig || currentCategoryConfig.enabled === 'none' || !currentCategoryConfig.exampleAddresses || currentCategoryConfig.exampleAddresses.length === 0) {
      // Initialize with default objects (same logic as handleUsageSelect('full'))
      let defaultObjects: typeof SWITCHING_OBJECTS;
      if (currentCategory === 'switching') {
        defaultObjects = SWITCHING_OBJECTS;
      } else if (currentCategory === 'dimming') {
        defaultObjects = DIMMING_OBJECTS;
      } else if (currentCategory === 'shading') {
        defaultObjects = SHADING_OBJECTS;
      } else {
        defaultObjects = HVAC_OBJECTS;
      }
      
      const exampleAddresses = defaultObjects.map(obj => ({
        objectName: obj.name.toLowerCase(),
        main: 0,
        middle: 0,
        sub: 0,
        dpt: obj.dpt,
        enabled: obj.defaultEnabled,
        mainIncrement: 0,
        middleIncrement: 0,
        subIncrement: 0
      }));
      
      const categoryName = {
        switching: 'schakelen',
        dimming: 'dimmen',
        shading: 'jalouzie',
        hvac: 'klimaat'
      }[currentCategory];
      
      const newCategoryConfig: TeachByExampleCategoryConfig = {
        id: currentCategoryConfig?.id || uid(),
        groupName: currentCategoryConfig?.groupName || categoryName,
        enabled: 'full',
        exampleAddresses
      };
      
      setConfig(prev => ({
        ...prev,
        categories: {
          ...prev.categories,
          [currentCategory]: newCategoryConfig
        }
      }));
    }
    
    // Automatically go to example step
    setStep('example');
    return null; // Return null while transitioning
  }
  
  // Old usage step code (kept for reference but should not be reached)
  if (false && step === 'usage' && currentCategory) {
    const categoryName = {
      switching: t('switch'),
      dimming: t('dimmer'),
      shading: t('blind'),
      hvac: t('hvac')
    }[currentCategory];

    const configs = getCategoryConfigs(config, currentCategory);
    const currentCategoryConfig = configs.length > 0 ? configs[0] : null;
    const currentEnabled = currentCategoryConfig?.enabled;

    // Special handling for switching - show question about dimming
    if (currentCategory === 'switching') {
      return (
        <div className="card">
          <h3>{t('configureCategory').replace('{category}', categoryName)}</h3>
          <p>{t('howDoYouWantToUseThisFunctionGroup')}</p>

          <div style={{ marginTop: 20 }}>
            <label className="flex" style={{ marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="usage"
                value="full"
                checked={currentEnabled === 'full'}
                onChange={() => {
                  if (!currentCategory) return;
                  
                  // Initialize category config with switching objects
                  const categoryConfig: TeachByExampleCategoryConfig = {
                    enabled: 'full',
                    exampleAddresses: SWITCHING_OBJECTS.map(obj => ({
                      objectName: obj.name.toLowerCase(),
                      main: 0,
                      middle: 0,
                      sub: 0,
                      dpt: obj.dpt,
                      enabled: obj.defaultEnabled,
                      mainIncrement: 0,
                      middleIncrement: 0,
                      subIncrement: 0
                    }))
                  };
                  
                  // Update category
                  updateCategory(currentCategory, categoryConfig);
                  // Go to example step
                  setStep('example');
                }}
                style={{ marginRight: 8 }}
              />
              <div>
                <strong>{t('fullyUse')}</strong>
                <div className="small">{t('allObjectsGeneratedWithNames')}</div>
              </div>
            </label>

            <label className="flex" style={{ marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="usage"
                value="none"
                checked={currentEnabled === 'none'}
                onChange={() => handleUsageSelect('none')}
                style={{ marginRight: 8 }}
              />
              <div>
                <strong>{t('notUse')}</strong>
                <div className="small">{t('selectThisOptionIfSameMainMiddleGroups')}</div>
              </div>
            </label>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            {/* Show cancel button if first category (switching), otherwise show back button */}
            {currentCategory === 'switching' && onCancel ? (
              <button className="button ghost" onClick={() => {
                // Save current config before canceling
                onCancel(config);
              }}>
                {t('cancel')}
              </button>
            ) : currentCategory !== 'switching' && (
              <button className="button ghost" onClick={() => {
                // Check if there's a previous category
                const prevCategory = getPreviousCategory(currentCategory);
                if (prevCategory) {
                  // Go back to previous category's usage step (begin scherm)
                  setCurrentCategory(prevCategory);
                  setStep('usage');
                  setCurrentGroupIndex(0);
                }
              }}>
                {t('back')}
              </button>
            )}
            {currentEnabled !== undefined && (
              <button 
                className="button primary" 
                onClick={() => {
                  if (currentEnabled === 'none') {
                    // Go to next category or overview
                    const nextCategory = getNextCategory(currentCategory);
                    if (nextCategory) {
                      setCurrentCategory(nextCategory);
                      setStep('usage');
                    } else {
                      setStep('finalOverview');
                      setCurrentCategory(null);
                      isInWizardFlowRef.current = false;
                    }
                  } else {
                    setStep('example');
                  }
                }}
              >
                {t('continueButton')}
              </button>
            )}
          </div>
        </div>
      );
    }

    // Special handling for dimming - 3 options
    if (currentCategory === 'dimming') {
      return (
        <div className="card">
          <h3>{t('configureCategory').replace('{category}', categoryName)}</h3>
          <p>{t('howDoYouWantToUseThisFunctionGroup')}</p>

          <div style={{ marginTop: 20 }}>
            <label className="flex" style={{ marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="usage"
                value="full"
                checked={currentEnabled === 'full' && !(getCategoryConfigs(config, 'dimming').some(cfg => cfg.linkedToSwitching))}
                onChange={() => {
                  if (!currentCategory) return;
                  
                  // Initialize category config with dimming objects
                  const categoryConfig: TeachByExampleCategoryConfig = {
                    enabled: 'full',
                    linkedToSwitching: false,
                    exampleAddresses: DIMMING_OBJECTS.map(obj => ({
                      objectName: obj.name.toLowerCase(),
                      main: 0,
                      middle: 0,
                      sub: 0,
                      dpt: obj.dpt,
                      enabled: obj.defaultEnabled,
                      mainIncrement: 0,
                      middleIncrement: 0,
                      subIncrement: 0
                    }))
                  };
                  
                  // Update category
                  updateCategory(currentCategory, categoryConfig);
                  // Go to example step
                  setStep('example');
                }}
                style={{ marginRight: 8 }}
              />
              <div>
                <strong>{t('onlyForDimming')}</strong>
                <div className="small">{t('dimmingHasOwnAddresses')}</div>
              </div>
            </label>

            {/* Only show "Voor Dimmen en Schakelen gebruiken" if switching is not set to "Volledig gebruiken" */}
            {!(getCategoryConfigs(config, 'switching').some(cfg => cfg.enabled === 'full')) && (
            <label className="flex" style={{ marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="usage"
                value="shared"
                checked={getCategoryConfigs(config, 'dimming').some(cfg => cfg.linkedToSwitching === true)}
                onChange={() => {
                  if (!currentCategory) return;
                  
                  // Copy example addresses from switching if available
                  const switchingConfigs = getCategoryConfigs(config, 'switching');
                  const switchingCategory = switchingConfigs.length > 0 ? switchingConfigs[0] : null;
                  let exampleAddresses: ExampleAddress[] = [];
                  
                  if (switchingCategory && switchingCategory.exampleAddresses.length > 0) {
                    // Copy addresses from switching
                    exampleAddresses = switchingCategory.exampleAddresses.map(addr => ({ ...addr }));
                    console.log('Copied addresses from switching:', exampleAddresses);
                  } else {
                    // Initialize with dimming objects if switching not configured yet
                    exampleAddresses = DIMMING_OBJECTS.map(obj => ({
                      objectName: obj.name.toLowerCase(),
                      main: 0,
                      middle: 0,
                      sub: 0,
                      dpt: obj.dpt,
                      enabled: obj.defaultEnabled,
                      mainIncrement: 0,
                      middleIncrement: 0,
                      subIncrement: 0
                    }));
                    console.log('Initialized with dimming objects:', exampleAddresses);
                  }
                  
                  // Update category with all data at once
                  const categoryConfig: TeachByExampleCategoryConfig = {
                    id: uid(),
                    groupName: `${t('dimmer').toLowerCase()} 1`,
                    enabled: 'full',
                    linkedToSwitching: true,
                    exampleAddresses
                  };
                  
                  console.log('Setting category config:', categoryConfig);
                  
                  // Update config and immediately navigate to example step
                  setConfig(prev => {
                    const dimmingConfigs = getCategoryConfigs(prev, 'dimming');
                    const updatedConfigs = dimmingConfigs.length > 0 ? [...dimmingConfigs, categoryConfig] : [categoryConfig];
                    const newConfig = {
                      ...prev,
                      categories: {
                        ...prev.categories,
                        dimming: updatedConfigs.length === 1 ? updatedConfigs[0] : updatedConfigs
                      }
                    };
                    console.log('Updated config:', newConfig);
                    return newConfig;
                  });
                  
                  // Ensure currentCategory is set to dimming and navigate to example step
                  setCurrentCategory('dimming');
                  setCurrentGroupIndex(0);
                  
                  // Use a small delay to ensure state is updated
                  setTimeout(() => {
                    console.log('Navigating to example step');
                    setStep('example');
                  }, 10);
                }}
                style={{ marginRight: 8 }}
              />
              <div>
                <strong>{t('forDimmingAndSwitching')}</strong>
                <div className="small">{t('unusedAddressesShownAs')}</div>
              </div>
            </label>
            )}

            <label className="flex" style={{ marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="usage"
                value="none"
                checked={currentEnabled === 'none' && !(getCategoryConfigs(config, 'dimming').some(cfg => cfg.linkedToSwitching))}
                onChange={() => handleUsageSelect('none')}
                style={{ marginRight: 8 }}
              />
              <div>
                <strong>{t('notUse')}</strong>
                <div className="small">Geen adressen genereren voor deze functiegroep</div>
              </div>
            </label>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            {/* Show cancel button if first category (switching), otherwise show back button */}
            {currentCategory === 'switching' && onCancel ? (
              <button className="button ghost" onClick={() => {
                // Save current config before canceling
                onCancel(config);
              }}>
                {t('cancel')}
              </button>
            ) : currentCategory !== 'switching' && (
              <button className="button ghost" onClick={() => {
                // Check if there's a previous category
                const prevCategory = getPreviousCategory(currentCategory);
                if (prevCategory) {
                  // Go back to previous category's usage step (begin scherm)
                  setCurrentCategory(prevCategory);
                  setStep('usage');
                  setCurrentGroupIndex(0);
                }
              }}>
                {t('back')}
              </button>
            )}
            {(currentEnabled !== undefined || getCategoryConfigs(config, 'dimming').some(cfg => cfg.linkedToSwitching !== undefined)) && (
              <button 
                className="button primary" 
                onClick={() => {
                  // If linkedToSwitching is true, we should already be in example step (set by onChange)
                  // But if user clicks Verder button, check if we need to go to example or next category
                  const dimmingConfigs = getCategoryConfigs(config, 'dimming');
                  const hasLinkedDimming = dimmingConfigs.some(cfg => cfg.linkedToSwitching === true);
                  if (hasLinkedDimming) {
                    // Check if we're still in usage step (shouldn't happen, but just in case)
                    if (step === 'usage') {
                      setStep('example');
                    } else {
                      // Already configured, go to next category
                      const nextCategory = getNextCategory(currentCategory);
                      if (nextCategory) {
                        setCurrentCategory(nextCategory);
                        setStep('usage');
                      } else {
                        // All categories done
                        setStep('finalOverview');
                        setCurrentCategory(null);
                        isInWizardFlowRef.current = false;
                      }
                    }
                  } else if (currentEnabled === 'none') {
                    // If we came from finalOverview, always go back there
                    if (cameFromFinalOverviewRef.current) {
                      setStep('finalOverview');
                      setCurrentCategory(null);
                      isInWizardFlowRef.current = false;
                      cameFromFinalOverviewRef.current = false;
                      return;
                    }
                    
                    // Automatically go to next category
                    const nextCategory = getNextCategory(currentCategory);
                    if (nextCategory) {
                      setCurrentCategory(nextCategory);
                      setStep('usage');
                    } else {
                      // All categories done
                      setStep('finalOverview');
                      setCurrentCategory(null);
                      isInWizardFlowRef.current = false;
                    }
                  } else {
                    // Go to example step
                    setStep('example');
                  }
                }}
              >
                {t('continueButton')}
              </button>
            )}
          </div>
        </div>
      );
    }

    // For other categories (shading, hvac) - only "Volledig gebruiken" or "Niet gebruiken"
    return (
      <div className="card">
        <h3>{t('configureCategory').replace('{category}', categoryName)}</h3>
        <p>{t('howDoYouWantToUseThisFunctionGroup')}</p>

        <div style={{ marginTop: 20 }}>
          <label className="flex" style={{ marginBottom: 12, cursor: 'pointer' }}>
            <input
              type="radio"
              name="usage"
              value="full"
              checked={currentEnabled === 'full'}
              onChange={() => {
                handleUsageSelect('full');
                // Direct go to example step to fill in addresses
                setStep('example');
              }}
              style={{ marginRight: 8 }}
            />
            <div>
              <strong>{t('fullyUse')}</strong>
              <div className="small">{t('allObjectsGeneratedWithNames')}</div>
            </div>
          </label>

          <label className="flex" style={{ marginBottom: 12, cursor: 'pointer' }}>
            <input
              type="radio"
              name="usage"
              value="none"
              checked={currentEnabled === 'none'}
              onChange={() => handleUsageSelect('none')}
              style={{ marginRight: 8 }}
            />
            <div>
              <strong>{t('notUse')}</strong>
              <div className="small">{t('noAddressesGeneratedForFunctionGroup')}</div>
            </div>
          </label>
        </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            {/* Show cancel button if first category (switching), otherwise show back button */}
            {currentCategory === 'switching' && onCancel ? (
              <button className="button ghost" onClick={() => {
                // Save current config before canceling
                onCancel(config);
              }}>
                {t('cancel')}
              </button>
            ) : currentCategory !== 'switching' && (
              <button className="button ghost" onClick={() => {
                // Check if there's a previous category
                const prevCategory = getPreviousCategory(currentCategory);
                if (prevCategory) {
                  // Go back to previous category's usage step (begin scherm)
                  setCurrentCategory(prevCategory);
                  setStep('usage');
                  setCurrentGroupIndex(0);
                }
              }}>
                {t('back')}
              </button>
            )}
            {currentEnabled !== undefined && (
              <button 
                className="button primary" 
                onClick={() => {
                  if (currentEnabled === 'none') {
                    // If we came from finalOverview, always go back there
                    if (cameFromFinalOverviewRef.current) {
                      setStep('finalOverview');
                      setCurrentCategory(null);
                      isInWizardFlowRef.current = false;
                      cameFromFinalOverviewRef.current = false;
                      return;
                    }
                    
                    // Go to next category or overview
                    const nextCategory = getNextCategory(currentCategory);
                    if (nextCategory) {
                      setCurrentCategory(nextCategory);
                      setStep('usage');
                    } else {
                      // All categories done, go to finalOverview
                      setStep('finalOverview');
                      setCurrentCategory(null);
                      isInWizardFlowRef.current = false;
                    }
                  } else {
                    setStep('example');
                  }
                }}
              >
                {t('continueButton')}
              </button>
            )}
          </div>
        </div>
      );
    }

    // Example input step
  if (step === 'example' && currentCategory) {
    const configs = getCategoryConfigs(config, currentCategory);
    
    // If no configs exist, initialize first one
    if (configs.length === 0) {
      if (currentCategory === 'dimming') {
        // Initialize dimming with objects
        const switchingConfigs = getCategoryConfigs(config, 'switching');
        const switchingCategory = switchingConfigs.length > 0 ? switchingConfigs[0] : null;
        let exampleAddresses: ExampleAddress[] = [];
        
        if (switchingCategory && switchingCategory.exampleAddresses.length > 0) {
          // Copy addresses from switching
          exampleAddresses = switchingCategory.exampleAddresses.map(addr => ({ ...addr }));
        } else {
          // Initialize with dimming objects
          exampleAddresses = DIMMING_OBJECTS.map(obj => ({
            objectName: obj.name.toLowerCase(),
            main: 0,
            middle: 0,
            sub: 0,
            dpt: obj.dpt,
            enabled: obj.defaultEnabled,
            mainIncrement: 0,
            middleIncrement: 0,
            subIncrement: 0
          }));
        }
        
        const categoryConfig: TeachByExampleCategoryConfig = {
          id: uid(),
          groupName: 'dimmen 1',
          enabled: 'full',
          linkedToSwitching: true,
          exampleAddresses
        };
        setConfig(prev => ({
          ...prev,
          categories: {
            ...prev.categories,
            [currentCategory]: categoryConfig
          }
        }));
        setCurrentGroupIndex(0);
      } else {
        // For other categories, use handleUsageSelect logic
        return null;
      }
    }
    
    // Get current group
    const currentConfigs = getCategoryConfigs(config, currentCategory);
    let category = currentConfigs[currentGroupIndex] || currentConfigs[0];
    
    // If dimming is linked but has no addresses, initialize them
    if (currentCategory === 'dimming' && 
        category.linkedToSwitching === true && 
        (!category.exampleAddresses || category.exampleAddresses.length === 0)) {
      const switchingConfigs = getCategoryConfigs(config, 'switching');
      const switchingCategory = switchingConfigs.length > 0 ? switchingConfigs[0] : null;
      let exampleAddresses: ExampleAddress[] = [];
      
      if (switchingCategory && switchingCategory.exampleAddresses.length > 0) {
        // Copy addresses from switching
        exampleAddresses = switchingCategory.exampleAddresses.map(addr => ({ ...addr }));
      } else {
        // Initialize with dimming objects
        exampleAddresses = DIMMING_OBJECTS.map(obj => ({
          objectName: obj.name.toLowerCase(),
          main: 0,
          middle: 0,
          sub: 0,
          dpt: obj.dpt,
          enabled: obj.defaultEnabled,
          mainIncrement: 0,
          middleIncrement: 0,
          subIncrement: 0
        }));
      }
      
      updateCategory(currentCategory, { exampleAddresses }, currentGroupIndex);
      category = { ...category, exampleAddresses };
    }
    
    if (!category) return null;

    const allMiddleGroupsSameExtended = (() => {
      const arr = [
        ...(category.exampleAddresses || []).map(addr => addr.middle),
        ...(category.extraObjects || []).map(obj => obj.middle)
      ];
      return [...new Set(arr)].length === 1;
    })();

    const categoryName = {
      switching: t('switch'),
      dimming: t('dimmer'),
      shading: t('blind'),
      hvac: t('hvac')
    }[currentCategory];

    // Special handling for dimming - check if linked to switching
    const isDimmingLinked = currentCategory === 'dimming' && category.linkedToSwitching === true;
    const dimmingConfigs = currentCategory === 'dimming' ? getCategoryConfigs(config, 'dimming') : [];
    const dimmingCategory = dimmingConfigs.length > 0 ? dimmingConfigs[0] : null;
    const hasDimmingAddresses = dimmingCategory?.exampleAddresses && dimmingCategory.exampleAddresses.length > 0;

    // IMPORTANT: If dimming is linked to switching (linkedToSwitching === true), 
    // ALWAYS show the example table - skip the question completely
    // Only show the link question if dimming is NOT linked and not configured yet
    // AND switching is not set to "Volledig gebruiken"
    if (currentCategory === 'dimming' && 
        dimmingCategory &&
        !isDimmingLinked &&
        dimmingCategory.enabled === undefined &&
        dimmingCategory.linkedToSwitching !== true &&
        dimmingCategory.linkedToSwitching !== false && // Not explicitly set to false either
        !hasDimmingAddresses &&
        !(getCategoryConfigs(config, 'switching').some(cfg => cfg.enabled === 'full'))) {
      // Ask if dimming should use same addresses as switching
      return (
        <div className="card">
          <h3>{t('dimmingConfiguration')}</h3>
          <p>{t('useSameAddressesAsSwitching')}</p>

          <div style={{ marginTop: 20 }}>
            <label className="flex" style={{ marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="dimmingLink"
                checked={isDimmingLinked === true}
                onChange={() => {
                  updateCategory('dimming', { linkedToSwitching: true });
                  setStep('overview');
                  setCurrentCategory(null);
                }}
                style={{ marginRight: 8 }}
              />
              <div>
                <strong>{t('yesDimEqualsSwitching')}</strong>
              </div>
            </label>

            <label className="flex" style={{ marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="dimmingLink"
                checked={isDimmingLinked === false || isDimmingLinked === undefined}
                onChange={() => {
                  // Initialize dimming category with default objects if not already configured
                  const dimmingConfigs = getCategoryConfigs(config, 'dimming');
                  const dimmingCategory = dimmingConfigs.length > 0 ? dimmingConfigs[0] : null;
                  if (!dimmingCategory || !dimmingCategory.exampleAddresses || dimmingCategory.exampleAddresses.length === 0) {
                    const defaultObjects = DIMMING_OBJECTS;
                    const exampleAddresses = defaultObjects.map(obj => ({
                      objectName: obj.name.toLowerCase(),
                      main: 0,
                      middle: 0,
                      sub: 0,
                      dpt: obj.dpt,
                      enabled: obj.defaultEnabled,
                      mainIncrement: 0,
                      middleIncrement: 0,
                      subIncrement: 0
                    }));
                    updateCategory('dimming', { 
                      linkedToSwitching: false,
                      enabled: dimmingCategory?.enabled || 'full',
                      exampleAddresses 
                    });
                  } else {
                    updateCategory('dimming', { linkedToSwitching: false });
                  }
                  // Stay in example step to show the address table
                  // The component will re-render and show the example table
                }}
                style={{ marginRight: 8 }}
              />
              <div>
                <strong>Nee, eigen structuur</strong>
              </div>
            </label>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            <button className="button ghost" onClick={() => {
              // When editing from overview, go back to finalOverview instead of usage
              if (startFromOverview && onReturnToOverview) {
                onReturnToOverview();
                setCurrentCategory(null);
                isInWizardFlowRef.current = false;
              } else {
                // Go back to overview or template step
                setStep('finalOverview');
                setCurrentCategory(null);
                isInWizardFlowRef.current = false;
              }
            }}>
              {t('back')}
            </button>
          </div>
        </div>
      );
    }

    const hasMultipleGroups = currentConfigs.length > 1;
    
    return (
      <div className="card">
        <h3>Teach by Example - {categoryName}</h3>
        {hasMultipleGroups && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9em' }}>
              Selecteer groep:
            </label>
            <select
              key={`group-select-${currentCategory}-${(() => {
                const freshConfigs = getCategoryConfigs(config, currentCategory);
                return freshConfigs.map(cfg => cfg.groupName || '').join('-');
              })()}`}
              value={currentGroupIndex}
              onChange={(e) => setCurrentGroupIndex(Number(e.target.value))}
              style={{ 
                padding: '8px 12px', 
                borderRadius: 8, 
                border: '1px solid var(--color-border)', 
                fontSize: '1em', 
                marginBottom: 8,
                minWidth: '300px',
                width: '100%',
                maxWidth: '500px'
              }}
            >
              {(() => {
                const freshConfigs = getCategoryConfigs(config, currentCategory);
                return freshConfigs.map((cfg, idx) => {
                  const displayName = cfg.groupName?.trim() || (idx === 0 ? categoryName : `${categoryName} ${idx + 1}`);
                  return (
                    <option key={`${cfg.id || idx}-${cfg.groupName || ''}`} value={idx}>
                      {displayName}
                    </option>
                  );
                });
              })()}
            </select>
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9em' }}>
            {t('groupNameLabel')}
          </label>
          <input
            type="text"
            value={editingGroupName !== null ? editingGroupName : (() => {
              const currentConfigs = getCategoryConfigs(config, currentCategory);
              const currentCategoryConfig = currentConfigs[currentGroupIndex] || currentConfigs[0];
              return currentCategoryConfig?.groupName ?? '';
            })()}
            onFocus={(e) => {
              const currentConfigs = getCategoryConfigs(config, currentCategory);
              const currentCategoryConfig = currentConfigs[currentGroupIndex] || currentConfigs[0];
              const raw = currentCategoryConfig?.groupName || '';
              setEditingGroupName(raw);
            }}
            onBlur={(e) => {
              const newGroupName = e.target.value.trim();
              const groupIdx = currentGroupIndex;
              const cat = currentCategory;
              if (!cat) return;
              
              const updatedConfig = updateCategoryConfigs(config, cat, (configs) => {
                const next = [...configs];
                if (next.length > groupIdx) {
                  next[groupIdx] = { ...next[groupIdx], groupName: newGroupName };
                }
                return next;
              });
              
              setConfig(updatedConfig);
              skipSyncRef.current = true;
              
              const currentConfig = getCategoryConfigs(updatedConfig, cat)[groupIdx];
              const currentTemplate = convertConfigToTemplate(updatedConfig, template);
              let updatedMainGroups: FixedMainGroupTemplate[] | null = null;
              if (currentTemplate?.devices?.fixed?.mainGroups && 
                  currentConfig?.exampleAddresses?.length) {
                const firstAddress = currentConfig.exampleAddresses[0];
                if (firstAddress.main > 0) {
                  updatedMainGroups = currentTemplate.devices.fixed.mainGroups.map(mg =>
                    mg.main === firstAddress.main ? { ...mg, name: newGroupName } : mg
                  );
                  currentTemplate.devices.fixed.mainGroups = updatedMainGroups;
                }
              }
              setTemplate(currentTemplate);
              if (updatedMainGroups) {
                setFixedAddresses(updatedMainGroups);
              }
              setEditingGroupName(newGroupName);
            }}
            onChange={(e) => {
              // Update the editing state while user is typing
              setEditingGroupName(e.target.value);
            }}
            placeholder={t('groupNamePlaceholder').replace('{category}', categoryName)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '1em' }}
          />
        </div>
        {/* Checkbox for "Voor Dimmen en Schakelen gebruiken" - only show for dimming and only if switching is not "Volledig gebruiken" */}
        {currentCategory === 'dimming' && !(getCategoryConfigs(config, 'switching').some(cfg => cfg.enabled === 'full')) && (
          <div style={{ marginBottom: 16 }}>
            <div className="flex" style={{ alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={category.linkedToSwitching === true}
                onChange={(e) => {
                  const newLinked = e.target.checked;
                  const defaultUnlinked = t('dimmer').toLowerCase();
                  const defaultLinked = `${t('dimmer').toLowerCase()} / ${t('switch').toLowerCase()}`;
                  const currentName = (category.groupName ?? '').trim().toLowerCase();
                  const isCurrentDefaultName = currentName === defaultUnlinked || currentName === defaultLinked;

                  const buildLinkedAddresses = (prev: TeachByExampleTemplateConfig): ExampleAddress[] => {
                    const switchingConfigs = getCategoryConfigs(prev, 'switching');
                    const switchingCategory = switchingConfigs.length > 0 ? switchingConfigs[0] : null;
                    if (switchingCategory && switchingCategory.exampleAddresses.length > 0) {
                      const switchingAddresses = switchingCategory.exampleAddresses;
                      return DIMMING_OBJECTS.map((dimObj) => {
                        const dimObjName = dimObj.name.toLowerCase();
                        let matchingSwitchingAddr = switchingAddresses.find(addr => {
                          const switchObjName = addr.objectName?.toLowerCase() || '';
                          return (dimObjName === 'aan / uit' && switchObjName.includes('aan') && switchObjName.includes('uit') && !switchObjName.includes('status')) ||
                                 (dimObjName === 'aan / uit status' && switchObjName.includes('aan') && switchObjName.includes('uit') && switchObjName.includes('status'));
                        });
                        if (!matchingSwitchingAddr && switchingAddresses.length > 0) {
                          matchingSwitchingAddr = switchingAddresses[0];
                        }
                        return {
                          objectName: dimObjName,
                          main: matchingSwitchingAddr?.main ?? 0,
                          middle: matchingSwitchingAddr?.middle ?? 0,
                          sub: matchingSwitchingAddr?.sub ?? 0,
                          dpt: dimObj.dpt,
                          enabled: dimObj.defaultEnabled,
                          mainIncrement: matchingSwitchingAddr?.mainIncrement ?? 0,
                          middleIncrement: matchingSwitchingAddr?.middleIncrement ?? 0,
                          subIncrement: matchingSwitchingAddr?.subIncrement ?? 0
                        };
                      });
                    }
                    return DIMMING_OBJECTS.map(obj => ({
                      objectName: obj.name.toLowerCase(),
                      main: 0,
                      middle: 0,
                      sub: 0,
                      dpt: obj.dpt,
                      enabled: obj.defaultEnabled,
                      mainIncrement: 0,
                      middleIncrement: 0,
                      subIncrement: 0
                    }));
                  };

                  const defaultAddressesUnlinked: ExampleAddress[] = DIMMING_OBJECTS.map(obj => ({
                    objectName: obj.name.toLowerCase(),
                    main: 0,
                    middle: 0,
                    sub: 0,
                    dpt: obj.dpt,
                    enabled: obj.defaultEnabled,
                    mainIncrement: 0,
                    middleIncrement: 0,
                    subIncrement: 0
                  }));

                  setConfig(prev => {
                    const dimmingConfigs = getCategoryConfigs(prev, 'dimming');
                    const updated = dimmingConfigs.map((cfg) => {
                      const name = (cfg.groupName ?? '').trim().toLowerCase();
                      const isDefaultName = name === defaultUnlinked || name === defaultLinked;
                      if (newLinked) {
                        const existing = cfg.exampleAddresses || [];
                        const hasExisting = existing.length > 0;
                        const exampleAddresses = hasExisting
                          ? existing.map(addr => ({ ...addr }))
                          : buildLinkedAddresses(prev);
                        const updates: Partial<TeachByExampleCategoryConfig> = {
                          linkedToSwitching: true,
                          exampleAddresses
                        };
                        if (isDefaultName) updates.groupName = defaultLinked;
                        return { ...cfg, ...updates };
                      } else {
                        const noAddresses = !cfg.exampleAddresses || cfg.exampleAddresses.length === 0;
                        const updates: Partial<TeachByExampleCategoryConfig> = { linkedToSwitching: false };
                        if (noAddresses) {
                          updates.exampleAddresses = defaultAddressesUnlinked;
                        }
                        if (isDefaultName) updates.groupName = defaultUnlinked;
                        return { ...cfg, ...updates };
                      }
                    });
                    return updateCategoryConfigs(prev, 'dimming', () => updated);
                  });

                  if (isCurrentDefaultName) {
                    setEditingGroupName(newLinked ? defaultLinked : defaultUnlinked);
                  }
                }}
                style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ userSelect: 'none' }}>{t('forDimmingAndSwitching')}</span>
            </div>
            <p className="small" style={{ margin: '6px 0 0 26px', color: 'var(--color-text-secondary)' }}>
              {t('groupNameOverwriteNote')}
            </p>
          </div>
        )}
        {currentCategory === 'dimming' && category.linkedToSwitching && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: 'var(--color-bg)', borderRadius: 8 }}>
            <p className="small" style={{ margin: 0 }}>
              <strong>{t('note')}</strong> {t('dimmingUsesSameAddressesAsSwitching')} {t('fillAddressesForBothSwitchingAndDimming')}
            </p>
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8 }}>{t('fillForOneDeviceZone')}</p>
          <p className="small" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            <strong>{t('note')}</strong> {t('noteIncrementForExtraDevices')} 
            {t('atLeastOneObjectMustHaveIncrement')}
          </p>
        </div>

        <div style={{ marginTop: 20 }}>
          {(() => {
            const middleGroups = category.exampleAddresses.map(addr => addr.middle);
            const uniqueMiddleGroups = [...new Set(middleGroups)];
            const allMiddleGroupsSame = uniqueMiddleGroups.length === 1;
            const objectColMinWidth = currentCategory === 'hvac' ? 200 : 130;

            return (
              <>
              <div style={{ overflowX: 'auto', marginBottom: 16, WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #ccc', minWidth: objectColMinWidth }}>{t('object')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc', width: 80 }}>{t('mainGroup')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc', width: 80 }}>{t('middleGroup')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc', width: 80 }}>{t('subGroup')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #ccc', minWidth: 160, width: 160 }}>DPT</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc', width: 75 }}>{t('mainGroupIncrement')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc', width: 75 }}>{t('middleGroupIncrement')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc', width: 75 }}>{t('subGroupIncrement')}</th>
                    {currentCategory !== 'switching' && currentCategory !== 'dimming' && (
                      <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #ccc', width: 80 }}>{t('used')}</th>
                    )}
                    <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #ccc', width: 80 }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {category.exampleAddresses.map((addr, idx) => {
                    const editingKey = `${currentCategory}-${currentGroupIndex}-${idx}`;
                    const isEditing = editingObjectNames[editingKey] !== undefined;
                    // Get the raw object name (stored in Dutch)
                    const rawObjectName = (addr.objectName || '').trim();
                    
                    // ALWAYS translate for display when not editing
                    // Determine display value
                    let displayValue: string;
                    if (isEditing) {
                      // Show user input while editing
                      displayValue = editingObjectNames[editingKey] || '';
                    } else if (rawObjectName) {
                      // Translate the stored Dutch name to current language
                      console.log(`[TeachByExampleWizard] About to translate: raw="${rawObjectName}", lang="${lang}"`);
                      const translatedName = translateObjectName(rawObjectName, lang);
                      console.log(`[TeachByExampleWizard] Translation result: "${rawObjectName}" -> "${translatedName}" (lang: ${lang})`);
                      // Use translated name if it's different from raw, otherwise use raw
                      const baseDisplayValue = (translatedName && translatedName !== rawObjectName) ? translatedName : rawObjectName;
                      // Capitalize first letter for display
                      displayValue = baseDisplayValue && baseDisplayValue.length > 0 
                        ? baseDisplayValue.charAt(0).toUpperCase() + baseDisplayValue.slice(1)
                        : baseDisplayValue;
                      console.log(`[TeachByExampleWizard] Final displayValue: "${displayValue}"`);
                    } else {
                      displayValue = '';
                    }
                    
                    return (
                    <tr key={idx}>
                      <td style={{ padding: '8px 6px', verticalAlign: 'middle', minWidth: objectColMinWidth }}>
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => {
                            setEditingObjectNames(prev => ({
                              ...prev,
                              [editingKey]: e.target.value
                            }));
                          }}
                          onFocus={() => {
                            setEditingObjectNames(prev => ({
                              ...prev,
                              [editingKey]: addr.objectName || ''
                            }));
                          }}
                          onBlur={(e) => {
                            const trimmedValue = e.target.value.trim();
                            const standardName = getStandardObjectName(trimmedValue);
                            if (standardName !== addr.objectName) {
                              handleExampleAddressChange(idx, 'objectName', standardName);
                            }
                            setEditingObjectNames(prev => {
                              const next = { ...prev };
                              delete next[editingKey];
                              return next;
                            });
                          }}
                          placeholder={t('object')}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <input
                          type="number"
                          min={0}
                          max={31}
                          value={addr.main}
                          onChange={(e) => handleExampleAddressChange(idx, 'main', Number(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <input
                          type="number"
                          min={0}
                          max={7}
                          value={addr.middle}
                          onChange={(e) => handleExampleAddressChange(idx, 'middle', Number(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <input
                          type="number"
                          min={0}
                          max={255}
                          value={addr.sub}
                          onChange={(e) => handleExampleAddressChange(idx, 'sub', Number(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 6px', verticalAlign: 'middle', minWidth: 160, width: 160 }}>
                        <div style={{ width: '100%' }}>
                          <DPTSelector
                            value={addr.dpt || ''}
                            onChange={(dpt) => handleExampleAddressChange(idx, 'dpt', dpt)}
                            placeholder="Selecteer DPT"
                            allowedDPTs={(() => {
                              // Get allowed DPTs for specific object names
                              const objectName = addr.objectName?.toLowerCase() || '';
                              if (objectName === 'ventielsturing' || objectName === 'ventielsturing status') {
                                return ['DPT5.001', 'DPT1.001'];
                              }
                              // Find the object in HVAC_OBJECTS to get allowedDPTs
                              if (currentCategory === 'hvac') {
                                const hvacObject = HVAC_OBJECTS.find(obj => obj.name.toLowerCase() === objectName);
                                if (hvacObject && (hvacObject as any).allowedDPTs) {
                                  return (hvacObject as any).allowedDPTs;
                                }
                              }
                              return undefined;
                            })()}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <select
                          value={addr.mainIncrement ?? 0}
                          onChange={(e) => handleExampleAddressChange(idx, 'mainIncrement', Number(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', minHeight: '36px', boxSizing: 'border-box' }}
                        >
                          <option value={0}>0</option>
                          <option value={1}>+1</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <select
                          value={addr.middleIncrement ?? 0}
                          onChange={(e) => handleExampleAddressChange(idx, 'middleIncrement', Number(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', minHeight: '36px', boxSizing: 'border-box' }}
                        >
                          <option value={0}>0</option>
                          <option value={1}>+1</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <select
                          value={addr.subIncrement ?? 0}
                          onChange={(e) => handleExampleAddressChange(idx, 'subIncrement', Number(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', minHeight: '36px', boxSizing: 'border-box' }}
                        >
                          <option value={0}>0</option>
                          {(!allMiddleGroupsSameExtended || currentCategory === 'hvac' || currentCategory === 'switching') && <option value={1}>+1</option>}
                          {currentCategory === 'dimming' && <option value={5}>+5</option>}
                          <option value={10}>+10</option>
                        </select>
                      </td>
                  {currentCategory !== 'switching' && currentCategory !== 'dimming' && (
                    <td style={{ padding: '8px 6px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={addr.enabled}
                        onChange={(e) => handleExampleAddressChange(idx, 'enabled', e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                    <td style={{ padding: '8px 6px', verticalAlign: 'middle' }} />
                    </tr>
                    );
                  })}

                  {category.extraObjects && category.extraObjects.length > 0 && category.extraObjects.map((obj, idx) => {
                    const editingKey = `extra-${currentCategory}-${currentGroupIndex}-${idx}`;
                    const isEditing = editingObjectNames[editingKey] !== undefined;
                    // Get the raw object name (stored in Dutch)
                    const rawObjectName = (obj.name || '').trim();
                    
                    // ALWAYS translate for display when not editing
                    // Determine display value
                    let displayValue: string;
                    if (isEditing) {
                      // Show user input while editing
                      displayValue = editingObjectNames[editingKey] || '';
                    } else if (rawObjectName) {
                      const translated = translateExtraObjectNameForDisplay(rawObjectName, lang);
                      displayValue = translated && translated.length > 0
                        ? translated.charAt(0).toUpperCase() + translated.slice(1)
                        : translated;
                    } else {
                      displayValue = '';
                    }
                    
                    return (
                    <tr key={obj.id}>
                      <td style={{ padding: '8px 6px', verticalAlign: 'middle', minWidth: objectColMinWidth }}>
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => {
                            setEditingObjectNames(prev => ({
                              ...prev,
                              [editingKey]: e.target.value
                            }));
                          }}
                          onFocus={() => {
                            setEditingObjectNames(prev => ({
                              ...prev,
                              [editingKey]: obj.name || ''
                            }));
                          }}
                          onBlur={(e) => {
                            const trimmedValue = e.target.value.trim();
                            const standardName = getStandardExtraObjectName(trimmedValue);
                            const newObjects = [...category.extraObjects!];
                            newObjects[idx].name = standardName;
                            const normalizedName = standardName.toLowerCase().replace(/\s+/g, ' ').trim();
                            const matchingExample = category.exampleAddresses.find(addr => {
                              const exampleName = (addr.objectName || '').toLowerCase().replace(/\s+/g, ' ').trim();
                              return exampleName === normalizedName;
                            });
                            if (matchingExample) {
                              newObjects[idx].main = matchingExample.main;
                              newObjects[idx].middle = matchingExample.middle;
                            }
                            updateCategory(currentCategory, { extraObjects: newObjects });
                            setEditingObjectNames(prev => {
                              const next = { ...prev };
                              delete next[editingKey];
                              return next;
                            });
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <input
                          type="number"
                          min={0}
                          max={31}
                          value={obj.main}
                          onChange={(e) => {
                            const newObjects = [...category.extraObjects!];
                            const validatedValue = Math.max(0, Math.min(31, Number(e.target.value) || 0));
                            
                            // Check if this applies to dimming, shading, or hvac
                            const shouldAutoSync = currentCategory === 'dimming' || currentCategory === 'shading' || currentCategory === 'hvac';
                            
                            if (shouldAutoSync) {
                              // Calculate the total index of this extra object (exampleAddresses.length + idx)
                              const totalObjectIndex = category.exampleAddresses.length + idx;
                              // Only auto-fill if editing object 0 or 1 (first or second in total)
                              const isEditingFirstOrSecondObject = totalObjectIndex === 0 || totalObjectIndex === 1;
                              
                              if (isEditingFirstOrSecondObject) {
                                // First, update the current object
                                newObjects[idx].main = validatedValue;
                                
                                // Get all objects (both exampleAddresses and extraObjects) for checking
                                const allObjects = [
                                  ...category.exampleAddresses.map(addr => ({ value: addr.main, type: 'example' as const })),
                                  ...newObjects.map(obj => ({ value: obj.main, type: 'extra' as const }))
                                ];
                                
                                // Check only the first 2 object fields
                                if (allObjects.length >= 2) {
                                  const firstValue = allObjects[0]?.value;
                                  const secondValue = allObjects[1]?.value;
                                  
                                  // Only check if both first values are non-zero
                                  if (firstValue > 0 && secondValue > 0) {
                                    if (firstValue === secondValue) {
                                      // Same values: apply to all fields (both exampleAddresses and extraObjects)
                                      const newAddresses = category.exampleAddresses.map(addr => ({
                                        ...addr,
                                        main: firstValue
                                      }));
                                      
                                      newObjects.forEach((extraObj) => {
                                        extraObj.main = firstValue;
                                      });
                                      
                                      updateCategory(currentCategory, { exampleAddresses: newAddresses, extraObjects: newObjects });
                                      return;
                                    } else if (Math.abs(secondValue - firstValue) === 1) {
                                      // Consecutive values: continue numbering from the minimum
                                      const startValue = Math.min(firstValue, secondValue);
                                      
                                      const newAddresses = category.exampleAddresses.map((addr, idx) => ({
                                        ...addr,
                                        main: startValue + idx
                                      }));
                                      
                                      newObjects.forEach((extraObj, idx) => {
                                        extraObj.main = startValue + category.exampleAddresses.length + idx;
                                      });
                                      
                                      updateCategory(currentCategory, { exampleAddresses: newAddresses, extraObjects: newObjects });
                                      return;
                                    }
                                  }
                                }
                                // If no pattern detected, just update the current object
                                newObjects[idx].main = validatedValue;
                                updateCategory(currentCategory, { extraObjects: newObjects });
                                return;
                              } else {
                                // User is editing object 2, 3, 4, etc. - just update that specific object without auto-fill
                                newObjects[idx].main = validatedValue;
                              }
                            } else {
                              // For switching, only update the current object
                              newObjects[idx].main = validatedValue;
                            }
                            
                            updateCategory(currentCategory, { extraObjects: newObjects });
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <input
                          type="number"
                          min={0}
                          max={7}
                          value={obj.middle}
                          onChange={(e) => {
                            const newObjects = [...category.extraObjects!];
                            const validatedValue = Math.max(0, Math.min(7, Number(e.target.value) || 0));
                            
                            // Check if this applies to dimming, shading, or hvac
                            const shouldAutoSync = currentCategory === 'dimming' || currentCategory === 'shading' || currentCategory === 'hvac';
                            
                            if (shouldAutoSync) {
                              // Calculate the total index of this extra object (exampleAddresses.length + idx)
                              const totalObjectIndex = category.exampleAddresses.length + idx;
                              // Only auto-fill if editing object 0 or 1 (first or second in total)
                              const isEditingFirstOrSecondObject = totalObjectIndex === 0 || totalObjectIndex === 1;
                              
                              if (isEditingFirstOrSecondObject) {
                                // First, update the current object
                                newObjects[idx].middle = validatedValue;
                                
                                // Get all objects (both exampleAddresses and extraObjects) for checking
                                const allObjects = [
                                  ...category.exampleAddresses.map(addr => ({ value: addr.middle, type: 'example' as const })),
                                  ...newObjects.map(obj => ({ value: obj.middle, type: 'extra' as const }))
                                ];
                                
                                // Check only the first 2 object fields
                                // If they are the same, ALWAYS apply to all fields (even if more than 7 objects for middle)
                                // If they are consecutive, only apply if <= 7 objects for middle
                                const totalObjects = allObjects.length;
                                const tooManyForAutoNumbering = totalObjects > 7;
                                
                                if (allObjects.length >= 2) {
                                  const firstValue = allObjects[0]?.value;
                                  const secondValue = allObjects[1]?.value;
                                  
                                  // Only check if both first values are non-zero
                                  if (firstValue > 0 && secondValue > 0) {
                                    if (firstValue === secondValue) {
                                      // Same values: ALWAYS apply to all fields (even if more than 7 objects for middle)
                                      const newAddresses = category.exampleAddresses.map(addr => ({
                                        ...addr,
                                        middle: firstValue
                                      }));
                                      
                                      newObjects.forEach((extraObj) => {
                                        extraObj.middle = firstValue;
                                      });
                                      
                                      updateCategory(currentCategory, { exampleAddresses: newAddresses, extraObjects: newObjects });
                                      return;
                                    } else if (!tooManyForAutoNumbering && Math.abs(secondValue - firstValue) === 1) {
                                      // Consecutive values: continue numbering from the minimum
                                      // But only if not too many objects for middle field
                                      const startValue = Math.min(firstValue, secondValue);
                                      
                                      const newAddresses = category.exampleAddresses.map((addr, idx) => ({
                                        ...addr,
                                        middle: startValue + idx
                                      }));
                                      
                                      newObjects.forEach((extraObj, idx) => {
                                        extraObj.middle = startValue + category.exampleAddresses.length + idx;
                                      });
                                      
                                      updateCategory(currentCategory, { exampleAddresses: newAddresses, extraObjects: newObjects });
                                      return;
                                    }
                                  }
                                }
                                // If no pattern detected, just update the current object
                                newObjects[idx].middle = validatedValue;
                                updateCategory(currentCategory, { extraObjects: newObjects });
                                return;
                              } else {
                                // User is editing object 2, 3, 4, etc. - just update that specific object without auto-fill
                                newObjects[idx].middle = validatedValue;
                              }
                            } else {
                              // For switching, only update the current object
                              newObjects[idx].middle = validatedValue;
                            }
                            
                            updateCategory(currentCategory, { extraObjects: newObjects });
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <input
                          type="number"
                          min={0}
                          max={255}
                          value={obj.sub}
                          onChange={(e) => {
                            const newObjects = [...category.extraObjects!];
                            const validatedValue = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                            
                            // ExtraObjects do NOT participate in auto-sync
                            // Just update the current extraObject
                            newObjects[idx].sub = validatedValue;
                            
                            updateCategory(currentCategory, { extraObjects: newObjects });
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 6px', verticalAlign: 'middle', minWidth: 160, width: 160 }}>
                        <div style={{ width: '100%' }}>
                          <DPTSelector
                            value={obj.dpt || ''}
                            onChange={(dpt) => {
                              const newObjects = [...category.extraObjects!];
                              newObjects[idx].dpt = dpt;
                              updateCategory(currentCategory, { extraObjects: newObjects });
                            }}
                            placeholder="Selecteer DPT"
                            allowedDPTs={(() => {
                              // Get allowed DPTs for specific object names
                              const objectName = obj.name?.toLowerCase() || '';
                              if (objectName === 'ventiel sturing' || objectName === 'ventielsturing' || 
                                  objectName === 'ventiel sturing status' || objectName === 'ventielsturing status') {
                                return ['DPT5.001', 'DPT1.001'];
                              }
                              // Find the object in HVAC_OBJECTS to get allowedDPTs
                              if (currentCategory === 'hvac') {
                                const hvacObject = HVAC_OBJECTS.find(hvacObj => hvacObj.name.toLowerCase() === objectName);
                                if (hvacObject && (hvacObject as any).allowedDPTs) {
                                  return (hvacObject as any).allowedDPTs;
                                }
                              }
                              return undefined;
                            })()}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <select
                          value={obj.mainIncrement ?? 0}
                          onChange={(e) => {
                            const newObjects = [...category.extraObjects!];
                            const newValue = Number(e.target.value) === 1 ? 1 : 0;
                            // Apply to all extra objects
                            newObjects.forEach((o, i) => {
                              newObjects[i] = {
                                ...o,
                                mainIncrement: newValue
                              };
                            });
                            updateCategory(currentCategory, { extraObjects: newObjects });
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', minHeight: '36px', boxSizing: 'border-box' }}
                        >
                          <option value={0}>0</option>
                          <option value={1}>+1</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <select
                          value={obj.middleIncrement ?? 0}
                          onChange={(e) => {
                            const newObjects = [...category.extraObjects!];
                            const newValue = Number(e.target.value) === 1 ? 1 : 0;
                            // Apply to all extra objects
                            newObjects.forEach((o, i) => {
                              newObjects[i] = {
                                ...o,
                                middleIncrement: newValue
                              };
                            });
                            updateCategory(currentCategory, { extraObjects: newObjects });
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', minHeight: '36px', boxSizing: 'border-box' }}
                        >
                          <option value={0}>0</option>
                          <option value={1}>+1</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 4px', verticalAlign: 'middle' }}>
                        <select
                          value={obj.subIncrement ?? 0}
                          onChange={(e) => {
                            const newObjects = [...category.extraObjects!];
                            const numValue = Number(e.target.value);
                            // Allow 0, 1 (for switching), 5 (for dimming), 10 (100 removed)
                            // For HVAC, also allow 1 even if all middle groups are the same
                            const allowedValues = currentCategory === 'switching' 
                              ? [0, 1, 10]
                              : currentCategory === 'dimming'
                              ? [0, 1, 5, 10]
                              : currentCategory === 'hvac'
                              ? [0, 1, 10]
                              : [0, 1, 10];
                            const newValue = allowedValues.includes(numValue) ? numValue : 0;
                            // Apply to all extra objects
                            newObjects.forEach((o, i) => {
                              newObjects[i] = {
                                ...o,
                                subIncrement: newValue
                              };
                            });
                            updateCategory(currentCategory, { extraObjects: newObjects });
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)', fontSize: '0.9em', minHeight: '36px', boxSizing: 'border-box' }}
                        >
                          <option value={0}>0</option>
                          {(!allMiddleGroupsSameExtended || currentCategory === 'hvac' || currentCategory === 'switching') && <option value={1}>+1</option>}
                          {currentCategory === 'dimming' && <option value={5}>+5</option>}
                          <option value={10}>+10</option>
                        </select>
                      </td>
                    {currentCategory !== 'switching' && currentCategory !== 'dimming' && (
                      <td style={{ padding: '8px 6px', verticalAlign: 'middle' }} />
                    )}
                    <td style={{ padding: 8 }}>
                      <button
                        className="button ghost"
                        onClick={() => {
                          const newObjects = category.extraObjects!.filter(o => o.id !== obj.id);
                          updateCategory(currentCategory, { extraObjects: newObjects });
                        }}
                        style={{ color: 'var(--color-danger)', padding: '4px 8px', fontSize: '0.85rem' }}
                        title="Verwijderen"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                  );
                })}
                                </tbody>
              </table>
              </div>
              {(category.exampleAddresses.some(addr => (addr.subIncrement ?? 0) === 1) || currentCategory === 'hvac') && (
                <div style={{ marginTop: 12 }}>
                  <button className="button secondary" onClick={handleAddExtraObject} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                    ➕ {t('addExtraObject')}
                  </button>
                </div>
              )}
            </>
            );
          })()}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button className="button secondary" onClick={handleAddExtraGroup}>
            ➕ {t('addExtraGroup').replace('{category}', categoryName)}
          </button>
          {hasMultipleGroups && (
            <button 
              className="button ghost" 
              onClick={handleDeleteGroup}
              style={{ color: 'var(--color-danger)' }}
            >
              🗑️ {t('removeGroup')}
            </button>
          )}
        </div>

        {/* Extra configuratie voor HVAC wanneer middengroep toename +1 is */}
        {currentCategory === 'hvac' && category.exampleAddresses && (
          <div style={{ marginTop: 24 }}>
            <div className="card" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 16 }}>
              <h4 style={{ marginTop: 0, marginBottom: 12 }}>{t('extraMainGroupsConfiguration')}</h4>
              {category.exampleAddresses.some(addr => (addr.middleIncrement ?? 0) === 1) ? (
                <div style={{ marginBottom: 16 }}>
                  <p className="small" style={{ marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                    {t('whenMiddleGroupIncrementIs1')} {t('forExtraZonesNextMainGroup')} {t('theseMainGroupsBlockedInFixed')}
                  </p>
                  {(() => {
                    const startMiddle = category.exampleAddresses[0]?.middle ?? 0;
                    const zonesPerMainGroup = Math.max(0, 8 - startMiddle);
                    let totalZones = zonesPerMainGroup;
                    if (category.pattern?.extraMainGroups && category.pattern.extraMainGroups.length > 0) {
                      category.pattern.extraMainGroups.forEach((extraGroup: any) => {
                        const extraStartMiddle = extraGroup.middle ?? 0;
                        totalZones += Math.max(0, 8 - extraStartMiddle);
                      });
                    }
                    const hasFilledGroups = category.exampleAddresses.length > 0 && (category.exampleAddresses[0]?.main != null || category.exampleAddresses[0]?.middle != null);
                    if (!hasFilledGroups || totalZones <= 0) return null;
                    return (
                      <p className="small" style={{ marginTop: 8, fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {t('maxZonesCountOnly', { count: totalZones })}
                      </p>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <p className="small" style={{ marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                    {t('ifYouSetMiddleGroupIncrementTo1')} {t('forExtraZonesYouCanSpecifyNextMainGroup')} {t('theseMainGroupsBlockedInFixed')}
                  </p>
                  {(() => {
                    const startMiddle = category.exampleAddresses[0]?.middle ?? 0;
                    const zonesPerMainGroup = Math.max(0, 8 - startMiddle);
                    const hasFilledGroups = category.exampleAddresses.length > 0 && (category.exampleAddresses[0]?.main != null || category.exampleAddresses[0]?.middle != null);
                    if (!hasFilledGroups || zonesPerMainGroup <= 0) return null;
                    return (
                      <p className="small" style={{ marginTop: 8, fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {t('middleGroupIncrement1MaxZones', { count: zonesPerMainGroup })}
                      </p>
                    );
                  })()}
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(category.pattern?.extraMainGroups || []).map((extraGroup, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ minWidth: 100 }}>{t('mainGroup')}:</span>
                      <input
                        type="number"
                        min={0}
                        max={31}
                        value={extraGroup.main}
                        onChange={(e) => {
                          const main = Math.max(0, Math.min(31, Number(e.target.value) || 0));
                          const currentPattern = category.pattern || {
                            fixedMain: category.exampleAddresses[0]?.main ?? 0,
                            middleGroupPattern: 'same' as const,
                            subGroupPattern: 'increment' as const,
                            objectsPerDevice: category.exampleAddresses.length,
                            startSub: category.exampleAddresses[0]?.sub ?? 1
                          };
                          const updatedExtraGroups = [...(currentPattern.extraMainGroups || [])];
                          const newGroup = { ...updatedExtraGroups[idx], main };
                          
                          // Check if this combination already exists (excluding current index)
                          const isDuplicate = updatedExtraGroups.some((g, i) => 
                            i !== idx && g.main === newGroup.main && g.middle === newGroup.middle
                          );
                          
                          if (isDuplicate) {
                            alert(`De combinatie ${newGroup.main}/${newGroup.middle} bestaat al. Elke hoofd/middengroep combinatie moet uniek zijn.`);
                            return;
                          }
                          
                          updatedExtraGroups[idx] = newGroup;
                          const updatedPattern = { ...currentPattern, extraMainGroups: updatedExtraGroups };
                          updateCategory(currentCategory, { pattern: updatedPattern }, currentGroupIndex);
                        }}
                        style={{ width: 80, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)' }}
                      />
                    </label>
                    
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ minWidth: 100 }}>{t('middleGroup')}:</span>
                      <input
                        type="number"
                        min={0}
                        max={7}
                        value={extraGroup.middle}
                        onChange={(e) => {
                          const middle = Math.max(0, Math.min(7, Number(e.target.value) || 0));
                          const currentPattern = category.pattern || {
                            fixedMain: category.exampleAddresses[0]?.main ?? 0,
                            middleGroupPattern: 'same' as const,
                            subGroupPattern: 'increment' as const,
                            objectsPerDevice: category.exampleAddresses.length,
                            startSub: category.exampleAddresses[0]?.sub ?? 1
                          };
                          const updatedExtraGroups = [...(currentPattern.extraMainGroups || [])];
                          const newGroup = { ...updatedExtraGroups[idx], middle };
                          
                          // Check if this combination already exists (excluding current index)
                          const isDuplicate = updatedExtraGroups.some((g, i) => 
                            i !== idx && g.main === newGroup.main && g.middle === newGroup.middle
                          );
                          
                          if (isDuplicate) {
                            alert(`De combinatie ${newGroup.main}/${newGroup.middle} bestaat al. Elke hoofd/middengroep combinatie moet uniek zijn.`);
                            return;
                          }
                          
                          updatedExtraGroups[idx] = newGroup;
                          const updatedPattern = { ...currentPattern, extraMainGroups: updatedExtraGroups };
                          updateCategory(currentCategory, { pattern: updatedPattern }, currentGroupIndex);
                        }}
                        style={{ width: 80, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)' }}
                      />
                    </label>
                    
                    <button
                      className="button ghost"
                      onClick={() => {
                        const currentPattern = category.pattern || {
                          fixedMain: category.exampleAddresses[0]?.main ?? 0,
                          middleGroupPattern: 'same' as const,
                          subGroupPattern: 'increment' as const,
                          objectsPerDevice: category.exampleAddresses.length,
                          startSub: category.exampleAddresses[0]?.sub ?? 1
                        };
                        const updatedExtraGroups = (currentPattern.extraMainGroups || []).filter((_, i) => i !== idx);
                        const updatedPattern = { ...currentPattern, extraMainGroups: updatedExtraGroups.length > 0 ? updatedExtraGroups : undefined };
                        updateCategory(currentCategory, { pattern: updatedPattern }, currentGroupIndex);
                      }}
                      style={{ color: 'var(--color-danger)', padding: '6px 12px' }}
                      title="Verwijderen"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                
                <button
                  className="button secondary"
                  onClick={() => {
                    const currentPattern = category.pattern || {
                      fixedMain: category.exampleAddresses[0]?.main ?? 0,
                      middleGroupPattern: 'same' as const,
                      subGroupPattern: 'increment' as const,
                      objectsPerDevice: category.exampleAddresses.length,
                      startSub: category.exampleAddresses[0]?.sub ?? 1
                    };
                    const existingGroups = currentPattern.extraMainGroups || [];
                    
                    // Calculate next main group: if there are existing groups, use highest + 1, otherwise use fixedMain + 1
                    let nextMain: number;
                    if (existingGroups.length > 0) {
                      const highestMain = Math.max(...existingGroups.map(g => g.main));
                      nextMain = highestMain + 1;
                    } else {
                      nextMain = (category.exampleAddresses[0]?.main ?? 0) + 1;
                    }
                    
                    // Clamp to valid range
                    nextMain = Math.max(0, Math.min(31, nextMain));
                    
                    const newExtraGroup = {
                      main: nextMain,
                      middle: 1
                    };
                    
                    // Check if this combination already exists
                    const isDuplicate = existingGroups.some(g => 
                      g.main === newExtraGroup.main && g.middle === newExtraGroup.middle
                    );
                    
                    if (isDuplicate) {
                      alert(`De combinatie ${newExtraGroup.main}/${newExtraGroup.middle} bestaat al. Elke hoofd/middengroep combinatie moet uniek zijn.`);
                      return;
                    }
                    
                    const updatedExtraGroups = [...existingGroups, newExtraGroup];
                    const updatedPattern = { ...currentPattern, extraMainGroups: updatedExtraGroups };
                    updateCategory(currentCategory, { pattern: updatedPattern }, currentGroupIndex);
                  }}
                  style={{ alignSelf: 'flex-start', padding: '6px 12px' }}
                >
                  ➕ {t('addExtraMainMiddleGroup')}
                </button>
              </div>
              
              {(category.pattern?.extraMainGroups && category.pattern.extraMainGroups.length > 0) && (
                <div style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(196, 186, 143, 0.1)', borderRadius: 8 }}>
                  <p className="small" style={{ margin: 0, fontWeight: 'bold' }}>{t('blockedMainGroups')}</p>
                  <p className="small" style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
                    {(() => {
                      const blockedMains = [...new Set(category.pattern.extraMainGroups!.map(g => g.main))].sort((a, b) => a - b);
                      return blockedMains.length > 0 ? blockedMains.join(', ') : 'Geen';
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <button className="button ghost" onClick={() => {
            // When editing from overview, go back to finalOverview instead of usage
            if (startFromOverview && onReturnToOverview) {
              onReturnToOverview();
              setCurrentCategory(null);
              isInWizardFlowRef.current = false;
            } else {
              // Go back to overview or template step
              setStep('finalOverview');
              setCurrentCategory(null);
              isInWizardFlowRef.current = false;
            }
          }}>
            {t('back')}
          </button>
          <button
            className="button secondary"
            onClick={() => {
              if (!currentCategory) return;
              
              // Check if there are devices configured for this category
              const { devices } = useAppStore.getState();
              const categoryMapping: Record<CategoryKey, 'switch' | 'dimmer' | 'blind' | 'hvac'> = {
                switching: 'switch',
                dimming: 'dimmer',
                shading: 'blind',
                hvac: 'hvac'
              };
              const deviceCategory = categoryMapping[currentCategory];
              const categoryDevices = devices[deviceCategory];
              
              const categoryName = {
                switching: t('switch'),
                dimming: t('dimmer'),
                shading: t('blind'),
                hvac: t('hvac')
              }[currentCategory];
              
              // Check if there are devices configured
              if (categoryDevices && categoryDevices.length > 0) {
                // Show warning that devices will be removed
                const warningMessage = t('confirmRemoveDevicesWhenNotUsed')?.replace('{category}', categoryName) || 
                  `Als je "${categoryName}" instelt op "niet gebruiken", worden alle ${categoryName} devices verwijderd uit de Configuratie. Weet je zeker dat je door wilt gaan?`;
                
                if (!confirm(warningMessage)) {
                  // User cancelled, don't proceed
                  return;
                }
                
                // Remove all devices for this category
                const { removeDevice } = useAppStore.getState();
                categoryDevices.forEach(device => {
                  removeDevice(deviceCategory, device.id);
                });
              }
              
              // Set category to "not used" - remove pattern and exampleAddresses
              // Get current config to preserve id and groupName
              const currentConfigs = getCategoryConfigs(config, currentCategory);
              const currentConfig = currentConfigs[currentGroupIndex] || currentConfigs[0];
              
              const categoryConfig: TeachByExampleCategoryConfig = {
                id: currentConfig?.id || category.id || uid(),
                groupName: currentConfig?.groupName || category.groupName || categoryName.toLowerCase(),
                enabled: 'none',
                exampleAddresses: [],
                // Explicitly remove pattern
                pattern: undefined
              };
              
              // Update config - ensure pattern is removed from all groups
              setConfig(prev => {
                const prevConfigs = getCategoryConfigs(prev, currentCategory);
                const updatedConfigs = prevConfigs.map((cfg, idx) => 
                  idx === currentGroupIndex ? {
                    ...cfg,
                    enabled: 'none',
                    exampleAddresses: [],
                    pattern: undefined, // Explicitly remove pattern
                    extraObjects: undefined // Also remove extra objects
                  } : cfg
                );
                
                return {
                  ...prev,
                  categories: {
                    ...prev.categories,
                    [currentCategory]: updatedConfigs.length === 1 ? updatedConfigs[0] : updatedConfigs
                  }
                };
              });
              
              // Also update template to remove pattern
              if (template) {
                const updatedConfig = {
                  ...config,
                  categories: {
                    ...config.categories,
                    [currentCategory]: categoryConfig
                  }
                };
                const updatedTemplate = {
                  ...template,
                  teachByExampleConfig: updatedConfig
                };
                setTemplate(updatedTemplate);
              }
              
              // Mark template as having changes
              useAppStore.setState({ templateHasChanges: true });
              
              // Save template if we have a template ID
              const { currentTemplateId, username, saveUserTemplate } = useAppStore.getState();
              if (currentTemplateId && username) {
                try {
                  saveUserTemplate();
                  console.log('Template saved after setting category to "not used"');
                } catch (err) {
                  console.error('Error saving template:', err);
                }
              }
              
              // Go back to overview
              if (startFromOverview && onReturnToOverview) {
                onReturnToOverview();
                setCurrentCategory(null);
                isInWizardFlowRef.current = false;
              } else {
                setStep('finalOverview');
                setCurrentCategory(null);
                isInWizardFlowRef.current = false;
              }
            }}
          >
            {t('notUse')}
          </button>
          <button
            className="button primary"
            onClick={handleAnalyze}
            disabled={category.exampleAddresses.length === 0 || category.exampleAddresses.some(a => 
              isNaN(a.main) || isNaN(a.middle) || isNaN(a.sub) ||
              a.main === 0 && a.middle === 0 && a.sub === 0
            )}
          >
            {t('analyzePattern')}
          </button>
        </div>
      </div>
    );
  }

  // Analysis result step
  if (step === 'analysis' && currentCategory) {
    const configs = getCategoryConfigs(config, currentCategory);
    const category = configs[currentGroupIndex] || configs[0];
    const pattern = category?.pattern;

    return (
      <div className="card">
        <h3>Patroon geanalyseerd - {currentCategory}</h3>
        
        {pattern && (
          <div style={{ marginTop: 20 }}>
            <div className="card" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <h4>Gedetecteerd patroon:</h4>
              <ul style={{ marginTop: 12 }}>
                <li>{t('mainGroupFixed').replace('{main}', pattern.fixedMain.toString())}</li>
                <li>{t('middleGroupPattern')}: {pattern.middleGroupPattern === 'same' ? t('middleGroupPatternSame') : t('middleGroupPatternDifferent')}</li>
                <li>{t('subGroupPattern')} {
                  pattern.subGroupPattern === 'increment' ? t('incrementing') :
                  pattern.subGroupPattern === 'offset' ? t('offset').replace('{value}', String(pattern.offsetValue || 0)) :
                  t('sequence')
                }</li>
                <li>{t('objectsPerDevice').replace('{count}', pattern.objectsPerDevice.toString())}</li>
                {pattern.startSub && <li>{t('startSubGroupLabel').replace('{sub}', pattern.startSub.toString())}</li>}
              </ul>
            </div>
            
            {/* Extra configuratie voor HVAC wanneer middengroep toename +1 is */}
            {currentCategory === 'hvac' && category.exampleAddresses && (
              <div style={{ marginTop: 20 }}>
                <div className="card" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 16 }}>
                  <h4 style={{ marginTop: 0, marginBottom: 12 }}>{t('extraMainGroupsConfiguration')}</h4>
                  {category.exampleAddresses.some(addr => (addr.middleIncrement ?? 0) === 1) ? (
                    <div style={{ marginBottom: 16 }}>
                      <p className="small" style={{ marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                        {t('whenMiddleGroupIncrementIs1')} {t('forExtraZonesNextMainGroup')} {t('theseMainGroupsBlockedInFixed')}
                      </p>
                      {(() => {
                        const startMiddle = category.exampleAddresses[0]?.middle ?? 0;
                        const zonesPerMainGroup = Math.max(0, 8 - startMiddle);
                        let totalZones = zonesPerMainGroup;
                        const pattern = category.pattern;
                        if (pattern?.extraMainGroups && pattern.extraMainGroups.length > 0) {
                          pattern.extraMainGroups.forEach((extraGroup: any) => {
                            const extraStartMiddle = extraGroup.middle ?? 0;
                            totalZones += Math.max(0, 8 - extraStartMiddle);
                          });
                        }
                        const hasFilledGroups = category.exampleAddresses.length > 0 && (category.exampleAddresses[0]?.main != null || category.exampleAddresses[0]?.middle != null);
                        if (!hasFilledGroups || totalZones <= 0) return null;
                        return (
                          <p className="small" style={{ marginTop: 8, fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {t('maxZonesCountOnly', { count: totalZones })}
                          </p>
                        );
                      })()}
                    </div>
                  ) : (
                    <div style={{ marginBottom: 16 }}>
                      <p className="small" style={{ marginBottom: 8, color: 'var(--color-text-secondary)' }}>
                        {t('ifYouSetMiddleGroupIncrementTo1')} {t('forExtraZonesYouCanSpecifyNextMainGroup')} {t('theseMainGroupsBlockedInFixed')}
                      </p>
                      {(() => {
                        const startMiddle = category.exampleAddresses[0]?.middle ?? 0;
                        const zonesPerMainGroup = Math.max(0, 8 - startMiddle);
                        const hasFilledGroups = category.exampleAddresses.length > 0 && (category.exampleAddresses[0]?.main != null || category.exampleAddresses[0]?.middle != null);
                        if (!hasFilledGroups || zonesPerMainGroup <= 0) return null;
                        return (
                          <p className="small" style={{ marginTop: 8, fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {t('middleGroupIncrement1MaxZones', { count: zonesPerMainGroup })}
                          </p>
                        );
                      })()}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(pattern?.extraMainGroups || []).map((extraGroup: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ minWidth: 100 }}>{t('mainGroup')}:</span>
                          <input
                            type="number"
                            min={0}
                            max={31}
                            value={extraGroup.main}
                            onChange={(e) => {
                              const main = Math.max(0, Math.min(31, Number(e.target.value) || 0));
                              const updatedExtraGroups = [...(pattern.extraMainGroups || [])];
                              const newGroup = { ...updatedExtraGroups[idx], main };
                              
                              // Check if this combination already exists (excluding current index)
                              const isDuplicate = updatedExtraGroups.some((g, i) => 
                                i !== idx && g.main === newGroup.main && g.middle === newGroup.middle
                              );
                              
                              if (isDuplicate) {
                                alert(`De combinatie ${newGroup.main}/${newGroup.middle} bestaat al. Elke hoofd/middengroep combinatie moet uniek zijn.`);
                                return;
                              }
                              
                              updatedExtraGroups[idx] = newGroup;
                              const updatedPattern = { ...pattern, extraMainGroups: updatedExtraGroups };
                              updateCategory(currentCategory, { pattern: updatedPattern }, currentGroupIndex);
                            }}
                            style={{ width: 80, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)' }}
                          />
                        </label>
                        
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ minWidth: 100 }}>{t('middleGroup')}:</span>
                          <input
                            type="number"
                            min={0}
                            max={7}
                            value={extraGroup.middle}
                            onChange={(e) => {
                              const middle = Math.max(0, Math.min(7, Number(e.target.value) || 0));
                              const updatedExtraGroups = [...(pattern.extraMainGroups || [])];
                              const newGroup = { ...updatedExtraGroups[idx], middle };
                              
                              // Check if this combination already exists (excluding current index)
                              const isDuplicate = updatedExtraGroups.some((g, i) => 
                                i !== idx && g.main === newGroup.main && g.middle === newGroup.middle
                              );
                              
                              if (isDuplicate) {
                                alert(`De combinatie ${newGroup.main}/${newGroup.middle} bestaat al. Elke hoofd/middengroep combinatie moet uniek zijn.`);
                                return;
                              }
                              
                              updatedExtraGroups[idx] = newGroup;
                              const updatedPattern = { ...pattern, extraMainGroups: updatedExtraGroups };
                              updateCategory(currentCategory, { pattern: updatedPattern }, currentGroupIndex);
                            }}
                            style={{ width: 80, padding: '6px 8px', borderRadius: 4, border: '1px solid var(--color-border)' }}
                          />
                        </label>
                        
                        <button
                          className="button ghost"
                          onClick={() => {
                            const updatedExtraGroups = (pattern.extraMainGroups || []).filter((_, i) => i !== idx);
                            const updatedPattern = { ...pattern, extraMainGroups: updatedExtraGroups.length > 0 ? updatedExtraGroups : undefined };
                            updateCategory(currentCategory, { pattern: updatedPattern }, currentGroupIndex);
                          }}
                          style={{ color: 'var(--color-danger)', padding: '6px 12px' }}
                          title="Verwijderen"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    
                    <button
                      className="button secondary"
                      onClick={() => {
                        const existingGroups = pattern.extraMainGroups || [];
                        
                        // Calculate next main group: if there are existing groups, use highest + 1, otherwise use fixedMain + 1
                        let nextMain: number;
                        if (existingGroups.length > 0) {
                          const highestMain = Math.max(...existingGroups.map(g => g.main));
                          nextMain = highestMain + 1;
                        } else {
                          nextMain = pattern.fixedMain + 1;
                        }
                        
                        // Clamp to valid range
                        nextMain = Math.max(0, Math.min(31, nextMain));
                        
                        const newExtraGroup = {
                          main: nextMain,
                          middle: 1
                        };
                        
                        // Check if this combination already exists
                        const isDuplicate = existingGroups.some(g => 
                          g.main === newExtraGroup.main && g.middle === newExtraGroup.middle
                        );
                        
                        if (isDuplicate) {
                          alert(`De combinatie ${newExtraGroup.main}/${newExtraGroup.middle} bestaat al. Elke hoofd/middengroep combinatie moet uniek zijn.`);
                          return;
                        }
                        
                        const updatedExtraGroups = [...existingGroups, newExtraGroup];
                        const updatedPattern = { ...pattern, extraMainGroups: updatedExtraGroups };
                        updateCategory(currentCategory, { pattern: updatedPattern }, currentGroupIndex);
                      }}
                      style={{ alignSelf: 'flex-start', padding: '6px 12px' }}
                    >
                      ➕ {t('addExtraMainMiddleGroup')}
                    </button>
                  </div>
                  
                  {(pattern.extraMainGroups && pattern.extraMainGroups.length > 0) && (
                    <div style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(196, 186, 143, 0.1)', borderRadius: 8 }}>
                      <p className="small" style={{ margin: 0, fontWeight: 'bold' }}>{t('blockedMainGroups')}</p>
                      <p className="small" style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
                        {(() => {
                          const blockedMains = [...new Set(pattern.extraMainGroups!.map(g => g.main))].sort((a, b) => a - b);
                          return blockedMains.length > 0 ? blockedMains.join(', ') : 'Geen';
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <button className="button ghost" onClick={() => setStep('example')}>
            {t('back')}
          </button>
          <button 
            className="button primary" 
            onClick={() => {
              // Always re-analyze when clicking "Analyseren" button
              // This allows re-analysis after making changes
              handleAnalyze();
            }}
            disabled={isAnalyzing}
            style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {isAnalyzing ? (
              <>
                <span style={{ 
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }}></span>
                <span>Analyseren...</span>
              </>
            ) : (
              'Analyseren'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Final overview step - show fixed addresses and patterns
  // Show finalOverview if step is finalOverview (either from viewing or editing a template)
  // This overview is shown even if not all categories are configured
  if (step === 'finalOverview') {
    // Calculate blocked main groups from HVAC patterns
    const getBlockedMainGroups = (): number[] => {
      const blocked: number[] = [];
      const hvacConfigs = getCategoryConfigs(config, 'hvac');
      hvacConfigs.forEach(category => {
        // Check if any object has middleIncrement === 1
        const hasMiddleIncrement = category.exampleAddresses?.some(addr => (addr.middleIncrement ?? 0) === 1);
        if (hasMiddleIncrement) {
          // Block main groups from extraMainGroups array
          if (category.pattern?.extraMainGroups && category.pattern.extraMainGroups.length > 0) {
            category.pattern.extraMainGroups.forEach(extraGroup => {
              if (!blocked.includes(extraGroup.main)) {
                blocked.push(extraGroup.main);
              }
            });
          }
          // Also support legacy nextMainGroup (for backwards compatibility)
          if (category.pattern?.nextMainGroup !== undefined) {
            if (!blocked.includes(category.pattern.nextMainGroup)) {
              blocked.push(category.pattern.nextMainGroup);
            }
          }
        }
      });
      return blocked.sort((a, b) => a - b);
    };
    
    const blockedMainGroups = getBlockedMainGroups();

    return (
      <div>
        <div className="card">
          <h3>{t('templateConfiguration')}</h3>
          <p>{t('configureFixedAddressesAndViewPatterns')}</p>
        </div>

        {/* Patterns Overview - hoofdfuncties eerst (schakelen, dimmen, jaloezie, klimaat) */}
        <div className="card" style={{ marginTop: 16 }}>
          <h4>{t('analyzedPatternsPerMainFunction')}</h4>
          
          <div style={{ marginTop: 24 }}>
            {getAllCategories().map((catKey) => {
              const categoryConfigs = getCategoryConfigs(config, catKey);
              
              // Always show all categories, even if they don't exist or are not used
              // If no configs exist, show category as "not used"
              if (categoryConfigs.length === 0) {
                const categoryName = catKey === 'switching' ? t('switch') : 
                                     catKey === 'dimming' ? t('dimmer') : 
                                     catKey === 'shading' ? t('blind') : 
                                     t('hvac');
                
                return (
                  <div key={catKey} style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px' }}>
                    <div className="flex-between" style={{ marginBottom: '12px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: 0 }}>{categoryName}</h4>
                      <button 
                        className="button secondary" 
                        onClick={() => {
                          setCurrentCategory(catKey);
                          setStep('usage');
                        }}
                        style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                      >
                        {t('editCategory')} {categoryName}
                      </button>
                    </div>
                    <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'var(--color-bg-card)', borderRadius: '8px' }}>
                      <p className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
                        {t('notUsed')}
                      </p>
                    </div>
                  </div>
                );
              }
              
              // One card per category; all groups inside with group names
              const categoryName = catKey === 'switching' ? t('switch') : 
                                   catKey === 'dimming' ? t('dimmer') : 
                                   catKey === 'shading' ? t('blind') : 
                                   t('hvac');
              return (
                <div key={catKey} style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px' }}>
                  <div className="flex-between" style={{ marginBottom: '12px' }}>
                    <h4 style={{ marginTop: 0, marginBottom: 0 }}>{categoryName}</h4>
                    <button 
                      className="button secondary" 
                      onClick={() => {
                        setCurrentCategory(catKey);
                        setStep('usage');
                        setCurrentGroupIndex(0);
                        isInWizardFlowRef.current = true;
                        cameFromFinalOverviewRef.current = true;
                      }}
                      style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                    >
                      {t('editCategory')} {categoryName}
                    </button>
                  </div>
                  {categoryConfigs.map((category, groupIdx) => {
                    const raw = (category.groupName || '').trim();
                    const groupDisplayName = raw
                      ? translateGroupNameForDisplay(raw, lang)
                      : translateGroupName(category.groupName, catKey, groupIdx);
                    const isFirst = groupIdx === 0;
                    const groupBlockStyle: React.CSSProperties = {
                      marginTop: isFirst ? 0 : 20,
                      paddingTop: isFirst ? 0 : 16,
                      borderTop: isFirst ? 'none' : '1px solid var(--color-border)'
                    };

                    // "Not used" group block
                    if (category.enabled === 'none' && !(catKey === 'dimming' && category.linkedToSwitching)) {
                      return (
                        <div key={category.id || groupIdx} style={groupBlockStyle}>
                          <h5 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 'bold' }}>{groupDisplayName}</h5>
                          <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-card)', borderRadius: '8px' }}>
                            <p className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
                              {t('notUsed')}
                            </p>
                          </div>
                        </div>
                      );
                    }

              // Special handling for dimming linked to switching - always show it
              if (catKey === 'dimming' && category.linkedToSwitching === true) {
                // Show that dimming uses same addresses as switching
                const switchingConfigs = getCategoryConfigs(config, 'switching');
                const switchingCategory = switchingConfigs.length > 0 ? switchingConfigs[0] : null;
                
                // Ensure dimming has the pattern from switching
                if (!category.pattern && switchingCategory?.pattern) {
                  updateCategory('dimming', { pattern: switchingCategory.pattern });
                }
                
                // Use the pattern from dimming (which should be the same as switching) or from switching as fallback
                const pattern = category.pattern || switchingCategory?.pattern;
                
                // Use the original example addresses from dimming category
                // These should match the switching addresses if they were copied, or be the dimming addresses
              // Helper function to calculate next address based on increments
              const calculateNextAddress = (main: number, middle: number, sub: number, mainInc: number, middleInc: number, subInc: number): string => {
                const nextMain = Math.max(0, Math.min(31, main + mainInc));
                const nextMiddle = Math.max(0, Math.min(7, middle + middleInc));
                const nextSub = Math.max(0, Math.min(255, sub + subInc));
                return `${nextMain}/${nextMiddle}/${nextSub}`;
              };
              
              const exampleAddresses: Array<{ objectName: string; address: string; nextAddress?: string; main?: number; middle?: number }> = [];
              if (category.exampleAddresses && category.exampleAddresses.length > 0) {
                // Use the dimming example addresses (which may have been copied from switching)
                category.exampleAddresses.forEach((exampleObj) => {
                  const mainInc = exampleObj.mainIncrement ?? 0;
                  const middleInc = exampleObj.middleIncrement ?? 0;
                  const subInc = exampleObj.subIncrement ?? 0;
                  // Get object name from template configuration (already translated) or fallback to stored objectName
                  const templateObjectName = getObjectNameFromTemplate(exampleObj.main, exampleObj.middle, 'dimming');
                  exampleAddresses.push({
                    objectName: templateObjectName || exampleObj.objectName || '',
                    address: `${exampleObj.main}/${exampleObj.middle}/${exampleObj.sub}`,
                    nextAddress: calculateNextAddress(exampleObj.main, exampleObj.middle, exampleObj.sub, mainInc, middleInc, subInc),
                    main: exampleObj.main,
                    middle: exampleObj.middle
                  });
                });
              } else if (switchingCategory && switchingCategory.exampleAddresses) {
                // Fallback: use switching addresses if dimming addresses are not available
                switchingCategory.exampleAddresses.forEach((exampleObj) => {
                  const mainInc = exampleObj.mainIncrement ?? 0;
                  const middleInc = exampleObj.middleIncrement ?? 0;
                  const subInc = exampleObj.subIncrement ?? 0;
                  // Get object name from template configuration (already translated) or fallback to stored objectName
                  const templateObjectName = getObjectNameFromTemplate(exampleObj.main, exampleObj.middle, 'switching');
                  exampleAddresses.push({
                    objectName: templateObjectName || exampleObj.objectName || '',
                    address: `${exampleObj.main}/${exampleObj.middle}/${exampleObj.sub}`,
                    nextAddress: calculateNextAddress(exampleObj.main, exampleObj.middle, exampleObj.sub, mainInc, middleInc, subInc),
                    main: exampleObj.main,
                    middle: exampleObj.middle
                  });
                });
              }
                
                // If no pattern available yet, show message
                if (!pattern) {
                  return (
                    <div key={category.id || groupIdx} style={groupBlockStyle}>
                      <h5 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 'bold' }}>{groupDisplayName}</h5>
                      <p className="small">{t('dimmingUsesSameAddresses')}</p>
                      <p className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                        {t('analyzeSwitchingFirst')}
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div key={category.id || groupIdx} style={groupBlockStyle}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 'bold' }}>{groupDisplayName}</h5>
                    <p className="small" style={{ marginBottom: 8 }}>{t('dimmingUsesSameAddresses')}</p>
                    {/* Show the pattern (from dimming or switching) */}
                      <div style={{ marginTop: 12, padding: 12, backgroundColor: 'var(--color-bg)', borderRadius: 8 }}>
                        <p className="small" style={{ margin: 0, marginBottom: 8, fontWeight: 'bold' }}>{t('patternDimmingAndSwitching')}</p>
                          <ul style={{ marginTop: 8, marginLeft: 20 }}>
                            <li>{t('mainGroupFixed').replace('{main}', pattern.fixedMain.toString())}</li>
                            <li>{t('middleGroupPattern')} {pattern.middleGroupPattern === 'same' ? t('sameForAllObjects') : t('differentPerObjectType')}</li>
                            <li>{t('subGroupPattern')} {
                              pattern.subGroupPattern === 'increment' ? t('incrementing') :
                              pattern.subGroupPattern === 'offset' ? t('offset').replace('{value}', (pattern.offsetValue || 0).toString()) :
                              t('sequence')
                            }</li>
                            <li>{t('objectsPerDevice').replace('{count}', (category.exampleAddresses?.length || pattern.objectsPerDevice || 0).toString())}</li>
                            {pattern.startSub && <li>{t('startSubGroup').replace('{sub}', pattern.startSub.toString())}</li>}
                            {/* Show maximum zones for HVAC */}
                            {catKey === 'hvac' && (() => {
                              // Get start middle group and increment from first example address
                              const startMiddle = category.exampleAddresses?.[0]?.middle ?? 0;
                              const middleIncrement = category.exampleAddresses?.[0]?.middleIncrement ?? 0;
                              
                              // Only show if middle increment is +1
                              if (middleIncrement === 1) {
                                // Zones per main group = 8 - startMiddle
                                // If startMiddle is 0: 8 - 0 = 8 zones (middengroep 0-7)
                                // If startMiddle is 1: 8 - 1 = 7 zones (middengroep 1-7)
                                const zonesPerMainGroup = 8 - startMiddle;
                                // Count zones from first main group
                                let totalZones = zonesPerMainGroup;
                                
                                // Add zones from each extra main group if they exist
                                if (pattern.extraMainGroups && pattern.extraMainGroups.length > 0) {
                                  return (
                                    <li>
                                      {t('extraMainGroupsForZones')} {pattern.extraMainGroups.map(g => `${g.main}/${g.middle}`).join(', ')}
                                      {(() => {
                                        pattern.extraMainGroups!.forEach(extraGroup => {
                                          const extraStartMiddle = extraGroup.middle;
                                          const extraZonesPerGroup = 8 - extraStartMiddle;
                                          totalZones += extraZonesPerGroup;
                                        });
                                        return ` (${t('maxZones')?.replace('{count}', totalZones.toString()) || `max ${totalZones} zones`}, ${t('seeTemplateSettings') || 'zie instellingen template'})`;
                                      })()}
                                    </li>
                                  );
                                  } else {
                                    // No extra main groups, just show max zones for first main group
                                    return (
                                      <li>
                                        Maximaal aantal zones: {totalZones} ({t('seeTemplateSettings') || 'zie instellingen template'})
                                      </li>
                                    );
                                  }
                              }
                              return null;
                            })()}
                          </ul>
                          
                          {/* Note about unused objects */}
                          <div style={{ marginTop: 12, padding: 8, backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: 4, border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                            <p className="small" style={{ margin: 0, fontStyle: 'italic' }}>
                              <strong>Let op:</strong> De objecten "Dimmen", "Waarde" en "Waarde status" krijgen de naam "---" omdat deze niet gebruikt worden bij Schakelen.
                            </p>
                          </div>
                          
                          {/* Example addresses */}
                          {(exampleAddresses.length > 0 || (category.extraObjects && category.extraObjects.length > 0)) && (
                            <div style={{ marginTop: 16 }}>
                              <p className="small" style={{ margin: 0, marginBottom: 8, fontWeight: 'bold' }}>
                                {t('example')}:&nbsp;&nbsp;{t('exampleDeviceSwitching')} {(() => {
                                  const firstAddr = exampleAddresses[0];
                                  if (!firstAddr) return '';
                                  const templateObjectName = firstAddr.main !== undefined && firstAddr.middle !== undefined 
                                    ? getObjectNameFromTemplate(firstAddr.main, firstAddr.middle, 'dimming')
                                    : null;
                                  const nameToTranslate = templateObjectName || firstAddr.objectName || '';
                                  return nameToTranslate ? translateObjectName(nameToTranslate, lang) : '';
                                })()} &nbsp;&nbsp; {exampleAddresses[0]?.address}
                              </p>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t('object')}</th>
                                    <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t('groupAddress')}</th>
                                    <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t('nextGroupAddressDimming')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {exampleAddresses.map((ex, idx) => {
                                    // Get object name from template configuration or fallback to stored objectName, then translate
                                    const templateObjectName = ex.main !== undefined && ex.middle !== undefined 
                                      ? getObjectNameFromTemplate(ex.main, ex.middle, 'dimming')
                                      : null;
                                    const nameToTranslate = templateObjectName || ex.objectName || '';
                                    const displayName = nameToTranslate 
                                      ? (() => {
                                          const translated = translateObjectName(nameToTranslate, lang);
                                          return translated.charAt(0).toUpperCase() + translated.slice(1);
                                        })()
                                      : '';
                                    return (
                                      <tr key={idx}>
                                        <td style={{ padding: '4px' }}>{displayName}</td>
                                        <td style={{ padding: '4px' }}>{ex.address}</td>
                                        <td style={{ padding: '4px', color: 'var(--color-text-secondary)' }}>{ex.nextAddress || ex.address}</td>
                                      </tr>
                                    );
                                  })}
                                  {category.extraObjects && category.extraObjects.map((extraObj: any, idx: number) => {
                                    const mainInc = extraObj.mainIncrement ?? 0;
                                    const middleInc = extraObj.middleIncrement ?? 0;
                                    const subInc = extraObj.subIncrement ?? 0;
                                    const nextMain = Math.max(0, Math.min(31, extraObj.main + mainInc));
                                    const nextMiddle = Math.max(0, Math.min(7, extraObj.middle + middleInc));
                                    const nextSub = Math.max(0, Math.min(255, extraObj.sub + subInc));
                                    return (
                                      <tr key={`extra-${idx}`}>
                                        <td style={{ padding: '4px' }}>{(() => {
                                          const templateObjectName = getObjectNameFromTemplate(extraObj.main, extraObj.middle, 'dimming');
                                          const nameToTranslate = templateObjectName || extraObj.name || '';
                                          return nameToTranslate ? translateExtraObjectNameForDisplay(nameToTranslate, lang) : t('unnamed');
                                        })()}</td>
                                        <td style={{ padding: '4px' }}>{extraObj.main}/{extraObj.middle}/{extraObj.sub}</td>
                                        <td style={{ padding: '4px', color: 'var(--color-text-secondary)' }}>{nextMain}/{nextMiddle}/{nextSub}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                      </div>
                  </div>
                );
              }
              
              // Skip if category is disabled (but not if dimming is linked)
              if (category.enabled === 'none' && !(catKey === 'dimming' && category.linkedToSwitching)) {
                return null;
              }
              
              // For dimming linked to switching, we already handled it above
              if (catKey === 'dimming' && category.linkedToSwitching === true) {
                return null;
              }
              
              // Get example device names
              const exampleDeviceNames: Record<CategoryKey, string> = {
                switching: t('exampleDeviceSwitching'),
                dimming: t('exampleDeviceDimming'),
                shading: t('exampleDeviceShading'),
                hvac: t('exampleDeviceHvac')
              };
              
              const pattern = category.pattern;
              
              // Helper function to calculate next address based on increments
              const calculateNextAddress = (main: number, middle: number, sub: number, mainInc: number, middleInc: number, subInc: number): string => {
                const nextMain = Math.max(0, Math.min(31, main + mainInc));
                const nextMiddle = Math.max(0, Math.min(7, middle + middleInc));
                const nextSub = Math.max(0, Math.min(255, sub + subInc));
                return `${nextMain}/${nextMiddle}/${nextSub}`;
              };
              
              // Use the original example addresses that were analyzed (for first device)
              // These are the addresses the user filled in, which match the analyzed pattern
              const exampleAddresses: Array<{ objectName: string; address: string; nextAddress?: string; main?: number; middle?: number }> = [];
              if (pattern && category.exampleAddresses) {
                category.exampleAddresses.forEach((exampleObj) => {
                  // Use the original addresses that were analyzed
                  const mainInc = exampleObj.mainIncrement ?? 0;
                  const middleInc = exampleObj.middleIncrement ?? 0;
                  const subInc = exampleObj.subIncrement ?? 0;
                  // Get object name from template configuration (already translated) or fallback to stored objectName
                  const templateObjectName = getObjectNameFromTemplate(exampleObj.main, exampleObj.middle, catKey);
                  exampleAddresses.push({
                    objectName: templateObjectName || exampleObj.objectName || '',
                    address: `${exampleObj.main}/${exampleObj.middle}/${exampleObj.sub}`,
                    nextAddress: calculateNextAddress(exampleObj.main, exampleObj.middle, exampleObj.sub, mainInc, middleInc, subInc),
                    main: exampleObj.main,
                    middle: exampleObj.middle
                  });
                });
              }
              
              return (
                <div key={category.id || groupIdx} style={groupBlockStyle}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 'bold' }}>{groupDisplayName}</h5>
                  {pattern ? (
                    <div style={{ marginTop: 12 }}>
                      {/* Show "Patroon dimmen" for dimming when not linked */}
                      {catKey === 'dimming' && !category.linkedToSwitching && (
                        <p className="small" style={{ margin: 0, marginBottom: 8, fontWeight: 'bold' }}>{t('patternDimming')}</p>
                      )}
                      <ul style={{ marginTop: 8, marginLeft: catKey === 'dimming' && !category.linkedToSwitching ? 20 : 0 }}>
                        <li>{t('mainGroupFixed').replace('{main}', pattern.fixedMain.toString())}</li>
                        <li>{t('middleGroupPattern')}: {pattern.middleGroupPattern === 'same' ? t('middleGroupPatternSame') : t('middleGroupPatternDifferent')}</li>
                        <li>{t('subGroupPattern')} {
                          pattern.subGroupPattern === 'increment' ? t('incrementing') :
                          pattern.subGroupPattern === 'offset' ? t('offset').replace('{value}', String(pattern.offsetValue || 0)) :
                          t('sequence')
                        }</li>
                        <li>{t('objectsPerDevice').replace('{count}', String(category.exampleAddresses?.length || pattern.objectsPerDevice))}</li>
                        {pattern.startSub && <li>{t('startSubGroupLabel').replace('{sub}', pattern.startSub.toString())}</li>}
                        {/* Show extra main groups for HVAC */}
                        {catKey === 'hvac' && pattern.extraMainGroups && pattern.extraMainGroups.length > 0 && (
                          <li>
                            {t('extraMainGroupsForZones')} {pattern.extraMainGroups.map(g => `${g.main}/${g.middle}`).join(', ')}
                            {(() => {
                              // Calculate maximum number of zones
                              // Get start middle group from first example address
                              const startMiddle = category.exampleAddresses?.[0]?.middle ?? 0;
                              // Zones per main group = 8 - startMiddle (middengroep 0-7)
                              const zonesPerMainGroup = 8 - startMiddle;
                              // Count zones from first main group
                              let totalZones = zonesPerMainGroup;
                              // Add zones from each extra main group
                              pattern.extraMainGroups.forEach(extraGroup => {
                                const extraStartMiddle = extraGroup.middle;
                                const extraZonesPerGroup = 8 - extraStartMiddle;
                                totalZones += extraZonesPerGroup;
                              });
                              return ` (max ${totalZones} zones, ${t('seeTemplateSettings') || 'zie instellingen template'})`;
                            })()}
                          </li>
                        )}
                      </ul>
                      
                      {/* Example addresses */}
                      {(exampleAddresses.length > 0 || (category.extraObjects && category.extraObjects.length > 0)) && (
                        <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--color-bg)', borderRadius: 8 }}>
                          <p className="small" style={{ margin: 0, marginBottom: 8, fontWeight: 'bold' }}>
                            {t('example')}:&nbsp;&nbsp;{exampleDeviceNames[catKey]} {(() => {
                              const firstAddr = exampleAddresses[0];
                              if (!firstAddr) return '';
                              const templateObjectName = firstAddr.main !== undefined && firstAddr.middle !== undefined 
                                ? getObjectNameFromTemplate(firstAddr.main, firstAddr.middle, catKey)
                                : null;
                              const nameToTranslate = templateObjectName || firstAddr.objectName || '';
                              return nameToTranslate ? translateObjectName(nameToTranslate, lang) : '';
                            })()} &nbsp;&nbsp; {exampleAddresses[0]?.address}
                          </p>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t('object')}</th>
                                <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t('groupAddress')}</th>
                                <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t(catKey === 'switching' ? 'nextGroupAddressSwitching' : catKey === 'dimming' ? (category.linkedToSwitching ? 'nextGroupAddressDimming' : 'nextGroupAddressDimmingOnly') : catKey === 'shading' ? 'nextGroupAddressShading' : 'nextGroupAddressHvac')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exampleAddresses.map((ex, idx) => {
                                // Get object name from template configuration or fallback to stored objectName, then translate
                                const templateObjectName = ex.main !== undefined && ex.middle !== undefined 
                                  ? getObjectNameFromTemplate(ex.main, ex.middle, catKey)
                                  : null;
                                const nameToTranslate = templateObjectName || ex.objectName || '';
                                const displayName = nameToTranslate 
                                  ? (() => {
                                      const translated = translateObjectName(nameToTranslate, lang);
                                      return translated.charAt(0).toUpperCase() + translated.slice(1);
                                    })()
                                  : '';
                                return (
                                  <tr key={idx}>
                                    <td style={{ padding: '4px' }}>{displayName}</td>
                                    <td style={{ padding: '4px' }}>{ex.address}</td>
                                    <td style={{ padding: '4px', color: 'var(--color-text-secondary)' }}>{ex.nextAddress || ex.address}</td>
                                  </tr>
                                );
                              })}
                              {category.extraObjects && category.extraObjects.map((extraObj: any, idx: number) => {
                                const mainInc = extraObj.mainIncrement ?? 0;
                                const middleInc = extraObj.middleIncrement ?? 0;
                                const subInc = extraObj.subIncrement ?? 0;
                                const nextMain = Math.max(0, Math.min(31, extraObj.main + mainInc));
                                const nextMiddle = Math.max(0, Math.min(7, extraObj.middle + middleInc));
                                const nextSub = Math.max(0, Math.min(255, extraObj.sub + subInc));
                                return (
                                  <tr key={`extra-${idx}`}>
                                    <td style={{ padding: '4px' }}>{(() => {
                                      const templateObjectName = getObjectNameFromTemplate(extraObj.main, extraObj.middle, catKey);
                                      const nameToTranslate = templateObjectName || extraObj.name || '';
                                      return nameToTranslate ? translateExtraObjectNameForDisplay(nameToTranslate, lang) : t('unnamed');
                                    })()}</td>
                                    <td style={{ padding: '4px' }}>{extraObj.main}/{extraObj.middle}/{extraObj.sub}</td>
                                    <td style={{ padding: '4px', color: 'var(--color-text-secondary)' }}>{nextMain}/{nextMiddle}/{nextSub}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {t('patternNotAnalyzed')}
                    </div>
                  )}
                </div>
              );
                  })}
                </div>
            );
            })}
          </div>
        </div>

        {/* Vaste groepsadressen - onderaan na hoofdfuncties */}
        <FixedGroupAddressesSection
          title={t('fixedGroupAddressesLabel')}
          mainGroups={fixedAddresses}
          blockedMainGroups={blockedMainGroups}
          teachByExampleConfig={config}
          onConfigUpdate={(updatedConfig) => {
            setConfig(updatedConfig);
          }}
          onUpdate={(mainGroups) => {
            console.log('[TeachByExampleWizard] onUpdate called with mainGroups:', mainGroups.length);
            mainGroups.forEach(mg => {
              mg.middleGroups?.forEach(mgInner => {
                console.log('[TeachByExampleWizard] onUpdate: mainGroup', mg.main, 'middleGroup', mgInner.middle, 'name =', mgInner.name);
              });
            });
            isUpdatingFromCallback.current = true;
            setFixedAddresses(mainGroups);
            if (template) {
              try {
                const updatedTemplate = {
                  ...template,
                  devices: {
                    ...template.devices,
                    fixed: {
                      mainGroups: mainGroups
                    }
                  },
                  teachByExampleConfig: template.teachByExampleConfig ? {
                    ...template.teachByExampleConfig,
                    fixedAddresses: mainGroups as any
                  } : undefined
                };
                setTemplate(updatedTemplate);
              } catch (error) {
                console.error('Error updating template with fixed addresses:', error);
              }
            } else {
              const newTemplate = {
                devices: {
                  fixed: {
                    mainGroups: mainGroups
                  }
                },
                teachByExampleConfig: config ? {
                  ...config,
                  fixedAddresses: mainGroups as any
                } : undefined
              } as any;
              setTemplate(newTemplate);
            }
          }}
        />

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <button className="button ghost" onClick={() => {
            // Go back to the last category (HVAC) usage step (beginscherm)
            setCurrentCategory('hvac');
            setStep('usage');
            setCurrentGroupIndex(0);
            isInWizardFlowRef.current = true;
            cameFromFinalOverviewRef.current = true; // Mark that we came from finalOverview
          }}>
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return null;
};


