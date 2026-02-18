import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../i18n/useTranslation'; // Keep for lang access temporarily
import { translateObjectName, getStandardObjectName } from '../i18n/translations';
import { translateGroupNameForDisplay, translateExtraObjectNameForDisplay } from '../i18n/userInputTranslations';
import { TeachByExampleCategoryConfig } from '../types/common';
import { FixedGroupAddressesSection } from './TemplateWizard';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type CategoryKey = 'switching' | 'dimming' | 'shading' | 'hvac';

interface TeachByExampleOverviewProps {
  onEdit?: () => void;
  onEditCategory?: (categoryKey: 'switching' | 'dimming' | 'shading' | 'hvac') => void;
}

export const TeachByExampleOverview = ({ onEdit, onEditCategory }: TeachByExampleOverviewProps) => {
  const { template, setStep, templateHasChanges, currentProjectId, setTemplate, currentTemplateId, saveProject, username } = useAppStore();
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [showProjectNameDialog, setShowProjectNameDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  
  // Debug: log language changes
  useEffect(() => {
    console.log(`[TeachByExampleOverview] Language changed to: "${lang}"`);
  }, [lang]);
  
  // Helper function to check if template is fully configured
  const isTemplateFullyConfigured = useCallback(() => {
    if (!template?.teachByExampleConfig || currentTemplateId) return false;
    
    const config = template.teachByExampleConfig;
    const hasCategories = config.categories && Object.keys(config.categories).length > 0;
    
    // Template name is not required - only categories need to be configured
    if (!hasCategories) return false;
    
    // Check if all categories are fully configured
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
  }, [template, currentTemplateId]);
  
  // Migrate object names to standard Dutch format when template is loaded
  useEffect(() => {
    if (!template?.teachByExampleConfig?.categories) return;
    
    let needsUpdate = false;
    const updatedConfig = { ...template.teachByExampleConfig };
    const updatedCategories = { ...updatedConfig.categories };
    
    // Normalize object names in all categories
    (['switching', 'dimming', 'shading', 'hvac'] as const).forEach(categoryKey => {
      const category = updatedCategories[categoryKey];
      if (!category) return;
      
      const configs = Array.isArray(category) ? category : [category];
      const updatedConfigs = configs.map(cat => {
        let updatedCat = { ...cat };
        let catNeedsUpdate = false;
        
        // Normalize exampleAddresses objectNames
        if (cat.exampleAddresses) {
          const updatedAddresses = cat.exampleAddresses.map((addr: any) => {
            if (addr.objectName) {
              const standardName = getStandardObjectName(addr.objectName);
              if (standardName !== addr.objectName) {
                catNeedsUpdate = true;
                needsUpdate = true;
                return { ...addr, objectName: standardName };
              }
            }
            return addr;
          });
          if (catNeedsUpdate) {
            updatedCat = { ...updatedCat, exampleAddresses: updatedAddresses };
          }
        }
        
        // Normalize extraObjects names
        if (cat.extraObjects) {
          const updatedExtraObjects = cat.extraObjects.map((obj: any) => {
            if (obj.name) {
              const standardName = getStandardObjectName(obj.name);
              if (standardName !== obj.name) {
                catNeedsUpdate = true;
                needsUpdate = true;
                return { ...obj, name: standardName };
              }
            }
            return obj;
          });
          if (catNeedsUpdate) {
            updatedCat = { ...updatedCat, extraObjects: updatedExtraObjects };
          }
        }
        
        return updatedCat;
      });
      
      if (updatedConfigs.some((cat, idx) => cat !== configs[idx])) {
        updatedCategories[categoryKey] = Array.isArray(category) ? updatedConfigs : updatedConfigs[0];
      }
    });
    
    // Update template if any object names were normalized
    if (needsUpdate) {
      const updatedTemplate = {
        ...template,
        teachByExampleConfig: {
          ...updatedConfig,
          categories: updatedCategories
        }
      };
      setTemplate(updatedTemplate);
    }
  }, [template, setTemplate]);
  
  // Check if template is fully configured and set templateHasChanges accordingly
  // This runs on mount and whenever template changes
  // Use a ref to prevent infinite loops from calling setTemplate
  const hasCheckedTemplateChanges = useRef(false);
  
  useEffect(() => {
    const fullyConfigured = isTemplateFullyConfigured();
    
    // Only set templateHasChanges for unsaved new templates that are fully configured
    // Don't set it if currentTemplateId exists (template is already saved)
    if (fullyConfigured && !currentTemplateId && !currentProjectId) {
      // Only set templateHasChanges if it's not already set and we haven't checked this template yet
      const currentState = useAppStore.getState();
      if (currentState.template && !currentState.templateHasChanges && !hasCheckedTemplateChanges.current) {
        // Mark that we've checked to prevent infinite loop
        hasCheckedTemplateChanges.current = true;
        
        // Set templateHasChanges directly instead of calling setTemplate which causes loops
        useAppStore.setState({ templateHasChanges: true });
      }
    } else {
      // Reset the ref when conditions change
      hasCheckedTemplateChanges.current = false;
    }
  }, [template, currentTemplateId, currentProjectId, isTemplateFullyConfigured]);
  
  // Helper function to capitalize first letter of a string
  const capitalize = (str: string): string => {
    if (!str || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Helper function to get object name from teachByExampleConfig or template configuration based on main/middle and category
  const getObjectNameFromTemplate = useCallback((main: number, middle: number, categoryKey: CategoryKey): string | null => {
    // First try to get from teachByExampleConfig (for Teach by Example templates)
    if (template?.teachByExampleConfig?.categories) {
      const category = template.teachByExampleConfig.categories[categoryKey];
      if (category) {
        const configs = Array.isArray(category) ? category : [category];
        for (const config of configs) {
          if (config.exampleAddresses) {
            const foundAddress = config.exampleAddresses.find((addr: any) => addr.main === main && addr.middle === middle);
            if (foundAddress?.objectName) {
              return foundAddress.objectName;
            }
          }
        }
      }
    }
    
    // Fallback to template.devices (for regular templates)
    if (!template?.devices) {
      return null;
    }
    
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

  // Helper function to translate group name if it matches a category name in any language
  // Returns name with first letter capitalized for display
  const translateGroupName = useCallback((groupName: string | undefined, categoryKey: CategoryKey, groupIndex: number): string => {
    let result: string;
    
    if (!groupName) {
      const categoryName = {
        switching: t('switch'),
        dimming: t('dimmer'),
        shading: t('blind'),
        hvac: t('hvac')
      }[categoryKey];
      result = groupIndex === 0 ? categoryName : `${categoryName} ${groupIndex + 1}`;
    } else {
      const groupNameLower = groupName.toLowerCase().trim();
      
      // Get current translated category name (full name with slashes if applicable)
      const currentCategoryName = {
        switching: t('switch'),
        dimming: t('dimmer'),
        shading: t('blind'),
        hvac: t('hvac')
      }[categoryKey];
      
      // First check if the group name exactly matches the current language's category name
      // This handles cases like "Jalouzie / Rolluik" (Dutch) or "Blind / Shutter" (English)
      if (groupNameLower === currentCategoryName.toLowerCase()) {
        result = groupIndex === 0 ? currentCategoryName : `${currentCategoryName} ${groupIndex + 1}`;
      } else {
        // Get category names in all languages (including full compound names)
        const categoryNames = {
          switching: ['schakelen', 'switch', 'interruptor', 'interrupteur', 'schalter'],
          dimming: ['dimmen', 'dimmer', 'regulador', 'variateur'],
          shading: ['jalouzie / rolluik', 'jaloezie / rolluik', 'blind / shutter', 'persiana', 'store', 'jalousie', 'jalouzie', 'rolluik', 'rollo', 'rolladen', 'blind'],
          hvac: ['klimaat / hvac', 'climate / hvac', 'clima / hvac', 'climat / cvc', 'klima / hlk', 'klimaat', 'hvac', 'clima', 'climat', 'klima']
        }[categoryKey] || [];
        
        let matched = false;
        
        // Check if groupName matches any category name variant (with or without number)
        for (const catName of categoryNames) {
          const catNameLower = catName.toLowerCase();
          // Normalize spaces for comparison
          const normalizedGroupName = groupNameLower.replace(/\s+/g, ' ').trim();
          const normalizedCatName = catNameLower.replace(/\s+/g, ' ').trim();
          
          // Check exact match or with number (also try normalized versions)
          if (normalizedGroupName === normalizedCatName || 
              normalizedGroupName === `${normalizedCatName} 1` ||
              normalizedGroupName === `${normalizedCatName} 2` ||
              normalizedGroupName === `${normalizedCatName} 3` ||
              normalizedGroupName.startsWith(`${normalizedCatName} `) ||
              groupNameLower === catNameLower ||
              groupNameLower === `${catNameLower} 1` ||
              groupNameLower === `${catNameLower} 2` ||
              groupNameLower === `${catNameLower} 3` ||
              groupNameLower.startsWith(`${catNameLower} `)) {
            // Extract number if present
            const match = groupNameLower.match(/^.+?(\s+\d+)?$/);
            if (match) {
              const numberPart = match[1] || '';
              result = groupIndex === 0 ? currentCategoryName : `${currentCategoryName}${numberPart}`;
            } else {
              result = groupIndex === 0 ? currentCategoryName : `${currentCategoryName} ${groupIndex + 1}`;
            }
            matched = true;
            break;
          }
        }
        
        // If no match, use original groupName
        if (!matched) {
          result = groupName;
        }
      }
    }
    
    // Capitalize first letter for display
    if (result && result.length > 0) {
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result;
  }, [t, lang]);

  const handleSaveProjectName = () => {
    if (!projectName.trim()) {
      alert(t('projectNameRequired') || 'Project naam is verplicht');
      return;
    }
    try {
      saveProject(projectName.trim());
      setProjectName('');
      setShowProjectNameDialog(false);
      
      // Check if all 4 main functions are set to "not used" (enabled === 'none')
      // If so, navigate to overview instead of devices
      const allCategoriesNotUsed = (() => {
        if (!template?.teachByExampleConfig?.categories) return false;
        const config = template.teachByExampleConfig;
        const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
        return allCategories.every(cat => {
          const categoryConfig = config.categories?.[cat];
          if (!categoryConfig) return false; // Category must be present
          const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
          return configs.every(cfg => cfg.enabled === 'none');
        });
      })();
      
      if (allCategoriesNotUsed) {
        setStep('overview');
      } else {
        setStep('devices');
      }
    } catch (err) {
      alert(t('projectSaveError') || 'Fout bij aanmaken project');
      console.error(err);
    }
  };

  if (!template?.teachByExampleConfig) {
    return (
      <div className="card">
        <h3>{t('templateOverview')}</h3>
        <p>{t('noTeachByExampleConfig')}</p>
        <button className="button secondary" onClick={() => setStep('template')}>
          {t('back')}
        </button>
      </div>
    );
  }

  // Show project name dialog if needed
  if (showProjectNameDialog) {
    return (
      <div className="card">
        <h3>{t('templateOverview')}</h3>
        <div style={{ marginTop: 16, padding: 16, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 16 }}>
          <h4 style={{ marginTop: 0 }}>{t('saveProject')}</h4>
          <p style={{ marginBottom: 16 }}>
            {t('projectNameRequiredForDevices') || 'Voer een naam in voor het nieuwe project'}
          </p>
          <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t('projectNamePlaceholder') || 'Project naam'}
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveProjectName();
                if (e.key === 'Escape') {
                  setShowProjectNameDialog(false);
                  setProjectName('');
                }
              }}
              autoFocus
            />
            <button onClick={handleSaveProjectName} disabled={!projectName.trim()}>
              {t('save')}
            </button>
            <button onClick={() => {
              setShowProjectNameDialog(false);
              setProjectName('');
            }} className="button secondary">
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const config = template.teachByExampleConfig;
  const categories = config.categories || {};
  
  // Debug: log HVAC config for troubleshooting
  if (categories.hvac) {
    const hvacConfig = categories.hvac;
    const hvacArray = Array.isArray(hvacConfig) ? hvacConfig : [hvacConfig];
    console.log('[TeachByExampleOverview] HVAC configs found:', hvacArray.length);
    hvacArray.forEach((hvac, idx) => {
      console.log(`[TeachByExampleOverview] HVAC[${idx}] pattern:`, hvac.pattern ? 'EXISTS' : 'MISSING');
      if (hvac.pattern) {
        console.log(`[TeachByExampleOverview] HVAC[${idx}] pattern.extraMainGroups:`, hvac.pattern.extraMainGroups);
        console.log(`[TeachByExampleOverview] HVAC[${idx}] exampleAddresses:`, hvac.exampleAddresses?.length || 0);
        console.log(`[TeachByExampleOverview] HVAC[${idx}] extraObjects:`, hvac.extraObjects?.length || 0);
      }
    });
  } else {
    console.log('[TeachByExampleOverview] No HVAC config found');
  }

  const renderCategoryConfig = (categoryKey: string, category: TeachByExampleCategoryConfig | TeachByExampleCategoryConfig[] | any) => {
    // If category doesn't exist, show it as "not used" with edit button
    if (!category) {
      const categoryName = categoryKey === 'switching' ? t('switch') : 
                           categoryKey === 'dimming' ? t('dimmer') : 
                           categoryKey === 'shading' ? t('blind') : 
                           t('hvac');
      
      return (
        <div key={categoryKey} className="card" style={{ marginTop: 16 }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <h4 style={{ marginTop: 0, marginBottom: 0 }}>
              {categoryName}
            </h4>
            {onEditCategory && (
              <button 
                className="button secondary" 
                onClick={() => onEditCategory(categoryKey as 'switching' | 'dimming' | 'shading' | 'hvac')}
                style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}
              >
                {t('editCategory')} {categoryName}
              </button>
            )}
          </div>
          <div style={{ marginTop: 12, padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
            <p className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
              {t('notUsed')}
            </p>
          </div>
        </div>
      );
    }

    // Handle array of configs (multiple groups): one card per hoofdfunctie, all groups inside with group names
    if (Array.isArray(category)) {
      const categoryName = categoryKey === 'switching' ? t('switch') : 
                           categoryKey === 'dimming' ? t('dimmer') : 
                           categoryKey === 'shading' ? t('blind') : 
                           t('hvac');
      return (
        <div key={categoryKey} className="card" style={{ marginTop: 16 }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <h4 style={{ marginTop: 0, marginBottom: 0 }}>{categoryName}</h4>
            {onEditCategory && (
              <button 
                className="button secondary" 
                onClick={() => onEditCategory(categoryKey as 'switching' | 'dimming' | 'shading' | 'hvac')}
                style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}
              >
                {t('editCategory')} {categoryName}
              </button>
            )}
          </div>
          {category.map((cat: any, idx: number) => {
            const raw = (cat.groupName || '').trim();
            const groupDisplayName = raw
              ? translateGroupNameForDisplay(raw, lang)
              : translateGroupName(cat.groupName, categoryKey as CategoryKey, idx);
            const isFirst = idx === 0;
            return (
              <div
                key={cat.id || idx}
                style={{
                  marginTop: isFirst ? 0 : 20,
                  paddingTop: isFirst ? 0 : 16,
                  borderTop: isFirst ? 'none' : '1px solid var(--color-border)'
                }}
              >
                <h5 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 'bold' }}>
                  {groupDisplayName}
                </h5>
                {cat.linkedToSwitching && (
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                    {t('linkedToSwitching')}
                  </p>
                )}
                {cat.pattern && typeof cat.pattern === 'object' ? (
                  <div style={{ marginTop: 12 }}>
                    <ul style={{ marginTop: 8, marginLeft: 20 }}>
                      <li>{t('mainGroupFixed')?.replace('{main}', cat.pattern.fixedMain.toString()) || `Main group fixed: ${cat.pattern.fixedMain}`}</li>
                      <li>{t('middleGroupPattern')} {cat.pattern.middleGroupPattern === 'same' ? t('sameForAllObjects') : t('differentPerObjectType')}</li>
                      <li>{t('subGroupPattern')} {
                        cat.pattern.subGroupPattern === 'increment' ? t('incrementing') :
                        cat.pattern.subGroupPattern === 'offset' ? t('offset')?.replace('{value}', (cat.pattern.offsetValue || 0).toString()) || `Offset: ${cat.pattern.offsetValue || 0}` :
                        t('sequence')
                      }</li>
                      <li>{t('objectsPerDevice')?.replace('{count}', (cat.exampleAddresses?.length || cat.pattern.objectsPerDevice || 0).toString()) || `Objects per device: ${cat.exampleAddresses?.length || cat.pattern.objectsPerDevice || 0}`}</li>
                      {cat.pattern.startSub && <li>{t('startSubGroup')?.replace('{sub}', cat.pattern.startSub.toString()) || `Start sub group: ${cat.pattern.startSub}`}</li>}
                      {categoryKey === 'hvac' && cat.pattern?.extraMainGroups && cat.pattern.extraMainGroups.length > 0 && (
                        <li>
                          {t('extraMainGroupsForZones')} {cat.pattern.extraMainGroups.map((g: any) => `${g.main}/${g.middle}`).join(', ')}
                        </li>
                      )}
                      {categoryKey === 'hvac' && cat.pattern && (() => {
                        const firstAddress = cat.exampleAddresses?.[0];
                        const firstExtraObj = cat.extraObjects?.[0];
                        const startMiddle = firstAddress?.middle ?? firstExtraObj?.middle ?? 0;
                        const zonesPerMainGroup = 8 - startMiddle;
                        let totalZones = zonesPerMainGroup;
                        if (cat.pattern.extraMainGroups && cat.pattern.extraMainGroups.length > 0) {
                          cat.pattern.extraMainGroups.forEach((extraGroup: any) => {
                            const extraStartMiddle = extraGroup.middle;
                            const extraZonesPerGroup = 8 - extraStartMiddle;
                            totalZones += extraZonesPerGroup;
                          });
                        }
                        return (
                          <li>
                            {t('maximumNumberOfZones')}: {totalZones} ({t('seeTemplateSettings')})
                          </li>
                        );
                      })()}
                    </ul>
                    {(cat.exampleAddresses && cat.exampleAddresses.length > 0) || (cat.extraObjects && cat.extraObjects.length > 0) ? (
                      <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--color-bg)', borderRadius: 8 }}>
                        <p className="small" style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
                          {t('exampleAddresses')}
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t('object')}</th>
                              <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t('groupAddress')}</th>
                              <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t(categoryKey === 'switching' ? 'nextGroupAddressSwitching' : categoryKey === 'dimming' ? (cat.linkedToSwitching ? 'nextGroupAddressDimming' : 'nextGroupAddressDimmingOnly') : categoryKey === 'shading' ? 'nextGroupAddressShading' : 'nextGroupAddressHvac')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.exampleAddresses && cat.exampleAddresses.map((addr: any, addrIdx: number) => {
                              const mainInc = addr.mainIncrement ?? 0;
                              const middleInc = addr.middleIncrement ?? 0;
                              const subInc = addr.subIncrement ?? 0;
                              const nextMain = Math.max(0, Math.min(31, addr.main + mainInc));
                              const nextMiddle = Math.max(0, Math.min(7, addr.middle + middleInc));
                              const nextSub = Math.max(0, Math.min(255, addr.sub + subInc));
                              const rawName = (addr.objectName || addr.name || '').trim();
                              const displayName = rawName 
                                ? (() => {
                                    const translated = translateObjectName(rawName, lang);
                                    return capitalize(translated);
                                  })()
                                : t('unnamed');
                              return (
                                <tr key={addrIdx}>
                                  <td style={{ padding: '4px' }}>{displayName}</td>
                                  <td style={{ padding: '4px' }}>{addr.main}/{addr.middle}/{addr.sub}</td>
                                  <td style={{ padding: '4px', color: 'var(--color-text-secondary)' }}>{nextMain}/{nextMiddle}/{nextSub}</td>
                                </tr>
                              );
                            })}
                            {cat.extraObjects && cat.extraObjects.map((extraObj: any, eidx: number) => {
                              const mainInc = extraObj.mainIncrement ?? 0;
                              const middleInc = extraObj.middleIncrement ?? 0;
                              const subInc = extraObj.subIncrement ?? 0;
                              const nextMain = Math.max(0, Math.min(31, extraObj.main + mainInc));
                              const nextMiddle = Math.max(0, Math.min(7, extraObj.middle + middleInc));
                              const nextSub = Math.max(0, Math.min(255, extraObj.sub + subInc));
                              const rawName = (extraObj.name || '').trim();
                              const displayName = rawName 
                                ? capitalize(translateExtraObjectNameForDisplay(rawName, lang))
                                : t('unnamed');
                              return (
                                <tr key={`extra-${eidx}`}>
                                  <td style={{ padding: '4px' }}>{displayName}</td>
                                  <td style={{ padding: '4px' }}>{extraObj.main}/{extraObj.middle}/{extraObj.sub}</td>
                                  <td style={{ padding: '4px', color: 'var(--color-text-secondary)' }}>{nextMain}/{nextMiddle}/{nextSub}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  cat.enabled !== 'none' && (
                    <div style={{ marginTop: 12, padding: 12, backgroundColor: 'var(--color-bg)', borderRadius: 8 }}>
                      <p className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
                        {t('patternNotAnalyzed')}
                      </p>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Handle single category config
    const cat = category as TeachByExampleCategoryConfig;
    // Always show category if it exists in the config (even if enabled === 'none' or no pattern)
    // The category may have been configured before, so we want to show it
    // Only hide if it's explicitly disabled and has no useful data at all
    const hasPattern = cat.pattern && typeof cat.pattern === 'object';
    const hasExampleAddresses = cat.exampleAddresses && cat.exampleAddresses.length > 0;
    const hasZones = categoryKey === 'hvac' && (cat as any).zones && (cat as any).zones.length > 0;
    const hasWizardConfig = cat.wizardConfig && Object.keys(cat.wizardConfig).length > 0;
    const hasData = hasPattern || hasExampleAddresses || hasZones || hasWizardConfig;
    
    // Always show all categories - never hide them
    // If enabled === 'none' and no data, show with "niet gebruikt" message

    // Special handling for dimming linked to switching
    if (categoryKey === 'dimming' && cat.linkedToSwitching) {
      const switchingCategory = categories.switching;
      const pattern = cat.pattern || switchingCategory?.pattern;
      
      if (!pattern) {
        return (
          <div key={categoryKey} className="card" style={{ marginTop: 16 }}>
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <h4 style={{ marginTop: 0, marginBottom: 0 }}>{t('dimmer')}</h4>
              {onEditCategory && cat.enabled !== 'none' && (
                <button 
                  className="button secondary" 
                  onClick={() => onEditCategory('dimming')}
                  style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}
                >
                  {t('editCategory')} {t('dimmer')}
                </button>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <p className="small" style={{ margin: 0 }}>
                {t('dimmingAndSwitchingUseSameAddresses')}
              </p>
              <p className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: '8px' }}>
                {t('analyzeSwitchingFirst')}
              </p>
            </div>
          </div>
        );
      }
      
      // Helper function to calculate next address based on increments
      const calculateNextAddress = (main: number, middle: number, sub: number, mainInc: number, middleInc: number, subInc: number): string => {
        const nextMain = Math.max(0, Math.min(31, main + mainInc));
        const nextMiddle = Math.max(0, Math.min(7, middle + middleInc));
        const nextSub = Math.max(0, Math.min(255, sub + subInc));
        return `${nextMain}/${nextMiddle}/${nextSub}`;
      };
      
      // Get example addresses
      const exampleAddresses: Array<{ objectName: string; address: string; nextAddress?: string; main?: number; middle?: number }> = [];
      if (cat.exampleAddresses && cat.exampleAddresses.length > 0) {
        cat.exampleAddresses.forEach((exampleObj: any) => {
          const mainInc = exampleObj.mainIncrement ?? 0;
          const middleInc = exampleObj.middleIncrement ?? 0;
          const subInc = exampleObj.subIncrement ?? 0;
          // Get object name from template configuration (already translated) or fallback to stored objectName
          const templateObjectName = getObjectNameFromTemplate(exampleObj.main, exampleObj.middle, categoryKey);
          exampleAddresses.push({
            objectName: templateObjectName || exampleObj.objectName || '',
            address: `${exampleObj.main}/${exampleObj.middle}/${exampleObj.sub}`,
            nextAddress: calculateNextAddress(exampleObj.main, exampleObj.middle, exampleObj.sub, mainInc, middleInc, subInc),
            main: exampleObj.main,
            middle: exampleObj.middle
          });
        });
      } else if (switchingCategory && switchingCategory.exampleAddresses) {
        switchingCategory.exampleAddresses.forEach((exampleObj: any) => {
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
      
      return (
        <div key={categoryKey} className="card" style={{ marginTop: 16 }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <h4 style={{ marginTop: 0, marginBottom: 0 }}>{t('dimmer')}</h4>
            {onEditCategory && cat.enabled !== 'none' && (
              <button 
                className="button secondary" 
                onClick={() => onEditCategory('dimming')}
                style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}
              >
                {t('edit')} {t('dimmer')}
              </button>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <p className="small" style={{ margin: '0 0 12px 0' }}>
              {t('dimmingAndSwitchingUseSameAddresses')}
            </p>
            <div style={{ marginTop: 12, padding: 12, backgroundColor: 'var(--color-bg)', borderRadius: 8 }}>
              <p className="small" style={{ margin: 0, marginBottom: 8, fontWeight: 'bold' }}>{t('patternDimmingAndSwitching')}</p>
              <ul style={{ marginTop: 8, marginLeft: 20 }}>
                <li>{t('mainGroupFixed')?.replace('{main}', pattern.fixedMain.toString()) || `Main group fixed: ${pattern.fixedMain}`}</li>
                <li>{t('middleGroupPattern')} {pattern.middleGroupPattern === 'same' ? t('sameForAllObjects') : t('differentPerObjectType')}</li>
                <li>{t('subGroupPattern')} {
                  pattern.subGroupPattern === 'increment' ? t('incrementing') :
                  pattern.subGroupPattern === 'offset' ? t('offset')?.replace('{value}', (pattern.offsetValue || 0).toString()) || `Offset: ${pattern.offsetValue || 0}` :
                  t('sequence')
                }</li>
                <li>{t('objectsPerDevice')?.replace('{count}', (cat.exampleAddresses?.length || switchingCategory?.exampleAddresses?.length || pattern.objectsPerDevice || 0).toString()) || `Objects per device: ${cat.exampleAddresses?.length || switchingCategory?.exampleAddresses?.length || pattern.objectsPerDevice || 0}`}</li>
                {pattern.startSub && <li>{t('startSubGroup')?.replace('{sub}', pattern.startSub.toString()) || `Start sub group: ${pattern.startSub}`}</li>}
              </ul>
              
              {exampleAddresses.length > 0 && (
                <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--color-bg)', borderRadius: 8 }}>
                  <p className="small" style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    {t('exampleAddresses')}
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
                        // Use stored objectName directly (it's already in the exampleAddresses), then translate
                        // translateObjectName handles normalization internally, so pass the original name
                        const rawName = (ex.objectName || '').trim();
                        const displayName = rawName 
                          ? capitalize(translateObjectName(rawName, lang))
                          : '';
                        return (
                          <tr key={idx}>
                            <td style={{ padding: '4px' }}>{displayName}</td>
                            <td style={{ padding: '4px' }}>{ex.address}</td>
                            <td style={{ padding: '4px', color: 'var(--color-text-secondary)' }}>{ex.nextAddress || ex.address}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Get group name - use stored groupName when present, otherwise default to category name
    const categoryName = categoryKey === 'switching' ? t('switch') : 
                         categoryKey === 'dimming' ? t('dimmer') : 
                         categoryKey === 'shading' ? t('blind') : 
                         t('hvac');
    const rawGroup = (cat.groupName || '').trim();
    const groupDisplayName = rawGroup
      ? translateGroupNameForDisplay(rawGroup, lang)
      : translateGroupName(cat.groupName, categoryKey as CategoryKey, 0);
    const categoryDisplayName = categoryKey === 'switching' ? t('switch') : 
                                categoryKey === 'dimming' ? t('dimmer') : 
                                categoryKey === 'shading' ? t('blind') : 
                                t('hvac');
    
    // Check if dimming is linked to switching - if so, switching should show special message
    const dimmingConfig = categories.dimming;
    const dimmingConfigs = dimmingConfig ? (Array.isArray(dimmingConfig) ? dimmingConfig : [dimmingConfig]) : [];
    const isDimmingLinkedToSwitching = dimmingConfigs.some(cfg => cfg.linkedToSwitching === true);
    const isSwitchingWithLinkedDimming = categoryKey === 'switching' && isDimmingLinkedToSwitching;
    
    // Check if category is not used (enabled === 'none' and no data)
    const isNotUsed = cat.enabled === 'none' && !hasData && !(categoryKey === 'dimming' && cat.linkedToSwitching);
    
    // Check if both switching and dimming are not used (enabled === 'none')
    // This message should only appear for switching category
    const switchingCategory = categories.switching;
    const switchingConfigs = switchingCategory ? (Array.isArray(switchingCategory) ? switchingCategory : [switchingCategory]) : [];
    const isSwitchingNotUsed = switchingConfigs.length > 0 && switchingConfigs.every(cfg => cfg.enabled === 'none');
    const isDimmingNotUsed = dimmingConfigs.length > 0 && dimmingConfigs.every(cfg => cfg.enabled === 'none' && !cfg.linkedToSwitching);
    const showSkipSwitchingMessage = categoryKey === 'switching' && isSwitchingNotUsed && isDimmingNotUsed;
    
    return (
      <div key={categoryKey} className="card" style={{ marginTop: 16 }}>
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <h4 style={{ marginTop: 0, marginBottom: 0 }}>
              {groupDisplayName}
            </h4>
            {showSkipSwitchingMessage && (
              <span className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                {t('skipSwitchingWhenUsingSameMainMiddleGroup')}
              </span>
            )}
          </div>
          {onEditCategory && (
            <button 
              className="button secondary" 
              onClick={() => {
                if (!isSwitchingWithLinkedDimming) {
                  onEditCategory(categoryKey as 'switching' | 'dimming' | 'shading' | 'hvac');
                }
              }}
              disabled={isSwitchingWithLinkedDimming}
              style={{ 
                borderRadius: '10px', 
                borderWidth: '0.5px', 
                padding: '14px 20px',
                opacity: isSwitchingWithLinkedDimming ? 0.5 : 1,
                filter: isSwitchingWithLinkedDimming ? 'blur(1.5px)' : 'none',
                cursor: isSwitchingWithLinkedDimming ? 'not-allowed' : 'pointer'
              }}
            >
              {t('editCategory')} {categoryDisplayName}
            </button>
          )}
        </div>
        
        <div style={{ marginTop: 12 }}>
        {isNotUsed && !isSwitchingWithLinkedDimming && (
          <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
            <p className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
              {t('notUsed')}
            </p>
          </div>
        )}
        {isSwitchingWithLinkedDimming && (
          <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
            <p className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
              {t('switchingUsesSameAddressesAsDimming')}
            </p>
          </div>
        )}

        {cat.pattern && cat.enabled !== 'none' ? (
          <div style={{ marginTop: 12 }}>
            <ul style={{ marginTop: 8, marginLeft: 20 }}>
              <li>{t('mainGroupFixed')?.replace('{main}', cat.pattern.fixedMain.toString()) || `Main group fixed: ${cat.pattern.fixedMain}`}</li>
              <li>{t('middleGroupPattern')} {cat.pattern.middleGroupPattern === 'same' ? t('sameForAllObjects') : t('differentPerObjectType')}</li>
              <li>{t('subGroupPattern')} {
                cat.pattern.subGroupPattern === 'increment' ? t('incrementing') :
                cat.pattern.subGroupPattern === 'offset' ? t('offset')?.replace('{value}', (cat.pattern.offsetValue || 0).toString()) || `Offset: ${cat.pattern.offsetValue || 0}` :
                t('sequence')
              }</li>
              <li>{t('objectsPerDevice')?.replace('{count}', (cat.exampleAddresses?.length || cat.pattern.objectsPerDevice || 0).toString()) || `Objects per device: ${cat.exampleAddresses?.length || cat.pattern.objectsPerDevice || 0}`}</li>
              {cat.pattern.startSub && <li>{t('startSubGroup')?.replace('{sub}', cat.pattern.startSub.toString()) || `Start sub group: ${cat.pattern.startSub}`}</li>}
              {/* Show extra main groups for zones (if any) */}
              {categoryKey === 'hvac' && cat.pattern?.extraMainGroups && cat.pattern.extraMainGroups.length > 0 && (
                <li>
                  {t('extraMainGroupsForZones')} {cat.pattern.extraMainGroups.map((g: any) => `${g.main}/${g.middle}`).join(', ')}
                </li>
              )}
              {/* Show maximum zones for HVAC - always show as separate line if pattern exists */}
              {categoryKey === 'hvac' && cat.pattern ? (() => {
                // Get start middle group from first example address or extra object
                // For HVAC zones, we assume middle increment is +1 (standard for zones)
                const firstAddress = cat.exampleAddresses?.[0];
                const firstExtraObj = cat.extraObjects?.[0];
                const startMiddle = firstAddress?.middle ?? firstExtraObj?.middle ?? 0;
                
                // Always calculate and show max zones for HVAC
                // Zones per main group = 8 - startMiddle (assuming middle increment +1)
                // If startMiddle is 0: 8 - 0 = 8 zones (middengroep 0-7)
                // If startMiddle is 1: 8 - 1 = 7 zones (middengroep 1-7)
                const zonesPerMainGroup = 8 - startMiddle;
                // Count zones from first main group
                let totalZones = zonesPerMainGroup;
                
                // Add zones from each extra main group if they exist
                if (cat.pattern.extraMainGroups && cat.pattern.extraMainGroups.length > 0) {
                  cat.pattern.extraMainGroups.forEach((extraGroup: any) => {
                    const extraStartMiddle = extraGroup.middle;
                    const extraZonesPerGroup = 8 - extraStartMiddle;
                    totalZones += extraZonesPerGroup;
                  });
                }
                
                // Always show max zones as a separate line
                return (
                  <li key="max-zones">
                    {t('maximumNumberOfZones')}: {totalZones} ({t('seeTemplateSettings') || 'zie instellingen template'})
                  </li>
                );
              })() : null}
            </ul>
            
            {/* Example addresses table */}
            {(cat.exampleAddresses && cat.exampleAddresses.length > 0) || (cat.extraObjects && cat.extraObjects.length > 0) ? (
              <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--color-bg)', borderRadius: 8 }}>
                <p className="small" style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
                  {t('exampleAddresses')}
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t('object')}</th>
                      <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t('groupAddress')}</th>
                      <th style={{ textAlign: 'left', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{t(categoryKey === 'switching' ? 'nextGroupAddressSwitching' : categoryKey === 'dimming' ? (cat.linkedToSwitching ? 'nextGroupAddressDimming' : 'nextGroupAddressDimmingOnly') : categoryKey === 'shading' ? 'nextGroupAddressShading' : 'nextGroupAddressHvac')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.exampleAddresses && cat.exampleAddresses.map((addr: any, idx: number) => {
                      const mainInc = addr.mainIncrement ?? 0;
                      const middleInc = addr.middleIncrement ?? 0;
                      const subInc = addr.subIncrement ?? 0;
                      const nextMain = Math.max(0, Math.min(31, addr.main + mainInc));
                      const nextMiddle = Math.max(0, Math.min(7, addr.middle + middleInc));
                      const nextSub = Math.max(0, Math.min(255, addr.sub + subInc));
                      // Use stored objectName directly (it's already in the exampleAddresses), then translate
                      // translateObjectName handles normalization internally, so pass the original name
                      const rawName = (addr.objectName || addr.name || '').trim();
                      const displayName = rawName 
                        ? capitalize(translateObjectName(rawName, lang))
                        : t('unnamed');
                      return (
                        <tr key={idx}>
                          <td style={{ padding: '4px' }}>{displayName}</td>
                          <td style={{ padding: '4px' }}>{addr.main}/{addr.middle}/{addr.sub}</td>
                          <td style={{ padding: '4px', color: 'var(--color-text-secondary)' }}>{nextMain}/{nextMiddle}/{nextSub}</td>
                        </tr>
                      );
                    })}
                    {cat.extraObjects && cat.extraObjects.map((extraObj: any, idx: number) => {
                      const mainInc = extraObj.mainIncrement ?? 0;
                      const middleInc = extraObj.middleIncrement ?? 0;
                      const subInc = extraObj.subIncrement ?? 0;
                      const nextMain = Math.max(0, Math.min(31, extraObj.main + mainInc));
                      const nextMiddle = Math.max(0, Math.min(7, extraObj.middle + middleInc));
                      const nextSub = Math.max(0, Math.min(255, extraObj.sub + subInc));
                      return (
                        <tr key={`extra-${idx}`}>
                          <td style={{ padding: '4px' }}>{extraObj.name ? capitalize(translateExtraObjectNameForDisplay(extraObj.name, lang)) : t('unnamed')}</td>
                          <td style={{ padding: '4px' }}>{extraObj.main}/{extraObj.middle}/{extraObj.sub}</td>
                          <td style={{ padding: '4px', color: 'var(--color-text-secondary)' }}>{nextMain}/{nextMiddle}/{nextSub}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : (
          // Only show "pattern not analyzed" if category is not set to "not used"
          cat.enabled !== 'none' && (
            <div style={{ marginTop: 12, padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
              <p className="small" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
                {t('patternNotAnalyzed')}
              </p>
            </div>
          )
        )}

        {cat.usage && (
          <div style={{ marginTop: 12 }}>
            <strong>{t('usage')}</strong> {cat.usage === 'all' ? t('fullyUse') : cat.usage === 'selected' ? t('basicUse') : t('notUse')}
          </div>
        )}


        {cat.wizardConfig && (
          <div style={{ marginTop: 12, padding: '8px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>{t('wizardConfiguration')}</strong>
            {cat.wizardConfig.mode && (
              <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                <strong>{t('mode')}:</strong> {cat.wizardConfig.mode}
              </div>
            )}
            {cat.wizardConfig.functionNumber && (
              <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                <strong>{t('functionNumber')}:</strong> {cat.wizardConfig.functionNumber}
              </div>
            )}
            {cat.wizardConfig.startSub && (
              <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                <strong>{t('startSubGroupLabel')}:</strong> {cat.wizardConfig.startSub}
              </div>
            )}
            {cat.wizardConfig.floor && (
              <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                <strong>{t('floor')}:</strong> {cat.wizardConfig.floor === 'variable' ? t('variable') : cat.wizardConfig.floor}
              </div>
            )}
          </div>
        )}

        {categoryKey === 'hvac' && (category as any).zones && (category as any).zones.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <strong>{t('zones')}:</strong>
            <ul style={{ margin: '4px 0 0 20px', fontSize: '0.9rem' }}>
              {(category as any).zones.map((zone: any, idx: number) => (
                <li key={idx}>
                  {zone.name} {zone.roomAddress && `(${zone.roomAddress})`}
                </li>
              ))}
            </ul>
          </div>
        )}
        </div>
      </div>
    );
  };

  // Get fixed addresses and filter out main groups used by categories
  // Prefer teachByExampleConfig.fixedAddresses if it exists (more up-to-date), otherwise use template.devices.fixed.mainGroups
  const allFixedAddresses = (template.teachByExampleConfig?.fixedAddresses as any) || template.devices?.fixed?.mainGroups || [];
  console.log('[TeachByExampleOverview] allFixedAddresses:', {
    source: template.teachByExampleConfig?.fixedAddresses ? 'teachByExampleConfig.fixedAddresses' : 'template.devices.fixed.mainGroups',
    count: allFixedAddresses.length,
    mainGroups: allFixedAddresses.map(mg => ({
      main: mg.main,
      name: mg.name,
      middleGroups: mg.middleGroups?.map(mg => ({
        name: mg.name,
        middle: mg.middle,
        subsCount: mg.subs?.length,
        subs: mg.subs?.map(s => ({ sub: s.sub, name: s.name }))
      }))
    }))
  });
  
  // Get main groups used by categories
  const getMainGroupsUsedByCategories = (): Set<number> => {
    const usedMainGroups = new Set<number>();
    
    // Check switching
    if (categories.switching) {
      const switchingGroups = Array.isArray(categories.switching) ? categories.switching : [categories.switching];
      switchingGroups.forEach(group => {
        if (group.exampleAddresses && group.exampleAddresses.length > 0) {
          group.exampleAddresses.forEach(addr => {
            if (addr.main > 0) {
              usedMainGroups.add(addr.main);
            }
          });
        }
        if (group.extraObjects && group.extraObjects.length > 0) {
          group.extraObjects.forEach(obj => {
            if (obj.main > 0) {
              usedMainGroups.add(obj.main);
            }
          });
        }
        // Check extra main groups for HVAC
        if (group.pattern?.extraMainGroups) {
          group.pattern.extraMainGroups.forEach(extraGroup => {
            if (extraGroup.main > 0) {
              usedMainGroups.add(extraGroup.main);
            }
          });
        }
        if (group.pattern?.nextMainGroup !== undefined && group.pattern.nextMainGroup > 0) {
          usedMainGroups.add(group.pattern.nextMainGroup);
        }
      });
    }
    
    // Check dimming
    if (categories.dimming) {
      const dimmingGroups = Array.isArray(categories.dimming) ? categories.dimming : [categories.dimming];
      dimmingGroups.forEach(group => {
        if (group.exampleAddresses && group.exampleAddresses.length > 0) {
          group.exampleAddresses.forEach(addr => {
            if (addr.main > 0) {
              usedMainGroups.add(addr.main);
            }
          });
        }
        if (group.extraObjects && group.extraObjects.length > 0) {
          group.extraObjects.forEach(obj => {
            if (obj.main > 0) {
              usedMainGroups.add(obj.main);
            }
          });
        }
        if (group.pattern?.extraMainGroups) {
          group.pattern.extraMainGroups.forEach(extraGroup => {
            if (extraGroup.main > 0) {
              usedMainGroups.add(extraGroup.main);
            }
          });
        }
        if (group.pattern?.nextMainGroup !== undefined && group.pattern.nextMainGroup > 0) {
          usedMainGroups.add(group.pattern.nextMainGroup);
        }
      });
    }
    
    // Check shading
    if (categories.shading) {
      const shadingGroups = Array.isArray(categories.shading) ? categories.shading : [categories.shading];
      shadingGroups.forEach(group => {
        if (group.exampleAddresses && group.exampleAddresses.length > 0) {
          group.exampleAddresses.forEach(addr => {
            if (addr.main > 0) {
              usedMainGroups.add(addr.main);
            }
          });
        }
        if (group.extraObjects && group.extraObjects.length > 0) {
          group.extraObjects.forEach(obj => {
            if (obj.main > 0) {
              usedMainGroups.add(obj.main);
            }
          });
        }
        if (group.pattern?.extraMainGroups) {
          group.pattern.extraMainGroups.forEach(extraGroup => {
            if (extraGroup.main > 0) {
              usedMainGroups.add(extraGroup.main);
            }
          });
        }
        if (group.pattern?.nextMainGroup !== undefined && group.pattern.nextMainGroup > 0) {
          usedMainGroups.add(group.pattern.nextMainGroup);
        }
      });
    }
    
    // Check hvac
    if (categories.hvac) {
      const hvacGroups = Array.isArray(categories.hvac) ? categories.hvac : [categories.hvac];
      hvacGroups.forEach(group => {
        if (group.exampleAddresses && group.exampleAddresses.length > 0) {
          group.exampleAddresses.forEach(addr => {
            if (addr.main > 0) {
              usedMainGroups.add(addr.main);
            }
          });
        }
        if (group.extraObjects && group.extraObjects.length > 0) {
          group.extraObjects.forEach(obj => {
            if (obj.main > 0) {
              usedMainGroups.add(obj.main);
            }
          });
        }
        if (group.pattern?.extraMainGroups) {
          group.pattern.extraMainGroups.forEach(extraGroup => {
            if (extraGroup.main > 0) {
              usedMainGroups.add(extraGroup.main);
            }
          });
        }
        if (group.pattern?.nextMainGroup !== undefined && group.pattern.nextMainGroup > 0) {
          usedMainGroups.add(group.pattern.nextMainGroup);
        }
      });
    }
    
    return usedMainGroups;
  };
  
  // Show all fixed addresses, but filter out main groups used by shading and HVAC from the overview
  // Main group 1 should always be shown in fixed addresses, even if it's also used by categories
  // Dynamically determine which main groups are used by shading and HVAC
  const getMainGroupsUsedByShadingAndHVAC = (): Set<number> => {
    const usedMainGroups = new Set<number>();
    
    // Check shading
    if (categories.shading) {
      const shadingGroups = Array.isArray(categories.shading) ? categories.shading : [categories.shading];
      shadingGroups.forEach(group => {
        if (group.exampleAddresses && group.exampleAddresses.length > 0) {
          group.exampleAddresses.forEach(addr => {
            if (addr.main > 0) {
              usedMainGroups.add(addr.main);
            }
          });
        }
        if (group.extraObjects && group.extraObjects.length > 0) {
          group.extraObjects.forEach(obj => {
            if (obj.main > 0) {
              usedMainGroups.add(obj.main);
            }
          });
        }
        if (group.pattern?.extraMainGroups) {
          group.pattern.extraMainGroups.forEach(extraGroup => {
            if (extraGroup.main > 0) {
              usedMainGroups.add(extraGroup.main);
            }
          });
        }
        if (group.pattern?.nextMainGroup !== undefined && group.pattern.nextMainGroup > 0) {
          usedMainGroups.add(group.pattern.nextMainGroup);
        }
      });
    }
    
    // Check hvac
    if (categories.hvac) {
      const hvacGroups = Array.isArray(categories.hvac) ? categories.hvac : [categories.hvac];
      hvacGroups.forEach(group => {
        if (group.exampleAddresses && group.exampleAddresses.length > 0) {
          group.exampleAddresses.forEach(addr => {
            if (addr.main > 0) {
              usedMainGroups.add(addr.main);
            }
          });
        }
        if (group.extraObjects && group.extraObjects.length > 0) {
          group.extraObjects.forEach(obj => {
            if (obj.main > 0) {
              usedMainGroups.add(obj.main);
            }
          });
        }
        if (group.pattern?.extraMainGroups) {
          group.pattern.extraMainGroups.forEach(extraGroup => {
            if (extraGroup.main > 0) {
              usedMainGroups.add(extraGroup.main);
            }
          });
        }
        if (group.pattern?.nextMainGroup !== undefined && group.pattern.nextMainGroup > 0) {
          usedMainGroups.add(group.pattern.nextMainGroup);
        }
      });
    }
    
    return usedMainGroups;
  };
  
  const shadingAndHVACMainGroups = getMainGroupsUsedByShadingAndHVAC();
  
  // Get all main groups used by categories for blocking
  const allUsedMainGroups = getMainGroupsUsedByCategories();
  const blockedMainGroups = Array.from(allUsedMainGroups);
  
  const fixedAddresses = allFixedAddresses.filter(mainGroup => {
    // Exclude main groups used by shading and HVAC as they are handled separately
    // But allow all other main groups including 1 and any user-added groups
    return !shadingAndHVACMainGroups.has(mainGroup.main);
  });

  return (
    <div>
      <div className="card">
        <h3>{t('templateConfigurationComplete')}</h3>
        <p>{t('configureFixedAddressesAndViewPatterns')}</p>
      </div>

      {/* Patterns Overview - hoofdfuncties eerst (schakelen, dimmen, jaloezie, klimaat) */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h4>{t('analyzedPatternsPerMainFunction')}</h4>
          {/* "Bewerk Patronen" button removed - should not appear */}
        </div>
        
        <div style={{ marginTop: 24 }}>
          {/* Always render all categories, even if they don't exist in config */}
          {renderCategoryConfig('switching', categories.switching)}
          {renderCategoryConfig('dimming', categories.dimming)}
          {renderCategoryConfig('shading', categories.shading)}
          {renderCategoryConfig('hvac', categories.hvac)}
        </div>
      </div>

      {/* Vaste groepsadressen - onderaan na hoofdfuncties */}
      <FixedGroupAddressesSection
        title={t('fixedGroupAddressesLabel')}
        mainGroups={fixedAddresses}
        teachByExampleConfig={config}
        onConfigUpdate={(updatedConfig) => {
          // Update the template with the new config
          if (template) {
            const updatedTemplate = {
              ...template,
              teachByExampleConfig: updatedConfig
            };
            
            // Update the template in the store
            setTemplate(updatedTemplate);
            
            // Force check for changes after update
            const { checkTemplateChanges } = useAppStore.getState();
            checkTemplateChanges(updatedTemplate);
            
            // Auto-save template if it's an existing template (has currentTemplateId)
            if (currentTemplateId && username) {
              // Use requestAnimationFrame to ensure the store update has been processed
              requestAnimationFrame(() => {
                try {
                  const { saveUserTemplate } = useAppStore.getState();
                  saveUserTemplate();
                } catch (err) {
                  console.error('[TeachByExampleOverview] Error auto-saving template:', err);
                  // Don't show error to user, just log it - template is still updated in store
                }
              });
            }
          }
        }}
        onUpdate={(mainGroups) => {
          // Update template with new fixed addresses
          // Always update, even for new templates
          console.log('[TeachByExampleOverview] onUpdate called with mainGroups:', mainGroups);
          
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
                // Also update teachByExampleConfig if it exists
                teachByExampleConfig: template.teachByExampleConfig ? {
                  ...template.teachByExampleConfig,
                  fixedAddresses: mainGroups as any
                } : undefined
              };
              
              console.log('[TeachByExampleOverview] Updating template with fixed addresses:', {
                mainGroupsCount: updatedTemplate.devices?.fixed?.mainGroups?.length,
                mainGroups: updatedTemplate.devices?.fixed?.mainGroups?.map(mg => ({
                  id: mg.id,
                  name: mg.name,
                  main: mg.main,
                  middleGroups: mg.middleGroups.map(mg => ({
                    id: mg.id,
                    name: mg.name,
                    middle: mg.middle,
                    subsCount: mg.subs.length,
                    subs: mg.subs.map(s => ({ sub: s.sub, name: s.name }))
                  }))
                }))
              });
              // Use setTemplate to update, which will trigger re-render
              setTemplate(updatedTemplate);
              // Force immediate update of the store to ensure the change is reflected
              useAppStore.setState({ template: updatedTemplate });
              console.log('[TeachByExampleOverview] Template updated, component should re-render');
              
              // Auto-save template if it's an existing template (has currentTemplateId)
              if (currentTemplateId && username) {
                try {
                  const { saveUserTemplate } = useAppStore.getState();
                  saveUserTemplate();
                  console.log('[TeachByExampleOverview] Template auto-saved after fixed addresses update');
                } catch (err) {
                  console.error('[TeachByExampleOverview] Error auto-saving template:', err);
                  // Don't show error to user, just log it - template is still updated in store
                }
              }
            } catch (error) {
              console.error('Error updating template with fixed addresses:', error);
            }
          } else {
            // If no template exists yet, create a minimal one with just the fixed addresses
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
            console.log('[TeachByExampleOverview] Creating new template with fixed addresses:', newTemplate.devices?.fixed?.mainGroups);
            setTemplate(newTemplate);
          }
        }}
        blockedMainGroups={blockedMainGroups}
      />

      <div className="flex" style={{ marginTop: '24px', gap: '12px' }}>
        {(() => {
          // Check if all 4 main functions are set to "not used" (enabled === 'none')
          const allCategoriesNotUsed = (() => {
            if (!template?.teachByExampleConfig?.categories) return false;
            const config = template.teachByExampleConfig;
            const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
            return allCategories.every(cat => {
              const categoryConfig = config.categories?.[cat];
              if (!categoryConfig) return false; // Category must be present
              const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
              return configs.every(cfg => cfg.enabled === 'none');
            });
          })();
          
          // Show button with different text and navigation based on whether all categories are "not used"
          return (
            <button 
              className="button primary" 
              onClick={() => {
                // If all categories are "not used", navigate to overview
                if (allCategoriesNotUsed) {
                  setStep('overview');
                  return;
                }
                
                // Skip check if we're working with a project (currentProjectId is set),
                // because projects manage their own state separately
                if (templateHasChanges && !currentProjectId) {
                  // If template has a currentTemplateId, it's already saved, so allow navigation
                  // (templateHasChanges might be true due to timing issues in the effect)
                  if (currentTemplateId) {
                    setStep('devices');
                    return;
                  }
                  
                  // Don't block if it's a new template that's not fully configured yet
                  const isNewTemplate = !currentTemplateId && template?.teachByExampleConfig;
                  if (isNewTemplate) {
                    const config = template.teachByExampleConfig;
                    const hasTemplateName = config?.templateName && config.templateName.trim() !== '';
                    const hasCategories = config?.categories && Object.keys(config.categories).length > 0;
                    
                    // Check if categories are fully configured
                    let allConfigured = false;
                    if (hasCategories) {
                      const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
                      allConfigured = allCategories.every(cat => {
                        const categoryConfig = config.categories?.[cat];
                        if (!categoryConfig) return true; // Category not used
                        const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
                        return configs.every(cfg => {
                          if (cfg.enabled === 'none') return true;
                          if (cat === 'dimming' && cfg.linkedToSwitching) return true;
                          return cfg.pattern !== undefined;
                        });
                      });
                    }
                    
                    // If it's a new template that's not fully configured, allow navigation
                    if (!hasTemplateName || !hasCategories || !allConfigured) {
                      setStep('devices');
                      return;
                    }
                  }
                  
                  // For existing templates with changes or fully completed new templates, show warning
                  const message = t('unsavedChanges') + '. ' + t('saveChanges');
                  alert(message);
                  return; // Don't navigate - user must save first
                }
                // If only template is loaded (no project), show dialog to ask for project name
                if (currentTemplateId && !currentProjectId) {
                  if (!username) {
                    alert(t('usernameRequired') || 'Gebruikersnaam is verplicht');
                    return;
                  }
                  if (!template) {
                    alert(t('noTemplate') || 'Geen template beschikbaar');
                    return;
                  }
                  // Show project name dialog instead of directly saving
                  setShowProjectNameDialog(true);
                  return;
                }
                setStep('devices');
              }}
              style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}
            >
              {allCategoriesNotUsed 
                ? `${t('next')}: ${t('stepOverview')}`
                : currentTemplateId && !currentProjectId 
                  ? t('createProjectFromTemplate')
                  : `${t('next')}: ${t('stepDeviceSelection')}`
              }
            </button>
          );
        })()}
      </div>
    </div>
  );
};

