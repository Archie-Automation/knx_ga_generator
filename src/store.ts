import { create } from 'zustand';
import {
  AnyDevice,
  DeviceCategory,
  TemplateConfig,
  TemplateDevicesConfig,
  FunctionGroupConfig,
  DeviceObjectTemplate,
  ProjectData,
  ProjectInstallerPdfOptions,
  TemplateData,
  CompanyInfo
} from './types/common';
import { NameDisplayOptions } from './generator/index';
import { uid } from './utils/id';
import { getStandardUserInput } from './i18n/userInputTranslations';
import { supabase } from './lib/supabase';

type WizardStep = 'start' | 'template' | 'devices' | 'configure' | 'overview' | 'export';

interface State {
  step: WizardStep;
  selectedCategories: DeviceCategory[];
  template?: TemplateConfig;
  devices: Record<DeviceCategory, AnyDevice[]>;
  username: string;
  currentProjectId?: string;
  currentTemplateId?: string;
  originalTemplate?: TemplateConfig; // Store original template for comparison
  templateHasChanges: boolean;
  // Export status tracking
  csvExported: boolean;
  pdfExported: boolean;
  setCsvExported: (exported: boolean) => void;
  setPdfExported: (exported: boolean) => void;
  resetExportStatus: () => void;
  // Global cache for roomAddress -> roomName mapping (for auto-fill across forms)
  roomAddressCache: Map<string, string>;
  updateRoomAddressCache: (roomAddress: string, roomName: string) => void;
  getRoomNameFromCache: (roomAddress: string) => string | null;
  // Name display options for GA overview
  nameOptions: NameDisplayOptions;
  setNameOptions: (options: NameDisplayOptions) => void;
  setStep: (step: WizardStep) => void;
  toggleCategory: (category: DeviceCategory) => void;
  setSelectedCategories: (categories: DeviceCategory[]) => void;
  setTemplate: (template: TemplateConfig) => void;
  addDevice: (device: AnyDevice) => void;
  updateDevice: (category: DeviceCategory, device: AnyDevice) => void;
  removeDevice: (category: DeviceCategory, id: string) => void;
  reset: () => void;
  // User management
  setUsername: (username: string) => void;
  signOutAuth: () => Promise<void>;
  loginScreenKey: number;
  authPendingPasswordReset: boolean;
  setAuthPendingPasswordReset: (v: boolean) => void;
  saveUserTemplate: () => void;
  checkTemplateChanges: (currentTemplate: TemplateConfig) => boolean;
  getUsers: () => string[];
  switchUser: (username: string) => void;
  deleteUser: (username: string) => boolean;
  renameUser: (oldUsername: string, newUsername: string) => void;
  updateUserEmailInSupabase: (newEmail: string) => Promise<{ error?: { message: string } }>;
  saveUserLogo: (username: string, logoDataUrl: string) => void;
  getUserLogo: (username: string) => string | null;
  getDisplayName: (username: string) => string | null;
  saveDisplayName: (username: string, displayName: string) => void;
  saveUserCompanyInfo: (username: string, companyInfo: CompanyInfo) => void;
  getUserCompanyInfo: (username: string) => CompanyInfo | null;
  // Project management
  saveProject: (name: string) => string;
  loadProject: (projectId: string) => boolean;
  deleteProject: (projectId: string) => void;
  getProjects: () => ProjectData[];
  exportProject: (projectId: string) => string;
  importProject: (jsonData: string) => boolean;
  saveInstallerPdfOptions: (options: Partial<ProjectInstallerPdfOptions>) => void;
  getInstallerPdfOptions: () => ProjectInstallerPdfOptions | undefined;
  // Template management
  saveTemplateAs: (name: string, templateToSave?: TemplateConfig) => string;
  loadTemplateById: (templateId: string) => boolean;
  deleteTemplate: (templateId: string) => void;
  getTemplates: () => TemplateData[];
  exportTemplate: (templateId: string) => string;
  importTemplate: (jsonData: string) => boolean;
}

const emptyDevices: Record<DeviceCategory, AnyDevice[]> = {
  switch: [],
  dimmer: [],
  blind: [],
  hvac: [],
  central: []
};

export const sortGroups = (config: TemplateConfig): TemplateConfig => {
  // Sort objects within each device type: main → middle → name
  const sorted = { ...config };
  
  // Ensure devices exists
  if (!sorted.devices) {
    sorted.devices = {
      switch: { groups: [] },
      dimmer: [],
      blind: { groups: [] },
      hvac: { zones: [] },
      fixed: { mainGroups: [] }
    };
  }
  
  // Preserve teachByExampleConfig explicitly (it should be preserved by spread, but be explicit)
  const teachByExampleConfig = config.teachByExampleConfig;
  
  const sortObjects = (objs: DeviceObjectTemplate[]): DeviceObjectTemplate[] => {
    return [...objs].sort((a, b) => {
      if (a.main !== b.main) return a.main - b.main;
      if (a.middle !== b.middle) return a.middle - b.middle;
      return a.name.localeCompare(b.name);
    });
  };
  
  // Sort switch objects
  if (sorted.devices?.switch?.objects) {
    sorted.devices.switch.objects = sortObjects(sorted.devices.switch.objects);
  }
  
  // Sort custom groups objects
  if (sorted.devices.customGroups) {
    sorted.devices.customGroups = sorted.devices.customGroups.map(group => ({
      ...group,
      objects: sortObjects(group.objects)
    }));
  }
  
  // Sort dimmer objects - handle both single dimmer and array of dimmers
  if (sorted.devices.dimmer) {
    if (Array.isArray(sorted.devices.dimmer)) {
      sorted.devices.dimmer = sorted.devices.dimmer.map(group => ({
        ...group,
        objects: sortObjects(group.objects || [])
      }));
    } else if (sorted.devices.dimmer.objects) {
      sorted.devices.dimmer.objects = sortObjects(sorted.devices.dimmer.objects);
    }
  }
  
  // Sort blind objects
  if (sorted.devices.blind.objects) {
    sorted.devices.blind.objects = sortObjects(sorted.devices.blind.objects);
  }
  
  // Sort HVAC objects
  if (sorted.devices.hvac.objects) {
    sorted.devices.hvac.objects = sortObjects(sorted.devices.hvac.objects);
  }
  
  // Sort fixed groups: new structure with mainGroups
  if (sorted.devices.fixed?.mainGroups) {
    // Sort mainGroups by main number, then by name
    sorted.devices.fixed.mainGroups = [...sorted.devices.fixed.mainGroups].sort((a, b) => {
      if (a.main !== b.main) return a.main - b.main;
      return a.name.localeCompare(b.name);
    });
    
    // Sort middleGroups within each mainGroup
    sorted.devices.fixed.mainGroups.forEach(mainGroup => {
      if (mainGroup.middleGroups) {
        mainGroup.middleGroups = [...mainGroup.middleGroups].sort((a, b) => {
          if (a.middle !== b.middle) return a.middle - b.middle;
          return a.name.localeCompare(b.name);
        });
        
        // Sort subs within each middle group
        mainGroup.middleGroups.forEach(mg => {
          if (mg.subs) {
            mg.subs = [...mg.subs].sort((a, b) => {
              if (a.sub !== b.sub) return a.sub - b.sub;
              return a.name.localeCompare(b.name);
            });
          }
        });
      }
    });
  }
  
  // Ensure teachByExampleConfig is preserved
  if (teachByExampleConfig) {
    sorted.teachByExampleConfig = teachByExampleConfig;
  }
  
  return sorted;
};

// Build empty template without example data
export const buildEmptyTemplate = (): TemplateConfig => {
  const template: TemplateConfig = {
    name: 'Project template',
    addressStructure: 'three-level',
    nameTemplate: {
      pattern: '<roomAddress> <roomName> <fixture> <switchCode> <function>',
      defaultOrder: ['roomAddress', 'roomName', 'fixture', 'switchCode', 'function']
    },
    commentTemplate: '<physical> – <channel>',
    devices: {
      switch: {
        objects: [],
        addressing: {
          mode: 'mode1',
          functionNumber: 3,
          typeOnOff: 1,
          typeStatus: 2,
          startChannelNumber: 1,
          channelIncrement: true
        }
      },
      dimmer: {
        objects: [],
        addressing: {
          mode: 'mode1',
          functionNumber: 2,
          typeOnOff: 1,
          typeStatus: 4,
          startChannelNumber: 1,
          channelIncrement: true
        }
      },
      blind: {
        objects: [],
        addressing: {
          mode: 'mode1',
          functionNumber: 3,
          typeOnOff: 1,
          typeStatus: 4,
          startChannelNumber: 1,
          channelIncrement: true
        }
      },
      hvac: {
        objects: [],
        valveControlType: 'bit',
        addressing: {
          mode: 'mode1',
          functionNumber: 4,
          typeOnOff: 1,
          typeStatus: 4,
          startChannelNumber: 1,
          channelIncrement: true
        }
      },
      fixed: {
        mainGroups: [
          {
            id: uid(),
            main: 1,
            name: 'algemeen',
            middleGroups: [
              {
                id: uid(),
                name: 'sc\u00E8nes', // Unicode escape for scènes (è = U+00E8)
                middle: 0,
                subs: [
                  { id: uid(), name: 'welkom', sub: 0, dpt: 'DPT18.001', enabled: true, isDefault: true }
                ]
              },
              {
                id: uid(),
                name: 'centraal schakelen',
                middle: 1,
                subs: [
                  { id: uid(), name: 'alles uit', sub: 0, dpt: 'DPT1.001', enabled: true, isDefault: true }
                ]
              },
              {
                id: uid(),
                name: 'centraal dimmen',
                middle: 2,
                subs: [
                  { id: uid(), name: '---', sub: 0, dpt: 'DPT3.007', enabled: true, isDefault: true }
                ]
              },
              {
                id: uid(),
                name: 'centraal jalouzie / rolluik',
                middle: 3,
                subs: [
                  { id: uid(), name: '---', sub: 0, dpt: 'DPT1.008', enabled: true, isDefault: true }
                ]
              }
            ]
          }
        ]
      },
      customGroups: []
    },
    createdAt: new Date().toISOString()
  };
  return sortGroups(template);
};

