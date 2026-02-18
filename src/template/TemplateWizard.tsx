import { useState, useEffect, useCallback, useMemo } from 'react';
import { TemplateConfig, TeachByExampleTemplateConfig, FixedMainGroupTemplate, FixedMiddleGroupTemplate, FixedSubTemplate } from '../types/common';
import { buildEmptyTemplate, buildDefaultTemplate, useAppStore, sortGroups } from '../store';
import { TeachByExampleWizard } from './TeachByExampleWizard';
import { TeachByExampleOverview } from './TeachByExampleOverview';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../i18n/useTranslation'; // Keep for lang access temporarily
import { translateObjectName, translateFixedAddressName, translateSubName, getStandardFixedAddressName, getFixedAddressKey } from '../i18n/translations';
import { uid } from '../utils/id';
import { DPTSelector } from '../ui/DPTSelector';

// FixedGroupAddressesSection component for managing fixed group addresses
export const FixedGroupAddressesSection = ({ title, mainGroups, blockedMainGroups = [], onUpdate, teachByExampleConfig, onConfigUpdate }: {
  title: string;
  mainGroups: FixedMainGroupTemplate[];
  blockedMainGroups?: number[]; // Main groups that should be blocked (e.g., from HVAC configuration)
  onUpdate: (mainGroups: FixedMainGroupTemplate[]) => void;
  teachByExampleConfig?: TeachByExampleTemplateConfig; // Teach by Example config to check for used addresses
  onConfigUpdate?: (config: TeachByExampleTemplateConfig) => void; // Callback to update config
}) => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  
  // Debug: Log when mainGroups prop changes
  useEffect(() => {
    const detailedMainGroups = mainGroups.map(mg => ({
      id: mg.id,
      name: mg.name,
      main: mg.main,
      middleGroups: mg.middleGroups.map(mg => ({
        id: mg.id,
        name: mg.name,
        middle: mg.middle,
        subsCount: mg.subs.length,
        subs: mg.subs.map(s => ({ sub: s.sub, name: s.name, id: s.id }))
      }))
    }));
    console.log('[FixedGroupAddressesSection] mainGroups prop changed:', {
      mainGroupsCount: mainGroups.length,
      mainGroups: detailedMainGroups,
      allSubs: mainGroups.flatMap(mg => 
        mg.middleGroups.flatMap(mg => 
          mg.subs.map(s => ({ mainGroup: mg.name, middleGroup: mg.name, sub: s.sub, name: s.name }))
        )
      )
    });
  }, [mainGroups]);
  const [editingMain, setEditingMain] = useState<string | null>(null);
  const [editingMiddle, setEditingMiddle] = useState<string | null>(null);
  const [editingMiddleName, setEditingMiddleName] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState<string | null>(null);
  
  // Check if auto-generate is enabled
  // Use useMemo to ensure it updates when mainGroups change (for name matching)
  const autoGenerateEnabled = useMemo(() => {
    const enabled = teachByExampleConfig?.autoGenerateRoomAddresses ?? false;
    console.log('[FixedGroupAddressesSection] autoGenerateEnabled computed:', {
      enabled,
      hasConfig: !!teachByExampleConfig,
      configValue: teachByExampleConfig?.autoGenerateRoomAddresses,
      mainGroupsCount: mainGroups.length,
      mainGroupNames: mainGroups.map(mg => ({ id: mg.id, name: mg.name, main: mg.main }))
    });
    return enabled;
  }, [teachByExampleConfig?.autoGenerateRoomAddresses, mainGroups]);
  
  // Check if all 4 main functions are set to "not used" (enabled === 'none')
  // If so, disable the auto-generate checkbox
  const allCategoriesNotUsed = useMemo(() => {
    if (!teachByExampleConfig?.categories) return false;
    const config = teachByExampleConfig;
    const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
    return allCategories.every(cat => {
      const categoryConfig = config.categories?.[cat];
      if (!categoryConfig) return false; // Category must be present
      const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
      return configs.every(cfg => cfg.enabled === 'none');
    });
  }, [teachByExampleConfig]);
  
  // Helper function to check if a name matches any language variant
  const matchesNameVariant = useCallback((name: string, variants: string[]): boolean => {
    const nameLower = name.toLowerCase().trim();
    return variants.some(variant => nameLower === variant.toLowerCase().trim());
  }, []);
  
  // Get all language variants for category names
  const getGeneralVariants = useCallback((): string[] => {
    return ['algemeen', 'general', 'général', 'allgemein'];
  }, []);
  
  const getCentralVariants = useCallback((): string[] => {
    return ['centraal', 'centraal schakelen', 'centraal objecten', 'central switching', 'central objects', 'central', 'objetos centrales', 'objetos central', 'objets centraux', 'objets central', 'zentrale objekte', 'zentral', 'zentrales schalten'];
  }, []);
  
  const getSceneVariants = useCallback((): string[] => {
    return ['scène\'s', 'scènes', 'scenes', 'scene', 'escenas', 'escena', 'scènes', 'scène', 'szenen', 'szene'];
  }, []);
  
  const getCentralDimmingVariants = useCallback((): string[] => {
    return ['centraal dimmen', 'central dimming', 'dimming central', 'centrale dimmerung', 'dimming central', 'dimming centrale', 'dimming central'];
  }, []);
  
  const getCentralBlindVariants = useCallback((): string[] => {
    return ['centraal jalouzie / rolluik', 'centraal jalouzie', 'centraal rolluik', 'central blind', 'central shading', 'central jalousie', 'central store', 'zentrale jalousie', 'zentrale rollo', 'jalousie central', 'store central'];
  }, []);
  
  // Get the original default name for a middle group based on its middle number
  // This is used to restore the original name when the user clears the name field
  const getOriginalMiddleGroupName = useCallback((middle: number): string | null => {
    // Standard middle groups in main group 1 (Algemeen):
    // middle 0: 'scènes'
    // middle 1: 'centraal schakelen'
    // middle 2: 'centraal dimmen'
    // middle 3: 'centraal jalouzie / rolluik'
    switch (middle) {
      case 0:
        return 'scènes';
      case 1:
        return 'centraal schakelen';
      case 2:
        return 'centraal dimmen';
      case 3:
        return 'centraal jalouzie / rolluik';
      default:
        return null; // Not a standard middle group
    }
  }, []);
  
  const getAllOffVariants = useCallback((): string[] => {
    return ['alles uit', 'all off', 'todo apagado', 'tout éteindre', 'alles aus'];
  }, []);
  
  const getWelcomeVariants = useCallback((): string[] => {
    return ['welkom', 'welcome', 'bienvenido', 'bienvenue', 'willkommen'];
  }, []);
  
  // Helper function to translate main group name if it matches a category name
  const translateMainGroupName = useCallback((name: string): string => {
    if (!name) return name;
    
    const nameLower = name.toLowerCase().trim();
    
    // Map of category names in all languages to their translation keys
    const categoryNameMap: Record<string, { key: 'switch' | 'dimmer' | 'blind' | 'hvac'; allVariants: string[] }> = {
      'schakelen': { key: 'switch', allVariants: ['schakelen', 'switch', 'interruptor', 'interrupteur', 'schalter'] },
      'switch': { key: 'switch', allVariants: ['schakelen', 'switch', 'interruptor', 'interrupteur', 'schalter'] },
      'interruptor': { key: 'switch', allVariants: ['schakelen', 'switch', 'interruptor', 'interrupteur', 'schalter'] },
      'interrupteur': { key: 'switch', allVariants: ['schakelen', 'switch', 'interruptor', 'interrupteur', 'schalter'] },
      'schalter': { key: 'switch', allVariants: ['schakelen', 'switch', 'interruptor', 'interrupteur', 'schalter'] },
      'dimmen': { key: 'dimmer', allVariants: ['dimmen', 'dimmer', 'regulador', 'variateur', 'dimmer'] },
      'dimmer': { key: 'dimmer', allVariants: ['dimmen', 'dimmer', 'regulador', 'variateur', 'dimmer'] },
      'regulador': { key: 'dimmer', allVariants: ['dimmen', 'dimmer', 'regulador', 'variateur', 'dimmer'] },
      'variateur': { key: 'dimmer', allVariants: ['dimmen', 'dimmer', 'regulador', 'variateur', 'dimmer'] },
      'jalouzie': { key: 'blind', allVariants: ['jalouzie', 'rolluik', 'blind', 'persiana', 'store', 'jalousie', 'rollo', 'rolladen'] },
      'rolluik': { key: 'blind', allVariants: ['jalouzie', 'rolluik', 'blind', 'persiana', 'store', 'jalousie', 'rollo', 'rolladen'] },
      'blind': { key: 'blind', allVariants: ['jalouzie', 'rolluik', 'blind', 'persiana', 'store', 'jalousie', 'rollo', 'rolladen'] },
      'persiana': { key: 'blind', allVariants: ['jalouzie', 'rolluik', 'blind', 'persiana', 'store', 'jalousie', 'rollo', 'rolladen'] },
      'store': { key: 'blind', allVariants: ['jalouzie', 'rolluik', 'blind', 'persiana', 'store', 'jalousie', 'rollo', 'rolladen'] },
      'jalousie': { key: 'blind', allVariants: ['jalouzie', 'rolluik', 'blind', 'persiana', 'store', 'jalousie', 'rollo', 'rolladen'] },
      'rollo': { key: 'blind', allVariants: ['jalouzie', 'rolluik', 'blind', 'persiana', 'store', 'jalousie', 'rollo', 'rolladen'] },
      'rolladen': { key: 'blind', allVariants: ['jalouzie', 'rolluik', 'blind', 'persiana', 'store', 'jalousie', 'rollo', 'rolladen'] },
      'klimaat': { key: 'hvac', allVariants: ['klimaat', 'hvac', 'clima', 'climat', 'klima'] },
      'hvac': { key: 'hvac', allVariants: ['klimaat', 'hvac', 'clima', 'climat', 'klima'] },
      'clima': { key: 'hvac', allVariants: ['klimaat', 'hvac', 'clima', 'climat', 'klima'] },
      'climat': { key: 'hvac', allVariants: ['klimaat', 'hvac', 'clima', 'climat', 'klima'] },
      'klima': { key: 'hvac', allVariants: ['klimaat', 'hvac', 'clima', 'climat', 'klima'] }
    };
    
    let result: string;
    
    // First check if the name exactly matches any language's category name
    // This handles cases like "Jalouzie / Rolluik" (Dutch) or "Blind / Shutter" (English)
    // Get all language translations for each category
    const allCategoryNames: Record<string, string[]> = {
      switch: ['schakelen', 'switch', 'interruptor', 'interrupteur', 'schalter'],
      dimmer: ['dimmen', 'dimmer', 'regulador', 'variateur'],
      blind: ['jalouzie / rolluik', 'jaloezie / rolluik', 'blind / shutter', 'persiana', 'store', 'jalousie', 'rollo', 'rolladen', 'blind'],
      hvac: ['klimaat / hvac', 'climate / hvac', 'clima / hvac', 'climat / cvc', 'klima / hlk', 'klimaat', 'hvac', 'clima', 'climat', 'klima']
    };
    
    // Check exact match with any language's category name (including compound names)
    for (const [key, names] of Object.entries(allCategoryNames)) {
      for (const catName of names) {
        if (nameLower === catName.toLowerCase()) {
          result = t(key) as string;
          // Capitalize first letter for display
          if (result && result.length > 0) {
            return result.charAt(0).toUpperCase() + result.slice(1);
          }
          return result;
        }
      }
    }
    
    // Check if name contains any category name variant (for compound names like "Jalouzie / Rolluik")
    // This handles cases where the name might have extra spaces or formatting
    for (const [variant, data] of Object.entries(categoryNameMap)) {
      // Normalize both the variant and the name for comparison (remove extra spaces, normalize slashes)
      const normalizedVariant = variant.replace(/\s+/g, ' ').trim();
      const normalizedName = nameLower.replace(/\s+/g, ' ').trim();
      
      // Check if the normalized name contains the normalized variant
      if (normalizedName.includes(normalizedVariant) || normalizedName === normalizedVariant || normalizedName.startsWith(normalizedVariant + ' ')) {
        result = t(data.key);
        // Capitalize first letter for display
        if (result && result.length > 0) {
          return result.charAt(0).toUpperCase() + result.slice(1);
        }
        return result;
      }
    }
    
    // Check if name matches any category name variant (original logic)
    for (const [variant, data] of Object.entries(categoryNameMap)) {
      if (nameLower === variant || nameLower.startsWith(variant + ' ')) {
        result = t(data.key);
        // Capitalize first letter for display
        if (result && result.length > 0) {
          return result.charAt(0).toUpperCase() + result.slice(1);
        }
        return result;
      }
    }
    
    // Return original name with first letter capitalized
    if (name && name.length > 0) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return name;
  }, [t]);
  
  // Helper function to translate middle group name
  // Uses translateFixedAddressName to translate standard names (centraal, scène's, etc.)
  // Falls back to original name if no translation found
  // Returns with first letter capitalized for display
  const translateMiddleGroupName = useCallback((name: string): string => {
    if (!name) return name;
    
    const nameLower = name.toLowerCase();
    
    // Check if this name is a known standard name variant
    const translationKey = getFixedAddressKey(nameLower);
    
    let result: string;
    if (translationKey) {
      // It's a standard name variant - translate it to the current language
      // This works for any language variant (Dutch, Spanish, English, etc.)
      result = translateFixedAddressName(name, lang);
    } else {
      // Not a standard name at all, just use lowercase
      result = nameLower;
    }
    
    // Capitalize first letter for display
    if (result && result.length > 0) {
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result;
  }, [lang]);
  
  // Helper function to get all used addresses from TeachByExample config
  const getUsedAddressesFromConfig = () => {
    const usedAddresses: Map<number, { name: string; middles: Set<number>; subs: Map<number, Set<number>> }> = new Map();
    
    if (!teachByExampleConfig?.categories) return usedAddresses;
    
    const categoryNames: Record<string, string> = {
      switching: t('switch'),
      dimming: t('dimmer'),
      shading: t('blind'),
      hvac: t('hvac')
    };
    
    // Helper to normalize category config to array
    const normalizeCategoryConfig = (category: any): any[] => {
      if (!category) return [];
      if (Array.isArray(category)) return category;
      return [category];
    };
    
    // Check all categories
    Object.entries(teachByExampleConfig.categories).forEach(([catKey, category]) => {
      const configs = normalizeCategoryConfig(category);
      const categoryName = categoryNames[catKey] || catKey;
      
      configs.forEach((cfg: any) => {
        if (cfg.enabled === 'none') return;
        
        // Check example addresses
        if (cfg.exampleAddresses) {
          cfg.exampleAddresses.forEach((addr: any) => {
            if (addr.main !== 0 || addr.middle !== 0 || addr.sub !== 0) {
              if (!usedAddresses.has(addr.main)) {
                usedAddresses.set(addr.main, {
                  name: categoryName,
                  middles: new Set(),
                  subs: new Map()
                });
              }
              const mainData = usedAddresses.get(addr.main)!;
              mainData.middles.add(addr.middle);
              if (!mainData.subs.has(addr.middle)) {
                mainData.subs.set(addr.middle, new Set());
              }
              mainData.subs.get(addr.middle)!.add(addr.sub);
            }
          });
        }
        
        // Check extra objects
        if (cfg.extraObjects) {
          cfg.extraObjects.forEach((obj: any) => {
            if (obj.main !== 0 || obj.middle !== 0 || obj.sub !== 0) {
              if (!usedAddresses.has(obj.main)) {
                usedAddresses.set(obj.main, {
                  name: categoryName,
                  middles: new Set(),
                  subs: new Map()
                });
              }
              const mainData = usedAddresses.get(obj.main)!;
              mainData.middles.add(obj.middle);
              if (!mainData.subs.has(obj.middle)) {
                mainData.subs.set(obj.middle, new Set());
              }
              mainData.subs.get(obj.middle)!.add(obj.sub);
            }
          });
        }
      });
    });
    
    return usedAddresses;
  };
  
  const addMainGroup = () => {
    // Find the first available main group (not used and not blocked)
    const usedMains = mainGroups.map(mg => mg.main);
    const usedAddresses = getUsedAddressesFromConfig();
    const usedMainNumbers = Array.from(usedAddresses.keys());
    
    let newMain = 0;
    while (newMain <= 31 && (usedMains.includes(newMain) || blockedMainGroups.includes(newMain) || usedMainNumbers.includes(newMain))) {
      newMain++;
    }
    if (newMain > 31) {
      alert(t('noMainGroupsAvailable'));
      return;
    }
    
    // Check if this main group is already used in the template
    const usedAddressData = usedAddresses.get(newMain);
    const rawGroupName = usedAddressData ? usedAddressData.name : `${t('mainGroupName')} ${newMain}`;
    const groupName = translateMainGroupName(rawGroupName);
    
    const newMainGroup: FixedMainGroupTemplate = {
      id: uid(),
      main: newMain,
      name: groupName,
      middleGroups: []
    };
    
    const updatedMainGroups = [...mainGroups, newMainGroup];
    console.log('[FixedGroupAddressesSection] addMainGroup: calling onUpdate with', updatedMainGroups.length, 'mainGroups');
    onUpdate(updatedMainGroups);
  };
  
  const updateMainGroup = (id: string, updates: Partial<FixedMainGroupTemplate>) => {
    console.log('[FixedGroupAddressesSection] updateMainGroup called:', {
      id,
      updates,
      currentName: mainGroups.find(mg => mg.id === id)?.name,
      newName: updates.name,
      autoGenerateEnabled
    });
    const updated = mainGroups.map(mg => mg.id === id ? { ...mg, ...updates } : mg);
    console.log('[FixedGroupAddressesSection] updateMainGroup: Updated mainGroups:', updated.map(mg => ({ id: mg.id, name: mg.name, main: mg.main })));
    onUpdate(updated);
  };
  
  // Get available main numbers (0-31, excluding already used ones and blocked ones)
  const getAvailableMainNumbers = (currentMainGroupId: string): number[] => {
    const usedMains = mainGroups
      .filter(mg => mg.id !== currentMainGroupId)
      .map(mg => mg.main);
    
    // Also check used addresses from template
    const usedAddresses = getUsedAddressesFromConfig();
    const usedMainNumbers = Array.from(usedAddresses.keys());
    
    return Array.from({ length: 32 }, (_, i) => i).filter(n => 
      !usedMains.includes(n) && !blockedMainGroups.includes(n) && !usedMainNumbers.includes(n)
    );
  };
  
  const deleteMainGroup = (id: string) => {
    onUpdate(mainGroups.filter(mg => mg.id !== id));
  };
  
  const addMiddleGroup = (mainGroupId: string) => {
    const mainGroup = mainGroups.find(mg => mg.id === mainGroupId);
    if (!mainGroup) return;
    
    // Find the next available middle number within this main group only
    const existingMiddles = mainGroup.middleGroups.map(mg => mg.middle);
    
    // Also check used addresses from template
    const usedAddresses = getUsedAddressesFromConfig();
    const usedMiddlesFromTemplate = usedAddresses.get(mainGroup.main)?.middles || new Set();
    const usedMiddlesArray = Array.from(usedMiddlesFromTemplate);
    
    // Find first available middle number
    let newMiddle = 0;
    while (newMiddle <= 7 && (existingMiddles.includes(newMiddle) || usedMiddlesArray.includes(newMiddle))) {
      newMiddle++;
    }
    
    if (newMiddle > 7) {
      alert(t('maxMiddleGroupsReached'));
      return;
    }
    
    const newMiddleGroup: FixedMiddleGroupTemplate = {
      id: uid(),
      middle: newMiddle,
      name: `${t('middleGroupName')} ${newMiddle}`,
      subs: []
    };
    
    updateMainGroup(mainGroupId, {
      middleGroups: [...mainGroup.middleGroups, newMiddleGroup]
    });
  };
  
  const updateMiddleGroup = (mainGroupId: string, middleGroupId: string, updates: Partial<FixedMiddleGroupTemplate>) => {
    const mainGroup = mainGroups.find(mg => mg.id === mainGroupId);
    if (!mainGroup) {
      console.log('[FixedGroupAddressesSection] updateMiddleGroup: Main group not found:', mainGroupId);
      return;
    }
    
    const currentMiddleGroup = mainGroup.middleGroups.find(mg => mg.id === middleGroupId);
    console.log('[FixedGroupAddressesSection] updateMiddleGroup START:', {
      mainGroupId,
      middleGroupId,
      mainGroupName: mainGroup.name,
      currentMiddleGroupName: currentMiddleGroup?.name,
      newName: updates.name,
      allUpdates: updates,
      autoGenerateEnabled,
      mainGroupsCount: mainGroups.length
    });
    
    // Create updated middle groups with the new values
    const updatedMiddleGroups = mainGroup.middleGroups.map(mg => 
      mg.id === middleGroupId ? { ...mg, ...updates } : mg
    );
    
    // Update the main group with the new middle groups
    const updatedMainGroups = mainGroups.map(mg => 
      mg.id === mainGroupId ? { ...mg, middleGroups: updatedMiddleGroups } : mg
    );
    
    const updatedMiddleGroup = updatedMiddleGroups.find(mg => mg.id === middleGroupId);
    console.log('[FixedGroupAddressesSection] updateMiddleGroup BEFORE onUpdate:', {
      updatedName: updatedMiddleGroup?.name,
      updatedMainGroupsCount: updatedMainGroups.length,
      updatedMainGroupNames: updatedMainGroups.map(mg => ({ id: mg.id, name: mg.name, main: mg.main, middleGroups: mg.middleGroups.map(mg => ({ id: mg.id, name: mg.name, middle: mg.middle })) }))
    });
    
    // Directly call onUpdate with the complete updated mainGroups to ensure the name is saved correctly
    onUpdate(updatedMainGroups);
    
    console.log('[FixedGroupAddressesSection] updateMiddleGroup AFTER onUpdate called');
    
    // Check if this affects auto-generate
    if (updatedMiddleGroup) {
      const isAutoGen = isAutoGeneratedMiddleGroup(
        updatedMainGroups.find(mg => mg.id === mainGroupId)!,
        updatedMiddleGroup
      );
      console.log('[FixedGroupAddressesSection] updateMiddleGroup: After update, isAutoGeneratedMiddleGroup:', {
        mainGroupName: updatedMainGroups.find(mg => mg.id === mainGroupId)?.name,
        middleGroupName: updatedMiddleGroup.name,
        isAutoGen,
        autoGenerateEnabled
      });
    }
  };
  
  // Get available middle numbers for a main group (0-7, excluding already used ones within that main group and from template)
  const getAvailableMiddleNumbers = (mainGroupId: string, currentMiddleGroupId: string): number[] => {
    const mainGroup = mainGroups.find(mg => mg.id === mainGroupId);
    if (!mainGroup) return Array.from({ length: 8 }, (_, i) => i);
    
    const usedMiddles = mainGroup.middleGroups
      .filter(mg => mg.id !== currentMiddleGroupId)
      .map(mg => mg.middle);
    
    // Also check used addresses from template
    const usedAddresses = getUsedAddressesFromConfig();
    const usedMiddlesFromTemplate = usedAddresses.get(mainGroup.main)?.middles || new Set();
    const usedMiddlesArray = Array.from(usedMiddlesFromTemplate);
    
    return Array.from({ length: 8 }, (_, i) => i).filter(n => 
      !usedMiddles.includes(n) && !usedMiddlesArray.includes(n)
    );
  };
  
  const deleteMiddleGroup = (mainGroupId: string, middleGroupId: string) => {
    const mainGroup = mainGroups.find(mg => mg.id === mainGroupId);
    if (!mainGroup) return;
    
    updateMainGroup(mainGroupId, {
      middleGroups: mainGroup.middleGroups.filter(mg => mg.id !== middleGroupId)
    });
  };
  
  const addSub = (mainGroupId: string, middleGroupId: string) => {
    const mainGroup = mainGroups.find(mg => mg.id === mainGroupId);
    if (!mainGroup) return;
    const middleGroup = mainGroup.middleGroups.find(mg => mg.id === middleGroupId);
    if (!middleGroup) return;
    
    // If this is an auto-generated middle group (centraal/scènes), only allow adding sub 100-255
    const isAutoGen = isAutoGeneratedMiddleGroup(mainGroup, middleGroup);
    const startSub = isAutoGen ? 100 : 0;
    
    // Find the next available sub number within this middle group only
    const existingSubs = middleGroup.subs.map(s => s.sub);
    
    // Also check used addresses from template
    const usedAddresses = getUsedAddressesFromConfig();
    const usedSubsFromTemplate = usedAddresses.get(mainGroup.main)?.subs.get(middleGroup.middle) || new Set();
    const usedSubsArray = Array.from(usedSubsFromTemplate);
    
    // Find first available sub number (starting from startSub)
    let newSub = startSub;
    while (newSub <= 255 && (existingSubs.includes(newSub) || usedSubsArray.includes(newSub))) {
      newSub++;
    }
    
    if (newSub > 255) {
      alert(t('maxSubGroupsReached'));
      return;
    }
    
    const newSubTemplate: FixedSubTemplate = {
      id: uid(),
      sub: newSub,
      name: `sub ${newSub}`,
      dpt: 'DPT1.001',
      enabled: true
    };
    
    updateMiddleGroup(mainGroupId, middleGroupId, {
      subs: [...middleGroup.subs, newSubTemplate]
    });
  };
  
  const updateSub = (mainGroupId: string, middleGroupId: string, subId: string, updates: Partial<FixedSubTemplate>) => {
    const mainGroup = mainGroups.find(mg => mg.id === mainGroupId);
    if (!mainGroup) return;
    const middleGroup = mainGroup.middleGroups.find(mg => mg.id === middleGroupId);
    if (!middleGroup) return;
    
    updateMiddleGroup(mainGroupId, middleGroupId, {
      subs: middleGroup.subs.map(s => s.id === subId ? { ...s, ...updates } : s)
    });
  };
  
  // Get available sub numbers for a middle group (0-255, excluding already used ones within that middle group and from template)
  // For auto-generated middle groups (centraal/scènes), only return sub 100-255
  const getAvailableSubNumbers = (mainGroupId: string, middleGroupId: string, currentSubId: string): number[] => {
    const mainGroup = mainGroups.find(mg => mg.id === mainGroupId);
    if (!mainGroup) return Array.from({ length: 256 }, (_, i) => i);
    
    const middleGroup = mainGroup.middleGroups.find(mg => mg.id === middleGroupId);
    if (!middleGroup) return Array.from({ length: 256 }, (_, i) => i);
    
    // Check if this is an auto-generated middle group
    const isAutoGen = isAutoGeneratedMiddleGroup(mainGroup, middleGroup);
    const currentSub = middleGroup.subs.find(s => s.id === currentSubId);
    
    // If this is an auto-generated middle group, only allow sub 100-255 for manual input
    // Sub 0-99 are reserved for automatic generation
    const minSub = isAutoGen ? 100 : 0;
    
    const usedSubs = middleGroup.subs
      .filter(s => s.id !== currentSubId)
      .map(s => s.sub);
    
    // Also check used addresses from template
    const usedAddresses = getUsedAddressesFromConfig();
    const usedSubsFromTemplate = usedAddresses.get(mainGroup.main)?.subs.get(middleGroup.middle) || new Set();
    const usedSubsArray = Array.from(usedSubsFromTemplate);
    
    return Array.from({ length: 256 }, (_, i) => i)
      .filter(n => n >= minSub && n <= 255)
      .filter(n => !usedSubs.includes(n) && !usedSubsArray.includes(n));
  };
  
  const deleteSub = (mainGroupId: string, middleGroupId: string, subId: string) => {
    const mainGroup = mainGroups.find(mg => mg.id === mainGroupId);
    if (!mainGroup) return;
    const middleGroup = mainGroup.middleGroups.find(mg => mg.id === middleGroupId);
    if (!middleGroup) return;
    
    updateMiddleGroup(mainGroupId, middleGroupId, {
      subs: middleGroup.subs.filter(s => s.id !== subId)
    });
  };
  
  // Check if a middle group is "centraal" or "scène's" based on names only (not numbers)
  // Works for any main/middle group combination - only checks middle group name, not main group name
  // This allows the checkbox to work regardless of what the main group is named
  const isAutoGeneratedMiddleGroup = useCallback((mainGroup: FixedMainGroupTemplate, middleGroup: FixedMiddleGroupTemplate): boolean => {
    console.log('[FixedGroupAddressesSection] isAutoGeneratedMiddleGroup called:', {
      autoGenerateEnabled,
      mainGroupName: mainGroup.name,
      middleGroupName: middleGroup.name,
      mainGroupId: mainGroup.id,
      middleGroupId: middleGroup.id
    });
    
    if (!autoGenerateEnabled) {
      console.log('[FixedGroupAddressesSection] isAutoGeneratedMiddleGroup: autoGenerateEnabled is false, returning false');
      return false;
    }
    
    // Only check if middle group name matches "central", "scene", or "central dimming" in any language
    // No longer require main group to be "algemeen" - works with any main group name
    // Check if this specific middle group type has auto-generation enabled
    const middleName = middleGroup.name.toLowerCase();
    const isScenes = matchesNameVariant(middleName, getSceneVariants());
    const isCentraal = matchesNameVariant(middleName, getCentralVariants());
    const isCentralDimming = matchesNameVariant(middleName, getCentralDimmingVariants());
    const isCentralBlind = matchesNameVariant(middleName, getCentralBlindVariants());
    
    if (isScenes) {
      return teachByExampleConfig?.autoGenerateMiddleGroups?.scenes ?? true;
    } else if (isCentraal) {
      return teachByExampleConfig?.autoGenerateMiddleGroups?.centralSwitching ?? true;
    } else if (isCentralDimming) {
      return teachByExampleConfig?.autoGenerateMiddleGroups?.centralDimming ?? true;
    } else if (isCentralBlind) {
      return teachByExampleConfig?.autoGenerateMiddleGroups?.centralBlind ?? true;
    }
    
    return false;
  }, [autoGenerateEnabled, matchesNameVariant, getCentralVariants, getSceneVariants, getCentralDimmingVariants, getCentralBlindVariants, teachByExampleConfig, mainGroups]);
  
  // Check if a specific sub address is auto-generated (blocked) - only sub 0-99 are blocked
  // Works with any main group name - only checks middle group name
  const isAutoGeneratedSub = useCallback((mainGroup: FixedMainGroupTemplate, middleGroup: FixedMiddleGroupTemplate, sub: FixedSubTemplate): boolean => {
    if (!autoGenerateEnabled) return false;
    
    // Only block sub addresses 0-99, sub 100-255 remain available for manual input
    if (sub.sub < 0 || sub.sub > 99) return false;
    
    // Only check if middle group name matches "central", "scene", or "central dimming" in any language
    // No longer require main group to be "algemeen" - works with any main group name
    const middleName = middleGroup.name.toLowerCase();
    const isCentraal = matchesNameVariant(middleName, getCentralVariants());
    const isScenes = matchesNameVariant(middleName, getSceneVariants());
    const isCentralDimming = matchesNameVariant(middleName, getCentralDimmingVariants());
    const isCentralBlind = matchesNameVariant(middleName, getCentralBlindVariants());
    
    return isCentraal || isScenes || isCentralDimming || isCentralBlind;
  }, [autoGenerateEnabled, matchesNameVariant, getCentralVariants, getSceneVariants, getCentralDimmingVariants, getCentralBlindVariants, mainGroups]);
  
  // Check if a sub is a default object that cannot be deleted (only disabled)
  // These are: "alles uit" (sub 0) in "centraal" and "welkom" (sub 0) in "scène's"
  // Works with any main group name - only checks middle group name
  const isDefaultSub = useCallback((mainGroup: FixedMainGroupTemplate, middleGroup: FixedMiddleGroupTemplate, sub: FixedSubTemplate): boolean => {
    // Only check if middle group name matches "central", "scene", or "central dimming" in any language
    // No longer require main group to be "algemeen" - works with any main group name
    const middleName = middleGroup.name.toLowerCase();
    const isCentraal = matchesNameVariant(middleName, getCentralVariants());
    const isScenes = matchesNameVariant(middleName, getSceneVariants());
    const isCentralDimming = matchesNameVariant(middleName, getCentralDimmingVariants());
    const isCentralBlind = matchesNameVariant(middleName, getCentralBlindVariants());
    
    if (!isCentraal && !isScenes && !isCentralDimming && !isCentralBlind) return false;
    
    // Check if sub is sub 0 and name matches "all off", "welcome", or "---" in any language
    if (sub.sub !== 0) return false;
    
    const subName = sub.name.toLowerCase().trim();
    if (isCentraal && matchesNameVariant(subName, getAllOffVariants())) {
      return true;
    }
    if (isScenes && matchesNameVariant(subName, getWelcomeVariants())) {
      return true;
    }
    if (isCentralDimming && (subName === '---' || subName === '—' || subName === '–')) {
      return true;
    }
    if (isCentralBlind && (subName === '---' || subName === '—' || subName === '–')) {
      return true;
    }
    
    return false;
  }, [matchesNameVariant, getCentralVariants, getSceneVariants, getCentralDimmingVariants, getCentralBlindVariants, getAllOffVariants, getWelcomeVariants, mainGroups]);
  
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <h4>{title}</h4>
        <button className="button secondary" onClick={addMainGroup} style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}>
          {t('addMainGroup')}
        </button>
      </div>
      
      {teachByExampleConfig && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: 'var(--color-bg)', borderRadius: 8 }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            cursor: allCategoriesNotUsed ? 'not-allowed' : 'pointer', 
            opacity: allCategoriesNotUsed ? 0.5 : 1,
            filter: allCategoriesNotUsed ? 'blur(1.5px)' : 'none'
          }}>
            <input
              type="checkbox"
              checked={autoGenerateEnabled}
              disabled={allCategoriesNotUsed}
              onChange={(e) => {
                console.log('[FixedGroupAddressesSection] Checkbox onChange triggered:', {
                  checked: e.target.checked,
                  currentAutoGenerateEnabled: autoGenerateEnabled,
                  hasConfig: !!teachByExampleConfig,
                  hasOnConfigUpdate: !!onConfigUpdate,
                  allCategoriesNotUsed,
                  mainGroupsCount: mainGroups.length,
                  mainGroupNames: mainGroups.map(mg => ({ id: mg.id, name: mg.name, main: mg.main, middleGroups: mg.middleGroups.map(mg => ({ id: mg.id, name: mg.name, middle: mg.middle })) }))
                });
                
                if (!teachByExampleConfig || !onConfigUpdate) {
                  console.log('[FixedGroupAddressesSection] Checkbox onChange: Missing config or callback, returning early');
                  return;
                }
                
                // If enabling auto-generate, set all per-middle-group checkboxes to true by default
                if (e.target.checked && !autoGenerateEnabled) {
                  // First, find all auto-generated middle groups to determine which checkboxes to enable
                  const hasScenes = mainGroups.some(mg => 
                    mg.middleGroups.some(mg => matchesNameVariant(mg.name.toLowerCase(), getSceneVariants()))
                  );
                  const hasCentralSwitching = mainGroups.some(mg => 
                    mg.middleGroups.some(mg => matchesNameVariant(mg.name.toLowerCase(), getCentralVariants()))
                  );
                  const hasCentralDimming = mainGroups.some(mg => 
                    mg.middleGroups.some(mg => matchesNameVariant(mg.name.toLowerCase(), getCentralDimmingVariants()))
                  );
                  const hasCentralBlind = mainGroups.some(mg => 
                    mg.middleGroups.some(mg => matchesNameVariant(mg.name.toLowerCase(), getCentralBlindVariants()))
                  );
                  
                  // Continue with existing logic for checking extra subs
                  // Find all middle groups with names "centraal" or "scènes" in ANY main group
                  // This works regardless of the main group name
                  const extraSubs: Array<{ mainGroupId: string; middleGroupId: string; subId: string; subName: string; middleName: string; subNumber: number; mainGroupName: string }> = [];
                  
                    mainGroups.forEach(mainGroup => {
                    mainGroup.middleGroups.forEach(middleGroup => {
                      const middleName = middleGroup.name.toLowerCase();
                      const isCentraal = matchesNameVariant(middleName, getCentralVariants());
                      const isScenes = matchesNameVariant(middleName, getSceneVariants());
                      const isCentralDimming = matchesNameVariant(middleName, getCentralDimmingVariants());
                      const isCentralBlind = matchesNameVariant(middleName, getCentralBlindVariants());
                      
                      if (isCentraal || isScenes || isCentralDimming || isCentralBlind) {
                        middleGroup.subs.forEach(sub => {
                          // Only check sub addresses 1-99 (sub 0 is the default and should be kept)
                          // Sub 100-255 remain available for manual input
                          if (sub.sub >= 1 && sub.sub <= 99) {
                            extraSubs.push({
                              mainGroupId: mainGroup.id,
                              middleGroupId: middleGroup.id,
                              subId: sub.id,
                              subName: sub.name,
                              middleName: middleGroup.name,
                              subNumber: sub.sub,
                              mainGroupName: mainGroup.name
                            });
                          }
                        });
                      }
                    });
                  });
                    
                  // If there are extra sub-addresses (0-99), ask for confirmation
                  // Sub 100-255 will remain available for manual input
                  if (extraSubs.length > 0) {
                    const middleGroupsList = extraSubs.map(s => `- ${s.mainGroupName} > ${s.middleName}: ${s.subName} (sub ${s.subNumber})`).join('\n');
                    const message = t('extraSubAddressesWarning').replace('{count}', extraSubs.length.toString()).replace('{list}', middleGroupsList);
                    
                    if (!confirm(message)) {
                      // User cancelled, don't enable auto-generate
                      return;
                    }
                    
                    // Remove sub-addresses 1-99, but keep sub 0 (default) and sub 100-255 (for manual input)
                    // Process all main groups, not just "algemeen"
                    const updatedMainGroups = mainGroups.map(mainGroup => {
                      const hasCentraalOrScenes = mainGroup.middleGroups.some(mg => {
                        const middleName = mg.name.toLowerCase();
                        const isCentraal = matchesNameVariant(middleName, getCentralVariants());
                        const isScenes = matchesNameVariant(middleName, getSceneVariants());
                        const isCentralDimming = matchesNameVariant(middleName, getCentralDimmingVariants());
                        const isCentralBlind = matchesNameVariant(middleName, getCentralBlindVariants());
                        return isCentraal || isScenes || isCentralDimming || isCentralBlind;
                      });
                      
                      if (!hasCentraalOrScenes) return mainGroup;
                      
                      return {
                        ...mainGroup,
                        middleGroups: mainGroup.middleGroups.map(mg => {
                          const middleName = mg.name.toLowerCase();
                          const isCentraal = matchesNameVariant(middleName, getCentralVariants());
                          const isScenes = matchesNameVariant(middleName, getSceneVariants());
                          const isCentralDimming = matchesNameVariant(middleName, getCentralDimmingVariants());
                          const isCentralBlind = matchesNameVariant(middleName, getCentralBlindVariants());
                          
                          if (isCentraal || isScenes || isCentralDimming || isCentralBlind) {
                            // Keep only sub 0 (for default objects) and sub 100-255 (for manual input)
                            const filteredSubs = mg.subs.filter(s => s.sub === 0 || s.sub >= 100);
                            console.log('[FixedGroupAddressesSection] Removing subs 1-99 from middle group:', {
                              middleGroupName: mg.name,
                              beforeCount: mg.subs.length,
                              afterCount: filteredSubs.length,
                              removedSubs: mg.subs.filter(s => s.sub >= 1 && s.sub <= 99).map(s => ({ sub: s.sub, name: s.name })),
                              keptSubs: filteredSubs.map(s => ({ sub: s.sub, name: s.name }))
                            });
                            return {
                              ...mg,
                              subs: filteredSubs
                            };
                          }
                          return mg;
                        })
                      };
                    });
                    
                    console.log('[FixedGroupAddressesSection] Checkbox onChange: Calling onUpdate with filtered mainGroups:', {
                      beforeMainGroupsCount: mainGroups.length,
                      afterMainGroupsCount: updatedMainGroups.length,
                      updatedMainGroups: updatedMainGroups.map(mg => ({
                        id: mg.id,
                        name: mg.name,
                        middleGroups: mg.middleGroups.map(mg => ({
                          id: mg.id,
                          name: mg.name,
                          subsCount: mg.subs.length,
                          subs: mg.subs.map(s => ({ sub: s.sub, name: s.name }))
                        }))
                      }))
                    });
                    
                    // Update mainGroups first
                    onUpdate(updatedMainGroups);
                    console.log('[FixedGroupAddressesSection] Checkbox onChange: onUpdate called');
                  }
                  
                  // Set all existing middle groups to enabled by default when enabling auto-generate
                  const updatedConfig = {
                    ...teachByExampleConfig,
                    autoGenerateRoomAddresses: true,
                    autoGenerateMiddleGroups: {
                      ...(teachByExampleConfig.autoGenerateMiddleGroups || {}),
                      ...(hasScenes ? { scenes: true } : {}),
                      ...(hasCentralSwitching ? { centralSwitching: true } : {}),
                      ...(hasCentralDimming ? { centralDimming: true } : {}),
                      ...(hasCentralBlind ? { centralBlind: true } : {})
                    }
                  };
                  onConfigUpdate(updatedConfig);
                  console.log('[FixedGroupAddressesSection] Checkbox onChange: Config updated with all middle groups enabled, onConfigUpdate called');
                } else {
                  // Update config when disabling
                  const updatedConfig = {
                    ...teachByExampleConfig,
                    autoGenerateRoomAddresses: e.target.checked
                  };
                  onConfigUpdate(updatedConfig);
                  console.log('[FixedGroupAddressesSection] Checkbox onChange: Config updated, onConfigUpdate called');
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9rem' }}>
              {t('autoGenerateRoomAddresses')}
            </span>
          </label>
          <p className="small" style={{ 
            marginTop: 8, 
            color: 'var(--color-text-secondary)',
            opacity: allCategoriesNotUsed ? 0.5 : 1,
            filter: allCategoriesNotUsed ? 'blur(1.5px)' : 'none'
          }}>
            {t('autoGenerateRoomAddressesDescription')}
          </p>
          {autoGenerateEnabled && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
              {(() => {
                // Find all auto-generated middle groups and create checkboxes for them
                const autoGenMiddleGroups: Array<{ mainGroup: FixedMainGroupTemplate; middleGroup: FixedMiddleGroupTemplate; type: 'scenes' | 'centralSwitching' | 'centralDimming' | 'centralBlind' }> = [];
                
                mainGroups.forEach(mainGroup => {
                  mainGroup.middleGroups.forEach(middleGroup => {
                    const middleName = middleGroup.name.toLowerCase();
                    const isScenes = matchesNameVariant(middleName, getSceneVariants());
                    const isCentraal = matchesNameVariant(middleName, getCentralVariants());
                    const isCentralDimming = matchesNameVariant(middleName, getCentralDimmingVariants());
                    const isCentralBlind = matchesNameVariant(middleName, getCentralBlindVariants());
                    
                    if (isScenes) {
                      autoGenMiddleGroups.push({ mainGroup, middleGroup, type: 'scenes' });
                    } else if (isCentraal) {
                      autoGenMiddleGroups.push({ mainGroup, middleGroup, type: 'centralSwitching' });
                    } else if (isCentralDimming) {
                      autoGenMiddleGroups.push({ mainGroup, middleGroup, type: 'centralDimming' });
                    } else if (isCentralBlind) {
                      autoGenMiddleGroups.push({ mainGroup, middleGroup, type: 'centralBlind' });
                    }
                  });
                });
                
                return autoGenMiddleGroups.map(({ mainGroup, middleGroup, type }) => {
                  const isEnabled = teachByExampleConfig?.autoGenerateMiddleGroups?.[type] ?? true;
                  const displayName = (() => {
                    const translated = translateMiddleGroupName(middleGroup.name);
                    return translated.charAt(0).toUpperCase() + translated.slice(1);
                  })();
                  
                  return (
                    <label key={`${mainGroup.id}-${middleGroup.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => {
                          if (!onConfigUpdate || !teachByExampleConfig) return;
                          
                          const updatedConfig = {
                            ...teachByExampleConfig,
                            autoGenerateMiddleGroups: {
                              ...(teachByExampleConfig.autoGenerateMiddleGroups || {}),
                              [type]: e.target.checked
                            }
                          };
                          
                          // Check if all per-middle-group checkboxes are now off
                          const allMiddleGroups = {
                            scenes: updatedConfig.autoGenerateMiddleGroups?.scenes ?? true,
                            centralSwitching: updatedConfig.autoGenerateMiddleGroups?.centralSwitching ?? true,
                            centralDimming: updatedConfig.autoGenerateMiddleGroups?.centralDimming ?? true,
                            centralBlind: updatedConfig.autoGenerateMiddleGroups?.centralBlind ?? true
                          };
                          
                          // Check which middle groups actually exist
                          const hasScenes = mainGroups.some(mg => 
                            mg.middleGroups.some(mg => matchesNameVariant(mg.name.toLowerCase(), getSceneVariants()))
                          );
                          const hasCentralSwitching = mainGroups.some(mg => 
                            mg.middleGroups.some(mg => matchesNameVariant(mg.name.toLowerCase(), getCentralVariants()))
                          );
                          const hasCentralDimming = mainGroups.some(mg => 
                            mg.middleGroups.some(mg => matchesNameVariant(mg.name.toLowerCase(), getCentralDimmingVariants()))
                          );
                          const hasCentralBlind = mainGroups.some(mg => 
                            mg.middleGroups.some(mg => matchesNameVariant(mg.name.toLowerCase(), getCentralBlindVariants()))
                          );
                          
                          // Check if all existing middle groups are disabled
                          const allDisabled = 
                            (!hasScenes || allMiddleGroups.scenes === false) &&
                            (!hasCentralSwitching || allMiddleGroups.centralSwitching === false) &&
                            (!hasCentralDimming || allMiddleGroups.centralDimming === false) &&
                            (!hasCentralBlind || allMiddleGroups.centralBlind === false);
                          
                          // If all are disabled, also disable the main checkbox
                          if (allDisabled) {
                            updatedConfig.autoGenerateRoomAddresses = false;
                          }
                          
                          onConfigUpdate(updatedConfig);
                        }}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <span className="small" style={{ fontSize: '0.9rem' }}>{displayName}</span>
                    </label>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
      
      {mainGroups.length === 0 ? (
        <p className="small" style={{ color: 'var(--color-text-secondary)' }}>
          {t('noFixedGroupAddresses').replace('{addMainGroup}', t('addMainGroup'))}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mainGroups.map((mainGroup) => (
            <div key={mainGroup.id} className="card" style={{ marginTop: mainGroups.indexOf(mainGroup) === 0 ? 0 : 16 }}>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <div className="flex" style={{ gap: 8, alignItems: 'center', flex: 1 }}>
                  {editingMain === mainGroup.id ? (
                    <>
                      <select
                        value={mainGroup.main}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const clampedValue = Math.max(0, Math.min(31, value));
                          // Don't allow selecting blocked main groups
                          if (!blockedMainGroups.includes(clampedValue)) {
                            // Check if this main group is used in template and get its name
                            const usedAddresses = getUsedAddressesFromConfig();
                            const usedAddressData = usedAddresses.get(clampedValue);
                            const updates: Partial<FixedMainGroupTemplate> = { main: clampedValue };
                            if (usedAddressData) {
                              updates.name = translateMainGroupName(usedAddressData.name);
                            }
                            updateMainGroup(mainGroup.id, updates);
                          }
                        }}
                        style={{ 
                          width: 80, 
                          padding: '4px 8px', 
                          borderRadius: 4, 
                          border: '1px solid var(--color-border)',
                          backgroundColor: blockedMainGroups.includes(mainGroup.main) ? 'rgba(255, 0, 0, 0.1)' : undefined
                        }}
                      >
                        {getAvailableMainNumbers(mainGroup.id).map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                      {blockedMainGroups.includes(mainGroup.main) && (
                        <span className="small" style={{ color: 'var(--color-danger)', marginLeft: 8 }}>
                          {t('blockedByHvacConfiguration')}
                        </span>
                      )}
                      <input
                        type="text"
                        value={mainGroup.name}
                        onChange={(e) => updateMainGroup(mainGroup.id, { name: e.target.value.toLowerCase() })}
                        style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)' }}
                      />
                      <button className="button ghost" onClick={() => setEditingMain(null)} style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}>
                        ✓
                      </button>
                    </>
                  ) : (
                    <>
                      <strong>{t('mainGroupLabel').replace('{main}', mainGroup.main.toString()).replace('{name}', translateMainGroupName(mainGroup.name))}</strong>
                      {blockedMainGroups.includes(mainGroup.main) && (
                        <span className="small" style={{ color: 'var(--color-danger)', marginLeft: 8 }}>
                          {t('blockedByHvacConfiguration')}
                        </span>
                      )}
                      <button className="button ghost" onClick={() => setEditingMain(mainGroup.id)} style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}>
                        ✎
                      </button>
                      <button 
                        className="button ghost" 
                        onClick={() => deleteMainGroup(mainGroup.id)}
                        style={{ 
                          color: 'var(--color-danger)', 
                          borderRadius: '10px',
                          borderWidth: '0.5px',
                          padding: '14px 20px',
                          cursor: 'pointer'
                        }}
                        title={t('remove')}
                      >
                        ✕
                      </button>
                      <button className="button secondary" onClick={() => addMiddleGroup(mainGroup.id)} style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '8px 12px', fontSize: '0.9rem' }}>
                        {t('addMiddleGroup')}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {mainGroup.middleGroups.length > 0 && (
                <div style={{ marginLeft: 48, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {mainGroup.middleGroups.map((middleGroup) => (
                    <div key={middleGroup.id} style={{ padding: 8, backgroundColor: 'var(--color-bg)', borderRadius: 6 }}>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <div className="flex" style={{ gap: 8, alignItems: 'center', flex: 1 }}>
                          {editingMiddle === middleGroup.id ? (
                            <>
                              <select
                                value={middleGroup.middle}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const clampedValue = Math.max(0, Math.min(7, value));
                                  // Check if this middle is available
                                  const availableMiddles = getAvailableMiddleNumbers(mainGroup.id, middleGroup.id);
                                  if (availableMiddles.includes(clampedValue)) {
                                    updateMiddleGroup(mainGroup.id, middleGroup.id, { middle: clampedValue });
                                  } else {
                                    alert(t('middleGroupInUse').replace('{value}', clampedValue.toString()));
                                  }
                                }}
                                style={{ width: 70, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)' }}
                              >
                                {getAvailableMiddleNumbers(mainGroup.id, middleGroup.id).map(num => (
                                  <option key={num} value={num}>{num}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={editingMiddleName !== null ? editingMiddleName : (middleGroup.name || '').toLowerCase()}
                                onChange={(e) => {
                                  // Allow spaces during typing - no trim in onChange
                                  setEditingMiddleName(e.target.value);
                                }}
                                onBlur={() => {
                                  // Only save when input loses focus (user is done editing)
                                  if (editingMiddleName !== null) {
                                    console.log('[FixedGroupAddressesSection] onBlur: editingMiddleName =', editingMiddleName);
                                    // Store in lowercase
                                    const trimmedName = editingMiddleName.trim().toLowerCase();
                                    console.log('[FixedGroupAddressesSection] onBlur: trimmedName =', trimmedName);
                                    
                                    const currentNameLower = (middleGroup.name || '').toLowerCase();
                                    
                                    // If user cleared the name (empty string), restore the original default name
                                    let nameToSave = trimmedName;
                                    if (trimmedName === '') {
                                      const originalName = getOriginalMiddleGroupName(middleGroup.middle);
                                      if (originalName) {
                                        nameToSave = originalName;
                                        console.log('[FixedGroupAddressesSection] onBlur: Name cleared, restoring original name:', originalName);
                                      } else {
                                        // Not a standard middle group, keep empty (or could use a default like 'middengroep X')
                                        nameToSave = '';
                                        console.log('[FixedGroupAddressesSection] onBlur: Name cleared, but not a standard middle group');
                                      }
                                    } else if (trimmedName === currentNameLower) {
                                      // User entered the same name - use standard version if it's a standard name
                                      const standardName = getStandardFixedAddressName(trimmedName, lang);
                                      console.log('[FixedGroupAddressesSection] onBlur: Same name entered, standardName =', standardName);
                                      // Only use standard if it's actually a standard name (different from input)
                                      if (getFixedAddressKey(trimmedName) !== null && standardName !== trimmedName) {
                                        nameToSave = standardName;
                                        console.log('[FixedGroupAddressesSection] onBlur: Using standard version:', standardName);
                                      } else {
                                        nameToSave = trimmedName;
                                        console.log('[FixedGroupAddressesSection] onBlur: Keeping entered name:', trimmedName);
                                      }
                                    } else {
                                      // User entered a different name - always keep their input (they want to change it)
                                      console.log('[FixedGroupAddressesSection] onBlur: Different name entered, keeping user input:', trimmedName, '(current:', currentNameLower, ')');
                                      nameToSave = trimmedName;
                                    }
                                    
                                    console.log('[FixedGroupAddressesSection] onBlur: nameToSave =', nameToSave, 'for middleGroup', middleGroup.id, 'current name:', middleGroup.name);
                                    updateMiddleGroup(mainGroup.id, middleGroup.id, { name: nameToSave });
                                    setEditingMiddleName(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur(); // Trigger onBlur
                                  } else if (e.key === 'Escape') {
                                    setEditingMiddleName(null);
                                    setEditingMiddle(null);
                                  }
                                }}
                                autoFocus
                                style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)' }}
                              />
                              <button className="button ghost" onClick={() => {
                                if (editingMiddleName !== null) {
                                  console.log('[FixedGroupAddressesSection] Checkmark clicked: editingMiddleName =', editingMiddleName);
                                  // Store in lowercase
                                  const trimmedName = editingMiddleName.trim().toLowerCase();
                                  
                                  const currentNameLower = (middleGroup.name || '').toLowerCase();
                                  
                                  // If user cleared the name (empty string), restore the original default name
                                  let nameToSave = trimmedName;
                                  if (trimmedName === '') {
                                    const originalName = getOriginalMiddleGroupName(middleGroup.middle);
                                    if (originalName) {
                                      nameToSave = originalName;
                                      console.log('[FixedGroupAddressesSection] Checkmark: Name cleared, restoring original name:', originalName);
                                    } else {
                                      // Not a standard middle group, keep empty (or could use a default like 'middengroep X')
                                      nameToSave = '';
                                      console.log('[FixedGroupAddressesSection] Checkmark: Name cleared, but not a standard middle group');
                                    }
                                  } else if (trimmedName === currentNameLower) {
                                    // User entered the same name - use standard version if it's a standard name
                                    const standardName = getStandardFixedAddressName(trimmedName, lang);
                                    console.log('[FixedGroupAddressesSection] Checkmark: Same name entered, standardName =', standardName);
                                    // Only use standard if it's actually a standard name (different from input)
                                    if (getFixedAddressKey(trimmedName) !== null && standardName !== trimmedName) {
                                      nameToSave = standardName;
                                      console.log('[FixedGroupAddressesSection] Checkmark: Using standard version:', standardName);
                                    } else {
                                      nameToSave = trimmedName;
                                      console.log('[FixedGroupAddressesSection] Checkmark: Keeping entered name:', trimmedName);
                                    }
                                  } else {
                                    // User entered a different name - always keep their input (they want to change it)
                                    console.log('[FixedGroupAddressesSection] Checkmark: Different name entered, keeping user input:', trimmedName, '(current:', currentNameLower, ')');
                                    nameToSave = trimmedName;
                                  }
                                  
                                  console.log('[FixedGroupAddressesSection] Checkmark: nameToSave =', nameToSave, 'for middleGroup', middleGroup.id, 'current name:', middleGroup.name);
                                  updateMiddleGroup(mainGroup.id, middleGroup.id, { name: nameToSave });
                                }
                                setEditingMiddleName(null);
                                setEditingMiddle(null);
                              }} style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}>
                                ✓
                              </button>
                            </>
                          ) : (
                            <>
                              <strong style={{ fontSize: '0.9rem' }}>
                                {(() => {
                                  const storedName = middleGroup.name || '';
                                  const translatedName = translateMiddleGroupName(storedName);
                                  console.log('[FixedGroupAddressesSection] Display: storedName =', storedName, 'translatedName =', translatedName);
                                  return t('middleGroupLabel').replace('{middle}', middleGroup.middle.toString()).replace('{name}', translatedName);
                                })()}
                              </strong>
                              <button className="button ghost" onClick={() => {
                                const storedName = middleGroup.name || '';
                                console.log('[FixedGroupAddressesSection] Edit button clicked: storedName =', storedName);
                                setEditingMiddle(middleGroup.id);
                                // Initialize with the stored name (already lowercase) for editing
                                setEditingMiddleName(storedName.toLowerCase());
                                console.log('[FixedGroupAddressesSection] Edit button: setEditingMiddleName to', storedName.toLowerCase());
                              }} style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '14px 20px' }}>
                                ✎
                              </button>
                              <button 
                                className="button ghost" 
                                onClick={() => deleteMiddleGroup(mainGroup.id, middleGroup.id)}
                                style={{ 
                                  color: 'var(--color-danger)', 
                                  borderRadius: '10px',
                                  borderWidth: '0.5px',
                                  padding: '14px 20px',
                                  cursor: 'pointer'
                                }}
                                title={t('remove')}
                              >
                                ✕
                              </button>
                              <button className="button secondary" onClick={() => addSub(mainGroup.id, middleGroup.id)} style={{ borderRadius: '10px', borderWidth: '0.5px', padding: '8px 12px', fontSize: '0.9rem' }}>
                                + {t('sub')}
                              </button>
                              {isAutoGeneratedMiddleGroup(mainGroup, middleGroup) && (
                                <span className="small" style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginLeft: 8 }}>
                                  ({t('automaticallyGenerated')} voor sub 0-99)
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {middleGroup.subs.length > 0 && (
                        <div style={{ marginLeft: 56, marginTop: 8 }}>
                          <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '4px 12px', borderBottom: '1px solid var(--color-border)' }}>{t('sub')}</th>
                                <th style={{ textAlign: 'left', padding: '4px 12px', borderBottom: '1px solid var(--color-border)' }}>{t('name')}</th>
                                <th style={{ textAlign: 'left', padding: '4px 12px', borderBottom: '1px solid var(--color-border)' }}>{t('datapointType')}</th>
                                <th style={{ textAlign: 'left', padding: '4px 12px', borderBottom: '1px solid var(--color-border)' }}>{t('used')}</th>
                                <th style={{ textAlign: 'left', padding: '4px 12px', borderBottom: '1px solid var(--color-border)' }}>{t('groupAddress')}</th>
                                <th style={{ textAlign: 'left', padding: '4px 12px', borderBottom: '1px solid var(--color-border)' }}>{t('actions')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {middleGroup.subs.filter(sub => {
                                // When auto-generate is enabled, filter out subs 1-99 (they are auto-generated and not stored in template)
                                // This applies to centraal, scènes, centraal dimmen, and centraal jalouzie / rolluik
                                if (autoGenerateEnabled && isAutoGeneratedMiddleGroup(mainGroup, middleGroup)) {
                                  // Only show sub 0 (default) and sub 100-255 (manual)
                                  return sub.sub === 0 || sub.sub >= 100;
                                }
                                // When auto-generate is disabled, only show enabled subs (disabled subs are hidden)
                                if (!autoGenerateEnabled && isAutoGeneratedMiddleGroup(mainGroup, middleGroup)) {
                                  return sub.enabled;
                                }
                                // For non-auto-generated middle groups, show all subs
                                return true;
                              }).map((sub) => {
                                // Check if this sub should be blurred (when auto-generate is ON AND this specific middle group checkbox is ON AND it's sub 0)
                                const shouldBlur = autoGenerateEnabled && isAutoGeneratedMiddleGroup(mainGroup, middleGroup) && sub.sub === 0;
                                return (
                                <tr key={sub.id} style={shouldBlur ? { opacity: 0.3, filter: 'blur(2px)' } : {}}>
                                  <td style={{ padding: '4px 12px' }}>
                                    {isAutoGeneratedSub(mainGroup, middleGroup, sub) ? (
                                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        {sub.sub} {sub.sub > 0 ? t('automatic') : ''}
                                      </span>
                                    ) : (
                                      <select
                                        value={sub.sub}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value) || 0;
                                          const clampedValue = Math.max(0, Math.min(255, value));
                                          
                                          // Prevent selecting sub 0-99 in auto-generated middle groups (unless it's the current sub)
                                          if (isAutoGeneratedMiddleGroup(mainGroup, middleGroup) && clampedValue >= 0 && clampedValue <= 99 && sub.sub !== clampedValue) {
                                            alert(t('subGroupInUse').replace('{value}', clampedValue.toString()) + ' (Sub 0-99 zijn gereserveerd voor automatische generatie)');
                                            return;
                                          }
                                          
                                          // Check if this sub is available
                                          const availableSubs = getAvailableSubNumbers(mainGroup.id, middleGroup.id, sub.id);
                                          if (availableSubs.includes(clampedValue)) {
                                            updateSub(mainGroup.id, middleGroup.id, sub.id, { sub: clampedValue });
                                          } else {
                                            alert(t('subGroupInUse').replace('{value}', clampedValue.toString()));
                                          }
                                        }}
                                        disabled={(() => {
                                          // Sub 0 (Welkom, Alles uit, ---) should always be editable, even when auto-generate is ON
                                          if (sub.sub === 0) return false;
                                          return isAutoGeneratedSub(mainGroup, middleGroup, sub);
                                        })()}
                                        style={{ 
                                          width: 80, 
                                          padding: '2px 4px', 
                                          borderRadius: 4, 
                                          border: '1px solid var(--color-border)', 
                                          fontSize: '0.85rem',
                                          opacity: (() => {
                                            if (sub.sub === 0) return 1;
                                            return isAutoGeneratedSub(mainGroup, middleGroup, sub) ? 0.5 : 1;
                                          })()
                                        }}
                                      >
                                        {getAvailableSubNumbers(mainGroup.id, middleGroup.id, sub.id).map(num => (
                                          <option key={num} value={num}>{num}</option>
                                        ))}
                                      </select>
                                    )}
                                  </td>
                                  <td style={{ padding: '4px 12px' }}>
                                    {editingSub === sub.id ? (
                                      <input
                                        type="text"
                                        value={editingSubName || ''}
                                        onChange={(e) => {
                                          // Allow spaces during typing - no trim in onChange
                                          setEditingSubName(e.target.value);
                                        }}
                                        onBlur={() => {
                                          if (editingSubName !== null) {
                                            // Only trim leading/trailing whitespace on blur
                                            const trimmedName = editingSubName.trim().toLowerCase();
                                            // If it's a standard fixed address name, store the standard (Dutch) version
                                            // Otherwise, store the user's input
                                            const standardName = getStandardFixedAddressName(trimmedName, lang);
                                            updateSub(mainGroup.id, middleGroup.id, sub.id, { name: standardName });
                                            setEditingSubName(null);
                                            setEditingSub(null);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.currentTarget.blur(); // Trigger onBlur
                                          } else if (e.key === 'Escape') {
                                            setEditingSubName(null);
                                            setEditingSub(null);
                                          }
                                        }}
                                        autoFocus
                                        disabled={(() => {
                                          // Sub 0 (Welkom, Alles uit, ---) should always be editable, even when auto-generate is ON
                                          if (sub.sub === 0) return false;
                                          return isAutoGeneratedSub(mainGroup, middleGroup, sub);
                                        })()}
                                        style={{ 
                                          width: '100%', 
                                          padding: '6px 8px', 
                                          borderRadius: 4, 
                                          border: '1px solid var(--color-border)',
                                          opacity: (() => {
                                            if (sub.sub === 0) return 1;
                                            return isAutoGeneratedSub(mainGroup, middleGroup, sub) ? 0.5 : 1;
                                          })()
                                        }}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={(() => {
                                          const translated = translateSubName(sub.name, lang);
                                          // Capitalize first letter for display
                                          return translated && translated.length > 0 
                                            ? translated.charAt(0).toUpperCase() + translated.slice(1)
                                            : translated;
                                        })()}
                                        readOnly
                                        onFocus={() => {
                                          setEditingSub(sub.id);
                                          setEditingSubName(translateSubName(sub.name, lang));
                                        }}
                                        disabled={(() => {
                                          // Sub 0 (Welkom, Alles uit, ---) should always be editable, even when auto-generate is ON
                                          if (sub.sub === 0) return false;
                                          return isAutoGeneratedSub(mainGroup, middleGroup, sub);
                                        })()}
                                        style={{ 
                                          width: '100%', 
                                          padding: '6px 8px', 
                                          borderRadius: 4, 
                                          border: '1px solid var(--color-border)',
                                          opacity: (() => {
                                            if (sub.sub === 0) return 1;
                                            return isAutoGeneratedSub(mainGroup, middleGroup, sub) ? 0.5 : 1;
                                          })()
                                        }}
                                      />
                                    )}
                                  </td>
                                  <td style={{ padding: '4px 12px' }}>
                                    <div style={{ 
                                      opacity: (() => {
                                        if (sub.sub === 0) return 1;
                                        return isAutoGeneratedSub(mainGroup, middleGroup, sub) ? 0.5 : 1;
                                      })(),
                                      pointerEvents: (() => {
                                        // Sub 0 (Welkom, Alles uit, ---) should always be editable, even when auto-generate is ON
                                        if (sub.sub === 0) return 'auto';
                                        return isAutoGeneratedSub(mainGroup, middleGroup, sub) ? 'none' : 'auto';
                                      })()
                                    }}>
                                      <DPTSelector
                                        value={sub.dpt}
                                        onChange={(dpt) => updateSub(mainGroup.id, middleGroup.id, sub.id, { dpt })}
                                        placeholder={t('selectDPT')}
                                      />
                                    </div>
                                  </td>
                                  <td style={{ padding: '4px 12px' }}>
                                    <input
                                      type="checkbox"
                                      checked={sub.enabled}
                                      onChange={(e) => updateSub(mainGroup.id, middleGroup.id, sub.id, { enabled: e.target.checked })}
                                      disabled={(() => {
                                        // When auto-generate is ON, the "Gebruikt" checkbox is not relevant (use the per-middle-group checkboxes instead)
                                        if (autoGenerateEnabled && isAutoGeneratedMiddleGroup(mainGroup, middleGroup)) {
                                          return true;
                                        }
                                        // When auto-generate is OFF, the "Gebruikt" checkbox controls visibility in GA overview
                                        return false;
                                      })()}
                                      style={{ 
                                        cursor: (() => {
                                          if (autoGenerateEnabled && isAutoGeneratedMiddleGroup(mainGroup, middleGroup)) {
                                            return 'not-allowed';
                                          }
                                          return 'pointer';
                                        })(),
                                        opacity: (() => {
                                          if (autoGenerateEnabled && isAutoGeneratedMiddleGroup(mainGroup, middleGroup)) {
                                            return 0.5;
                                          }
                                          return 1;
                                        })()
                                      }}
                                      title={(() => {
                                        if (autoGenerateEnabled && isAutoGeneratedMiddleGroup(mainGroup, middleGroup)) {
                                          return t('usePerMiddleGroupCheckbox');
                                        }
                                        return isDefaultSub(mainGroup, middleGroup, sub) ? t('defaultObjectCannotDelete') : '';
                                      })()}
                                    />
                                  </td>
                                  <td style={{ padding: '4px 12px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                                    {mainGroup.main}/{middleGroup.middle}/{sub.sub}
                                  </td>
                                  <td style={{ padding: '4px 12px' }}>
                                    {isAutoGeneratedSub(mainGroup, middleGroup, sub) ? (
                                      <span className="small" style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                        {sub.sub > 0 ? t('automaticallyGenerated') : t('fixed')}
                                      </span>
                                    ) : isDefaultSub(mainGroup, middleGroup, sub) ? (
                                      <span className="small" style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                        {t('standardCannotDelete')}
                                      </span>
                                    ) : (
                                      <button 
                                        className="button ghost" 
                                        onClick={() => deleteSub(mainGroup.id, middleGroup.id, sub.id)}
                                        disabled={isAutoGeneratedSub(mainGroup, middleGroup, sub)}
                                        style={{ 
                                          color: 'var(--color-danger)', 
                                          borderRadius: '10px',
                                          borderWidth: '0.5px',
                                          padding: '4px 8px',
                                          fontSize: '0.85rem'
                                        }}
                                        title={t('remove')}
                                      >
                                        {t('delete')}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Convert TeachByExample config to normal TemplateConfig structure
// Helper function to check if a name matches any variant (for use outside component)
const matchesNameVariantHelper = (name: string, variants: string[]): boolean => {
  const nameLower = name.toLowerCase().trim();
  return variants.some(variant => nameLower === variant.toLowerCase().trim());
};

const getCentralDimmingVariantsHelper = (): string[] => {
  return ['centraal dimmen', 'central dimming', 'dimming central', 'centrale dimmerung', 'dimming central', 'dimming centrale', 'dimming central'];
};

const getCentralBlindVariantsHelper = (): string[] => {
  return ['centraal jalouzie / rolluik', 'centraal jalouzie', 'centraal rolluik', 'central blind', 'central shading', 'central jalousie', 'central store', 'zentrale jalousie', 'zentrale rollo', 'jalousie central', 'store central'];
};

const convertTeachByExampleToTemplate = (
  teachByExampleConfig: TeachByExampleTemplateConfig,
  existingTemplate?: TemplateConfig
): TemplateConfig => {
  const template: TemplateConfig = existingTemplate || buildEmptyTemplate();
  
  // Preserve teachByExampleConfig from existingTemplate if it exists
  const templateWithConfig = {
    ...template,
    teachByExampleConfig: template.teachByExampleConfig || teachByExampleConfig
  };
  
  // Ensure default fixed addresses exist for Teach by Example templates
  if (!templateWithConfig.devices.fixed || !templateWithConfig.devices.fixed.mainGroups || templateWithConfig.devices.fixed.mainGroups.length === 0) {
    const defaultFixed = buildDefaultTemplate().devices.fixed;
    templateWithConfig.devices.fixed = defaultFixed;
  } else {
    // Check if the default main group (1, "algemeen") exists, if not add it
    const hasDefaultMainGroup = templateWithConfig.devices.fixed.mainGroups.some(
      mg => mg.main === 1 && mg.name.toLowerCase() === 'algemeen'
    );
    
    if (!hasDefaultMainGroup) {
      const defaultFixed = buildDefaultTemplate().devices.fixed;
      // Only add the main group 1 ("algemeen"), not other main groups (3 for shading, 4 for HVAC)
      const defaultMainGroup1 = defaultFixed.mainGroups.find(mg => mg.main === 1);
      if (defaultMainGroup1) {
        templateWithConfig.devices.fixed = {
          mainGroups: [...templateWithConfig.devices.fixed.mainGroups, defaultMainGroup1]
        };
      }
    } else {
      // Check if centraal and scène's middle groups exist
      const defaultMainGroup = templateWithConfig.devices.fixed.mainGroups.find(
        mg => mg.main === 1 && mg.name.toLowerCase() === 'algemeen'
      );
      
      if (defaultMainGroup) {
        const hasCentraal = defaultMainGroup.middleGroups.some(
          mg => mg.name.toLowerCase() === 'centraal'
        );
        const hasScenes = defaultMainGroup.middleGroups.some(
          mg => mg.name.toLowerCase() === 'scène\'s' || mg.name.toLowerCase() === 'scenes'
        );
        
        if (!hasCentraal || !hasScenes) {
          const defaultFixed = buildDefaultTemplate().devices.fixed;
          const defaultMainGroupFromDefault = defaultFixed.mainGroups[0];
          
          if (!hasCentraal) {
            const centraalMiddle = defaultMainGroupFromDefault.middleGroups.find(
              mg => mg.name.toLowerCase() === 'centraal'
            );
            if (centraalMiddle) {
              // Deep clone to avoid reference issues
              defaultMainGroup.middleGroups.push({
                ...centraalMiddle,
                subs: centraalMiddle.subs.map(sub => ({ ...sub }))
              });
            }
          } else {
            // Check if "alles uit" sub exists in centraal
            const centraalMiddle = defaultMainGroup.middleGroups.find(
              mg => mg.name.toLowerCase() === 'centraal'
            );
            if (centraalMiddle) {
              const hasAllesUit = centraalMiddle.subs.some(
                sub => {
                  const subName = sub.name.toLowerCase().trim();
                  return sub.sub === 0 && matchesNameVariant(subName, getAllOffVariants());
                }
              );
              if (!hasAllesUit) {
                const defaultFixed = buildDefaultTemplate().devices.fixed;
                const defaultMainGroupFromDefault = defaultFixed.mainGroups[0];
                const defaultCentraal = defaultMainGroupFromDefault.middleGroups.find(
                  mg => mg.name.toLowerCase() === 'centraal'
                );
                if (defaultCentraal && defaultCentraal.subs.length > 0) {
                  centraalMiddle.subs.push({ ...defaultCentraal.subs[0] });
                }
              }
            }
          }
          
          if (!hasScenes) {
            const scenesMiddle = defaultMainGroupFromDefault.middleGroups.find(
              mg => mg.name.toLowerCase() === 'scène\'s' || mg.name.toLowerCase() === 'scenes'
            );
            if (scenesMiddle) {
              // Deep clone to avoid reference issues
              defaultMainGroup.middleGroups.push({
                ...scenesMiddle,
                subs: scenesMiddle.subs.map(sub => ({ ...sub }))
              });
            }
          } else {
            // Check if "welkom" sub exists in scène's
            const scenesMiddle = defaultMainGroup.middleGroups.find(
              mg => mg.name.toLowerCase() === 'scène\'s' || mg.name.toLowerCase() === 'scenes'
            );
            if (scenesMiddle) {
              const hasWelkom = scenesMiddle.subs.some(
                sub => {
                  const subName = sub.name.toLowerCase().trim();
                  return sub.sub === 0 && matchesNameVariant(subName, getWelcomeVariants());
                }
              );
              if (!hasWelkom) {
                const defaultFixed = buildDefaultTemplate().devices.fixed;
                const defaultMainGroupFromDefault = defaultFixed.mainGroups[0];
                const defaultScenes = defaultMainGroupFromDefault.middleGroups.find(
                  mg => mg.name.toLowerCase() === 'scène\'s' || mg.name.toLowerCase() === 'scenes'
                );
                if (defaultScenes && defaultScenes.subs.length > 0) {
                  scenesMiddle.subs.push({ ...defaultScenes.subs[0] });
                }
              }
            }
          }
          
          // Check if "centraal dimmen" middle group exists
          const hasCentralDimming = defaultMainGroup.middleGroups.some(
            mg => matchesNameVariantHelper(mg.name.toLowerCase(), getCentralDimmingVariantsHelper())
          );
          if (!hasCentralDimming) {
            const centralDimmingMiddle = defaultMainGroupFromDefault.middleGroups.find(
              mg => matchesNameVariantHelper(mg.name.toLowerCase(), getCentralDimmingVariantsHelper())
            );
            if (centralDimmingMiddle) {
              // Deep clone to avoid reference issues
              defaultMainGroup.middleGroups.push({
                ...centralDimmingMiddle,
                subs: centralDimmingMiddle.subs.map(sub => ({ ...sub }))
              });
            }
          } else {
            // Check if "---" sub exists in centraal dimmen
            const centralDimmingMiddle = defaultMainGroup.middleGroups.find(
              mg => matchesNameVariantHelper(mg.name.toLowerCase(), getCentralDimmingVariantsHelper())
            );
            if (centralDimmingMiddle) {
              const hasDefaultSub = centralDimmingMiddle.subs.some(
                sub => {
                  const subName = sub.name.toLowerCase().trim();
                  return sub.sub === 0 && (subName === '---' || subName === '—' || subName === '–');
                }
              );
              if (!hasDefaultSub) {
                const defaultFixed = buildDefaultTemplate().devices.fixed;
                const defaultMainGroupFromDefault = defaultFixed.mainGroups[0];
                const defaultCentralDimming = defaultMainGroupFromDefault.middleGroups.find(
                  mg => matchesNameVariantHelper(mg.name.toLowerCase(), getCentralDimmingVariantsHelper())
                );
                if (defaultCentralDimming && defaultCentralDimming.subs.length > 0) {
                  centralDimmingMiddle.subs.push({ ...defaultCentralDimming.subs[0] });
                }
              }
            }
          }
          
          // Check if "centraal jalouzie / rolluik" middle group exists
          const hasCentralBlind = defaultMainGroup.middleGroups.some(
            mg => matchesNameVariantHelper(mg.name.toLowerCase(), getCentralBlindVariantsHelper())
          );
          if (!hasCentralBlind) {
            const centralBlindMiddle = defaultMainGroupFromDefault.middleGroups.find(
              mg => matchesNameVariantHelper(mg.name.toLowerCase(), getCentralBlindVariantsHelper())
            );
            if (centralBlindMiddle) {
              // Deep clone to avoid reference issues
              defaultMainGroup.middleGroups.push({
                ...centralBlindMiddle,
                subs: centralBlindMiddle.subs.map(sub => ({ ...sub }))
              });
            }
          } else {
            // Check if "---" sub exists in centraal jalouzie / rolluik
            const centralBlindMiddle = defaultMainGroup.middleGroups.find(
              mg => matchesNameVariantHelper(mg.name.toLowerCase(), getCentralBlindVariantsHelper())
            );
            if (centralBlindMiddle) {
              const hasDefaultSub = centralBlindMiddle.subs.some(
                sub => {
                  const subName = sub.name.toLowerCase().trim();
                  return sub.sub === 0 && (subName === '---' || subName === '—' || subName === '–');
                }
              );
              if (!hasDefaultSub) {
                const defaultFixed = buildDefaultTemplate().devices.fixed;
                const defaultMainGroupFromDefault = defaultFixed.mainGroups[0];
                const defaultCentralBlind = defaultMainGroupFromDefault.middleGroups.find(
                  mg => matchesNameVariantHelper(mg.name.toLowerCase(), getCentralBlindVariantsHelper())
                );
                if (defaultCentralBlind && defaultCentralBlind.subs.length > 0) {
                  centralBlindMiddle.subs.push({ ...defaultCentralBlind.subs[0] });
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Filter out main groups used by shading and HVAC from fixed addresses
  // These should not be shown in the fixed addresses section
  // Dynamically determine which main groups are used by shading and HVAC
  const getMainGroupsUsedByShadingAndHVAC = (): Set<number> => {
    const usedMainGroups = new Set<number>();
    const categories = teachByExampleConfig.categories;
    
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
  
  if (templateWithConfig.devices.fixed && templateWithConfig.devices.fixed.mainGroups) {
    templateWithConfig.devices.fixed = {
      ...templateWithConfig.devices.fixed,
      mainGroups: templateWithConfig.devices.fixed.mainGroups.filter(mg => !shadingAndHVACMainGroups.has(mg.main))
    };
  }
  
  // Sort groups but preserve teachByExampleConfig
  const sorted = sortGroups(templateWithConfig);
  // Ensure teachByExampleConfig is preserved (it might be lost in sortGroups)
  if (!sorted.teachByExampleConfig) {
    sorted.teachByExampleConfig = templateWithConfig.teachByExampleConfig;
  }
  
  // Filter again after sorting, in case sortGroups added them back
  if (sorted.devices.fixed && sorted.devices.fixed.mainGroups) {
    sorted.devices.fixed = {
      ...sorted.devices.fixed,
      mainGroups: sorted.devices.fixed.mainGroups.filter(mg => !shadingAndHVACMainGroups.has(mg.main))
    };
  }
  
  return sorted;
};

export const TemplateWizard = () => {
  const { t } = useTranslation();
  const { template, setTemplate, setStep, checkTemplateChanges, username, currentTemplateId, currentProjectId } = useAppStore();
  
  console.log('[TemplateWizard] Rendering with:', { 
    hasTemplate: !!template, 
    currentTemplateId, 
    currentProjectId,
    hasTeachByExampleConfig: !!template?.teachByExampleConfig 
  });

  // Check if template has teachByExampleConfig
  // For templates: requires templateName and categories
  // For projects: only requires categories (templateName can be empty)
  const hasTeachByExampleConfig = Boolean(
    template?.teachByExampleConfig && 
    template.teachByExampleConfig.categories &&
    Object.keys(template.teachByExampleConfig.categories).length > 0 &&
    // For templates (not projects), also require templateName
    (currentProjectId || (template.teachByExampleConfig.templateName && template.teachByExampleConfig.templateName.trim() !== ''))
  );

  // State to track if we're editing (showing wizard) or viewing (showing overview)
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<'switching' | 'dimming' | 'shading' | 'hvac' | null>(null);

  // Reset editing state when template or project changes
  useEffect(() => {
    setIsEditing(false);
    setEditingCategory(null);
  }, [currentTemplateId, currentProjectId]);

  // Create a stable callback for editing
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditingCategory(null);
  }, []);

  // Create a callback for editing a specific category
  const handleEditCategory = useCallback((categoryKey: 'switching' | 'dimming' | 'shading' | 'hvac') => {
    setIsEditing(true);
    setEditingCategory(categoryKey);
  }, []);

  // Helper function to save template
  const handleSave = useCallback((config: TeachByExampleTemplateConfig) => {
    try {
      const currentTemplate = template || buildEmptyTemplate();
      
      // Preserve fixed addresses from config if present
      let updated = convertTeachByExampleToTemplate(config, currentTemplate);
      
      // If config has fixedAddresses, use them
      if ((config as any).fixedAddresses) {
        updated.devices.fixed = {
          mainGroups: (config as any).fixedAddresses
        };
      }
      
      // Preserve the teachByExampleConfig
      updated.teachByExampleConfig = config;
      
      if (username) {
        try {
          const key = `knx-template-${username}`;
          localStorage.setItem(key, JSON.stringify(updated));
          
          const sorted = sortGroups(updated);
          
          // After sorting, filter out main groups used by shading and HVAC again
          // (sortGroups might preserve them, so we need to filter again)
          if (sorted.devices.fixed && sorted.devices.fixed.mainGroups && config.categories) {
            // Dynamically determine which main groups are used by shading and HVAC
            const getMainGroupsUsedByShadingAndHVAC = (): Set<number> => {
              const usedMainGroups = new Set<number>();
              const categories = config.categories;
              
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
            sorted.devices.fixed = {
              ...sorted.devices.fixed,
              mainGroups: sorted.devices.fixed.mainGroups.filter(mg => !shadingAndHVACMainGroups.has(mg.main))
            };
          }
          
          const updatedOriginal = JSON.parse(JSON.stringify(sorted));
          const hasChanges = checkTemplateChanges(sorted);
          
          // Update template in store
          useAppStore.setState({ 
            template: sorted,
            templateHasChanges: hasChanges,
            originalTemplate: updatedOriginal
          });
          
          // If there's a template name, save it as a named template
          if (config.templateName && config.templateName.trim()) {
            try {
              const { saveTemplateAs } = useAppStore.getState();
              const templateId = saveTemplateAs(config.templateName.trim(), sorted);
              
              // Update currentTemplateId after saving
              useAppStore.setState({ 
                currentTemplateId: templateId,
                templateHasChanges: false,
                originalTemplate: updatedOriginal
              });
            } catch (err) {
              console.error('Error saving template as:', err);
            }
          }
          
          // Always go back to overview after saving (not editing mode)
          setIsEditing(false);
          setEditingCategory(null);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          throw new Error('Fout bij opslaan naar localStorage: ' + errorMessage);
        }
      } else {
        setTemplate(updated);
        setIsEditing(false);
        setEditingCategory(null);
      }
    } catch (error) {
      throw error;
    }
  }, [template, username, checkTemplateChanges, setTemplate]);

  // Helper function to check if config is fully configured
  const isConfigFullyConfigured = useCallback((config: TeachByExampleTemplateConfig): boolean => {
    if (!config || !config.categories) return false;
    
    // If categories object is empty, config is not fully configured
    const categoryKeys = Object.keys(config.categories);
    if (categoryKeys.length === 0) return false;
    
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
  }, []);

  // Helper function to handle cancel - only saves if template is existing or fully configured
  const handleCancel = useCallback((currentConfig?: TeachByExampleTemplateConfig) => {
    setIsEditing(false);
    setEditingCategory(null);
    
    // Determine if we should save:
    // 1. If it's an existing template (has templateName that was already saved), OR
    // 2. If the configuration is fully completed
    const configToCheck = currentConfig || template?.teachByExampleConfig;
    const existingTemplateConfig = template?.teachByExampleConfig;
    
    // Check if it's an existing template: has templateName and was previously saved (has categories with data)
    const isExistingTemplate = Boolean(
      existingTemplateConfig?.templateName && 
      existingTemplateConfig.templateName.trim() !== '' &&
      existingTemplateConfig.categories &&
      Object.keys(existingTemplateConfig.categories).length > 0
    );
    
    // Check if current config is fully configured
    const isFullyConfigured = configToCheck ? isConfigFullyConfigured(configToCheck) : false;
    
    // Only save if it's an existing template (with changes) OR if configuration is fully completed
    if (configToCheck && (isExistingTemplate || isFullyConfigured)) {
      try {
        const currentTemplate = template || buildEmptyTemplate();
        const converted = convertTeachByExampleToTemplate(configToCheck, currentTemplate);
        
        // Also update store to reflect saved state
        const sorted = sortGroups(converted);
        
        // After sorting, filter out main groups used by shading and HVAC again
        // (sortGroups might preserve them, so we need to filter again)
        if (sorted.devices.fixed && sorted.devices.fixed.mainGroups && configToCheck.categories) {
          // Dynamically determine which main groups are used by shading and HVAC
          const getMainGroupsUsedByShadingAndHVAC = (): Set<number> => {
            const usedMainGroups = new Set<number>();
            const categories = configToCheck.categories;
            
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
          sorted.devices.fixed = {
            ...sorted.devices.fixed,
            mainGroups: sorted.devices.fixed.mainGroups.filter(mg => !shadingAndHVACMainGroups.has(mg.main))
          };
        }
        
        setTemplate(sorted);
        if (username) {
          try {
            const key = `knx-template-${username}`;
            localStorage.setItem(key, JSON.stringify(sorted));
            
            const updatedOriginal = JSON.parse(JSON.stringify(sorted));
            const hasChanges = checkTemplateChanges(sorted);
            
            useAppStore.setState({ 
              template: sorted,
              templateHasChanges: hasChanges,
              originalTemplate: updatedOriginal
            });
          } catch (err) {
            console.error('Failed to save template', err);
          }
        }
      } catch (error) {
        console.error('Error saving template on cancel:', error);
      }
    } else {
      // For new templates that aren't completed, reset everything completely
      // Set template to undefined to match initial state, which prevents red border
      // Directly update the store without using setTemplate to avoid checkTemplateChanges
      useAppStore.setState({ 
        template: undefined,
        currentTemplateId: undefined,
        templateHasChanges: false,
        originalTemplate: undefined
      });
    }
    // Go back to start screen
    setStep('start');
  }, [template, username, setTemplate, setStep, checkTemplateChanges, sortGroups, isConfigFullyConfigured]);

  // If we have currentTemplateId but no template yet, show loading
  if (currentTemplateId && !template) {
    return (
      <div className="card no-hover">
        <h3>{t('templateConfiguration')}</h3>
        <p>Template wordt geladen...</p>
      </div>
    );
  }

  // SIMPLIFIED LOGIC:
  // 1. If we're editing, show the wizard
  // 2. If we have a loaded template with teachByExampleConfig, show overview
  // 3. If we have teachByExampleConfig (but not loaded), show overview
  // 4. Otherwise, show wizard to create new template

  // Helper function to return to overview without saving
  const handleReturnToOverview = useCallback(() => {
    setIsEditing(false);
    setEditingCategory(null);
  }, []);

  // 1. If we're editing, show the wizard
  if (isEditing && template) {
    return (
      <div className="card no-hover">
        <div>
          <h3>{t.templateConfiguration} - Teach by Example</h3>
        </div>
        <TeachByExampleWizard
          initialConfig={template?.teachByExampleConfig}
          startFromOverview={true}
          startCategory={editingCategory || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
          onReturnToOverview={handleReturnToOverview}
        />
      </div>
    );
  }

  // 2. If we have a loaded template (currentTemplateId), prioritize showing overview if it has teachByExampleConfig that is fully configured
  // This ensures that when loading an existing template, we show the overview instead of the wizard
  // For new templates (with currentTemplateId but not fully configured), show wizard instead of overview
  if (currentTemplateId && template) {
    const config = template.teachByExampleConfig;
    const hasCategories = config?.categories && Object.keys(config.categories).length > 0;
    const isFullyConfigured = config ? isConfigFullyConfigured(config) : false;
    console.log('[TemplateWizard] Check 2 - currentTemplateId exists, config:', config ? 'exists' : 'null', 'hasCategories:', hasCategories, 'isFullyConfigured:', isFullyConfigured);
    
    // Only show overview if config is fully configured
    // For new templates (has currentTemplateId but config is not fully configured), show wizard
    if (isFullyConfigured) {
      console.log('[TemplateWizard] Check 2 - Showing overview (fully configured)');
      return <TeachByExampleOverview onEdit={handleEdit} onEditCategory={handleEditCategory} />;
    }
    
    // If currentTemplateId exists but config is not fully configured, it's a new template or incomplete - show wizard
    console.log('[TemplateWizard] Check 2 - Config not fully configured, showing wizard');
    return (
      <div className="card no-hover">
        <div>
          <h3>{t.templateConfiguration} - Teach by Example</h3>
        </div>
        <TeachByExampleWizard
          initialConfig={template?.teachByExampleConfig}
          startFromOverview={false}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // 3. If we have teachByExampleConfig (but not loaded via currentTemplateId), show overview
  // This includes projects (currentProjectId) and templates without currentTemplateId
  // For projects, also check if template.teachByExampleConfig exists directly (even if hasTeachByExampleConfig is false due to missing templateName)
  if (template && !currentTemplateId && (
    hasTeachByExampleConfig || 
    (currentProjectId && template.teachByExampleConfig && template.teachByExampleConfig.categories && Object.keys(template.teachByExampleConfig.categories).length > 0)
  )) {
    return <TeachByExampleOverview onEdit={handleEdit} onEditCategory={handleEditCategory} />;
  }

  // 4. Otherwise, show wizard to create new template
  return (
    <div className="card no-hover">
      <div>
        <h3>{t.templateConfiguration} - Teach by Example</h3>
      </div>
      <TeachByExampleWizard
        initialConfig={template?.teachByExampleConfig}
        startFromOverview={false}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};