export const buildDefaultTemplate = (): TemplateConfig => {
  const template: TemplateConfig = {
    name: 'Project template',
    addressStructure: 'three-level',
    nameTemplate: {
      pattern: '<roomAddress> <roomName> <fixture> <switchCode> <function>',
      defaultOrder: ['roomAddress', 'roomName', 'fixture', 'switchCode', 'function']
    },
    commentTemplate: '<physical> – <channel>',
    devices: {
      switch: {
        objects: [
          { id: uid(), name: 'aan/uit', dpt: 'DPT1.001', main: 1, middle: 1, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'aan/uit status', dpt: 'DPT1.002', main: 1, middle: 2, start: 1, enabled: true, isDefault: true }
        ],
        addressing: {
          mode: 'mode1', // Default MODE 1 voor backwards compatibiliteit
          functionNumber: 3, // Schakelen = 3
          typeOnOff: 1, // Aan/Uit = 1
          typeStatus: 2, // Status = 2
          startChannelNumber: 1,
          channelIncrement: true
        }
      },
      dimmer: {
        objects: [
          { id: uid(), name: 'aan/uit', dpt: 'DPT1.001', main: 2, middle: 1, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'dimmen', dpt: 'DPT3.007', main: 2, middle: 2, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'waarde', dpt: 'DPT5.001', main: 2, middle: 3, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'aan/uit status', dpt: 'DPT1.002', main: 2, middle: 4, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'waarde status', dpt: 'DPT5.001', main: 2, middle: 5, start: 1, enabled: true, isDefault: true }
        ],
        addressing: {
          mode: 'mode1',
          functionNumber: 2,
          typeOnOff: 1,
          typeStatus: 4,
          startChannelNumber: 1,
          channelIncrement: true
        }
      },
      blind: {
        objects: [
          { id: uid(), name: 'op/neer', dpt: 'DPT1.008', main: 3, middle: 1, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'stop', dpt: 'DPT1.010', main: 3, middle: 2, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'waarde', dpt: 'DPT5.001', main: 3, middle: 3, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'waarde status', dpt: 'DPT5.001', main: 3, middle: 4, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'lamellen', dpt: 'DPT5.001', main: 3, middle: 5, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'lamellen positie status', dpt: 'DPT5.001', main: 3, middle: 6, start: 1, enabled: true, isDefault: true }
        ],
        addressing: {
          mode: 'mode1',
          functionNumber: 3,
          typeOnOff: 1,
          typeStatus: 4,
          startChannelNumber: 1,
          channelIncrement: true
        }
      },
      hvac: {
        objects: [
          { id: uid(), name: 'gemeten temperatuur', dpt: 'DPT9.001', main: 4, middle: 1, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'gemeten temperatuur 2', dpt: 'DPT9.001', main: 4, middle: 2, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'setpoint', dpt: 'DPT9.001', main: 4, middle: 3, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'setpoint status', dpt: 'DPT9.001', main: 4, middle: 4, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'mode', dpt: 'DPT20.102', main: 4, middle: 5, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'mode status', dpt: 'DPT20.102', main: 4, middle: 6, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'klepsturing', dpt: 'DPT1.001', main: 4, middle: 7, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'klepsturing status', dpt: 'DPT1.001', main: 4, middle: 8, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'melding verwarmen', dpt: 'DPT1.001', main: 4, middle: 9, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'melding koelen', dpt: 'DPT1.001', main: 4, middle: 10, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'setpoint shift', dpt: 'DPT6.001', main: 4, middle: 11, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'setpoint shift status', dpt: 'DPT6.001', main: 4, middle: 12, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'fan', dpt: 'DPT5.001', main: 4, middle: 13, start: 1, enabled: true, isDefault: true },
          { id: uid(), name: 'fan status', dpt: 'DPT5.001', main: 4, middle: 14, start: 1, enabled: true, isDefault: true }
        ],
        valveControlType: 'bit',
        addressing: {
          mode: 'mode1',
          functionNumber: 4,
          typeOnOff: 1,
          typeStatus: 4,
          startChannelNumber: 1,
          channelIncrement: true
        }
      },
      fixed: {
        mainGroups: [
          {
            id: uid(),
            main: 1,
            name: 'algemeen',
            middleGroups: [
              {
                id: uid(),
                name: 'sc\u00E8nes', // Unicode escape for scènes (è = U+00E8)
                middle: 0,
                subs: [
                  { id: uid(), name: 'welkom', sub: 0, dpt: 'DPT18.001', enabled: true, isDefault: true }
                ]
              },
              {
                id: uid(),
                name: 'centraal schakelen',
                middle: 1,
                subs: [
                  { id: uid(), name: 'alles uit', sub: 0, dpt: 'DPT1.001', enabled: true, isDefault: true }
                ]
              },
              {
                id: uid(),
                name: 'centraal dimmen',
                middle: 2,
                subs: [
                  { id: uid(), name: '---', sub: 0, dpt: 'DPT3.007', enabled: true, isDefault: true }
                ]
              },
              {
                id: uid(),
                name: 'centraal jalouzie / rolluik',
                middle: 3,
                subs: [
                  { id: uid(), name: '---', sub: 0, dpt: 'DPT1.008', enabled: true, isDefault: true }
                ]
              }
            ]
          }
        ]
      },
      customGroups: [] // Start with no custom groups
    },
    createdAt: new Date().toISOString()
  };
  return sortGroups(template);
};

// Get username from localStorage
const getUsername = (): string => {
  try {
    return localStorage.getItem('knx-username') || '';
  } catch (err) {
    console.error('Failed to get username', err);
    return '';
  }
};

// Save username to localStorage
const saveUsername = (username: string) => {
  try {
    localStorage.setItem('knx-username', username);
  } catch (err) {
    console.error('Failed to save username', err);
  }
};

// After email change we migrate data from old to new. Store redirect so login with old uses new.
const EMAIL_REDIRECT_PREFIX = 'knx-email-redirect-';
const setEmailRedirect = (oldEmail: string, newEmail: string) => {
  try {
    localStorage.setItem(`${EMAIL_REDIRECT_PREFIX}${oldEmail}`, newEmail);
  } catch (err) {
    console.error('Failed to set email redirect', err);
  }
};
const removeUserData = (username: string) => {
  try {
    localStorage.removeItem(`knx-template-${username}`);
    localStorage.removeItem(`knx-logo-${username}`);
    localStorage.removeItem(`knx-company-${username}`);
    localStorage.removeItem(`knx-displayname-${username}`);
    localStorage.removeItem(`knx-projects-${username}`);
    localStorage.removeItem(`knx-templates-${username}`);
  } catch {
    /* ignore */
  }
};

const clearEmailRedirects = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(EMAIL_REDIRECT_PREFIX)) {
        keysToRemove.push(key);
        const oldEmail = key.replace(EMAIL_REDIRECT_PREFIX, '');
        removeUserData(oldEmail);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error('Failed to clear email redirects', err);
  }
};
const resolveEmailRedirect = (email: string): string => {
  try {
    const redirect = localStorage.getItem(`${EMAIL_REDIRECT_PREFIX}${email}`);
    return redirect || email;
  } catch {
    return email;
  }
};

// Fix encoding issues in template data loaded from localStorage
const fixTemplateEncoding = (template: any): any => {
  if (!template) return template;
  
  // Recursively fix encoding in all string fields
  const fixEncoding = (str: string): string => {
    if (!str || typeof str !== 'string') return str;
    
    // If no mojibake patterns detected, return as-is
    if (!str.includes('Ã')) {
      return str;
    }
    
    let fixed = str;
    
    // Fix all UTF-8 misinterpretations systematically
    // Spanish/French accented characters
    fixed = fixed.replace(/Ã¡/g, 'á')   // á = UTF-8 C3 A1
                 .replace(/Ã©/g, 'é')   // é = UTF-8 C3 A9
                 .replace(/Ã­/g, 'í')   // í = UTF-8 C3 AD
                 .replace(/Ã³/g, 'ó')   // ó = UTF-8 C3 B3
                 .replace(/Ãº/g, 'ú')   // ú = UTF-8 C3 BA
                 .replace(/Ã±/g, 'ñ')   // ñ = UTF-8 C3 B1
                 .replace(/Ã /g, 'à')   // à = UTF-8 C3 A0
                 .replace(/Ã¨/g, 'è')   // è = UTF-8 C3 A8
                 .replace(/Ã¬/g, 'ì')   // ì = UTF-8 C3 AC
                 .replace(/Ã²/g, 'ò')   // ò = UTF-8 C3 B2
                 .replace(/Ã¹/g, 'ù')   // ù = UTF-8 C3 B9
                 .replace(/Ã¢/g, 'â')   // â = UTF-8 C3 A2
                 .replace(/Ãª/g, 'ê')   // ê = UTF-8 C3 AA
                 .replace(/Ã®/g, 'î')   // î = UTF-8 C3 AE
                 .replace(/Ã´/g, 'ô')   // ô = UTF-8 C3 B4
                 .replace(/Ã»/g, 'û')   // û = UTF-8 C3 BB
                 .replace(/Ã¤/g, 'ä')   // ä = UTF-8 C3 A4
                 .replace(/Ã«/g, 'ë')   // ë = UTF-8 C3 AB
                 .replace(/Ã¯/g, 'ï')   // ï = UTF-8 C3 AF
                 .replace(/Ã¶/g, 'ö')   // ö = UTF-8 C3 B6
                 .replace(/Ã¼/g, 'ü')   // ü = UTF-8 C3 BC
                 .replace(/Ã¿/g, 'ÿ')   // ÿ = UTF-8 C3 BF
                 .replace(/Ã§/g, 'ç');  // ç = UTF-8 C3 A7
    
    // Specific common word fixes
    fixed = fixed.replace(/scÃ¨nes/gi, 'scènes')
                 .replace(/scÃ©nes/gi, 'scènes')
                 .replace(/atenuaciÃ³n/gi, 'atenuación')
                 .replace(/posiciÃ³n/gi, 'posición');
    
    return fixed;
  };
  
  // Deep clone and fix all string values
  const fixObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return fixEncoding(obj);
    if (Array.isArray(obj)) return obj.map(fixObject);
    if (typeof obj === 'object') {
      const fixed: any = {};
      for (const key in obj) {
        fixed[key] = fixObject(obj[key]);
      }
      return fixed;
    }
    return obj;
  };
  
  return fixObject(template);
};

// Load template for specific username
const loadTemplate = (username?: string): TemplateConfig | undefined => {
  try {
    const user = username || getUsername();
    if (!user) return undefined;
    
    const key = `knx-template-${user}`;
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    
    // Normalize to NFC before parsing to ensure consistent UTF-8 representation
    const normalized = raw.normalize('NFC');
    const parsed = JSON.parse(normalized) as TemplateConfig;
    
    // Fix encoding issues in the loaded template
    const fixedParsed = fixTemplateEncoding(parsed) as TemplateConfig;
    if (!fixedParsed.devices) return buildDefaultTemplate();
    
    // Migrate old template structure to new structure if needed
    if (!fixedParsed.devices.switch?.objects) {
      // Old template structure detected, return default
      return buildDefaultTemplate();
    }
    
    // Migrate old fixed structure to new structure (mainGroups with middleGroups and subs)
    if (fixedParsed.devices.fixed) {
      const oldFixed = fixedParsed.devices.fixed as any;
      
      // Check if old structure (objects or middleGroups without mainGroups)
      if (oldFixed.objects) {
        // Old structure: objects array
        // Group objects by main and middle number
        const mainGroupMap = new Map<number, Map<number, any[]>>();
        oldFixed.objects.forEach((obj: any) => {
          const main = obj.main ?? (oldFixed.main ?? 5);
          if (!mainGroupMap.has(main)) {
            mainGroupMap.set(main, new Map());
          }
          const middleMap = mainGroupMap.get(main)!;
          if (!middleMap.has(obj.middle)) {
            middleMap.set(obj.middle, []);
          }
          middleMap.get(obj.middle)!.push(obj);
        });
        
        // Convert to new structure with mainGroups
        const mainGroups = Array.from(mainGroupMap.entries()).map(([main, middleMap]) => {
          const middleGroups = Array.from(middleMap.entries()).map(([middle, objs]) => {
            const firstObj = objs[0];
            return {
              id: uid(),
              name: firstObj.name === 'scene' ? 'scene' : (firstObj.name === 'centraal' || firstObj.name === 'centraal schakelen') ? 'centraal schakelen' : `middengroep ${middle}`,
              middle: middle,
              subs: objs.map((obj: any) => ({
                id: uid(),
                name: obj.name,
                sub: obj.start || 1,
                dpt: obj.dpt,
                enabled: obj.enabled,
                isDefault: obj.isDefault
              }))
            };
          });
          
          return {
            id: uid(),
            main: main,
            name: oldFixed.name || 'Vaste groepsadressen',
            middleGroups: middleGroups
          };
        });
        
        fixedParsed.devices.fixed = { mainGroups };
      } else if (oldFixed.middleGroups && !oldFixed.mainGroups) {
        // Old structure: middleGroups without mainGroups (single main group)
        const main = oldFixed.main ?? 5;
        const name = oldFixed.name || 'Vaste groepsadressen';
        
        // Ensure middleGroups have correct structure
        const middleGroups = oldFixed.middleGroups.map((mg: any) => ({
          id: mg.id || uid(),
          name: mg.name,
          middle: mg.middle,
          subs: mg.subs || []
        }));
        
        fixedParsed.devices.fixed = {
          mainGroups: [{
            id: uid(),
            main: main,
            name: name,
            middleGroups: middleGroups
          }]
        };
      } else if (!oldFixed.mainGroups || oldFixed.mainGroups.length === 0) {
        // No mainGroups at all, use default
        fixedParsed.devices.fixed = buildDefaultTemplate().devices.fixed;
      }
    }
    
    // Migrate scene/central to fixed if needed
    if (fixedParsed.devices.scene || fixedParsed.devices.central) {
      const defaultTemplate = buildDefaultTemplate();
      const newFixed = defaultTemplate.devices.fixed;
      
      // Get the first main group (default structure has one main group)
      const firstMainGroup = newFixed.mainGroups[0];
      
      // If scene exists, add it to fixed
      if (fixedParsed.devices.scene?.scenes) {
        const sceneMiddleGroup = firstMainGroup.middleGroups.find(mg => 
          mg.name.toLowerCase() === 'scenes' || mg.name.toLowerCase() === 'scene'
        );
        if (sceneMiddleGroup) {
          sceneMiddleGroup.middle = fixedParsed.devices.scene.scenes.middle;
          if (sceneMiddleGroup.subs.length > 0) {
            sceneMiddleGroup.subs[0].sub = fixedParsed.devices.scene.scenes.start;
            sceneMiddleGroup.subs[0].dpt = fixedParsed.devices.scene.scenes.dpt;
          }
        }
      }
      
      // If central exists, add it to fixed
      if (fixedParsed.devices.central?.central) {
        const centralMiddleGroup = firstMainGroup.middleGroups.find(mg => {
          const nameLower = mg.name.toLowerCase();
          return nameLower === 'centraal objecten' || nameLower === 'centraal' || nameLower === 'centraal schakelen';
        });
        if (centralMiddleGroup) {
          centralMiddleGroup.middle = fixedParsed.devices.central.central.middle;
          if (centralMiddleGroup.subs.length > 0) {
            centralMiddleGroup.subs[0].sub = fixedParsed.devices.central.central.start;
            centralMiddleGroup.subs[0].dpt = fixedParsed.devices.central.central.dpt;
          }
        }
      }
      
      // Replace scene/central with fixed
      fixedParsed.devices.fixed = newFixed;
      delete (fixedParsed.devices as any).scene;
      delete (fixedParsed.devices as any).central;
    }
    
    // Ensure fixed exists with new structure (mainGroups)
    if (!fixedParsed.devices.fixed || !fixedParsed.devices.fixed.mainGroups || fixedParsed.devices.fixed.mainGroups.length === 0) {
      fixedParsed.devices.fixed = buildDefaultTemplate().devices.fixed;
    }
    
    // Ensure customGroups exists
    if (!fixedParsed.devices.customGroups) {
      fixedParsed.devices.customGroups = [];
    }
    
    // Backwards compatibiliteit: voeg default addressing configuratie toe als deze ontbreekt
    const defaultTemplate = buildDefaultTemplate();
    if (!fixedParsed.devices.switch?.addressing) {
      fixedParsed.devices.switch = {
        ...fixedParsed.devices.switch,
        addressing: defaultTemplate.devices.switch.addressing
      };
    }
    // Backwards compatibility: normalize dimmer to array format if needed
    if (fixedParsed.devices.dimmer) {
      // If dimmer is not an array, ensure it has groupIndex 0
      if (!Array.isArray(fixedParsed.devices.dimmer)) {
        fixedParsed.devices.dimmer = {
          ...fixedParsed.devices.dimmer,
          groupIndex: 0,
          groupName: fixedParsed.devices.dimmer.groupName || 'Dimgroep 1',
          addressing: fixedParsed.devices.dimmer.addressing || defaultTemplate.devices.dimmer.addressing
        };
      } else {
        // If it's an array, ensure each group has groupIndex
        fixedParsed.devices.dimmer = fixedParsed.devices.dimmer.map((group, idx) => ({
          ...group,
          groupIndex: group.groupIndex ?? idx,
          groupName: group.groupName || `Dimgroep ${idx + 1}`,
          addressing: group.addressing || defaultTemplate.devices.dimmer.addressing
        }));
      }
    } else {
      // If dimmer doesn't exist, use default
      fixedParsed.devices.dimmer = {
        ...defaultTemplate.devices.dimmer,
        groupIndex: 0,
        groupName: 'Dimgroep 1'
      };
    }
    if (!fixedParsed.devices.blind?.addressing) {
      fixedParsed.devices.blind = {
        ...fixedParsed.devices.blind,
        addressing: defaultTemplate.devices.blind.addressing
      };
    }
    if (!fixedParsed.devices.hvac?.addressing) {
      fixedParsed.devices.hvac = {
        ...fixedParsed.devices.hvac,
        addressing: defaultTemplate.devices.hvac.addressing
      };
    }
    
    return fixedParsed;
  } catch (err) {
    console.error('Failed to load template', err);
    return buildDefaultTemplate();
  }
};

// Compare two templates to check if they are different
const compareTemplates = (a: TemplateConfig, b: TemplateConfig): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

// Fix encoding issues in template before saving (ensures correct UTF-8 encoding)
const fixTemplateEncodingForSave = (template: any): any => {
  if (!template) return template;
  
  // Fix encoding issues in all string fields before saving
  const fixEncoding = (str: string): string => {
    if (!str || typeof str !== 'string') return str;
    
    // If no mojibake patterns detected, return as-is
    if (!str.includes('Ã')) {
      return str;
    }
    
    let fixed = str;
    
    // Fix all UTF-8 misinterpretations systematically
    // Spanish/French accented characters
    fixed = fixed.replace(/Ã¡/g, 'á')   // á = UTF-8 C3 A1
                 .replace(/Ã©/g, 'é')   // é = UTF-8 C3 A9
                 .replace(/Ã­/g, 'í')   // í = UTF-8 C3 AD
                 .replace(/Ã³/g, 'ó')   // ó = UTF-8 C3 B3
                 .replace(/Ãº/g, 'ú')   // ú = UTF-8 C3 BA
                 .replace(/Ã±/g, 'ñ')   // ñ = UTF-8 C3 B1
                 .replace(/Ã /g, 'à')   // à = UTF-8 C3 A0
                 .replace(/Ã¨/g, 'è')   // è = UTF-8 C3 A8
                 .replace(/Ã¬/g, 'ì')   // ì = UTF-8 C3 AC
                 .replace(/Ã²/g, 'ò')   // ò = UTF-8 C3 B2
                 .replace(/Ã¹/g, 'ù')   // ù = UTF-8 C3 B9
                 .replace(/Ã¢/g, 'â')   // â = UTF-8 C3 A2
                 .replace(/Ãª/g, 'ê')   // ê = UTF-8 C3 AA
                 .replace(/Ã®/g, 'î')   // î = UTF-8 C3 AE
                 .replace(/Ã´/g, 'ô')   // ô = UTF-8 C3 B4
                 .replace(/Ã»/g, 'û')   // û = UTF-8 C3 BB
                 .replace(/Ã¤/g, 'ä')   // ä = UTF-8 C3 A4
                 .replace(/Ã«/g, 'ë')   // ë = UTF-8 C3 AB
                 .replace(/Ã¯/g, 'ï')   // ï = UTF-8 C3 AF
                 .replace(/Ã¶/g, 'ö')   // ö = UTF-8 C3 B6
                 .replace(/Ã¼/g, 'ü')   // ü = UTF-8 C3 BC
                 .replace(/Ã¿/g, 'ÿ')   // ÿ = UTF-8 C3 BF
                 .replace(/Ã§/g, 'ç');  // ç = UTF-8 C3 A7
    
    // Specific common word fixes
    fixed = fixed.replace(/scÃ¨nes/gi, 'scènes')
                 .replace(/scÃ©nes/gi, 'scènes')
                 .replace(/atenuaciÃ³n/gi, 'atenuación')
                 .replace(/posiciÃ³n/gi, 'posición');
    
    return fixed;
  };
  
  // Deep clone and fix all string values
  const fixObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return fixEncoding(obj);
    if (Array.isArray(obj)) return obj.map(fixObject);
    if (typeof obj === 'object') {
      const fixed: any = {};
      for (const key in obj) {
        fixed[key] = fixObject(obj[key]);
      }
      return fixed;
    }
    return obj;
  };
  
  return fixObject(template);
};

// Save template for specific username
const saveTemplate = (template: TemplateConfig, username?: string) => {
  try {
    const user = username || getUsername();
    if (!user) return;
    
    // Fix encoding issues before saving
    const fixedTemplate = fixTemplateEncodingForSave(template);
    
    // Ensure UTF-8 encoding: normalize to NFC and explicitly encode
    const jsonString = JSON.stringify(fixedTemplate);
    // Normalize to NFC to ensure consistent representation
    const normalized = jsonString.normalize('NFC');
    
    const key = `knx-template-${user}`;
    localStorage.setItem(key, normalized);
  } catch (err) {
    console.error('Failed to save template', err);
  }
};

// Project management functions
const getProjectsKey = (username: string): string => {
  return `knx-projects-${username}`;
};

const loadProjects = (username: string): ProjectData[] => {
  try {
    if (!username) return [];
    const key = getProjectsKey(username);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    // Normalize to NFC before parsing to ensure consistent UTF-8 representation
    const normalized = raw.normalize('NFC');
    return JSON.parse(normalized) as ProjectData[];
  } catch (err) {
    console.error('Failed to load projects', err);
    return [];
  }
};

const saveProjects = (username: string, projects: ProjectData[]) => {
  try {
    if (!username) return;
    const key = getProjectsKey(username);
    // Normalize to NFC to ensure consistent UTF-8 representation
    const jsonString = JSON.stringify(projects);
    const normalized = jsonString.normalize('NFC');
    localStorage.setItem(key, normalized);
  } catch (err) {
    console.error('Failed to save projects', err);
  }
};

// Template management helper functions
const getTemplatesKey = (username: string): string => {
  return `knx-templates-${username}`;
};

const loadTemplates = (username: string): TemplateData[] => {
  try {
    if (!username) return [];
    const key = getTemplatesKey(username);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    // Normalize to NFC before parsing to ensure consistent UTF-8 representation
    const normalized = raw.normalize('NFC');
    return JSON.parse(normalized) as TemplateData[];
  } catch (err) {
    console.error('Failed to load templates', err);
    return [];
  }
};

const saveTemplates = (username: string, templates: TemplateData[]) => {
  try {
    if (!username) return;
    const key = getTemplatesKey(username);
    // Normalize to NFC to ensure consistent UTF-8 representation
    const jsonString = JSON.stringify(templates);
    const normalized = jsonString.normalize('NFC');
    localStorage.setItem(key, normalized);
  } catch (err) {
    console.error('Failed to save templates', err);
  }
};

// Module-level timeout reference for project auto-save to prevent infinite loops
let projectAutoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

// Get all users (from template keys in localStorage)
const getAllUsers = (): string[] => {
  try {
    const users: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('knx-template-')) {
        const username = key.replace('knx-template-', '');
        if (username && !users.includes(username)) {
          users.push(username);
        }
      }
    }
    return users.sort();
  } catch (err) {
    console.error('Failed to get users', err);
    return [];
  }
};

// Safe initialization function - always returns undefined on startup
// User must explicitly load a template or create a new one
const initializeTemplate = (username?: string): TemplateConfig | undefined => {
  // Always return undefined - user must choose to load a template or create new one
  return undefined;
};

// Always start with empty username - user must explicitly log in
const initialUsername = '';
const initialTemplate = initializeTemplate(initialUsername);

// Helper to check initial template changes
const getInitialTemplateChanges = (template: TemplateConfig | undefined, username: string): boolean => {
  if (!template) return false; // No template means no changes
  if (!username) {
    const emptyTemplate = buildEmptyTemplate();
    return !compareTemplates(template, emptyTemplate);
  }
  const savedTemplate = loadTemplate(username);
  return !savedTemplate || !compareTemplates(template, savedTemplate);
};

export const useAppStore = create<State>((set, get) => ({
  step: 'start',
  selectedCategories: [],
  template: initialTemplate,
  devices: emptyDevices,
  username: initialUsername,
  currentProjectId: undefined,
  currentTemplateId: undefined,
  originalTemplate: undefined,
  templateHasChanges: initialTemplate ? getInitialTemplateChanges(initialTemplate, initialUsername) : false,
  csvExported: false,
  pdfExported: false,
  authPendingPasswordReset: false,
  setAuthPendingPasswordReset: (v: boolean) => set({ authPendingPasswordReset: v }),
  loginScreenKey: 0,
  setCsvExported: (exported: boolean) => set({ csvExported: exported }),
  setPdfExported: (exported: boolean) => set({ pdfExported: exported }),
  resetExportStatus: () => set({ csvExported: false, pdfExported: false }),
  nameOptions: {
    showRoomAddress: true,
    showSwitchCode: true,
    showObjectName: true
  } as NameDisplayOptions,
  setNameOptions: (options: NameDisplayOptions) => set({ nameOptions: options }),
  roomAddressCache: new Map<string, string>(),
  updateRoomAddressCache: (roomAddress: string, roomName: string) => {
    if (roomAddress && roomAddress.trim() && roomName && roomName.trim()) {
      set(state => {
        const newCache = new Map(state.roomAddressCache);
        newCache.set(roomAddress.trim(), roomName.trim());
        return { roomAddressCache: newCache };
      });
    }
  },
  getRoomNameFromCache: (roomAddress: string) => {
    if (!roomAddress || !roomAddress.trim()) return null;
    const state = get();
    return state.roomAddressCache.get(roomAddress.trim()) || null;
  },
  setStep: (step) => {
    console.log('[store] setStep called with:', step);
    const state = get();
    console.log('[store] Current state:', { currentStep: state.step, currentTemplateId: state.currentTemplateId, currentProjectId: state.currentProjectId });
    
    // Check if leaving template step with unsaved changes
    // Skip this check if we're working with a project (currentProjectId is set),
    // because projects manage their own state separately
    if (state.step === 'template' && step !== 'template' && state.templateHasChanges && state.template && !state.currentProjectId) {
      // Check if all categories are fully configured (including 'none' as valid configuration)
      const config = state.template?.teachByExampleConfig;
      if (config?.categories) {
        // Helper function to get category configs
        const getCategoryConfigs = (config: any, categoryKey: string): any[] => {
          const categoryConfig = config.categories?.[categoryKey];
          if (!categoryConfig) return [];
          return Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
        };
        
        const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
        const allConfigured = allCategories.every(cat => {
          const categoryConfig = config.categories?.[cat];
          if (!categoryConfig) return true; // Category not configured yet
          const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
          return configs.every(cfg => {
            // 'none' (not used) is a valid configuration
            if (cfg.enabled === 'none') return true;
            // Dimming linked to switching is valid if switching has pattern
            if (cat === 'dimming' && cfg.linkedToSwitching) {
              const switchingConfigs = getCategoryConfigs(config, 'switching');
              return switchingConfigs.some((sc: any) => sc.pattern !== undefined);
            }
            // Must have pattern if enabled
            return cfg.pattern !== undefined;
          });
        });
        
        // If all categories are fully configured (including all set to 'none'), allow navigation
        // This allows navigation when all categories are analyzed (even if all are 'none')
        if (allConfigured) {
          set({ step });
          return;
        }
      }
      
      // For existing templates with changes that aren't fully configured, show warning
      const message = 'Er zijn niet-opgeslagen wijzigingen in het template. U moet eerst opslaan voordat u verder kunt gaan.';
      alert(message);
      return; // Don't change step - user must save first
    }
    
    set({ step });
    
    // Auto-save project if it exists when step changes
    if (state.username && state.currentProjectId && state.template) {
      setTimeout(() => {
        const currentState = get();
        if (currentState.username && currentState.currentProjectId && currentState.template) {
          const projects = loadProjects(currentState.username);
          const project = projects.find(p => p.id === currentState.currentProjectId);
          if (project) {
            const template = currentState.template || buildDefaultTemplate();
            const templateName = template?.teachByExampleConfig?.templateName || template?.name || project.templateName;
            const updatedProject: ProjectData = {
              ...project,
              template: template,
              templateName: templateName,
              selectedCategories: currentState.selectedCategories,
              devices: currentState.devices,
              step: currentState.step,
              nameOptions: currentState.nameOptions,
              updatedAt: new Date().toISOString()
            };
            const projectIndex = projects.findIndex(p => p.id === currentState.currentProjectId);
            if (projectIndex >= 0) {
              projects[projectIndex] = updatedProject;
              saveProjects(currentState.username, projects);
            }
          }
        }
      }, 100);
    }
  },
  toggleCategory: (category) =>
    set((state) => {
      const exists = state.selectedCategories.includes(category);
      const selected = exists
        ? state.selectedCategories.filter((c) => c !== category)
        : [...state.selectedCategories, category];
      const newState = { selectedCategories: selected };
      
      // Auto-save project if it exists
      if (state.username && state.currentProjectId && state.template) {
        setTimeout(() => {
          const currentState = get();
          if (currentState.username && currentState.currentProjectId && currentState.template) {
            const projects = loadProjects(currentState.username);
            const project = projects.find(p => p.id === currentState.currentProjectId);
            if (project) {
              const updatedProject: ProjectData = {
                ...project,
                template: currentState.template,
                selectedCategories: currentState.selectedCategories,
                devices: currentState.devices,
                step: currentState.step,
                updatedAt: new Date().toISOString()
              };
              const projectIndex = projects.findIndex(p => p.id === currentState.currentProjectId);
              if (projectIndex >= 0) {
                projects[projectIndex] = updatedProject;
                saveProjects(currentState.username, projects);
              }
            }
          }
        }, 100);
      }
      
      return newState;
    }),
  setSelectedCategories: (categories) =>
    set((state) => {
      const newState = { selectedCategories: categories };
      
      // Auto-save project if it exists
      if (state.username && state.currentProjectId && state.template) {
        setTimeout(() => {
          const currentState = get();
          if (currentState.username && currentState.currentProjectId && currentState.template) {
            const projects = loadProjects(currentState.username);
            const project = projects.find(p => p.id === currentState.currentProjectId);
            if (project) {
              const updatedProject: ProjectData = {
                ...project,
                template: currentState.template!,
                selectedCategories: currentState.selectedCategories,
                devices: currentState.devices,
                step: currentState.step,
                updatedAt: new Date().toISOString()
              };
              const projectIndex = projects.findIndex(p => p.id === currentState.currentProjectId);
              if (projectIndex >= 0) {
                projects[projectIndex] = updatedProject;
                saveProjects(currentState.username, projects);
              }
            }
          }
        }, 100);
      }
      
      return newState;
    }),
  setTemplate: (template) =>
    set((state) => {
      const sorted = sortGroups(template);
      // Always check if template has changes compared to saved version
      if (state.username) {
        // If there's a currentProjectId, we're working with a project, not a template
        // In this case, compare with originalTemplate (from loadProject) to detect changes
        // This check must come FIRST before other checks
        if (state.currentProjectId) {
          // For projects, compare with originalTemplate to detect changes
          // This allows users to see when they've made changes to the project's template
          if (state.originalTemplate) {
            const sortedOriginal = sortGroups(state.originalTemplate);
            const hasChanges = !compareTemplates(sorted, sortedOriginal);
            // Auto-save project when template changes (but keep changes indicator visible)
            // The user can still explicitly save to clear the indicator
            // Use a debounced approach with module-level timeout to prevent infinite loops
            if (hasChanges) {
              // Clear existing timeout if any
              if (projectAutoSaveTimeout) {
                clearTimeout(projectAutoSaveTimeout);
                projectAutoSaveTimeout = null;
              }
              
              // Set new timeout for auto-save
              projectAutoSaveTimeout = setTimeout(() => {
                const currentState = get();
                if (currentState.username && currentState.currentProjectId && currentState.template) {
                  const projects = loadProjects(currentState.username);
                  const project = projects.find(p => p.id === currentState.currentProjectId);
                  if (project) {
                    // Only save if template still has changes compared to original
                    const currentSorted = sortGroups(currentState.template);
                    const originalSorted = sortGroups(currentState.originalTemplate || {});
                    const stillHasChanges = !compareTemplates(currentSorted, originalSorted);
                    
                    if (stillHasChanges) {
                      const template = currentState.template || buildDefaultTemplate();
                      const templateName = template?.teachByExampleConfig?.templateName || template?.name || project.templateName;
                      const updatedProject: ProjectData = {
                        ...project,
                        template: template,
                        templateName: templateName,
                        selectedCategories: currentState.selectedCategories,
                        devices: currentState.devices,
                        step: currentState.step,
                        updatedAt: new Date().toISOString()
                      };
                      const projectIndex = projects.findIndex(p => p.id === currentState.currentProjectId);
                      if (projectIndex >= 0) {
                        projects[projectIndex] = updatedProject;
                        saveProjects(currentState.username, projects);
                        // Don't update originalTemplate here - let explicit save handle that
                        // This keeps the changes indicator visible until user explicitly saves
                      }
                    }
                  }
                }
                // Clear the timeout reference
                projectAutoSaveTimeout = null;
              }, 1000); // Delay to reduce update frequency and prevent loops
            }
            return { template: sorted, templateHasChanges: hasChanges };
          }
          // If no originalTemplate, treat as no changes (shouldn't happen, but safe fallback)
          return { template: sorted, templateHasChanges: false };
        }
        // If there's an originalTemplate stored (from loadTemplateById), compare with that
        if (state.originalTemplate) {
          const sortedOriginal = sortGroups(state.originalTemplate);
          const hasChanges = !compareTemplates(sorted, sortedOriginal);
          return { template: sorted, templateHasChanges: hasChanges };
        }
        // If there's a currentTemplateId, compare with the original template from the list
        if (state.currentTemplateId) {
          const templates = loadTemplates(state.username);
          const originalTemplate = templates.find(t => t.id === state.currentTemplateId);
          if (originalTemplate) {
            // Compare with the original template from the list
            // Sort the original template for fair comparison
            const sortedOriginal = sortGroups(originalTemplate.template);
            const hasChanges = !compareTemplates(sorted, sortedOriginal);
            // Always use the template from the list as the originalTemplate
            // This ensures the comparison is always accurate with the saved version
            return { 
              template: sorted, 
              templateHasChanges: hasChanges,
              originalTemplate: sortedOriginal
            };
          }
        }
        // Otherwise, compare with the default saved template
        const savedTemplate = loadTemplate(state.username);
        
        // FIRST: Check if this is a new template with teachByExampleConfig that is fully configured
        // This check must come BEFORE the general "new template" checks below
        if (!state.currentTemplateId && sorted.teachByExampleConfig) {
          const config = sorted.teachByExampleConfig;
          const hasCategories = config.categories && Object.keys(config.categories).length > 0;
          
          // Only proceed if we have categories (template name is not required)
          if (hasCategories) {
            // Check if categories are fully configured (all have patterns)
            const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
            const allConfigured = allCategories.every(cat => {
              const categoryConfig = config.categories[cat];
              if (!categoryConfig || (Array.isArray(categoryConfig) && categoryConfig.length === 0)) {
                return true; // Category not used is fine
              }
              const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
              return configs.every(cfg => {
                if (cfg.enabled === 'none') return true;
                if (cat === 'dimming' && cfg.linkedToSwitching) return true;
                return cfg.pattern !== undefined;
              });
            });
            
            // If fully configured, mark as changed so user can save it
            // This MUST return early to prevent other checks from overriding it
            if (allConfigured) {
              return { template: sorted, templateHasChanges: true };
            }
          }
        }
        
        // Check if this is an empty template (no teachByExampleConfig or empty config)
        // Empty templates should not be marked as changed
        const isEmptyTemplate = !sorted.teachByExampleConfig || 
          (sorted.teachByExampleConfig && 
           (!sorted.teachByExampleConfig.templateName || sorted.teachByExampleConfig.templateName.trim() === '') &&
           (!sorted.teachByExampleConfig.categories || Object.keys(sorted.teachByExampleConfig.categories).length === 0));
        
        if (isEmptyTemplate) {
          return { template: sorted, templateHasChanges: false };
        }
        
        // For new templates that are not fully configured yet, don't mark as changed
        if (!state.currentTemplateId && !savedTemplate) {
          return { template: sorted, templateHasChanges: false };
        }
        
        // For existing templates, compare with saved template
        const hasChanges = !savedTemplate || !compareTemplates(sorted, savedTemplate);
        return { template: sorted, templateHasChanges: hasChanges };
      }
      // Check if template differs from empty template (if no username yet)
      // For new templates (no username yet), don't mark as changed
      const hasChanges = false; // New templates should not be marked as changed initially
      return { template: sorted, templateHasChanges: hasChanges };
    }),
  addDevice: (device) =>
    set((state) => {
      const category = device.category;
      
      // Migrate device to standard versions (convert translated roomName/fixture to standard)
      let migratedDevice: AnyDevice = device;
      if ('outputs' in device && device.outputs) {
        migratedDevice = {
          ...device,
          outputs: device.outputs.map((output: any) => ({
            ...output,
            roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
            fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
          }))
        } as AnyDevice;
      } else if ('zones' in device && device.zones) {
        migratedDevice = {
          ...device,
          zones: device.zones.map((zone: any) => ({
            ...zone,
            roomName: getStandardUserInput(zone.roomName, 'roomName') || zone.roomName
          }))
        } as AnyDevice;
      }
      
      // Update roomAddress cache with roomName from the migrated device
      const newCache = new Map(state.roomAddressCache);
      if ('outputs' in migratedDevice && migratedDevice.outputs) {
        for (const output of migratedDevice.outputs) {
          if ('roomAddress' in output && 'roomName' in output && output.roomAddress && output.roomName) {
            newCache.set(output.roomAddress.trim(), output.roomName.trim());
          }
        }
      }
      if ('zones' in migratedDevice && migratedDevice.zones) {
        for (const zone of migratedDevice.zones) {
          if (zone.roomAddress && zone.roomName) {
            newCache.set(zone.roomAddress.trim(), zone.roomName.trim());
          }
        }
      }
      
      const newState = {
        devices: {
          ...state.devices,
          [category]: [...state.devices[category], migratedDevice]
        },
        roomAddressCache: newCache,
        // Reset export status when devices are modified
        csvExported: false,
        pdfExported: false
      };
      
      // Auto-save project if it exists
      if (state.username && state.currentProjectId && state.template) {
        setTimeout(() => {
          const currentState = get();
          if (currentState.username && currentState.currentProjectId && currentState.template) {
            const projects = loadProjects(currentState.username);
            const project = projects.find(p => p.id === currentState.currentProjectId);
            if (project) {
              const updatedProject: ProjectData = {
                ...project,
                template: currentState.template,
                selectedCategories: currentState.selectedCategories,
                devices: currentState.devices,
                step: currentState.step,
                updatedAt: new Date().toISOString()
              };
              const projectIndex = projects.findIndex(p => p.id === currentState.currentProjectId);
              if (projectIndex >= 0) {
                projects[projectIndex] = updatedProject;
                saveProjects(currentState.username, projects);
              }
            }
          }
        }, 100);
      }
      
      return newState;
    }),
  updateDevice: (category, device) =>
    set((state) => {
      // Migrate device to standard versions (convert translated roomName/fixture to standard)
      let migratedDevice: AnyDevice = device;
      if ('outputs' in device && device.outputs) {
        migratedDevice = {
          ...device,
          outputs: device.outputs.map((output: any) => ({
            ...output,
            roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
            fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
          }))
        } as AnyDevice;
      } else if ('zones' in device && device.zones) {
        migratedDevice = {
          ...device,
          zones: device.zones.map((zone: any) => ({
            ...zone,
            roomName: getStandardUserInput(zone.roomName, 'roomName') || zone.roomName
          }))
        } as AnyDevice;
      }
      
      // Update roomAddress cache with roomName from the migrated device
      const newCache = new Map(state.roomAddressCache);
      if ('outputs' in migratedDevice && migratedDevice.outputs) {
        for (const output of migratedDevice.outputs) {
          if ('roomAddress' in output && 'roomName' in output && output.roomAddress && output.roomName) {
            newCache.set(output.roomAddress.trim(), output.roomName.trim());
          }
        }
      }
      if ('zones' in migratedDevice && migratedDevice.zones) {
        for (const zone of migratedDevice.zones) {
          if (zone.roomAddress && zone.roomName) {
            newCache.set(zone.roomAddress.trim(), zone.roomName.trim());
          }
        }
      }
      
      const newState = {
        devices: {
          ...state.devices,
          [category]: state.devices[category].map((d) =>
            d.id === device.id ? migratedDevice : d
          )
        },
        roomAddressCache: newCache,
        // Reset export status when devices are modified
        csvExported: false,
        pdfExported: false
      };
      
      // Auto-save project if it exists
      if (state.username && state.currentProjectId && state.template) {
        setTimeout(() => {
          const currentState = get();
          if (currentState.username && currentState.currentProjectId && currentState.template) {
            const projects = loadProjects(currentState.username);
            const project = projects.find(p => p.id === currentState.currentProjectId);
            if (project) {
              const updatedProject: ProjectData = {
                ...project,
                template: currentState.template,
                selectedCategories: currentState.selectedCategories,
                devices: currentState.devices,
                step: currentState.step,
                updatedAt: new Date().toISOString()
              };
              const projectIndex = projects.findIndex(p => p.id === currentState.currentProjectId);
              if (projectIndex >= 0) {
                projects[projectIndex] = updatedProject;
                saveProjects(currentState.username, projects);
              }
            }
          }
        }, 100);
      }
      
      return newState;
    }),
  removeDevice: (category, id) =>
    set((state) => {
      const newState = {
        devices: {
          ...state.devices,
          [category]: state.devices[category].filter((d) => d.id !== id)
        },
        // Reset export status when devices are modified
        csvExported: false,
        pdfExported: false
      };
      
      // Auto-save project if it exists
      if (state.username && state.currentProjectId && state.template) {
        setTimeout(() => {
          const currentState = get();
          if (currentState.username && currentState.currentProjectId && currentState.template) {
            const projects = loadProjects(currentState.username);
            const project = projects.find(p => p.id === currentState.currentProjectId);
            if (project) {
              const updatedProject: ProjectData = {
                ...project,
                template: currentState.template,
                selectedCategories: currentState.selectedCategories,
                devices: currentState.devices,
                step: currentState.step,
                updatedAt: new Date().toISOString()
              };
              const projectIndex = projects.findIndex(p => p.id === currentState.currentProjectId);
              if (projectIndex >= 0) {
                projects[projectIndex] = updatedProject;
                saveProjects(currentState.username, projects);
              }
            }
          }
        }, 100);
      }
      
      return newState;
    }),
  reset: () =>
    set({
      step: 'start',
      selectedCategories: [],
      devices: emptyDevices,
      template: buildDefaultTemplate(),
      currentProjectId: undefined,
      currentTemplateId: undefined,
      originalTemplate: undefined,
      templateHasChanges: false,
      csvExported: false,
      pdfExported: false,
      roomAddressCache: new Map()
    }),
  // User management
  setUsername: (username: string) => {
    // After email change: old may redirect to new so we use migrated data
    const resolved = resolveEmailRedirect(username);
    const state = get();
    // If redirected, remove stale old-user data so it doesn't appear in the list
    if (resolved !== username) {
      try {
        localStorage.removeItem(`knx-template-${username}`);
        localStorage.removeItem(getProjectsKey(username));
        localStorage.removeItem(getTemplatesKey(username));
      } catch { /* ignore */ }
    }
    saveUsername(resolved);
    
    // Ensure user exists in localStorage by saving an empty template if none exists
    // This ensures the user is recognized after page refresh
    const existingTemplate = loadTemplate(resolved);
    if (!existingTemplate) {
      // Save an empty template to mark this user as existing
      const emptyTemplate = buildEmptyTemplate();
      saveTemplate(emptyTemplate, resolved);
    }
    
    // If there's a current template, save it for the new username
    if (state.template) {
      saveTemplate(state.template, resolved);
    }
    
    // Load template for the new username (or undefined if none exists)
    const template = initializeTemplate(resolved);
    const savedTemplate = loadTemplate(resolved);
    const hasChanges = template ? (!savedTemplate || !compareTemplates(template, savedTemplate)) : false;
    
    set({ username: resolved, template, templateHasChanges: hasChanges });
  },
  signOutAuth: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clearEmailRedirects();
    saveUsername('');
    set((s) => ({ loginScreenKey: s.loginScreenKey + 1 }));
    try {
      sessionStorage.clear();
    } catch { /* ignore */ }
    set({
      username: '',
      template: undefined,
      currentProjectId: undefined,
      currentTemplateId: undefined,
      devices: emptyDevices,
      selectedCategories: [],
      step: 'start',
      templateHasChanges: false,
      roomAddressCache: new Map()
    });
  },
  saveUserTemplate: () => {
    const state = get();
    if (!state.username || !state.template) return;
    
    saveTemplate(state.template, state.username);
    
    // Also update template in template list if currentTemplateId is set
    if (state.currentTemplateId) {
      const templates = loadTemplates(state.username);
      const templateIndex = templates.findIndex(t => t.id === state.currentTemplateId);
      if (templateIndex >= 0) {
        templates[templateIndex] = {
          ...templates[templateIndex],
          template: state.template,
          updatedAt: new Date().toISOString()
        };
        saveTemplates(state.username, templates);
        
        // Update originalTemplate to the newly saved version (deep copy)
        const updatedOriginal = JSON.parse(JSON.stringify(state.template));
        set({ 
          templateHasChanges: false,
          originalTemplate: updatedOriginal 
        });
        return;
      }
    }
    
    set({ templateHasChanges: false });
  },
  checkTemplateChanges: (currentTemplate: TemplateConfig) => {
    const state = get();
    
    // If template is undefined, there are no changes
    if (!currentTemplate) {
      set({ templateHasChanges: false });
      return false;
    }
    
    if (!state.username) {
      // Check against empty template if no username
      const emptyTemplate = buildEmptyTemplate();
      const hasChanges = !compareTemplates(currentTemplate, emptyTemplate);
      set({ templateHasChanges: hasChanges });
      return hasChanges;
    }
    
    // Check if it's a new template with teachByExampleConfig
    if (!state.currentTemplateId && currentTemplate.teachByExampleConfig) {
      const config = currentTemplate.teachByExampleConfig;
      const hasTemplateName = config.templateName && config.templateName.trim() !== '';
      const hasCategories = config.categories && Object.keys(config.categories).length > 0;
      
      // If it has no categories, it's still incomplete
      if (!hasCategories) {
        set({ templateHasChanges: false });
        return false;
      }
      
      // Check if categories are fully configured (all have patterns)
      // Template name is not required - can be added when saving
      const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
      const allConfigured = allCategories.every(cat => {
        const categoryConfig = config.categories?.[cat];
        if (!categoryConfig) return true; // Category not used
        const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
        return configs.every(cfg => {
          if (cfg.enabled === 'none') return true;
          if (cat === 'dimming' && cfg.linkedToSwitching) return true;
          return cfg.pattern !== undefined;
        });
      });
      
      // If not fully configured, don't mark as changed
      if (!allConfigured) {
        set({ templateHasChanges: false });
        return false;
      }
      
      // If fully configured, mark as changed so user can save it
      set({ templateHasChanges: true });
      return true;
    }
    
    const savedTemplate = loadTemplate(state.username);
    const hasChanges = !savedTemplate || !compareTemplates(currentTemplate, savedTemplate);
    set({ templateHasChanges: hasChanges });
    return hasChanges;
  },
  getUsers: () => {
    return getAllUsers();
  },
  switchUser: (username: string) => {
    const state = get();
    // Warn if there are unsaved changes
    if (state.templateHasChanges && state.template && state.username) {
      if (!confirm('Er zijn niet-opgeslagen wijzigingen. Wilt u overschakelen zonder op te slaan?')) {
        return; // User cancelled
      }
    }
    
    // Load template for the new user
    const template = initializeTemplate(username);
    const savedTemplate = loadTemplate(username);
    const hasChanges = !savedTemplate || !compareTemplates(template, savedTemplate);
    
    saveUsername(username);
    set({ username, template, templateHasChanges: hasChanges, currentProjectId: undefined, currentTemplateId: undefined, roomAddressCache: new Map() });
  },
  deleteUser: (username: string) => {
    const state = get();
    if (!username) return false;
    
    try {
      clearEmailRedirects();
      // Delete template
      const templateKey = `knx-template-${username}`;
      localStorage.removeItem(templateKey);
      
      // Delete logo
      const logoKey = `knx-logo-${username}`;
      localStorage.removeItem(logoKey);
      
      // Delete company info
      const companyKey = `knx-company-${username}`;
      localStorage.removeItem(companyKey);

      // Delete display name
      const displayNameKey = `knx-displayname-${username}`;
      localStorage.removeItem(displayNameKey);
      
      // Delete projects
      const projectsKey = getProjectsKey(username);
      localStorage.removeItem(projectsKey);
      
      // Delete templates
      const templatesKey = getTemplatesKey(username);
      localStorage.removeItem(templatesKey);
      
      // If deleting current user, log out
      if (username === state.username) {
        set({ username: '', currentProjectId: undefined, currentTemplateId: undefined, template: undefined, devices: emptyDevices, selectedCategories: [], step: 'start' });
      }
      
      return true; // Return true to indicate successful deletion
    } catch (err) {
      console.error('Failed to delete user', err);
      return false; // Return false to indicate deletion failed
    }
  },
  saveUserLogo: (username: string, logoDataUrl: string) => {
    try {
      const logoKey = `knx-logo-${username}`;
      
      // If empty string, remove the logo
      if (!logoDataUrl || logoDataUrl === '') {
        localStorage.removeItem(logoKey);
        return;
      }
      
      // Validate data URL
      if (!logoDataUrl.startsWith('data:image/')) {
        throw new Error('Ongeldig logo formaat');
      }
      
      // Check if data URL is too large (localStorage has ~5-10MB limit)
      const sizeInBytes = new Blob([logoDataUrl]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 2) {
        throw new Error(`Logo is te groot (${sizeInMB.toFixed(2)}MB). Maximum is 2MB.`);
      }
      
      localStorage.setItem(logoKey, logoDataUrl);
    } catch (err) {
      console.error('Failed to save user logo', err);
      const errorMessage = err instanceof Error ? err.message : 'Fout bij opslaan logo';
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        alert('Logo is te groot voor opslag. Probeer een kleiner bestand.');
      } else {
        alert(errorMessage);
      }
      throw err; // Re-throw so caller knows it failed
    }
  },
  getUserLogo: (username: string) => {
    try {
      const logoKey = `knx-logo-${username}`;
      return localStorage.getItem(logoKey);
    } catch (err) {
      console.error('Failed to get user logo', err);
      return null;
    }
  },
  getDisplayName: (username: string) => {
    try {
      const key = `knx-displayname-${username}`;
      const value = localStorage.getItem(key);
      return value && value.trim() ? value.trim() : null;
    } catch (err) {
      console.error('Failed to get display name', err);
      return null;
    }
  },
  saveDisplayName: (username: string, displayName: string) => {
    try {
      const key = `knx-displayname-${username}`;
      const trimmed = displayName.trim();
      if (trimmed) {
        localStorage.setItem(key, trimmed);
      } else {
        localStorage.removeItem(key);
      }
    } catch (err) {
      console.error('Failed to save display name', err);
    }
  },
  saveUserCompanyInfo: (username: string, companyInfo: CompanyInfo) => {
    try {
      const companyKey = `knx-company-${username}`;
      // Normalize to NFC to ensure consistent UTF-8 representation
      const jsonString = JSON.stringify(companyInfo);
      const normalized = jsonString.normalize('NFC');
      localStorage.setItem(companyKey, normalized);
    } catch (err) {
      console.error('Failed to save company info', err);
      alert('Fout bij opslaan bedrijfsgegevens');
    }
  },
  getUserCompanyInfo: (username: string) => {
    try {
      const companyKey = `knx-company-${username}`;
      const data = localStorage.getItem(companyKey);
      if (!data) return null;
      return JSON.parse(data) as CompanyInfo;
    } catch (err) {
      console.error('Failed to get company info', err);
      return null;
    }
  },
  renameUser: (oldUsername: string, newUsername: string) => {
    if (!newUsername.trim()) {
      alert('Gebruikersnaam mag niet leeg zijn');
      return;
    }
    
    if (oldUsername === newUsername.trim()) {
      return; // No change
    }
    
    const users = getAllUsers();
    if (users.includes(newUsername.trim())) {
      alert('Gebruikersnaam bestaat al');
      return;
    }
    
    try {
      const newName = newUsername.trim();
      
      // Copy logo if exists
      const oldLogoKey = `knx-logo-${oldUsername}`;
      const logoData = localStorage.getItem(oldLogoKey);
      if (logoData) {
        const newLogoKey = `knx-logo-${newName}`;
        localStorage.setItem(newLogoKey, logoData);
        localStorage.removeItem(oldLogoKey);
      }
      
      // Copy company info if exists
      const oldCompanyKey = `knx-company-${oldUsername}`;
      const companyData = localStorage.getItem(oldCompanyKey);
      if (companyData) {
        const newCompanyKey = `knx-company-${newName}`;
        localStorage.setItem(newCompanyKey, companyData);
        localStorage.removeItem(oldCompanyKey);
      }

      // Copy display name if exists
      const oldDisplayNameKey = `knx-displayname-${oldUsername}`;
      const displayNameData = localStorage.getItem(oldDisplayNameKey);
      if (displayNameData) {
        localStorage.setItem(`knx-displayname-${newName}`, displayNameData);
        localStorage.removeItem(oldDisplayNameKey);
      }
      
      // Copy template
      const templateKey = `knx-template-${oldUsername}`;
      const templateData = localStorage.getItem(templateKey);
      if (templateData) {
        localStorage.setItem(`knx-template-${newName}`, templateData);
      }
      
      // Copy projects
      const projectsKey = getProjectsKey(oldUsername);
      const projectsData = localStorage.getItem(projectsKey);
      if (projectsData) {
        const projects = JSON.parse(projectsData) as ProjectData[];
        const updatedProjects = projects.map(p => ({
          ...p,
          username: newName
        }));
        saveProjects(newName, updatedProjects);
      }
      
      // Copy templates
      const templatesKey = getTemplatesKey(oldUsername);
      const templatesData = localStorage.getItem(templatesKey);
      if (templatesData) {
        const templates = JSON.parse(templatesData) as TemplateData[];
        const updatedTemplates = templates.map(t => ({
          ...t,
          username: newName
        }));
        saveTemplates(newName, updatedTemplates);
      }
      
      // Delete old user data
      localStorage.removeItem(templateKey);
      localStorage.removeItem(projectsKey);
      localStorage.removeItem(templatesKey);
      
      // If this was the current user (Supabase email change), store redirect so login with old uses new
      const state = get();
      if (state.username === oldUsername) {
        setEmailRedirect(oldUsername, newName);
        set({ username: newName });
        saveUsername(newName);
      }
    } catch (err) {
      console.error('Failed to rename user', err);
      alert('Fout bij hernoemen gebruiker');
    }
  },
  updateUserEmailInSupabase: async (newEmail: string) => {
    try {
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        console.error('Supabase getUser error:', getUserError);
        return { error: { message: getUserError.message || 'Kon sessie niet ophalen' } };
      }
      if (!user) {
        return { error: { message: 'Geen ingelogde gebruiker' } };
      }
      const redirectTo = typeof window !== 'undefined'
        ? window.location.origin + window.location.pathname
        : '';
      const { data, error } = await supabase.auth.updateUser(
        { email: newEmail.trim().toLowerCase() },
        redirectTo ? { emailRedirectTo: redirectTo } : undefined
      );
      if (error) {
        console.error('Supabase updateUser error:', error);
        return { error: { message: error.message } };
      }
      // Controleer of de request bij Supabase is aangekomen (data.user zou het bijgewerkte user object bevatten)
      if (!data?.user) {
        console.warn('Supabase updateUser: geen user in response');
      }
      return {};
    } catch (err) {
      console.error('updateUserEmailInSupabase exception:', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Er is iets misgegaan bij het bijwerken van het e-mailadres';
      return { error: { message } };
    }
  },
  // Project management
  saveProject: (name: string) => {
    const state = get();
    if (!state.username) {
      throw new Error('Username must be set before saving a project');
    }
    
    const projectId = state.currentProjectId || uid();
    const template = state.template || buildDefaultTemplate();
    
    // Get template name: 
    // 1. If currentTemplateId exists, get name from templates list
    // 2. Otherwise: teachByExampleConfig.templateName, then template.name
    let templateName: string | undefined = undefined;
    if (state.currentTemplateId) {
      const templates = loadTemplates(state.username);
      const templateData = templates.find(t => t.id === state.currentTemplateId);
      if (templateData) {
        templateName = templateData.name;
      }
    }
    // Fallback to teachByExampleConfig.templateName or template.name if not found in templates list
    if (!templateName) {
      templateName = template?.teachByExampleConfig?.templateName || template?.name || undefined;
    }
    
    const existingProject = state.currentProjectId
      ? loadProjects(state.username).find(p => p.id === projectId)
      : null;
    const project: ProjectData = {
      id: projectId,
      name,
      username: state.username,
      template: template,
      templateName: templateName,
      nameOptions: state.nameOptions,
      selectedCategories: state.selectedCategories,
      devices: state.devices,
      step: state.step,
      installerPdfOptions: existingProject?.installerPdfOptions, // Preserve installer PDF options
      createdAt: state.currentProjectId 
        ? existingProject?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const projects = loadProjects(state.username);
    const existingIndex = projects.findIndex(p => p.id === projectId);
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }
    
    saveProjects(state.username, projects);
    // When creating a new project, clear room cache - only show room names that are configured in this project
    if (existingIndex < 0) {
      const newCache = new Map<string, string>();
      const allDeviceTypes: Array<{ category: DeviceCategory; devices: AnyDevice[] }> = [
        { category: 'switch', devices: project.devices.switch },
        { category: 'dimmer', devices: project.devices.dimmer },
        { category: 'blind', devices: project.devices.blind },
        { category: 'hvac', devices: project.devices.hvac },
        { category: 'central', devices: project.devices.central }
      ];
      for (const { devices } of allDeviceTypes) {
        for (const device of devices) {
          if ('outputs' in device && device.outputs) {
            for (const output of device.outputs) {
              if ('roomAddress' in output && 'roomName' in output && output.roomAddress && output.roomName) {
                newCache.set(output.roomAddress.trim(), output.roomName.trim());
              }
            }
          }
          if ('zones' in device && device.zones) {
            for (const zone of device.zones) {
              if (zone.roomAddress && zone.roomName) {
                newCache.set(zone.roomAddress.trim(), zone.roomName.trim());
              }
            }
          }
        }
      }
      set({ currentProjectId: projectId, roomAddressCache: newCache });
    } else {
      set({ currentProjectId: projectId });
    }
    return projectId;
  },
  loadProject: (projectId: string) => {
    const state = get();
    if (!state.username) return false;
    
    const projects = loadProjects(state.username);
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;
    
    // Double check that project belongs to current user
    if (project.username !== state.username) {
      console.error('Project does not belong to current user');
      return false;
    }
    
    // Reset export status when loading a project (exports are not persisted)
    set({ csvExported: false, pdfExported: false });
    
    // Sort the template to ensure consistent comparison
    const sortedTemplate = sortGroups(project.template);
    
    // Debug: log what we're loading for projects
    console.log('loadProject: Loading project with teachByExampleConfig:', sortedTemplate?.teachByExampleConfig ? 'HAS teachByExampleConfig' : 'NO teachByExampleConfig');
    if (sortedTemplate?.teachByExampleConfig?.categories?.hvac) {
      const hvacConfig = sortedTemplate.teachByExampleConfig.categories.hvac;
      const hvacArray = Array.isArray(hvacConfig) ? hvacConfig : [hvacConfig];
      console.log('loadProject: HVAC configs:', hvacArray.length);
      hvacArray.forEach((hvac, idx) => {
        console.log(`loadProject: HVAC[${idx}] pattern:`, hvac.pattern ? 'EXISTS' : 'MISSING');
        if (hvac.pattern) {
          console.log(`loadProject: HVAC[${idx}] pattern.extraMainGroups:`, hvac.pattern.extraMainGroups);
        }
      });
    }
    
    // Store the original template for comparison (deep copy, also sorted)
    const originalTemplate = JSON.parse(JSON.stringify(sortedTemplate));
    
    // Migrate devices to standard versions (convert translated roomName/fixture to standard)
    
    const migratedDevices: Record<DeviceCategory, AnyDevice[]> = {
      switch: project.devices.switch.map(device => ({
        ...device,
        outputs: device.outputs.map(output => ({
          ...output,
          roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
          fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
        }))
      })),
      dimmer: project.devices.dimmer.map(device => ({
        ...device,
        outputs: device.outputs.map(output => ({
          ...output,
          roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
          fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
        }))
      })),
      blind: project.devices.blind.map(device => ({
        ...device,
        outputs: device.outputs.map(output => ({
          ...output,
          roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
          fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
        }))
      })),
      hvac: project.devices.hvac.map(device => ({
        ...device,
        zones: device.zones.map(zone => ({
          ...zone,
          roomName: getStandardUserInput(zone.roomName, 'roomName') || zone.roomName
        }))
      })),
      central: project.devices.central
    };
    
    // Initialize roomAddress cache from migrated devices
    const roomAddressCache = new Map<string, string>();
    const allDeviceTypes: Array<{ category: DeviceCategory; devices: AnyDevice[] }> = [
      { category: 'switch', devices: migratedDevices.switch },
      { category: 'dimmer', devices: migratedDevices.dimmer },
      { category: 'blind', devices: migratedDevices.blind },
      { category: 'hvac', devices: migratedDevices.hvac },
      { category: 'central', devices: migratedDevices.central }
    ];
    
    for (const { devices } of allDeviceTypes) {
      for (const device of devices) {
        if ('outputs' in device && device.outputs) {
          for (const output of device.outputs) {
            if ('roomAddress' in output && 'roomName' in output && output.roomAddress && output.roomName) {
              roomAddressCache.set(output.roomAddress.trim(), output.roomName.trim());
            }
          }
        }
        if ('zones' in device && device.zones) {
          for (const zone of device.zones) {
            if (zone.roomAddress && zone.roomName) {
              roomAddressCache.set(zone.roomAddress.trim(), zone.roomName.trim());
            }
          }
        }
      }
    }
    
    // Ensure originalTemplate matches sortedTemplate to prevent false change detection
    // This prevents setTemplate from triggering unnecessary updates
    const finalOriginalTemplate = JSON.parse(JSON.stringify(sortedTemplate));
    
    set({
      template: sortedTemplate,
      selectedCategories: project.selectedCategories,
      devices: migratedDevices, // Use migrated devices with standard versions
      step: project.step,
      currentProjectId: projectId,
      currentTemplateId: undefined, // Reset template ID since this is a project, not a template
      originalTemplate: finalOriginalTemplate,
      templateHasChanges: false, // Template from project should not be marked as changed
      csvExported: false, // Reset export status when loading a project
      pdfExported: false, // Reset export status when loading a project
      nameOptions: project.nameOptions || {
        showRoomAddress: true,
        showSwitchCode: true,
        showObjectName: true
      },
      roomAddressCache: roomAddressCache // Initialize cache from loaded project
    });
    return true;
  },
  deleteProject: (projectId: string) => {
    const state = get();
    if (!state.username) return;
    
    const projects = loadProjects(state.username);
    const filtered = projects.filter(p => p.id !== projectId);
    saveProjects(state.username, filtered);
    
    if (state.currentProjectId === projectId) {
      set({ currentProjectId: undefined });
    }
  },
  getProjects: () => {
    const state = get();
    if (!state.username) return [];
    return loadProjects(state.username);
  },
  saveInstallerPdfOptions: (options: Partial<ProjectInstallerPdfOptions>) => {
    const state = get();
    if (!state.username || !state.currentProjectId) return;
    const projects = loadProjects(state.username);
    const project = projects.find(p => p.id === state.currentProjectId);
    if (!project) return;
    const merged = { ...project.installerPdfOptions, ...options };
    const updatedProject: ProjectData = {
      ...project,
      installerPdfOptions: merged,
      updatedAt: new Date().toISOString()
    };
    const idx = projects.findIndex(p => p.id === state.currentProjectId);
    if (idx >= 0) {
      projects[idx] = updatedProject;
      saveProjects(state.username, projects);
    }
  },
  getInstallerPdfOptions: () => {
    const state = get();
    if (!state.username || !state.currentProjectId) return undefined;
    const projects = loadProjects(state.username);
    const project = projects.find(p => p.id === state.currentProjectId);
    return project?.installerPdfOptions;
  },
  exportProject: (projectId: string) => {
    const state = get();
    if (!state.username) return '';
    
    const projects = loadProjects(state.username);
    const project = projects.find(p => p.id === projectId);
    if (!project) return '';
    
    return JSON.stringify(project, null, 2);
  },
  importProject: (jsonData: string) => {
    try {
      const project = JSON.parse(jsonData) as ProjectData;
      const state = get();
      
      if (!state.username) {
        alert('Stel eerst een gebruikersnaam in voordat u een project importeert');
        return false;
      }
      
      // Generate new ID for imported project
      const newId = uid();
      const importedProject: ProjectData = {
        ...project,
        id: newId,
        username: state.username, // Always use current username
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const projects = loadProjects(state.username);
      projects.push(importedProject);
      saveProjects(state.username, projects);
      
      // Sort the template to ensure consistent comparison
      const sortedTemplate = sortGroups(importedProject.template);
      
      // Store the original template for comparison (deep copy, also sorted)
      const originalTemplate = JSON.parse(JSON.stringify(sortedTemplate));
      
      // Migrate devices to standard versions (convert translated roomName/fixture to standard)
      const migratedDevices: Record<DeviceCategory, AnyDevice[]> = {
        switch: importedProject.devices.switch.map(device => ({
          ...device,
          outputs: device.outputs.map(output => ({
            ...output,
            roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
            fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
          }))
        })),
        dimmer: importedProject.devices.dimmer.map(device => ({
          ...device,
          outputs: device.outputs.map(output => ({
            ...output,
            roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
            fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
          }))
        })),
        blind: importedProject.devices.blind.map(device => ({
          ...device,
          outputs: device.outputs.map(output => ({
            ...output,
            roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
            fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
          }))
        })),
        hvac: importedProject.devices.hvac.map(device => ({
          ...device,
          zones: device.zones.map(zone => ({
            ...zone,
            roomName: getStandardUserInput(zone.roomName, 'roomName') || zone.roomName
          }))
        })),
        central: importedProject.devices.central
      };
      
      // Initialize roomAddressCache from imported project's devices
      const roomAddressCache = new Map<string, string>();
      const allDeviceTypes: Array<{ category: DeviceCategory; devices: AnyDevice[] }> = [
        { category: 'switch', devices: migratedDevices.switch },
        { category: 'dimmer', devices: migratedDevices.dimmer },
        { category: 'blind', devices: migratedDevices.blind },
        { category: 'hvac', devices: migratedDevices.hvac },
        { category: 'central', devices: migratedDevices.central }
      ];
      for (const { devices } of allDeviceTypes) {
        for (const device of devices) {
          if ('outputs' in device && device.outputs) {
            for (const output of device.outputs) {
              if ('roomAddress' in output && 'roomName' in output && output.roomAddress && output.roomName) {
                roomAddressCache.set(output.roomAddress.trim(), output.roomName.trim());
              }
            }
          }
          if ('zones' in device && device.zones) {
            for (const zone of device.zones) {
              if (zone.roomAddress && zone.roomName) {
                roomAddressCache.set(zone.roomAddress.trim(), zone.roomName.trim());
              }
            }
          }
        }
      }

      // Load the imported project
      set({
        template: sortedTemplate,
        selectedCategories: importedProject.selectedCategories,
        devices: migratedDevices, // Use migrated devices with standard versions
        step: importedProject.step,
        currentProjectId: newId,
        currentTemplateId: undefined, // Reset template ID since this is a project, not a template
        originalTemplate: originalTemplate,
        templateHasChanges: false, // Template from imported project should not be marked as changed
        nameOptions: importedProject.nameOptions || {
          showRoomAddress: true,
          showSwitchCode: true,
          showObjectName: true
        },
        roomAddressCache
      });
      
      return true;
    } catch (err) {
      console.error('Failed to import project', err);
      return false;
    }
  },
  // Template management
  saveTemplateAs: (name: string, templateToSave?: TemplateConfig) => {
    const state = get();
    if (!state.username) {
      throw new Error('Username must be set before saving a template');
    }
    
    // Use the provided template, or fall back to state.template
    const template = templateToSave || state.template || buildDefaultTemplate();
    
    const templates = loadTemplates(state.username);
    
    // Check if a template with this name already exists
    const existingTemplate = templates.find(t => t.name === name);
    if (existingTemplate) {
      // If it exists and it's the current template, update it
      if (state.currentTemplateId === existingTemplate.id) {
        // Debug: log what we're saving
        console.log('saveTemplateAs (update): Template provided:', template?.teachByExampleConfig ? 'HAS teachByExampleConfig' : 'NO teachByExampleConfig');
        
        const updatedTemplate: TemplateData = {
          ...existingTemplate,
          template: template,
          updatedAt: new Date().toISOString()
        };
        
        // Debug: log what we're saving to templates array
        console.log('saveTemplateAs (update): TemplateData teachByExampleConfig:', updatedTemplate.template?.teachByExampleConfig ? 'HAS teachByExampleConfig' : 'NO teachByExampleConfig');
        const index = templates.findIndex(t => t.id === existingTemplate.id);
        templates[index] = updatedTemplate;
        saveTemplates(state.username, templates);
        // Store the original template for comparison (deep copy)
        const originalTemplate = JSON.parse(JSON.stringify(updatedTemplate.template));
        set({ 
          currentTemplateId: existingTemplate.id, 
          originalTemplate: originalTemplate,
          templateHasChanges: false 
        });
        return existingTemplate.id;
      } else {
        // Template with this name exists but it's not the current one - throw error
        throw new Error(`Een template met de naam "${name}" bestaat al. Kies een andere naam.`);
      }
    }
    
    // Create new template with unique ID
    const templateId = uid();
    
    // Debug: log what we're saving
    console.log('saveTemplateAs (new): Template provided:', template?.teachByExampleConfig ? 'HAS teachByExampleConfig' : 'NO teachByExampleConfig');
    if (template?.teachByExampleConfig) {
      console.log('saveTemplateAs (new): Template teachByExampleConfig.templateName:', template.teachByExampleConfig.templateName);
    }
    
    // CRITICAL: Ensure teachByExampleConfig is preserved in the template we're saving
    const templateWithConfig = {
      ...template,
      teachByExampleConfig: template.teachByExampleConfig || (state.template?.teachByExampleConfig)
    };
    
    const templateData: TemplateData = {
      id: templateId,
      name,
      username: state.username,
      template: templateWithConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Debug: log what we're saving to templates array
    console.log('saveTemplateAs (new): TemplateData teachByExampleConfig:', templateData.template?.teachByExampleConfig ? 'HAS teachByExampleConfig' : 'NO teachByExampleConfig');
    if (templateData.template?.teachByExampleConfig) {
      console.log('saveTemplateAs (new): TemplateData teachByExampleConfig.templateName:', templateData.template.teachByExampleConfig.templateName);
    }
    
    templates.push(templateData);
    saveTemplates(state.username, templates);
    
    // Debug: log what we're saving to default template location
    console.log('saveTemplateAs: Saving to default template location, teachByExampleConfig:', templateData.template?.teachByExampleConfig ? 'HAS teachByExampleConfig' : 'NO teachByExampleConfig');
    
    // Also save to the default template location
    saveTemplate(templateData.template, state.username);
    
    // Debug: verify what we're setting in the store
    console.log('saveTemplateAs: Setting template in store, teachByExampleConfig:', templateData.template?.teachByExampleConfig ? 'HAS teachByExampleConfig' : 'NO teachByExampleConfig');
    
    // Store the original template for comparison (deep copy)
    const originalTemplate = JSON.parse(JSON.stringify(templateData.template));
    
    // Debug: log what we're setting in store
    console.log('saveTemplateAs: Setting template in store, teachByExampleConfig:', templateData.template?.teachByExampleConfig ? 'HAS teachByExampleConfig' : 'NO teachByExampleConfig');
    
    set({ 
      currentTemplateId: templateId, 
      template: templateData.template,
      originalTemplate: originalTemplate,
      templateHasChanges: false 
    });
    return templateId;
  },
  loadTemplateById: (templateId: string) => {
    const state = get();
    if (!state.username) return false;
    
    const templates = loadTemplates(state.username);
    const templateData = templates.find(t => t.id === templateId);
    if (!templateData) return false;
    
    // Double check that template belongs to current user
    if (templateData.username !== state.username) {
      console.error('Template does not belong to current user');
      return false;
    }
    
    // Sort the template to ensure consistent comparison (same as loadProject)
    const sortedTemplate = sortGroups(templateData.template);
    
    // Store the original template for comparison (deep copy, also sorted)
    const originalTemplate = JSON.parse(JSON.stringify(sortedTemplate));
    
    // Also save as the default template for this user
    const key = `knx-template-${state.username}`;
    try {
      // Normalize to NFC to ensure consistent UTF-8 representation
      const jsonString = JSON.stringify(sortedTemplate);
      const normalized = jsonString.normalize('NFC');
      localStorage.setItem(key, normalized);
    } catch (err) {
      console.error('Failed to save template to localStorage', err);
    }
    
    // Also save to the user template (for compatibility)
    saveTemplate(sortedTemplate, state.username);
    
    // Debug: log what we're loading
    console.log('loadTemplateById: Loading template with teachByExampleConfig:', sortedTemplate?.teachByExampleConfig ? 'HAS teachByExampleConfig' : 'NO teachByExampleConfig');
    if (sortedTemplate?.teachByExampleConfig?.categories?.hvac) {
      const hvacConfig = sortedTemplate.teachByExampleConfig.categories.hvac;
      const hvacArray = Array.isArray(hvacConfig) ? hvacConfig : [hvacConfig];
      console.log('loadTemplateById: HVAC configs:', hvacArray.length);
      hvacArray.forEach((hvac, idx) => {
        console.log(`loadTemplateById: HVAC[${idx}] pattern:`, hvac.pattern ? 'EXISTS' : 'MISSING');
        if (hvac.pattern) {
          console.log(`loadTemplateById: HVAC[${idx}] pattern.extraMainGroups:`, hvac.pattern.extraMainGroups);
        }
      });
    }
    
    set({
      template: sortedTemplate,
      currentTemplateId: templateId,
      originalTemplate: originalTemplate,
      templateHasChanges: false,
      step: 'template', // Set step to template so template content is shown
      csvExported: false, // Reset export status when loading a template
      pdfExported: false, // Reset export status when loading a template
      roomAddressCache: new Map() // Clear cache - templates don't have device config with room names
    });
    return true;
  },
  deleteTemplate: (templateId: string) => {
    const state = get();
    if (!state.username) return;
    
    const templates = loadTemplates(state.username);
    const filtered = templates.filter(t => t.id !== templateId);
    saveTemplates(state.username, filtered);
    
    if (state.currentTemplateId === templateId) {
      // Load default template if current was deleted
      const defaultTemplate = buildDefaultTemplate();
      set({ 
        template: defaultTemplate, 
        currentTemplateId: undefined,
        templateHasChanges: false 
      });
    }
  },
  getTemplates: () => {
    const state = get();
    if (!state.username) return [];
    return loadTemplates(state.username);
  },
  exportTemplate: (templateId: string) => {
    const state = get();
    if (!state.username) return '';
    
    const templates = loadTemplates(state.username);
    const templateData = templates.find(t => t.id === templateId);
    if (!templateData) return '';
    
    return JSON.stringify(templateData, null, 2);
  },
  importTemplate: (jsonData: string) => {
    try {
      const templateData = JSON.parse(jsonData) as TemplateData;
      const state = get();
      
      if (!state.username) {
        alert('Stel eerst een gebruikersnaam in voordat u een template importeert');
        return false;
      }
      
      // Generate new ID for imported template
      const newId = uid();
      const importedTemplate: TemplateData = {
        ...templateData,
        id: newId,
        username: state.username, // Always use current username
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const templates = loadTemplates(state.username);
      templates.push(importedTemplate);
      saveTemplates(state.username, templates);
      
      // Load the imported template
      set({
        template: importedTemplate.template,
        currentTemplateId: newId,
        templateHasChanges: false
      });
      
      return true;
    } catch (err) {
      console.error('Failed to import template', err);
      return false;
    }
  }
}));

