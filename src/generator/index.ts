import { AnyDevice, GroupAddressRow, TemplateConfig, FunctionGroupConfig, FixedMiddleGroupTemplate, AddressingConfig, HierarchicalGroupAddressOverview, HierarchicalMainGroup, HierarchicalMiddleGroup, HierarchicalGroupAddress } from '../types/common';
import { Language, getTranslation, translateFixedAddressName, translateObjectName } from '../i18n/translations';
import { translateUserInput, getStandardUserInput, translateGroupNameForDisplay, roomNameTranslations, fixtureTranslations } from '../i18n/userInputTranslations';
import { generateAddressesFromPattern } from './patternGenerator';

// Fix common encoding issues where UTF-8 characters are incorrectly decoded
// This fixes all UTF-8 misinterpretations, not just "scÃ¨nes"
// Example: "scÃ¨nes" -> "scènes", "atenuaciÃ³n" -> "atenuación", "posiciÃ³n" -> "posición"
const fixEncoding = (str: string): string => {
  if (!str) return str;
  
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

// Helper function to check if a name matches any language variant
const matchesNameVariant = (name: string, variants: string[]): boolean => {
  const nameLower = name.toLowerCase().trim();
  return variants.some(variant => nameLower === variant.toLowerCase().trim());
};

// Get all language variants for category names
const getGeneralVariants = (): string[] => {
  return ['algemeen', 'general', 'général', 'allgemein'];
};

const getCentralVariants = (): string[] => {
  return ['centraal', 'centraal schakelen', 'centraal objecten', 'central switching', 'central objects', 'central', 'objetos centrales', 'objetos central', 'objets centraux', 'objets central', 'zentrale objekte', 'zentral', 'zentrales schalten'];
};

const getSceneVariants = (): string[] => {
  return ['scène\'s', 'scènes', 'scenes', 'scene', 'escenas', 'escena', 'scènes', 'scène', 'szenen', 'szene'];
};

const getCentralDimmingVariants = (): string[] => {
  return ['centraal dimmen', 'central dimming', 'dimming central', 'centrale dimmerung', 'dimming central', 'dimming centrale', 'dimming central'];
};

const getCentralBlindVariants = (): string[] => {
  return ['centraal jalouzie / rolluik', 'centraal jalouzie', 'centraal rolluik', 'central blind', 'central shading', 'central jalousie', 'central store', 'zentrale jalousie', 'zentrale rollo', 'jalousie central', 'store central'];
};

const getAllOffVariants = (): string[] => {
  return ['alles uit', 'all off', 'todo apagado', 'tout éteindre', 'alles aus'];
};

const getWelcomeVariants = (): string[] => {
  return ['welkom', 'welcome', 'bienvenido', 'bienvenue', 'willkommen'];
};

interface BuildNameParams {
  template: TemplateConfig;
  roomAddress: string;
  roomName: string;
  fixture: string;
  switchCode?: string;
  fn: string;
}

// Removed unused replaceTokens function

// Extract floor number from roomAddress (e.g., "3.1" -> 3, "0.5" -> 0, "-1.2" -> -1)
const extractFloorNumber = (roomAddress: string): number => {
  if (!roomAddress || !roomAddress.trim()) return 0;
  const parts = roomAddress.split('.');
  if (parts.length > 0) {
    const floor = parseInt(parts[0], 10);
    return isNaN(floor) ? 0 : floor;
  }
  return 0;
};

// Parse roomAddress for sorting (e.g., "-2.1" -> [-2, 1], "0.5" -> [0, 5], "3.10" -> [3, 10])
const parseRoomAddressForSorting = (roomAddress: string): [number, number] => {
  if (!roomAddress || !roomAddress.trim()) return [0, 0];
  const parts = roomAddress.split('.');
  const floor = parts.length > 0 ? (parseInt(parts[0], 10) || 0) : 0;
  const room = parts.length > 1 ? (parseInt(parts[1], 10) || 0) : 0;
  return [floor, room];
};

// Sort room addresses numerically (supports negative numbers like -2.1, -2.2, 0.1, 3.5)
const sortRoomAddresses = (rooms: Array<{ roomAddress: string; roomName: string }>): Array<{ roomAddress: string; roomName: string }> => {
  return [...rooms].sort((a, b) => {
    const [floorA, roomA] = parseRoomAddressForSorting(a.roomAddress);
    const [floorB, roomB] = parseRoomAddressForSorting(b.roomAddress);
    
    // First sort by floor (can be negative)
    if (floorA !== floorB) {
      return floorA - floorB;
    }
    
    // Then sort by room number
    return roomA - roomB;
  });
};

// Check if object name indicates a status object
const isStatusObject = (objectName: string): boolean => {
  const lowerName = objectName.toLowerCase();
  return lowerName.includes('status') || lowerName.includes('state') || 
         lowerName.includes('waarde status') || lowerName.includes('aan/uit status');
};

// Build address based on addressing mode
const buildAddressWithMode = (
  cfg: FunctionGroupConfig,
  idx: number,
  addressStructure: TemplateConfig['addressStructure'],
  addressingConfig: AddressingConfig | undefined,
  roomAddress: string,
  _objectName: string,
  isStatusObject: boolean = false
): string => {
  // Default to MODE 1 if no config provided (backwards compatibility)
  const mode = addressingConfig?.mode || 'mode1';
  const startChannel = addressingConfig?.startChannelNumber || 1;
  const channelIncrement = addressingConfig?.channelIncrement !== false;
  
  // Calculate device/channel number
  const deviceNumber = channelIncrement ? (startChannel + idx) : startChannel;
  
  // Validate device number
  if (deviceNumber > 255) {
    console.warn(`Device number ${deviceNumber} exceeds maximum of 255. Using 255 instead.`);
    const maxDevice = 255;
    if (addressStructure === 'two-level') {
      return `${cfg.main}/${cfg.middle + maxDevice - 1}`;
    }
    return `${cfg.main}/${cfg.middle}/${maxDevice}`;
  }
  
  if (addressStructure === 'two-level') {
    // Two-level addresses are simpler
    return `${cfg.main}/${cfg.middle + deviceNumber - 1}`;
  }
  
  // Three-level addresses with different modes
  switch (mode) {
    case 'mode1': {
      // MODE 1: Functie / Type / Device
      // main = functionNumber (from addressing config or from object.main)
      // middle = type (from object.middle or addressing config)
      // sub = deviceNumber
      const main = addressingConfig?.functionNumber ?? cfg.main;
      const middle = cfg.middle; // Use object's middle group (type)
      
      // Prevent 0/0/0 addresses - if main=0 and middle=0, this will always generate invalid addresses
      if (main === 0 && middle === 0) {
        return '0/0/0';
      }
      
      return `${main}/${middle}/${deviceNumber}`;
    }
    
    case 'mode2': {
      // MODE 2: Verdieping / Functie / Device
      // main = floor (from roomAddress)
      // middle = functionNumber (from addressing config)
      // sub = deviceNumber (status = deviceNumber + 1)
      const floor = extractFloorNumber(roomAddress);
      const main = floor >= 0 ? floor : 0; // Ensure non-negative
      const middle = addressingConfig?.functionNumber ?? cfg.main;
      const sub = isStatusObject ? (deviceNumber + 1) : deviceNumber;
      
      // Validate sub doesn't exceed 255
      const finalSub = sub > 255 ? 255 : sub;
      
      // Prevent 0/0/0 addresses - if main=0 and middle=0, this will always generate invalid addresses
      if (main === 0 && middle === 0) {
        return '0/0/0';
      }
      
      return `${main}/${middle}/${finalSub}`;
    }
    
    case 'mode3': {
      // MODE 3: Verdieping / Functie / Device + Status offset
      // main = floor (from roomAddress)
      // middle = functionNumber (from addressing config)
      // sub = deviceNumber (status = deviceNumber + statusOffset)
      const floor = extractFloorNumber(roomAddress);
      const main = floor >= 0 ? floor : 0; // Ensure non-negative
      const middle = addressingConfig?.functionNumber ?? cfg.main;
      const statusOffset = addressingConfig?.statusOffset || 100;
      const sub = isStatusObject ? (deviceNumber + statusOffset) : deviceNumber;
      
      // Validate sub doesn't exceed 255
      const finalSub = sub > 255 ? 255 : sub;
      
      // Prevent 0/0/0 addresses - if main=0 and middle=0, this will always generate invalid addresses
      if (main === 0 && middle === 0) {
        return '0/0/0';
      }
      
      return `${main}/${middle}/${finalSub}`;
    }
    
    default:
      // Fallback to original behavior
      // Prevent 0/0/0 addresses - if main=0 and middle=0, this will always generate invalid addresses
      if (cfg.main === 0 && cfg.middle === 0) {
        return '0/0/0';
      }
      
      const address = `${cfg.main}/${cfg.middle}/${deviceNumber}`;
      return address;
  }
};

// Legacy buildAddress function for backwards compatibility
const buildAddress = (
  cfg: FunctionGroupConfig,
  idx: number,
  addressStructure: TemplateConfig['addressStructure']
) => {
  // Prevent 0/0/0 addresses - if main=0 and middle=0, this will always generate invalid addresses
  if (cfg.main === 0 && cfg.middle === 0) {
    return '0/0/0';
  }
  
  const offset = cfg.start + idx;
  
  // Validate that offset doesn't exceed 255
  if (offset > 255) {
    console.warn(`Group address offset ${offset} exceeds maximum of 255. Using 255 instead.`);
    const maxOffset = 255;
    if (addressStructure === 'two-level') {
      return `${cfg.main}/${cfg.middle + maxOffset - 1}`;
    }
    return `${cfg.main}/${cfg.middle}/${maxOffset}`;
  }
  
  if (addressStructure === 'two-level') {
    const address = `${cfg.main}/${cfg.middle + offset - 1}`;
    // Prevent 0/0 addresses
    if (cfg.main === 0 && (cfg.middle + offset - 1) === 0) {
      return '0/0/0'; // Return marker to be filtered
    }
    return address;
  }
  
  const address = `${cfg.main}/${cfg.middle}/${offset}`;
  return address;
};

const buildName = ({
  template,
  roomAddress,
  roomName,
  fixture,
  switchCode,
  fn
}: BuildNameParams, lang: Language = 'nl', isReserve?: boolean, nameOptions?: NameDisplayOptions) => {
  const t = getTranslation(lang);
  const reserveName = t.reserve || 'reserve';
  
  // Check if channel is marked as reserve/unused - return translated "reserve" immediately
  // Explicitly check for true (not just truthy) to handle undefined/false cases
  if (isReserve === true) {
    return reserveName;
  }
  
  // Check if all fields are empty - if so, return "reserve" (translated)
  // This handles the case where isReserve might be undefined but fields are empty
  // This is important: if isReserve is true, the fields should be empty, so we check this first
  const isEmpty = !roomAddress?.trim() && !roomName?.trim() && !fixture?.trim();
  if (isEmpty && isReserve !== false) {
    // If fields are empty and isReserve is not explicitly false, treat as reserve
    return reserveName;
  }
  
  // Translate roomName and fixture to the current language
  // First get standard version to ensure correct translation (handles already-translated values)
  const standardRoomName = roomName && roomName.trim() 
    ? (getStandardUserInput(roomName, 'roomName') || roomName)
    : roomName;
  
  // Translate from standard to target language
  // translateUserInput should handle standard (Dutch) values and translate them to target language
  let translatedRoomName = '';
  if (standardRoomName && standardRoomName.trim()) {
    translatedRoomName = translateUserInput(standardRoomName, lang, 'roomName');
    // Debug: check if translation worked
    // if (translatedRoomName === standardRoomName && lang !== 'nl') {
    //   console.warn('[buildName] Translation failed for roomName:', { standardRoomName, lang, translatedRoomName });
    // }
  } else {
    translatedRoomName = roomName || '';
  }
  
  const standardFixture = fixture && fixture.trim()
    ? (getStandardUserInput(fixture, 'fixture') || fixture)
    : fixture;
  
  // Translate from standard to target language
  let translatedFixture = '';
  if (standardFixture && standardFixture.trim()) {
    translatedFixture = translateUserInput(standardFixture, lang, 'fixture');
    // Debug: check if translation worked
    // if (translatedFixture === standardFixture && lang !== 'nl') {
    //   console.warn('[buildName] Translation failed for fixture:', { standardFixture, lang, translatedFixture });
    // }
  } else {
    translatedFixture = fixture || '';
  }
  
  // Alleen roomAddress tonen als het ingevuld is en showRoomAddress is true (default true)
  const addressPart = (nameOptions?.showRoomAddress !== false && roomAddress && roomAddress.trim()) ? `${roomAddress} ` : '';
  const parts = [
    addressPart,
    translatedRoomName,
    translatedFixture,
    (nameOptions?.showSwitchCode !== false && switchCode) ? switchCode : '',
    (nameOptions?.showObjectName !== false && fn) ? fn : ''
  ].filter(p => p && p.trim());
  
  const result = parts.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
  // If result is empty, return reserve name
  return result || reserveName;
};

const buildComment = (
  template: TemplateConfig,
  physical?: string,
  channel?: string,
  lang: Language = 'nl'
) => {
  const t = getTranslation(lang);
  let pattern = template.commentTemplate ?? '<physical> – <channel>';
  
  // Ensure output word starts with lowercase letter
  const outputWord = t.output.charAt(0).toLowerCase() + t.output.slice(1);
  
  // Replace any dash/separator between <physical> and <channel> with the translated "output" word
  // Handle various dash types: – (en dash U+2013), - (hyphen), — (em dash U+2014), and with/without spaces
  // Also replace if the output word (in any case) already exists between physical and channel
  pattern = pattern
    .replace(/<physical>\s*[–—\-]\s*<channel>/g, `<physical> ${outputWord} <channel>`)
    .replace(/<physical>\s+<channel>/g, `<physical> ${outputWord} <channel>`) // Also handle space-only separators
    .replace(new RegExp(`<physical>\\s*${t.output}\\s*<channel>`, 'gi'), `<physical> ${outputWord} <channel>`); // Replace existing output word (case-insensitive) with lowercase version
  
  // Now replace the placeholders with actual values
  let result = pattern
    .replace('<physical>', physical ?? 'n/a')
    .replace('<channel>', channel ?? 'n/a');
  
  // Final cleanup: normalize multiple spaces and trim
  return result.replace(/\s+/g, ' ').trim();
};

const getChannelName = (output: { channelName?: string }, index: number): string => {
  return output.channelName ?? `K${index + 1}`;
};

const extractChannelNumber = (channelName: string): number => {
  const match = channelName.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

// Parse physical address for sorting (e.g., "1.1.1" -> [1, 1, 1])
const parsePhysicalAddress = (addr: string): number[] => {
  try {
    return addr.split('.').map(Number);
  } catch {
    return [999, 999, 999]; // Put invalid addresses at the end
  }
};

// Sort devices by physical address (low to high)
const sortDevicesByPhysicalAddress = (devices: AnyDevice[]): AnyDevice[] => {
  return [...devices].sort((a, b) => {
    const addrA = 'physicalAddress' in a ? parsePhysicalAddress(a.physicalAddress) : [999, 999, 999];
    const addrB = 'physicalAddress' in b ? parsePhysicalAddress(b.physicalAddress) : [999, 999, 999];
    
    for (let i = 0; i < Math.max(addrA.length, addrB.length); i++) {
      const partA = addrA[i] ?? 0;
      const partB = addrB[i] ?? 0;
      if (partA !== partB) {
        return partA - partB;
      }
    }
    return 0;
  });
};

export interface NameDisplayOptions {
  showRoomAddress?: boolean;
  showSwitchCode?: boolean;
  showObjectName?: boolean;
}

export const generateGroupAddresses = (
  template: TemplateConfig,
  devices: AnyDevice[],
  lang: Language = 'nl',
  nameOptions?: NameDisplayOptions
): GroupAddressRow[] => {
  let rows: GroupAddressRow[] = [];
  
  // Migrate devices to standard versions (convert translated roomName/fixture to standard)
  // This ensures that even if devices were saved with translated values, they are converted to standard before translation
  const migratedDevices: AnyDevice[] = devices.map(device => {
    if ('outputs' in device && device.outputs) {
      const migratedOutputs = device.outputs.map((output: any) => {
        const standardRoomName = getStandardUserInput(output.roomName, 'roomName') || output.roomName;
        const standardFixture = getStandardUserInput(output.fixture, 'fixture') || output.fixture;
        
        // Debug: log first few migrations
        // if (output.roomName || output.fixture) {
        //   console.log('[generateGroupAddresses migration]', {
        //     original: { roomName: output.roomName, fixture: output.fixture },
        //     standard: { roomName: standardRoomName, fixture: standardFixture }
        //   });
        // }
        
        return {
          ...output,
          roomName: standardRoomName,
          fixture: standardFixture
        };
      });
      return {
        ...device,
        outputs: migratedOutputs
      } as AnyDevice;
    } else if ('zones' in device && device.zones) {
      return {
        ...device,
        zones: device.zones.map((zone: any) => ({
          ...zone,
          roomName: getStandardUserInput(zone.roomName, 'roomName') || zone.roomName
        }))
      } as AnyDevice;
    }
    return device;
  });
  
  // Check if template uses Teach by Example config
  // Default name options (all enabled)
  const defaultNameOptions: NameDisplayOptions = {
    showRoomAddress: true,
    showSwitchCode: true,
    showObjectName: true
  };
  const finalNameOptions = nameOptions || defaultNameOptions;
  
  if (template.teachByExampleConfig) {
    rows = generateAddressesFromPattern(template.teachByExampleConfig, migratedDevices, lang, finalNameOptions);
    // Continue below to also generate fixed addresses (centraal and scène's) with auto-generate if enabled
  } else {
    // Fall back to old generation method
    rows = [];
    
    // Counter per object (main/middle combinatie) om unieke groepsadressen te garanderen
    // Key format: `${main}-${middle}`
    const addressCounters = new Map<string, number>();

    // Sort devices by physical address first
    const sortedDevices = sortDevicesByPhysicalAddress(migratedDevices);

    sortedDevices.forEach((device) => {
    if (device.category === 'hvac' || device.category === 'central') {
      // These are handled separately
      return;
    }

    // Type guard: devices with outputs
    if (!('outputs' in device) || !device.outputs) {
      return;
    }

    // Sort outputs by channel number
    const sortedOutputs = [...device.outputs].sort((a, b) => {
      const channelA = extractChannelNumber(getChannelName(a, 0));
      const channelB = extractChannelNumber(getChannelName(b, 0));
      return channelA - channelB;
    });

    sortedOutputs.forEach((output, index) => {
      const channelLabel = getChannelName(output, index);
      const physicalAddr = 'physicalAddress' in device ? device.physicalAddress : 'n/a';
      const comment = buildComment(template, physicalAddr, channelLabel, lang);
      // Explicitly check isReserve - it might be undefined, false, or true
      // Check both the output object and any nested properties
      const isReserve = (output as any).isReserve === true || (output as any)?.isReserve === true;
      
      // Skip generating addresses for reserve channels (they don't need group addresses)
      if (isReserve) {
        return;
      }
      
      // Note: output.roomName and output.fixture are already in standard format due to migration at function start
      // But we still normalize here as a safety measure to ensure consistency
      const standardRoomName = output.roomName && output.roomName.trim()
        ? (getStandardUserInput(output.roomName, 'roomName') || output.roomName)
        : (output.roomName || '');
      const standardFixture = output.fixture && output.fixture.trim()
        ? (getStandardUserInput(output.fixture, 'fixture') || output.fixture)
        : (output.fixture || '');
      
      // Debug: log to see what values we're working with
      // Temporarily enable to debug translation issues
      // if (standardRoomName || standardFixture) {
      //   console.log('[generateGroupAddresses] nameBase creation:', {
      //     original: { roomName: output.roomName, fixture: output.fixture },
      //     standard: { roomName: standardRoomName, fixture: standardFixture },
      //     lang,
      //     deviceCategory: device.category
      //   });
      // }
      
      const nameBase = {
        template,
        roomAddress: output.roomAddress || '',
        roomName: standardRoomName,
        fixture: standardFixture,
        switchCode: output.switchCode || ''
      };

      switch (device.category) {
        case 'switch': {
          const cfg = template.devices.switch;
          const addressingConfig = cfg.addressing;
          // ALTIJD alle objecten genereren, niet alleen enabled
          // Filter out objects that would generate 0/0/0 addresses
          const allObjects = (cfg.objects || []).filter(obj => {
            // Skip ALL objects with main=0 and middle=0 (they will generate 0/0/X which becomes 0/0/0)
            if (obj.main === 0 && obj.middle === 0) {
              return false;
            }
            return true;
          });
          const physicalAddrParts = physicalAddr.split('.').map(Number);
          const channelNum = extractChannelNumber(channelLabel);
          
          allObjects.forEach((obj, objIdx) => {
            const key = `${obj.main}-${obj.middle}`;
            const currentCount = addressCounters.get(key) || 0;
            addressCounters.set(key, currentCount + 1);
            
            const isStatus = isStatusObject(obj.name);
            
            // Skip if this would generate 0/0/0 - check before building address
            // In mode1, if functionNumber is 0 and obj.main is 0, main will be 0
            // If obj.middle is also 0, this will generate 0/0/X addresses
            if (obj.main === 0 && obj.middle === 0) {
              // Always skip objects with main=0 and middle=0, they will generate invalid addresses
              return;
            }
            
            // Also check if the final address would be 0/0/0 after applying addressing config
            if (addressingConfig?.mode === 'mode1') {
              const finalMain = addressingConfig?.functionNumber ?? obj.main;
              if (finalMain === 0 && obj.middle === 0) {
                return;
              }
            }
            
            const groupAddress = buildAddressWithMode(
              { main: obj.main, middle: obj.middle, start: obj.start, dpt: obj.dpt },
              currentCount,
              template.addressStructure,
              addressingConfig,
              output.roomAddress,
              obj.name,
              isStatus
            );
            
            // Skip invalid addresses (0/0/0 or similar) - double check after building
            if (groupAddress === '0/0/0' || groupAddress === '0/0') {
              return;
            }
            
            // Als object disabled is, gebruik "---" als naam
            const name = obj.enabled 
              ? buildName({ ...nameBase, fn: obj.name }, lang, isReserve, finalNameOptions)
              : '---';
            
            // Debug: log first few to see what's happening
            // Temporarily enable to debug translation issues
            // if (rows.length < 3 && (nameBase.roomName || nameBase.fixture)) {
            //   console.log('[generateGroupAddresses] Generated name:', {
            //     name,
            //     nameBase: { roomName: nameBase.roomName, fixture: nameBase.fixture },
            //     lang,
            //     deviceCategory: device.category
            //   });
            // }
            
            rows.push({
              groupAddress,
              name,
              datapointType: obj.dpt,
              comment,
              _sortKey: {
                physicalAddress: physicalAddrParts,
                channelNumber: channelNum,
                objectIndex: objIdx
              }
            });
          });
          break;
        }
        case 'dimmer': {
          // DALI gebruikt dezelfde template als dimmer (category is 'dimmer')
          // Support multiple dim groups
          // Check if template uses TeachByExample config or old structure
          let dimGroups: any[];
          if (template.teachByExampleConfig?.categories?.dimming) {
            // Use TeachByExample config - convert to old structure format for compatibility
            const dimmingConfig = template.teachByExampleConfig.categories.dimming;
            const dimmingGroups = Array.isArray(dimmingConfig) ? dimmingConfig : [dimmingConfig];
            
            // Convert each dim group pattern to objects format
            dimGroups = dimmingGroups.map(dimGroup => {
              const objects: any[] = [];
              if (dimGroup.pattern && dimGroup.exampleAddresses) {
                // Group example addresses by middle group to create objects
                const middleGroups = new Map<number, any[]>();
                dimGroup.exampleAddresses.forEach(addr => {
                  if (!middleGroups.has(addr.middle)) {
                    middleGroups.set(addr.middle, []);
                  }
                  middleGroups.get(addr.middle)!.push(addr);
                });
                
                middleGroups.forEach((addresses, middle) => {
                  addresses.forEach((addr) => {
                    objects.push({
                      main: addr.main,
                      middle: addr.middle,
                      start: addr.sub,
                      dpt: addr.dpt || 'DPT5.001',
                      name: addr.objectName || 'dimmen',
                      enabled: true
                    });
                  });
                });
              }
              
              return {
                objects: objects,
                addressing: dimGroup.pattern?.addressing,
                wizardConfig: {
                  hiddenName: '---'
                }
              };
            });
          } else {
            // Use old template structure
            const dimmerConfig = template.devices.dimmer;
            dimGroups = Array.isArray(dimmerConfig) ? dimmerConfig : [dimmerConfig];
          }
          
          // Explicitly check isReserve - it might be undefined, false, or true
          const isReserve = (output as any).isReserve === true;
          
          // Get the dim group for this output (default to first group if not specified)
          // This is the key fix: use dimGroupIndex to select the correct dim group
          const outputDimGroupIndex = (output as any).dimGroupIndex ?? 0;
          const cfg = dimGroups[outputDimGroupIndex] || dimGroups[0];
          
          const addressingConfig = cfg.addressing;
          // ALTIJD alle objecten genereren, niet alleen enabled
          // Filter out objects that would generate 0/0/0 addresses
          const allObjects = (cfg.objects || []).filter(obj => {
            // Skip ALL objects with main=0 and middle=0 (they will generate 0/0/X which becomes 0/0/0)
            if (obj.main === 0 && obj.middle === 0) {
              return false;
            }
            return true;
          });
          const physicalAddrParts = physicalAddr.split('.').map(Number);
          const channelNum = extractChannelNumber(channelLabel);
          
          // Check if dimmer inherits from switch and should use "---" for disabled
          const hiddenName = cfg.wizardConfig?.hiddenName || '---';
          
          allObjects.forEach((obj, objIdx) => {
            const key = `${obj.main}-${obj.middle}`;
            const currentCount = addressCounters.get(key) || 0;
            addressCounters.set(key, currentCount + 1);
            
            const isStatus = isStatusObject(obj.name);
            
            // Skip if this would generate 0/0/0 - check before building address
            // In mode1, if functionNumber is 0 and obj.main is 0, main will be 0
            // If obj.middle is also 0, this will generate 0/0/X addresses
            if (obj.main === 0 && obj.middle === 0) {
              // Always skip objects with main=0 and middle=0, they will generate invalid addresses
              return;
            }
            
            // Also check if the final address would be 0/0/0 after applying addressing config
            if (addressingConfig?.mode === 'mode1') {
              const finalMain = addressingConfig?.functionNumber ?? obj.main;
              if (finalMain === 0 && obj.middle === 0) {
                return;
              }
            }
            
            const groupAddress = buildAddressWithMode(
              { main: obj.main, middle: obj.middle, start: obj.start, dpt: obj.dpt },
              currentCount,
              template.addressStructure,
              addressingConfig,
              output.roomAddress,
              obj.name,
              isStatus
            );
            
            // Skip invalid addresses (0/0/0 or similar) - double check after building
            if (groupAddress === '0/0/0' || groupAddress === '0/0') {
              return;
            }
            
            // Als object disabled is, gebruik hiddenName (default "---") als naam
            const name = obj.enabled 
              ? buildName({ ...nameBase, fn: obj.name }, lang, isReserve, finalNameOptions)
              : hiddenName;
            
            rows.push({
              groupAddress,
              name,
              datapointType: obj.dpt,
              comment,
              _sortKey: {
                physicalAddress: physicalAddrParts,
                channelNumber: channelNum,
                objectIndex: objIdx
              }
            });
          });
          break;
        }
        case 'blind': {
          const cfg = template.devices.blind;
          const addressingConfig = cfg.addressing;
          // Explicitly check isReserve - it might be undefined, false, or true
          const isReserve = (output as any).isReserve === true;
          const blindOutput = output as { fixture: string; type?: 'Rolluik' | 'Jaloezie' | 'Screens' };
          const fixtureName = blindOutput.fixture || blindOutput.type || 'Zonwering';
          // ALTIJD alle objecten genereren, niet alleen enabled
          // Filter out objects that would generate 0/0/0 addresses
          const allObjects = (cfg.objects || []).filter(obj => {
            // Skip ALL objects with main=0 and middle=0 (they will generate 0/0/X which becomes 0/0/0)
            if (obj.main === 0 && obj.middle === 0) {
              return false;
            }
            return true;
          });
          const physicalAddrParts = physicalAddr.split('.').map(Number);
          const channelNum = extractChannelNumber(channelLabel);
          
          allObjects.forEach((obj, objIdx) => {
            const key = `${obj.main}-${obj.middle}`;
            const currentCount = addressCounters.get(key) || 0;
            addressCounters.set(key, currentCount + 1);
            
            const isStatus = isStatusObject(obj.name);
            
            // Skip if this would generate 0/0/0 - check before building address
            // In mode1, if functionNumber is 0 and obj.main is 0, main will be 0
            // If obj.middle is also 0, this will generate 0/0/X addresses
            if (obj.main === 0 && obj.middle === 0) {
              // Always skip objects with main=0 and middle=0, they will generate invalid addresses
              return;
            }
            
            // Also check if the final address would be 0/0/0 after applying addressing config
            if (addressingConfig?.mode === 'mode1') {
              const finalMain = addressingConfig?.functionNumber ?? obj.main;
              if (finalMain === 0 && obj.middle === 0) {
                return;
              }
            }
            
            const groupAddress = buildAddressWithMode(
              { main: obj.main, middle: obj.middle, start: obj.start, dpt: obj.dpt },
              currentCount,
              template.addressStructure,
              addressingConfig,
              output.roomAddress,
              obj.name,
              isStatus
            );
            
            // Skip invalid addresses (0/0/0 or similar) - double check after building
            if (groupAddress === '0/0/0' || groupAddress === '0/0') {
              return;
            }
            
            // Als object disabled is, gebruik "---" als naam
            const name = obj.enabled
              ? buildName({ ...nameBase, fixture: fixtureName, fn: obj.name }, lang, isReserve, finalNameOptions)
              : '---';
            
            rows.push({
              groupAddress,
              name,
              datapointType: obj.dpt,
              comment,
              _sortKey: {
                physicalAddress: physicalAddrParts,
                channelNumber: channelNum,
                objectIndex: objIdx
              }
            });
          });
          break;
        }
        default:
          break;
      }
    });
    });

    // Collect all unique rooms from devices (excluding reserve channels)
    const rooms = new Map<string, { roomAddress: string; roomName: string }>();
    
    devices.forEach((device) => {
    if (device.category === 'hvac') {
      device.zones.forEach((zone) => {
        const key = `${zone.roomAddress}-${zone.roomName}`;
        // Skip empty rooms (reserve channels)
        const isEmpty = !zone.roomAddress?.trim() && !zone.roomName?.trim();
        if (!isEmpty && !rooms.has(key)) {
          rooms.set(key, {
            roomAddress: zone.roomAddress,
            roomName: zone.roomName
          });
        }
      });
    } else if (device.category !== 'central' && 'outputs' in device && device.outputs) {
      device.outputs.forEach((output) => {
        // Skip reserve channels
        const isReserve = (output as any).isReserve === true;
        if (isReserve) {
          return;
        }
        
        const key = `${output.roomAddress}-${output.roomName}`;
        // Skip empty rooms (reserve channels)
        const isEmpty = !output.roomAddress?.trim() && !output.roomName?.trim();
        if (!isEmpty && !rooms.has(key)) {
          rooms.set(key, {
            roomAddress: output.roomAddress,
            roomName: output.roomName
          });
        }
      });
    }
    });

    // Generate HVAC GA's for all zones
    // Use sorted devices to maintain physical address order
    const hvacDevices = sortedDevices.filter(d => d.category === 'hvac');
  
    // Collect all zones from all HVAC devices and assign unique zone numbers
    const allZones: Array<{ zone: { id: string; roomAddress: string; roomName: string; channelName?: string }; zoneNumber: number }> = [];
    let globalZoneCounter = 0;
    
    hvacDevices.forEach((device) => {
      if (device.category === 'hvac') {
        // Sort zones by channel number
        const sortedZones = [...device.zones].sort((a, b) => {
          const channelA = extractChannelNumber(a.channelName || 'K1');
          const channelB = extractChannelNumber(b.channelName || 'K1');
          return channelA - channelB;
        });
        
        sortedZones.forEach((zone) => {
          globalZoneCounter++;
          allZones.push({ zone, zoneNumber: globalZoneCounter });
        });
      }
    });
    
    // Generate group addresses for each zone with all enabled objects
    // For HVAC: each zone gets all enabled objects, sub group increments per zone
    allZones.forEach(({ zone, zoneNumber }) => {
    const cfg = template.devices.hvac;
    const addressingConfig = cfg.addressing;
    const comment = buildComment(template, 'HVAC', zone.channelName, lang);

        // ALTIJD alle HVAC objecten genereren voor deze zone (ook disabled)
        cfg.objects
          .forEach((obj) => {
        const isStatus = isStatusObject(obj.name);
        
        // For HVAC, always use main and middle from template object (obj.main, obj.middle)
        // The sub group should increment per zone, starting from obj.start
        // Zone 1: sub = obj.start, Zone 2: sub = obj.start + 1, etc.
        const baseSub = obj.start + (zoneNumber - 1); // zoneNumber starts at 1
        
        // Handle status objects with offset if needed
        let finalSub = baseSub;
        if (isStatus && addressingConfig) {
          if (addressingConfig.mode === 'mode2') {
            // MODE 2: status = sub + 1
            finalSub = baseSub + 1;
          } else if (addressingConfig.mode === 'mode3') {
            // MODE 3: status = sub + statusOffset
            finalSub = baseSub + (addressingConfig.statusOffset || 100);
          }
        }
        
        // Validate sub doesn't exceed 255
        if (finalSub > 255) {
          console.warn(`HVAC sub group ${finalSub} exceeds maximum of 255. Using 255 instead.`);
          finalSub = 255;
        }
        
        // Build group address: always use obj.main and obj.middle from template
        let groupAddress: string;
        if (template.addressStructure === 'two-level') {
          groupAddress = `${obj.main}/${obj.middle + finalSub - 1}`;
        } else {
          groupAddress = `${obj.main}/${obj.middle}/${finalSub}`;
        }
        
        // For HVAC, include the function name in the GA name (of "---" als disabled)
        const name = obj.enabled ? (() => {
          // Translate roomName to current language
          // First get standard version to ensure correct translation (handles already-translated values)
          const standardZoneRoomName = zone.roomName && zone.roomName.trim()
            ? (getStandardUserInput(zone.roomName, 'roomName') || zone.roomName)
            : zone.roomName;
          const translatedRoomName = standardZoneRoomName && standardZoneRoomName.trim()
            ? translateUserInput(standardZoneRoomName, lang, 'roomName')
            : zone.roomName;
          // Translate "Klimaat" to current language
          const t = getTranslation(lang);
          const climateName = t.hvac || 'Klimaat';
          // Translate object name
          const translatedObjName = translateObjectName(obj.name, lang);
          
          const addressPart = zone.roomAddress && zone.roomAddress.trim() ? `${zone.roomAddress} ` : '';
          const parts = [
            addressPart,
            translatedRoomName,
            climateName,
            translatedObjName // Include function name for HVAC
          ].filter(p => p && p.trim());
          return parts.join(' ').replace(/\s+/g, ' ').trim();
        })() : '---';
        
        rows.push({
          groupAddress,
          name,
          datapointType: obj.dpt,
          comment,
          _sortKey: {
            physicalAddress: [0, 0, 0], // HVAC zones don't have physical addresses
            channelNumber: extractChannelNumber(zone.channelName || 'Z1'),
            objectIndex: obj.main * 10000 + obj.middle * 100 + zoneNumber
          }
        });
      });
    });

    // Generate fixed group addresses (replaces scene and central)
    // These are always added and sorted by main group and middle group
    // Generate fixed group addresses (replaces scene and central)
    // These are always added and sorted by main group and middle group
    const fixedConfig = template.devices.fixed;
    if (fixedConfig) {
      const fixedMainGroups = fixedConfig.mainGroups || [];
    
      // Filter out reserve rooms (empty rooms) for scene/central-like objects
      const nonReserveRooms = Array.from(rooms.values()).filter(room => {
      const isEmpty = !room.roomAddress?.trim() && !room.roomName?.trim();
        return !isEmpty;
      });

      fixedMainGroups.forEach((mainGroup) => {
        // Skip main groups with main=0 that would generate invalid addresses
        if (mainGroup.main === 0) {
          return;
        }
        
        mainGroup.middleGroups.forEach((middleGroup: FixedMiddleGroupTemplate) => {
          // Skip middle groups with middle=0 if main is also 0 (already checked above, but double-check)
          if (mainGroup.main === 0 && middleGroup.middle === 0) {
            return;
          }
          
          // Check if this is a scene, central, or central dimming middle group (by name)
          // Works for any main/middle group numbers as long as names match (in any language)
          // No longer requires main group to be "algemeen" - works with any main group name
          const middleName = middleGroup.name.toLowerCase();
          const isCentraal = matchesNameVariant(middleName, getCentralVariants());
          const isScenes = matchesNameVariant(middleName, getSceneVariants());
          const isCentralDimming = matchesNameVariant(middleName, getCentralDimmingVariants());
          const isCentralBlind = matchesNameVariant(middleName, getCentralBlindVariants());
          
          // Also check by middle number to handle cases where the name has been changed
          // Standard middle groups in main group 1 (Algemeen):
          // middle 0: Scènes
          // middle 1: Centraal schakelen
          // middle 2: Centraal dimmen
          // middle 3: Centraal jalouzie / rolluik
          const isStandardMiddleGroupByNumber = mainGroup.main === 1 && (
            middleGroup.middle === 0 || // Scènes
            middleGroup.middle === 1 || // Centraal schakelen
            middleGroup.middle === 2 || // Centraal dimmen
            middleGroup.middle === 3    // Centraal jalouzie / rolluik
          );
          
          // Determine the type based on name match OR middle number
          let detectedType: 'scenes' | 'centralSwitching' | 'centralDimming' | 'centralBlind' | null = null;
          if (isScenes || (isStandardMiddleGroupByNumber && middleGroup.middle === 0)) {
            detectedType = 'scenes';
          } else if (isCentraal || (isStandardMiddleGroupByNumber && middleGroup.middle === 1)) {
            detectedType = 'centralSwitching';
          } else if (isCentralDimming || (isStandardMiddleGroupByNumber && middleGroup.middle === 2)) {
            detectedType = 'centralDimming';
          } else if (isCentralBlind || (isStandardMiddleGroupByNumber && middleGroup.middle === 3)) {
            detectedType = 'centralBlind';
          }
          
          const isSceneOrCentral = detectedType !== null;
          
          // Check if auto-generate is enabled globally
          const autoGenerateEnabled = template.teachByExampleConfig?.autoGenerateRoomAddresses ?? false;
          
          // Check if this specific middle group has auto-generation enabled
          let isThisMiddleGroupEnabled = false;
          if (detectedType === 'scenes') {
            isThisMiddleGroupEnabled = template.teachByExampleConfig?.autoGenerateMiddleGroups?.scenes ?? true;
          } else if (detectedType === 'centralSwitching') {
            isThisMiddleGroupEnabled = template.teachByExampleConfig?.autoGenerateMiddleGroups?.centralSwitching ?? true;
          } else if (detectedType === 'centralDimming') {
            isThisMiddleGroupEnabled = template.teachByExampleConfig?.autoGenerateMiddleGroups?.centralDimming ?? true;
          } else if (detectedType === 'centralBlind') {
            isThisMiddleGroupEnabled = template.teachByExampleConfig?.autoGenerateMiddleGroups?.centralBlind ?? true;
          }
          
          if (isSceneOrCentral && autoGenerateEnabled && isThisMiddleGroupEnabled) {
            // First, add the sub 0 address (alles uit, welkom, or ---) if it exists
            const sub0 = middleGroup.subs.find(sub => {
              if (sub.sub !== 0) return false;
              // Check if it's a default object by name (in any language)
              const subNameLower = sub.name.toLowerCase().trim();
              const isDefaultObject = (detectedType === 'centralSwitching' && matchesNameVariant(subNameLower, getAllOffVariants())) || 
                                      (detectedType === 'scenes' && matchesNameVariant(subNameLower, getWelcomeVariants())) ||
                                      (detectedType === 'centralDimming' && (subNameLower === '---' || subNameLower === '—' || subNameLower === '–')) ||
                                      (detectedType === 'centralBlind' && (subNameLower === '---' || subNameLower === '—' || subNameLower === '–'));
              return isDefaultObject;
            });
            if (sub0) {
              const groupAddress0 = buildAddress(
                { main: mainGroup.main, middle: middleGroup.middle, start: 0, dpt: sub0.dpt },
                0,
                template.addressStructure
              );
              
              // Skip invalid addresses (0/0/0 or similar)
              if (groupAddress0 !== '0/0/0' && groupAddress0 !== '0/0') {
                // Translate the name if it's a standard name (alles uit, welkom)
                const translatedName = translateFixedAddressName(sub0.name, lang);
                // Ensure name starts with lowercase letter for GA overview
                const nameWithLowercase = translatedName.charAt(0).toLowerCase() + translatedName.slice(1);
                rows.push({
                  groupAddress: groupAddress0,
                  name: nameWithLowercase, // Use translated sub name (e.g., "alles uit" or "welkom")
                  datapointType: sub0.dpt,
                  comment: '', // Comment blijft leeg voor fixed addresses
                  _sortKey: {
                    physicalAddress: [0, 0, 0], // Fixed addresses come first
                    channelNumber: 0,
                    objectIndex: mainGroup.main * 10000 + middleGroup.middle * 100 + 0 // Sort by main, then middle, then sub
                  }
                });
              }
            }
            
            // Auto-generate addresses for unique rooms, starting from sub 1, up to sub 99
            // Sub 100-255 remain available for manual input
            // Collect unique room addresses (based on roomAddress only, not roomName)
            const uniqueRoomAddresses = new Map<string, { roomAddress: string; roomName: string }>();
            nonReserveRooms.forEach((room) => {
              const roomAddr = room.roomAddress?.trim() || '';
              if (roomAddr && !uniqueRoomAddresses.has(roomAddr)) {
                uniqueRoomAddresses.set(roomAddr, room);
              }
            });
            
            // Sort unique room addresses numerically (supports negative numbers)
            const sortedUniqueRooms = sortRoomAddresses(Array.from(uniqueRoomAddresses.values()));
            
            // Generate addresses for each unique room address, starting from sub 1, up to sub 99
            let subCounter = 1;
            sortedUniqueRooms.forEach((room) => {
              // Only generate up to sub 99, sub 100-255 are reserved for manual input
              if (subCounter > 99) {
                console.warn(`[generateGroupAddresses] Maximum of 99 auto-generated addresses reached for ${middleGroup.name}. Remaining rooms will not be auto-generated.`);
                return;
              }
              
              const groupAddress = buildAddress(
                { main: mainGroup.main, middle: middleGroup.middle, start: subCounter, dpt: middleGroup.subs[0]?.dpt || 'DPT1.001' },
                0,
                template.addressStructure
              );
              
              // Skip invalid addresses (0/0/0 or similar)
              if (groupAddress === '0/0/0' || groupAddress === '0/0') {
                return;
              }
              
              // Build name: roomAddress + roomName (e.g., "0.1 entree")
              // Respect showRoomAddress option from nameOptions
              let roomName = '';
              if (nameOptions?.showRoomAddress !== false && room.roomAddress) {
                // Include roomAddress if showRoomAddress is enabled (default true)
                roomName = room.roomName 
                  ? `${room.roomAddress} ${room.roomName}`.trim()
                  : room.roomAddress;
              } else {
                // Only include roomName if showRoomAddress is disabled
                roomName = room.roomName || '';
              }
              
              rows.push({
                groupAddress,
                name: roomName.toLowerCase(),
                datapointType: middleGroup.subs[0]?.dpt || 'DPT1.001',
                comment: '', // Comment blijft leeg voor fixed addresses
                _sortKey: {
                  physicalAddress: [0, 0, 0], // Fixed addresses come first
                  channelNumber: 0,
                  objectIndex: mainGroup.main * 10000 + middleGroup.middle * 100 + subCounter // Sort by main, then middle, then sub
                }
              });
              
              subCounter++;
            });
            
            // Also show manually created fixed addresses with sub 100-255 (these remain available for manual input)
            const manualSubs = middleGroup.subs.filter(sub => sub.enabled && sub.sub >= 100 && sub.sub <= 255);
            manualSubs.forEach((sub) => {
              const groupAddress = buildAddress(
                { main: mainGroup.main, middle: middleGroup.middle, start: sub.sub, dpt: sub.dpt },
                0,
                template.addressStructure
              );
              
              // Skip invalid addresses (0/0/0 or similar)
              if (groupAddress === '0/0/0' || groupAddress === '0/0') {
                return;
              }
              
              // Translate the name if it's a standard name
              const translatedName = translateFixedAddressName(sub.name, lang);
              // Ensure name starts with lowercase letter for GA overview
              const nameWithLowercase = translatedName.charAt(0).toLowerCase() + translatedName.slice(1);
              rows.push({
                groupAddress,
                name: nameWithLowercase,
                datapointType: sub.dpt,
                comment: '',
                _sortKey: {
                  physicalAddress: [0, 0, 0],
                  channelNumber: 0,
                  objectIndex: mainGroup.main * 10000 + middleGroup.middle * 100 + sub.sub
                }
              });
            });
          } else {
            // Normal fixed addresses (not auto-generated)
            // When autoGenerateRoomAddresses is false, always show the manually created fixed addresses (subs)
            // regardless of whether there are rooms or not
            const enabledSubs = middleGroup.subs.filter(sub => sub.enabled);
            
            enabledSubs.forEach((sub) => {
              // Always show the fixed address with the sub name from template
              // This ensures manually created fixed addresses are always visible in the GA overview
              const groupAddress = buildAddress(
                { main: mainGroup.main, middle: middleGroup.middle, start: sub.sub, dpt: sub.dpt },
                0,
                template.addressStructure
              );
              
              // Skip invalid addresses (0/0/0 or similar)
              if (groupAddress === '0/0/0' || groupAddress === '0/0') {
                return;
              }
              
              // Translate the name if it's a standard name (alles uit, welkom)
              const translatedName = translateFixedAddressName(sub.name, lang);
              // Ensure name starts with lowercase letter for GA overview
              const nameWithLowercase = translatedName.charAt(0).toLowerCase() + translatedName.slice(1);
              rows.push({
                groupAddress,
                name: nameWithLowercase, // Use translated sub name
                datapointType: sub.dpt,
                comment: '', // Comment blijft leeg voor fixed addresses
                _sortKey: {
                  physicalAddress: [0, 0, 0], // Fixed addresses come first
                  channelNumber: 0,
                  objectIndex: mainGroup.main * 10000 + middleGroup.middle * 100 + sub.sub // Sort by main, then middle, then sub
                }
              });
            });
          }
        });
      });
    }
  }
  
  // Generate fixed addresses (centraal and scène's) with auto-generate if enabled
  // This applies to both old and Teach by Example configs
  // Only generate if using Teach by Example (old method already handles fixed addresses)
  if (template.teachByExampleConfig) {
    const fixedConfigForAutoGen = template.devices.fixed;
    if (fixedConfigForAutoGen) {
      // Collect all unique rooms from devices (excluding reserve channels) for auto-generate
      const roomsForAutoGen = new Map<string, { roomAddress: string; roomName: string }>();
      
      devices.forEach((device) => {
        if (device.category === 'hvac') {
          device.zones.forEach((zone) => {
            const key = `${zone.roomAddress}-${zone.roomName}`;
            const isEmpty = !zone.roomAddress?.trim() && !zone.roomName?.trim();
            if (!isEmpty && !roomsForAutoGen.has(key)) {
              roomsForAutoGen.set(key, {
                roomAddress: zone.roomAddress,
                roomName: zone.roomName
              });
            }
          });
        } else if (device.category !== 'central' && 'outputs' in device && device.outputs) {
          device.outputs.forEach((output) => {
            const isReserve = (output as any).isReserve === true;
            if (isReserve) return;
            
            const key = `${output.roomAddress}-${output.roomName}`;
            const isEmpty = !output.roomAddress?.trim() && !output.roomName?.trim();
            if (!isEmpty && !roomsForAutoGen.has(key)) {
              roomsForAutoGen.set(key, {
                roomAddress: output.roomAddress,
                roomName: output.roomName
              });
            }
          });
        }
      });
      
      const fixedMainGroupsForAutoGen = fixedConfigForAutoGen.mainGroups || [];
      const nonReserveRoomsForAutoGen = Array.from(roomsForAutoGen.values()).filter(room => {
        const isEmpty = !room.roomAddress?.trim() && !room.roomName?.trim();
        return !isEmpty;
      });
      
      fixedMainGroupsForAutoGen.forEach((mainGroup) => {
        if (mainGroup.main === 0) return;
        
        mainGroup.middleGroups.forEach((middleGroup: FixedMiddleGroupTemplate) => {
          if (mainGroup.main === 0 && middleGroup.middle === 0) return;
          
          // Check if this is a scene, central, or central dimming middle group (by name)
          // Works for any main/middle group numbers as long as names match (in any language)
          // No longer requires main group to be "algemeen" - works with any main group name
          const middleName = middleGroup.name.toLowerCase();
          const isCentraal = matchesNameVariant(middleName, getCentralVariants());
          const isScenes = matchesNameVariant(middleName, getSceneVariants());
          const isCentralDimming = matchesNameVariant(middleName, getCentralDimmingVariants());
          const isCentralBlind = matchesNameVariant(middleName, getCentralBlindVariants());
          
          // Also check by middle number to handle cases where the name has been changed
          // Standard middle groups in main group 1 (Algemeen):
          // middle 0: Scènes
          // middle 1: Centraal schakelen
          // middle 2: Centraal dimmen
          // middle 3: Centraal jalouzie / rolluik
          const isStandardMiddleGroupByNumber = mainGroup.main === 1 && (
            middleGroup.middle === 0 || // Scènes
            middleGroup.middle === 1 || // Centraal schakelen
            middleGroup.middle === 2 || // Centraal dimmen
            middleGroup.middle === 3    // Centraal jalouzie / rolluik
          );
          
          // Determine the type based on name match OR middle number
          let detectedType: 'scenes' | 'centralSwitching' | 'centralDimming' | 'centralBlind' | null = null;
          if (isScenes || (isStandardMiddleGroupByNumber && middleGroup.middle === 0)) {
            detectedType = 'scenes';
          } else if (isCentraal || (isStandardMiddleGroupByNumber && middleGroup.middle === 1)) {
            detectedType = 'centralSwitching';
          } else if (isCentralDimming || (isStandardMiddleGroupByNumber && middleGroup.middle === 2)) {
            detectedType = 'centralDimming';
          } else if (isCentralBlind || (isStandardMiddleGroupByNumber && middleGroup.middle === 3)) {
            detectedType = 'centralBlind';
          }
          
          const isSceneOrCentral = detectedType !== null;
          
          const autoGenerateEnabled = template.teachByExampleConfig?.autoGenerateRoomAddresses ?? false;
          
          // Check if this specific middle group has auto-generation enabled
          let isThisMiddleGroupEnabled = false;
          if (detectedType === 'scenes') {
            isThisMiddleGroupEnabled = template.teachByExampleConfig?.autoGenerateMiddleGroups?.scenes ?? true;
          } else if (detectedType === 'centralSwitching') {
            isThisMiddleGroupEnabled = template.teachByExampleConfig?.autoGenerateMiddleGroups?.centralSwitching ?? true;
          } else if (detectedType === 'centralDimming') {
            isThisMiddleGroupEnabled = template.teachByExampleConfig?.autoGenerateMiddleGroups?.centralDimming ?? true;
          } else if (detectedType === 'centralBlind') {
            isThisMiddleGroupEnabled = template.teachByExampleConfig?.autoGenerateMiddleGroups?.centralBlind ?? true;
          }
          
          if (isSceneOrCentral && autoGenerateEnabled && isThisMiddleGroupEnabled) {
            // First, add the sub 0 address (alles uit, welkom, or ---) if it exists
            const sub0 = middleGroup.subs.find(sub => {
              if (sub.sub !== 0) return false;
              const subNameLower = sub.name.toLowerCase().trim();
              const isDefaultObject = (detectedType === 'centralSwitching' && matchesNameVariant(subNameLower, getAllOffVariants())) || 
                                      (detectedType === 'scenes' && matchesNameVariant(subNameLower, getWelcomeVariants())) ||
                                      (detectedType === 'centralDimming' && (subNameLower === '---' || subNameLower === '—' || subNameLower === '–')) ||
                                      (detectedType === 'centralBlind' && (subNameLower === '---' || subNameLower === '—' || subNameLower === '–'));
              return isDefaultObject;
            });
            if (sub0) {
              const groupAddress0 = buildAddress(
                { main: mainGroup.main, middle: middleGroup.middle, start: 0, dpt: sub0.dpt },
                0,
                template.addressStructure
              );
              
              if (groupAddress0 !== '0/0/0' && groupAddress0 !== '0/0') {
                const translatedName = translateFixedAddressName(sub0.name, lang);
                // Ensure name starts with lowercase letter for GA overview
                const nameWithLowercase = translatedName.charAt(0).toLowerCase() + translatedName.slice(1);
                rows.push({
                  groupAddress: groupAddress0,
                  name: nameWithLowercase,
                  datapointType: sub0.dpt,
                  comment: '',
                  _sortKey: {
                    physicalAddress: [0, 0, 0],
                    channelNumber: 0,
                    objectIndex: mainGroup.main * 10000 + middleGroup.middle * 100 + 0
                  }
                });
              }
            }
            
            // Auto-generate addresses for unique rooms, starting from sub 1, up to sub 99
            // Sub 100-255 remain available for manual input
            const uniqueRoomAddresses = new Map<string, { roomAddress: string; roomName: string }>();
            nonReserveRoomsForAutoGen.forEach((room) => {
              const roomAddr = room.roomAddress?.trim() || '';
              if (roomAddr && !uniqueRoomAddresses.has(roomAddr)) {
                uniqueRoomAddresses.set(roomAddr, room);
              }
            });
            
            // Sort unique room addresses numerically (supports negative numbers)
            const sortedUniqueRooms = sortRoomAddresses(Array.from(uniqueRoomAddresses.values()));
            
            let subCounter = 1;
            sortedUniqueRooms.forEach((room) => {
              // Only generate up to sub 99, sub 100-255 are reserved for manual input
              if (subCounter > 99) {
                console.warn(`[generateGroupAddresses] Maximum of 99 auto-generated addresses reached for ${middleGroup.name}. Remaining rooms will not be auto-generated.`);
                return;
              }
              
              const groupAddress = buildAddress(
                { main: mainGroup.main, middle: middleGroup.middle, start: subCounter, dpt: middleGroup.subs[0]?.dpt || 'DPT1.001' },
                0,
                template.addressStructure
              );
              
              if (groupAddress !== '0/0/0' && groupAddress !== '0/0') {
                // Build name: roomAddress + roomName (e.g., "0.1 entree")
                // Respect showRoomAddress option from nameOptions
                let roomName = '';
                if (nameOptions?.showRoomAddress !== false && room.roomAddress) {
                  // Include roomAddress if showRoomAddress is enabled (default true)
                  roomName = room.roomName 
                    ? `${room.roomAddress} ${room.roomName}`.trim()
                    : room.roomAddress;
                } else {
                  // Only include roomName if showRoomAddress is disabled
                  roomName = room.roomName || '';
                }
                
                rows.push({
                  groupAddress,
                  name: roomName.toLowerCase(),
                  datapointType: middleGroup.subs[0]?.dpt || 'DPT1.001',
                  comment: '',
                  _sortKey: {
                    physicalAddress: [0, 0, 0],
                    channelNumber: 0,
                    objectIndex: mainGroup.main * 10000 + middleGroup.middle * 100 + subCounter
                  }
                });
              }
              
              subCounter++;
            });
            
            // Also show manually created fixed addresses with sub 100-255 (these remain available for manual input)
            const manualSubs = middleGroup.subs.filter(sub => sub.enabled && sub.sub >= 100 && sub.sub <= 255);
            manualSubs.forEach((sub) => {
              const groupAddress = buildAddress(
                { main: mainGroup.main, middle: middleGroup.middle, start: sub.sub, dpt: sub.dpt },
                0,
                template.addressStructure
              );
              
              if (groupAddress !== '0/0/0' && groupAddress !== '0/0') {
                const translatedName = translateFixedAddressName(sub.name, lang);
                // Ensure name starts with lowercase letter for GA overview
                const nameWithLowercase = translatedName.charAt(0).toLowerCase() + translatedName.slice(1);
                rows.push({
                  groupAddress,
                  name: nameWithLowercase,
                  datapointType: sub.dpt,
                  comment: '',
                  _sortKey: {
                    physicalAddress: [0, 0, 0],
                    channelNumber: 0,
                    objectIndex: mainGroup.main * 10000 + middleGroup.middle * 100 + sub.sub
                  }
                });
              }
            });
          } else if (isSceneOrCentral && (!autoGenerateEnabled || (autoGenerateEnabled && !isThisMiddleGroupEnabled))) {
            // When autoGenerateEnabled is false, OR when autoGenerateEnabled is true but this specific middle group is disabled,
            // show manually created fixed addresses (subs) that are enabled
            // This ensures manually created fixed addresses are always visible in the GA overview
            const enabledSubs = middleGroup.subs.filter(sub => sub.enabled);
            
            enabledSubs.forEach((sub) => {
              const groupAddress = buildAddress(
                { main: mainGroup.main, middle: middleGroup.middle, start: sub.sub, dpt: sub.dpt },
                0,
                template.addressStructure
              );
              
              // Skip invalid addresses (0/0/0 or similar)
              if (groupAddress === '0/0/0' || groupAddress === '0/0') {
                return;
              }
              
              // Translate the name if it's a standard name (alles uit, welkom)
              const translatedName = translateFixedAddressName(sub.name, lang);
              // Ensure name starts with lowercase letter for GA overview
              const nameWithLowercase = translatedName.charAt(0).toLowerCase() + translatedName.slice(1);
              rows.push({
                groupAddress,
                name: nameWithLowercase, // Use translated sub name
                datapointType: sub.dpt,
                comment: '', // Comment blijft leeg voor fixed addresses
                _sortKey: {
                  physicalAddress: [0, 0, 0], // Fixed addresses come first
                  channelNumber: 0,
                  objectIndex: mainGroup.main * 10000 + middleGroup.middle * 100 + sub.sub // Sort by main, then middle, then sub
                }
              });
            });
          } else if (!isSceneOrCentral) {
            // For middle groups that are NOT scene/central (regular fixed addresses)
            // Always show all enabled subs regardless of auto-generate settings
            const enabledSubs = middleGroup.subs.filter(sub => sub.enabled);
            
            enabledSubs.forEach((sub) => {
              const groupAddress = buildAddress(
                { main: mainGroup.main, middle: middleGroup.middle, start: sub.sub, dpt: sub.dpt },
                0,
                template.addressStructure
              );
              
              // Skip invalid addresses (0/0/0 or similar)
              if (groupAddress === '0/0/0' || groupAddress === '0/0') {
                return;
              }
              
              // Translate the name if it's a standard name
              const translatedName = translateFixedAddressName(sub.name, lang);
              // Ensure name starts with lowercase letter for GA overview
              const nameWithLowercase = translatedName.charAt(0).toLowerCase() + translatedName.slice(1);
              rows.push({
                groupAddress,
                name: nameWithLowercase,
                datapointType: sub.dpt,
                comment: '',
                _sortKey: {
                  physicalAddress: [0, 0, 0],
                  channelNumber: 0,
                  objectIndex: mainGroup.main * 10000 + middleGroup.middle * 100 + sub.sub
                }
              });
            });
          }
        });
      });
    }
  }

  // Filter out any remaining 0/0/0 addresses before sorting
  const filteredRows = rows.filter(row => {
    return row.groupAddress !== '0/0/0' && row.groupAddress !== '0/0';
  });
  
  // Sort rows: first by physical address (fixed addresses [0,0,0] come first), then by group address, then by channel
  return filteredRows.sort((a, b) => {
    // Parse group addresses for comparison
    const parseGA = (ga: string) => {
      const parts = ga.split('/').map(Number);
      return {
        main: parts[0] || 0,
        middle: parts[1] || 0,
        sub: parts[2] || 0
      };
    };
    
    // First sort by physical address (fixed addresses [0,0,0] come first)
    if (a._sortKey && b._sortKey) {
      const addrA = a._sortKey.physicalAddress;
      const addrB = b._sortKey.physicalAddress;
      
      for (let i = 0; i < Math.max(addrA.length, addrB.length); i++) {
        const partA = addrA[i] ?? 0;
        const partB = addrB[i] ?? 0;
        if (partA !== partB) {
          return partA - partB;
        }
      }
    }
    
    // Then sort by group address (main/middle/sub)
    const gaA = parseGA(a.groupAddress);
    const gaB = parseGA(b.groupAddress);
    
    if (gaA.main !== gaB.main) {
      return gaA.main - gaB.main;
    }
    
    if (gaA.middle !== gaB.middle) {
      return gaA.middle - gaB.middle;
    }
    
    if (gaA.sub !== gaB.sub) {
      return gaA.sub - gaB.sub;
    }
    
    // Then sort by channel number
    if (a._sortKey && b._sortKey) {
      if (a._sortKey.channelNumber !== b._sortKey.channelNumber) {
        return a._sortKey.channelNumber - b._sortKey.channelNumber;
      }
      
      // Finally sort by object index
      return a._sortKey.objectIndex - b._sortKey.objectIndex;
    }
    
    // Fallback: keep original order
    return 0;
  });
};

// Convert flat GroupAddressRow[] to hierarchical structure (ETS 5/6 style)
export const convertToHierarchicalOverview = (
  rows: GroupAddressRow[],
  template: TemplateConfig,
  lang: Language = 'nl',
  devices?: AnyDevice[] // Optional devices for HVAC zone name lookup
): HierarchicalGroupAddressOverview => {
  // Parse group address to extract main, middle, sub
  const parseGroupAddress = (ga: string): { main: number; middle: number; sub: number } => {
    const parts = ga.split('/').map(Number);
    return {
      main: parts[0] || 0,
      middle: parts[1] || 0,
      sub: parts[2] || 0
    };
  };

  // Check if an address is a status address (sub is 100+ more than another address with same main/middle)
  const isStatusAddress = (ga: string, allAddresses: string[]): boolean => {
    const parsed = parseGroupAddress(ga);
    if (parsed.sub < 100) return false;
    
    // Check if there's a corresponding non-status address (sub - 100)
    const nonStatusSub = parsed.sub - 100;
    const nonStatusGA = `${parsed.main}/${parsed.middle}/${nonStatusSub}`;
    return allAddresses.includes(nonStatusGA);
  };

  // Get main group name from template
  // When there are multiple groups with the same main group, we need to check which middle groups are present
  const getMainGroupName = (main: number, middleGroupsInMain?: number[]): string => {
    const t = getTranslation(lang);
    
    // Check fixed addresses first
    if (template.devices.fixed?.mainGroups) {
      const fixedMainGroup = template.devices.fixed.mainGroups.find(mg => mg.main === main);
      if (fixedMainGroup) {
        // Fix encoding issues before translating
        const fixedName = fixEncoding(fixedMainGroup.name);
        return translateFixedAddressName(fixedName, lang);
      }
    }
    
    // Check teach by example config for category names
    if (template.teachByExampleConfig) {
      const categories = template.teachByExampleConfig.categories;
      
      // Check switching – use groupName when present, else category
      if (categories.switching) {
        const switchingGroups = Array.isArray(categories.switching) ? categories.switching : [categories.switching];
        for (const switchGroup of switchingGroups) {
          if (switchGroup.exampleAddresses && switchGroup.exampleAddresses.length > 0) {
            const firstAddress = switchGroup.exampleAddresses[0];
            if (firstAddress.main === main) {
              const raw = (switchGroup.groupName || '').trim();
              return raw ? translateGroupNameForDisplay(raw, lang) : t.switch;
            }
          }
        }
      }
      
      // Check dimming – use groupName when present, else category (or "dimmen / schakelen" when linked)
      // When there are multiple dim groups with the same main group, find the one that matches the middle groups
      if (categories.dimming) {
        const dimmingGroups = Array.isArray(categories.dimming) ? categories.dimming : [categories.dimming];
        
        // If we have middle groups info, try to find the dim group that matches
        if (middleGroupsInMain && middleGroupsInMain.length > 0) {
          // Find dim group that has example addresses matching the middle groups in this main group
          // Check all middle groups to find the best match
          let bestMatch: { dimGroup: any; matchCount: number } | null = null;
          
          for (const dimGroup of dimmingGroups) {
            if (dimGroup.exampleAddresses && dimGroup.exampleAddresses.length > 0) {
              const firstAddress = dimGroup.exampleAddresses[0];
              if (firstAddress.main === main) {
                // Check how many middle groups from this dim group match the middle groups in the main group
                const dimGroupMiddleGroups = new Set(dimGroup.exampleAddresses.map(addr => addr.middle));
                const matchCount = middleGroupsInMain.filter(m => dimGroupMiddleGroups.has(m)).length;
                
                // Use the dim group with the most matching middle groups
                if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.matchCount)) {
                  bestMatch = { dimGroup, matchCount };
                }
              }
            }
          }
          
          if (bestMatch) {
            const dimGroup = bestMatch.dimGroup;
            if (dimGroup.linkedToSwitching && categories.switching) {
              const switchingGroups = Array.isArray(categories.switching) ? categories.switching : [categories.switching];
              for (const switchGroup of switchingGroups) {
                if (switchGroup.exampleAddresses && switchGroup.exampleAddresses.length > 0) {
                  const switchFirstAddress = switchGroup.exampleAddresses[0];
                  if (switchFirstAddress.main === main) {
                    const raw = (dimGroup.groupName || '').trim();
                    return raw ? translateGroupNameForDisplay(raw, lang) : `${t.dimmer} / ${t.switch}`;
                  }
                }
              }
            }
            const raw = (dimGroup.groupName || '').trim();
            return raw ? translateGroupNameForDisplay(raw, lang) : t.dimmer;
          }
        }
        
        // Fallback: use first dim group that matches main (original behavior)
        for (const dimGroup of dimmingGroups) {
          if (dimGroup.exampleAddresses && dimGroup.exampleAddresses.length > 0) {
            const firstAddress = dimGroup.exampleAddresses[0];
            if (firstAddress.main === main) {
              if (dimGroup.linkedToSwitching && categories.switching) {
                const switchingGroups = Array.isArray(categories.switching) ? categories.switching : [categories.switching];
                for (const switchGroup of switchingGroups) {
                  if (switchGroup.exampleAddresses && switchGroup.exampleAddresses.length > 0) {
                    const switchFirstAddress = switchGroup.exampleAddresses[0];
                    if (switchFirstAddress.main === main) {
                      const raw = (dimGroup.groupName || '').trim();
                      return raw ? translateGroupNameForDisplay(raw, lang) : `${t.dimmer} / ${t.switch}`;
                    }
                  }
                }
              }
              const raw = (dimGroup.groupName || '').trim();
              return raw ? translateGroupNameForDisplay(raw, lang) : t.dimmer;
            }
          }
        }
      }
      
      // Check shading – use groupName when present, else category
      if (categories.shading) {
        const shadingGroups = Array.isArray(categories.shading) ? categories.shading : [categories.shading];
        for (const shadeGroup of shadingGroups) {
          if (shadeGroup.exampleAddresses && shadeGroup.exampleAddresses.length > 0) {
            const firstAddress = shadeGroup.exampleAddresses[0];
            if (firstAddress.main === main) {
              const raw = (shadeGroup.groupName || '').trim();
              return raw ? translateGroupNameForDisplay(raw, lang) : t.blind;
            }
          }
        }
      }
      
      // Check hvac – use groupName when present, else category
      if (categories.hvac) {
        const hvacGroups = Array.isArray(categories.hvac) ? categories.hvac : [categories.hvac];
        for (const hvacGroup of hvacGroups) {
          if (hvacGroup.exampleAddresses && hvacGroup.exampleAddresses.length > 0) {
            const firstAddress = hvacGroup.exampleAddresses[0];
            if (firstAddress.main === main) {
              const raw = (hvacGroup.groupName || '').trim();
              return raw ? translateGroupNameForDisplay(raw, lang) : t.hvac;
            }
          }
        }
      }
    }
    
    // Check device objects (old template structure)
    if (template.devices.switch.objects.length > 0) {
      const switchMain = template.devices.switch.objects[0]?.main;
      if (switchMain === main) {
        return t.switch;
      }
    }
    if (template.devices.dimmer) {
      const dimmerConfigs = Array.isArray(template.devices.dimmer) ? template.devices.dimmer : [template.devices.dimmer];
      for (const dimmerConfig of dimmerConfigs) {
        if (dimmerConfig.objects.length > 0) {
          const dimmerMain = dimmerConfig.objects[0]?.main;
          if (dimmerMain === main) {
            return t.dimmer;
          }
        }
      }
    }
    if (template.devices.blind.objects.length > 0) {
      const blindMain = template.devices.blind.objects[0]?.main;
      if (blindMain === main) {
        return t.blind;
      }
    }
    if (template.devices.hvac.objects.length > 0) {
      const hvacMain = template.devices.hvac.objects[0]?.main;
      if (hvacMain === main) {
        return t.hvac;
      }
    }
    
    // Default: return main group number as name
    return `Hoofdgroep ${main}`;
  };

  // Helper function to build zone name from zone data
  const buildZoneNameFromZone = (zone: { roomAddress?: string; roomName?: string }): string => {
    // Translate roomName to current language
    // First get standard version to ensure correct translation (handles already-translated values)
    const standardZoneRoomName = zone.roomName && zone.roomName.trim()
      ? (getStandardUserInput(zone.roomName, 'roomName') || zone.roomName)
      : zone.roomName;
    const translatedRoomName = standardZoneRoomName && standardZoneRoomName.trim()
      ? translateUserInput(standardZoneRoomName, lang, 'roomName')
      : zone.roomName;
    const addressPart = zone.roomAddress && zone.roomAddress.trim() ? `${zone.roomAddress} ` : '';
    const roomPart = translatedRoomName && translatedRoomName.trim() ? translatedRoomName : '';
    return `${addressPart}${roomPart}`.trim();
  };

  // Get middle group name from template (same logic as CSV export, but also support teach by example and HVAC zones)
  const getMiddleGroupName = (main: number, middle: number, addressRows: GroupAddressRow[]): string => {
    // Check fixed addresses first
    if (template.devices.fixed?.mainGroups) {
      const fixedMainGroup = template.devices.fixed.mainGroups.find(mg => mg.main === main);
      if (fixedMainGroup) {
        const fixedMiddleGroup = fixedMainGroup.middleGroups.find(mg => mg.middle === middle);
        if (fixedMiddleGroup) {
          // Fix encoding issues before translating
          const fixedName = fixEncoding(fixedMiddleGroup.name);
          return translateFixedAddressName(fixedName, lang);
        }
      }
    }
    
    // For HVAC: determine middle group name based on template analysis
    if (template.teachByExampleConfig?.categories.hvac) {
      const hvacGroups = Array.isArray(template.teachByExampleConfig.categories.hvac) 
        ? template.teachByExampleConfig.categories.hvac 
        : [template.teachByExampleConfig.categories.hvac];
      
      for (const hvacGroup of hvacGroups) {
        if (hvacGroup.exampleAddresses && hvacGroup.exampleAddresses.length > 0) {
          const firstAddress = hvacGroup.exampleAddresses[0];
          const pattern = hvacGroup.pattern;
          // Check if this main group matches the base main or any extra main groups
          const baseMain = pattern?.fixedMain ?? firstAddress.main;
          const matchesBaseMain = baseMain === main;
          const matchesExtraMain = pattern?.extraMainGroups?.some(eg => eg.main === main) ?? false;
          if (matchesBaseMain || matchesExtraMain) {
            // Check middleIncrement to determine HVAC structure
            const middleIncrement = firstAddress.middleIncrement ?? 0;
            const isZonePerMiddleGroup = middleIncrement === 1;
            const startMiddle = firstAddress.middle;
            
            if (isZonePerMiddleGroup && devices) {
              // Mode 1: Middle groups are zones - get zone name from devices
              // We need to replicate the zone ordering logic from patternGenerator.ts
              // Collect all HVAC zones from devices, sorted by channel number, deduplicated by roomAddress
              const allHvacZones: Array<{ roomAddress?: string; roomName?: string; channelName?: string }> = [];
              const seenRoomAddresses = new Set<string>(); // Track seen zones by roomAddress only
              const hvacDevices = devices.filter(d => d.category === 'hvac' && 'zones' in d);
              hvacDevices.forEach((device: any) => {
                if (device.zones) {
                  const sortedZones = [...device.zones].sort((a: any, b: any) => {
                    const channelA = extractChannelNumber(a.channelName || 'K1');
                    const channelB = extractChannelNumber(b.channelName || 'K1');
                    return channelA - channelB;
                  });
                  sortedZones.forEach((zone: any) => {
                    // Deduplicate by roomAddress only (not roomName, because roomName can be translated)
                    const roomAddress = zone.roomAddress || '';
                    if (!seenRoomAddresses.has(roomAddress)) {
                      seenRoomAddresses.add(roomAddress);
                      allHvacZones.push(zone);
                    }
                  });
                }
              });
              
              // Calculate which zone index this middle group corresponds to
              // In patternGenerator.ts: zoneCounter increments per zone, middle = (startMiddle + zoneCounter) % 8
              // So: zoneIndex = (middle - startMiddle + 8) % 8 (but only for first main group)
              // We need to handle extra main groups too - for now, just use simple calculation for first main group
              const pattern = hvacGroup.pattern;
              if (pattern) {
                const totalMiddleGroups = 8; // 0-7
                const baseMain = pattern.fixedMain;
                
                // Check if this is in the first main group
                if (main === baseMain) {
                  const middleOffset = (middle - startMiddle + totalMiddleGroups) % totalMiddleGroups;
                  if (middleOffset < allHvacZones.length) {
                    const zone = allHvacZones[middleOffset];
                    const zoneName = buildZoneNameFromZone(zone);
                    if (zoneName) {
                      return zoneName;
                    }
                  }
                } else if (pattern.extraMainGroups) {
                  // Check if this is in an extra main group
                  // Reverse the logic from getZoneMainAndMiddle:
                  // In patternGenerator: middle = (extraGroup.middle + remainingZones) % totalMiddleGroups
                  // where remainingZones = counter - (extraGroupIndex * totalMiddleGroups) - (totalMiddleGroups - startMiddle)
                  // So: remainingZones = (middle - extraGroup.middle + totalMiddleGroups) % totalMiddleGroups
                  // But we need to find which extraGroupIndex this corresponds to
                  for (let extraIndex = 0; extraIndex < pattern.extraMainGroups.length; extraIndex++) {
                    const extraGroup = pattern.extraMainGroups[extraIndex];
                    if (main === extraGroup.main) {
                      // Calculate remainingZones from middle
                      const remainingZones = (middle - extraGroup.middle + totalMiddleGroups) % totalMiddleGroups;
                      // Calculate counter from extraGroupIndex and remainingZones
                      const counter = (extraIndex * totalMiddleGroups) + (totalMiddleGroups - startMiddle) + remainingZones;
                      
                      if (counter < allHvacZones.length) {
                        const zone = allHvacZones[counter];
                        const zoneName = buildZoneNameFromZone(zone);
                        if (zoneName) {
                          return zoneName;
                        }
                      }
                      break;
                    }
                  }
                }
              }
              
              // Fall back to object name if no zone name found
              const matchingExample = hvacGroup.exampleAddresses.find(addr => addr.middle === middle);
              if (matchingExample) {
                const capitalized = matchingExample.objectName
                  .split(/\s+/)
                  .map(word => {
                    if (word.includes('/')) {
                      return word.split('/').map(part => 
                        part.charAt(0).toUpperCase() + part.slice(1)
                      ).join(' / ');
                    }
                    return word.charAt(0).toUpperCase() + word.slice(1);
                  })
                  .join(' ');
                return translateObjectName(capitalized, lang) || capitalized;
              }
            } else {
              // Mode 2: Objects share middle groups (with potential status offset)
              // Analyze example addresses to determine how zones are structured
              const exampleAddresses = hvacGroup.exampleAddresses;
              const firstExample = exampleAddresses[0];
              const mainIncrement = firstExample.mainIncrement ?? 0;
              const middleIncrement = firstExample.middleIncrement ?? 0;
              
              // Analyze example addresses to detect zones
              // Check if example addresses contain multiple zones by looking at:
              // 1. Different main groups (mainIncrement === 1)
              // 2. Different middle groups (middleIncrement === 1, but that's Mode 1)
              // 3. Sub number patterns that suggest multiple zones
              
              let objectsPerZone = exampleAddresses.length;
              let zonesInExamples = 1;
              
              if (mainIncrement === 1) {
                // Extra main groups: check if examples contain multiple main groups
                const uniqueMains = new Set(exampleAddresses.map(addr => addr.main));
                if (uniqueMains.size > 1) {
                  zonesInExamples = uniqueMains.size;
                  objectsPerZone = exampleAddresses.length / zonesInExamples;
                }
              } else {
                // Check if sub numbers suggest multiple zones
                // Look for patterns where subs repeat (e.g., 1,2,3,1,2,3 = 2 zones of 3 objects)
                const subs = exampleAddresses.map(addr => addr.sub).sort((a, b) => a - b);
                const startSub = pattern?.startSub ?? subs[0];
                
                // Try to detect repeating patterns
                for (let testZones = 2; testZones <= Math.floor(subs.length / 2); testZones++) {
                  const testObjectsPerZone = Math.floor(subs.length / testZones);
                  if (testObjectsPerZone * testZones === subs.length) {
                    let matches = true;
                    for (let zoneIdx = 0; zoneIdx < testZones && matches; zoneIdx++) {
                      for (let objIdx = 0; objIdx < testObjectsPerZone && matches; objIdx++) {
                        const expectedSub = startSub + objIdx;
                        const actualSub = subs[zoneIdx * testObjectsPerZone + objIdx];
                        const normalizedActual = actualSub < 100 ? actualSub : actualSub % 100;
                        if (normalizedActual !== expectedSub) {
                          matches = false;
                        }
                      }
                    }
                    if (matches) {
                      zonesInExamples = testZones;
                      objectsPerZone = testObjectsPerZone;
                      break;
                    }
                  }
                }
              }
              
              // Now determine zone based on the analysis
              if (mainIncrement === 1 && zonesInExamples > 1) {
                // Scenario: Extra main groups - each main group (or group of main groups) = zones
                // Determine zone based on main group and sub number
                if (addressRows && addressRows.length > 0 && devices) {
                  // Get the main group and lowest sub from addressRows
                  const firstAddress = parseGroupAddress(addressRows[0].groupAddress);
                  const baseMain = firstAddress.main;
                  const baseSub = firstAddress.sub < 100 ? firstAddress.sub : firstAddress.sub % 100;
                  
                  // Calculate which zone this is based on main group offset and sub number
                  const baseMainFromPattern = pattern?.fixedMain ?? firstExample.main;
                  const mainOffset = baseMain - baseMainFromPattern;
                  const startSub = pattern?.startSub ?? 1;
                  const subOffset = baseSub - startSub;
                  
                  // Zone index = (mainOffset * zonesPerMain) + (subOffset / objectsPerZone)
                  // But we need to know how many zones per main group
                  // For now, assume: zoneIndex = mainOffset + Math.floor(subOffset / objectsPerZone)
                  const zoneIndex = mainOffset + Math.floor(subOffset / objectsPerZone);
                  
                  // Collect all HVAC zones
                  const allHvacZones: Array<{ roomAddress?: string; roomName?: string; channelName?: string }> = [];
                  const seenRoomAddresses = new Set<string>();
                  const hvacDevices = devices.filter(d => d.category === 'hvac' && 'zones' in d);
                  hvacDevices.forEach((device: any) => {
                    if (device.zones) {
                      const sortedZones = [...device.zones].sort((a: any, b: any) => {
                        const channelA = extractChannelNumber(a.channelName || 'K1');
                        const channelB = extractChannelNumber(b.channelName || 'K1');
                        return channelA - channelB;
                      });
                      sortedZones.forEach((zone: any) => {
                        const roomAddress = zone.roomAddress || '';
                        if (!seenRoomAddresses.has(roomAddress)) {
                          seenRoomAddresses.add(roomAddress);
                          allHvacZones.push(zone);
                        }
                      });
                    }
                  });
                  
                  if (zoneIndex >= 0 && zoneIndex < allHvacZones.length) {
                    const zone = allHvacZones[zoneIndex];
                    const zoneName = buildZoneNameFromZone(zone);
                    if (zoneName) {
                      return zoneName;
                    }
                  }
                }
              } else if (zonesInExamples > 1) {
                // Scenario: Multiple zones in examples, determined by sub number pattern
                // Each sub number (normalized) represents a zone
                if (addressRows && addressRows.length > 0 && devices) {
                  const firstAddress = parseGroupAddress(addressRows[0].groupAddress);
                  const baseSub = firstAddress.sub < 100 ? firstAddress.sub : firstAddress.sub % 100;
                  const startSub = pattern?.startSub ?? 1;
                  
                  // Zone index = (baseSub - startSub) / objectsPerZone
                  const zoneIndex = Math.floor((baseSub - startSub) / objectsPerZone);
                  
                  // Collect all HVAC zones
                  const allHvacZones: Array<{ roomAddress?: string; roomName?: string; channelName?: string }> = [];
                  const seenRoomAddresses = new Set<string>();
                  const hvacDevices = devices.filter(d => d.category === 'hvac' && 'zones' in d);
                  hvacDevices.forEach((device: any) => {
                    if (device.zones) {
                      const sortedZones = [...device.zones].sort((a: any, b: any) => {
                        const channelA = extractChannelNumber(a.channelName || 'K1');
                        const channelB = extractChannelNumber(b.channelName || 'K1');
                        return channelA - channelB;
                      });
                      sortedZones.forEach((zone: any) => {
                        const roomAddress = zone.roomAddress || '';
                        if (!seenRoomAddresses.has(roomAddress)) {
                          seenRoomAddresses.add(roomAddress);
                          allHvacZones.push(zone);
                        }
                      });
                    }
                  });
                  
                  if (zoneIndex >= 0 && zoneIndex < allHvacZones.length) {
                    const zone = allHvacZones[zoneIndex];
                    const zoneName = buildZoneNameFromZone(zone);
                    if (zoneName) {
                      return zoneName;
                    }
                  }
                }
              } else {
                // Scenario: Mode 2 - Objects share middle groups
                // In Mode 2, the middle group name should be the object name (from the first object with lowest sub)
                // NOT the zone name
                // Find the matching example address for this middle group
                const matchingExample = hvacGroup.exampleAddresses.find(addr => addr.middle === middle);
                if (matchingExample) {
                  // Capitalize the object name
                  const capitalized = matchingExample.objectName
                    .split(/\s+/)
                    .map(word => {
                      if (word.includes('/')) {
                        return word.split('/').map(part => 
                          part.charAt(0).toUpperCase() + part.slice(1)
                        ).join(' / ');
                      }
                      return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ');
                  return translateObjectName(capitalized, lang) || capitalized;
                }
                
                // If no matching example found, try to find the object with the lowest sub in this middle group
                if (addressRows && addressRows.length > 0) {
                  // Sort addressRows by sub number
                  const sortedRows = [...addressRows].sort((a, b) => {
                    const parsedA = parseGroupAddress(a.groupAddress);
                    const parsedB = parseGroupAddress(b.groupAddress);
                    // Normalize status offsets (sub % 100 for sub >= 100)
                    const subA = parsedA.sub < 100 ? parsedA.sub : parsedA.sub % 100;
                    const subB = parsedB.sub < 100 ? parsedB.sub : parsedB.sub % 100;
                    return subA - subB;
                  });
                  
                  // Get the first row (lowest sub) and use its name as the middle group name
                  const firstRow = sortedRows[0];
                  if (firstRow && firstRow.name && firstRow.name !== '---') {
                    // Extract object name from the full name (which might be "zone objectname")
                    // For Mode 2, the name should be just the object name
                    const nameParts = firstRow.name.split(' ');
                    // The last part is usually the object name
                    const objectName = nameParts[nameParts.length - 1];
                    if (objectName) {
                      return objectName;
                    }
                  }
                }
                
                // Fallback: try to find matching example address (for first zone only)
                const fallbackExample = hvacGroup.exampleAddresses.find(addr => addr.middle === middle);
                if (fallbackExample) {
                  const capitalized = fallbackExample.objectName
                    .split(/\s+/)
                    .map(word => {
                      if (word.includes('/')) {
                        return word.split('/').map(part => 
                          part.charAt(0).toUpperCase() + part.slice(1)
                        ).join(' / ');
                      }
                      return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ');
                  return translateObjectName(capitalized, lang) || capitalized;
                }
              }
              
              // Fallback: try to find matching example address (for first zone only)
              const matchingExample = hvacGroup.exampleAddresses.find(addr => addr.middle === middle);
              if (matchingExample) {
                const capitalized = matchingExample.objectName
                  .split(/\s+/)
                  .map(word => {
                    if (word.includes('/')) {
                      return word.split('/').map(part => 
                        part.charAt(0).toUpperCase() + part.slice(1)
                      ).join(' / ');
                    }
                    return word.charAt(0).toUpperCase() + word.slice(1);
                  })
                  .join(' ');
                return translateObjectName(capitalized, lang) || capitalized;
              }
              // Check extra objects if no example address matched
              if (hvacGroup.extraObjects && hvacGroup.extraObjects.length > 0) {
                const matchingExtra = hvacGroup.extraObjects.find(obj => obj.middle === middle);
                if (matchingExtra && matchingExtra.name) {
                  const capitalized = matchingExtra.name
                    .split(/\s+/)
                    .map(word => {
                      if (word.includes('/')) {
                        return word.split('/').map(part => 
                          part.charAt(0).toUpperCase() + part.slice(1)
                        ).join(' / ');
                      }
                      return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ');
                  return translateObjectName(capitalized, lang) || capitalized;
                }
              }
            }
          }
        }
      }
    }
    
    // Check teach by example config for object names
    if (template.teachByExampleConfig) {
      const categories = template.teachByExampleConfig.categories;
      
      // Check switching
      if (categories.switching) {
        const switchingGroups = Array.isArray(categories.switching) ? categories.switching : [categories.switching];
        for (const switchGroup of switchingGroups) {
          if (switchGroup.exampleAddresses && switchGroup.exampleAddresses.length > 0) {
            const firstAddress = switchGroup.exampleAddresses[0];
            if (firstAddress.main === main) {
              const matchingExample = switchGroup.exampleAddresses.find(addr => addr.middle === middle);
              if (matchingExample) {
                const capitalized = matchingExample.objectName
                  .split(/\s+/)
                  .map(word => {
                    if (word.includes('/')) {
                      return word.split('/').map(part => 
                        part.charAt(0).toUpperCase() + part.slice(1)
                      ).join(' / ');
                    }
                    return word.charAt(0).toUpperCase() + word.slice(1);
                  })
                  .join(' ');
                return translateObjectName(capitalized, lang) || capitalized;
              }
              // Check extra objects if no example address matched
              if (switchGroup.extraObjects && switchGroup.extraObjects.length > 0) {
                const matchingExtra = switchGroup.extraObjects.find(obj => obj.main === main && obj.middle === middle);
                if (matchingExtra && matchingExtra.name) {
                  const capitalized = matchingExtra.name
                    .split(/\s+/)
                    .map(word => {
                      if (word.includes('/')) {
                        return word.split('/').map(part => 
                          part.charAt(0).toUpperCase() + part.slice(1)
                        ).join(' / ');
                      }
                      return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ');
                  return translateObjectName(capitalized, lang) || capitalized;
                }
              }
            }
          }
        }
      }
      
      // Check dimming - find dim group that matches both main and middle
      if (categories.dimming) {
        const dimmingGroups = Array.isArray(categories.dimming) ? categories.dimming : [categories.dimming];
        
        // First, try to find dim group that has an example address matching this exact main/middle combination
        for (const dimGroup of dimmingGroups) {
          if (dimGroup.exampleAddresses && dimGroup.exampleAddresses.length > 0) {
            const firstAddress = dimGroup.exampleAddresses[0];
            if (firstAddress.main === main) {
              // Check if this dim group has an example address with this middle group
              const matchingExample = dimGroup.exampleAddresses.find(addr => addr.middle === middle);
              if (matchingExample) {
                const capitalized = matchingExample.objectName
                  .split(/\s+/)
                  .map(word => {
                    if (word.includes('/')) {
                      return word.split('/').map(part => 
                        part.charAt(0).toUpperCase() + part.slice(1)
                      ).join(' / ');
                    }
                    return word.charAt(0).toUpperCase() + word.slice(1);
                  })
                  .join(' ');
                return translateObjectName(capitalized, lang) || capitalized;
              }
              // Check extra objects if no example address matched
              if (dimGroup.extraObjects && dimGroup.extraObjects.length > 0) {
                const matchingExtra = dimGroup.extraObjects.find(obj => obj.main === main && obj.middle === middle);
                if (matchingExtra && matchingExtra.name) {
                  const capitalized = matchingExtra.name
                    .split(/\s+/)
                    .map(word => {
                      if (word.includes('/')) {
                        return word.split('/').map(part => 
                          part.charAt(0).toUpperCase() + part.slice(1)
                        ).join(' / ');
                      }
                      return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ');
                  return translateObjectName(capitalized, lang) || capitalized;
                }
              }
            }
          }
        }
      }
      
      // Check shading
      if (categories.shading) {
        const shadingGroups = Array.isArray(categories.shading) ? categories.shading : [categories.shading];
        for (const shadeGroup of shadingGroups) {
          if (shadeGroup.exampleAddresses && shadeGroup.exampleAddresses.length > 0) {
            const firstAddress = shadeGroup.exampleAddresses[0];
            if (firstAddress.main === main) {
              const matchingExample = shadeGroup.exampleAddresses.find(addr => addr.middle === middle);
              if (matchingExample) {
                const capitalized = matchingExample.objectName
                  .split(/\s+/)
                  .map(word => {
                    if (word.includes('/')) {
                      return word.split('/').map(part => 
                        part.charAt(0).toUpperCase() + part.slice(1)
                      ).join(' / ');
                    }
                    return word.charAt(0).toUpperCase() + word.slice(1);
                  })
                  .join(' ');
                return translateObjectName(capitalized, lang) || capitalized;
              }
              // Check extra objects if no example address matched
              if (shadeGroup.extraObjects && shadeGroup.extraObjects.length > 0) {
                const matchingExtra = shadeGroup.extraObjects.find(obj => obj.main === main && obj.middle === middle);
                if (matchingExtra && matchingExtra.name) {
                  const capitalized = matchingExtra.name
                    .split(/\s+/)
                    .map(word => {
                      if (word.includes('/')) {
                        return word.split('/').map(part => 
                          part.charAt(0).toUpperCase() + part.slice(1)
                        ).join(' / ');
                      }
                      return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ');
                  return translateObjectName(capitalized, lang) || capitalized;
                }
              }
            }
          }
        }
      }
    }
    
    // Check device objects for middle group names (old template structure)
    const allDeviceObjects: Array<{ name: string; dpt: string }> = [];
    
    // Check switch objects
    template.devices.switch.objects.forEach(obj => {
      if (obj.main === main && obj.middle === middle) {
        allDeviceObjects.push({ name: obj.name, dpt: obj.dpt });
      }
    });
    
    // Check dimmer objects
    if (template.devices.dimmer) {
      const dimmerConfigs = Array.isArray(template.devices.dimmer) ? template.devices.dimmer : [template.devices.dimmer];
      dimmerConfigs.forEach(dimmerConfig => {
        dimmerConfig.objects.forEach(obj => {
          if (obj.main === main && obj.middle === middle) {
            allDeviceObjects.push({ name: obj.name, dpt: obj.dpt });
          }
        });
      });
    }
    
    // Check blind objects
    template.devices.blind.objects.forEach(obj => {
      if (obj.main === main && obj.middle === middle) {
        allDeviceObjects.push({ name: obj.name, dpt: obj.dpt });
      }
    });
    
    // Check hvac objects (old template structure)
    template.devices.hvac.objects.forEach(obj => {
      if (obj.main === main && obj.middle === middle) {
        allDeviceObjects.push({ name: obj.name, dpt: obj.dpt });
      }
    });
    
    // Use the first matching object name (capitalized like in CSV export)
    if (allDeviceObjects.length > 0) {
      const firstObject = allDeviceObjects[0];
      // Capitalize first letter of each word (similar to getObjectNameWithBit in CSV)
      const capitalized = firstObject.name
        .split(/\s+/)
        .map(word => {
          if (word.includes('/')) {
            return word.split('/').map(part => 
              part.charAt(0).toUpperCase() + part.slice(1)
            ).join(' / ');
          }
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
      
      // Translate object name if it's a standard name
      return translateObjectName(capitalized, lang) || capitalized;
    }
    
    // For HVAC: if we get here and devices are available, try one more time to get zone names
    // This handles cases where the template check above didn't match correctly
    if (devices && template.teachByExampleConfig?.categories.hvac) {
      const hvacGroups = Array.isArray(template.teachByExampleConfig.categories.hvac) 
        ? template.teachByExampleConfig.categories.hvac 
        : [template.teachByExampleConfig.categories.hvac];
      
      for (const hvacGroup of hvacGroups) {
        if (hvacGroup.exampleAddresses && hvacGroup.exampleAddresses.length > 0) {
          const firstAddress = hvacGroup.exampleAddresses[0];
          const pattern = hvacGroup.pattern;
          const baseMain = pattern?.fixedMain ?? firstAddress.main;
          const matchesBaseMain = baseMain === main;
          const matchesExtraMain = pattern?.extraMainGroups?.some(eg => eg.main === main) ?? false;
          
          if (matchesBaseMain || matchesExtraMain) {
            // Try to get object name as fallback
            const matchingExample = hvacGroup.exampleAddresses.find(addr => addr.middle === middle);
            if (matchingExample) {
              const capitalized = matchingExample.objectName
                .split(/\s+/)
                .map(word => {
                  if (word.includes('/')) {
                    return word.split('/').map(part => 
                      part.charAt(0).toUpperCase() + part.slice(1)
                    ).join(' / ');
                  }
                  return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
              return translateObjectName(capitalized, lang) || capitalized;
            }
          }
        }
      }
    }
    
    // Default: return middle group number as name (should not happen for HVAC if template is correct)
    return `Middengroep ${middle}`;
  };

  // Group addresses by main and middle
  const mainGroupMap = new Map<number, Map<number, GroupAddressRow[]>>();
  const allAddressStrings = rows.map(r => r.groupAddress);

  rows.forEach(row => {
    const parsed = parseGroupAddress(row.groupAddress);
    
    // For status addresses that are 100+ more, use the non-status middle group
    let targetMain = parsed.main;
    let targetMiddle = parsed.middle;
    
    if (isStatusAddress(row.groupAddress, allAddressStrings)) {
      // Status address: use the non-status middle group name
      // The sub will be 100+ more, but we keep it in the same middle group structure
      // The name will come from the non-status middle group
      targetMain = parsed.main;
      targetMiddle = parsed.middle; // Keep same middle, but name will be from non-status
    }
    
    if (!mainGroupMap.has(targetMain)) {
      mainGroupMap.set(targetMain, new Map());
    }
    
    const middleGroupMap = mainGroupMap.get(targetMain)!;
    if (!middleGroupMap.has(targetMiddle)) {
      middleGroupMap.set(targetMiddle, []);
    }
    
    middleGroupMap.get(targetMiddle)!.push(row);
  });

  // Convert to hierarchical structure
  const mainGroups: HierarchicalMainGroup[] = [];
  
  // Sort main groups by number
  const sortedMainGroups = Array.from(mainGroupMap.keys()).sort((a, b) => a - b);
  
  sortedMainGroups.forEach(main => {
    const middleGroupMap = mainGroupMap.get(main)!;
    const middleGroups: HierarchicalMiddleGroup[] = [];
    
    // Sort middle groups by number
    const sortedMiddleGroups = Array.from(middleGroupMap.keys()).sort((a, b) => a - b);
    
    // For dimming: check if we need to split main groups when multiple dim groups share the same main group
    // but have different middle groups. If so, we'll create separate main group entries.
    const shouldSplitDimGroups = template.teachByExampleConfig?.categories?.dimming && 
      Array.isArray(template.teachByExampleConfig.categories.dimming) &&
      template.teachByExampleConfig.categories.dimming.length > 1;
    
    let hasSplitMainGroups = false;
    
    if (shouldSplitDimGroups) {
      const dimmingGroups = template.teachByExampleConfig.categories.dimming as any[];
      
      // Group middle groups by which dim group they belong to
      const middleGroupsByDimGroup = new Map<number, Array<{ middle: number; addressRows: GroupAddressRow[] }>>();
      
      sortedMiddleGroups.forEach(middle => {
        const addressRows = middleGroupMap.get(middle)!;
        
        // Find which dim group this middle group belongs to
        for (let dimGroupIndex = 0; dimGroupIndex < dimmingGroups.length; dimGroupIndex++) {
          const dimGroup = dimmingGroups[dimGroupIndex];
          if (dimGroup.exampleAddresses && dimGroup.exampleAddresses.length > 0) {
            const firstAddress = dimGroup.exampleAddresses[0];
            if (firstAddress.main === main) {
              // Check if this middle group belongs to this dim group
              const hasMatchingMiddle = dimGroup.exampleAddresses.some(addr => addr.middle === middle);
              if (hasMatchingMiddle) {
                if (!middleGroupsByDimGroup.has(dimGroupIndex)) {
                  middleGroupsByDimGroup.set(dimGroupIndex, []);
                }
                middleGroupsByDimGroup.get(dimGroupIndex)!.push({ middle, addressRows });
                break;
              }
            }
          }
        }
      });
      
      // If middle groups belong to different dim groups, create separate main group entries
      if (middleGroupsByDimGroup.size > 1) {
        hasSplitMainGroups = true;
        
        // Create a separate main group entry for each dim group
        middleGroupsByDimGroup.forEach((middleGroupList, dimGroupIndex) => {
          const dimGroup = dimmingGroups[dimGroupIndex];
          const dimGroupMiddleGroups: HierarchicalMiddleGroup[] = [];
          
          middleGroupList.forEach(({ middle, addressRows }) => {
            // Sort addresses by sub number
            addressRows.sort((a, b) => {
              const parsedA = parseGroupAddress(a.groupAddress);
              const parsedB = parseGroupAddress(b.groupAddress);
              return parsedA.sub - parsedB.sub;
            });
            
            // Convert to HierarchicalGroupAddress
            const addresses: HierarchicalGroupAddress[] = addressRows.map(row => ({
              groupAddress: row.groupAddress,
              name: row.name,
              datapointType: row.datapointType,
              comment: row.comment
            }));
            
            // Get middle group name
            let middleGroupName = getMiddleGroupName(main, middle, addressRows);
            
            // If this middle group contains status addresses, try to find the corresponding non-status middle group name
            const hasStatusAddresses = addressRows.some(row => isStatusAddress(row.groupAddress, allAddressStrings));
            if (hasStatusAddresses) {
              const firstAddress = addressRows[0];
              const parsed = parseGroupAddress(firstAddress.groupAddress);
              if (parsed.sub >= 100) {
                const nonStatusAddressRows = rows.filter(row => {
                  const rowParsed = parseGroupAddress(row.groupAddress);
                  return rowParsed.main === main && rowParsed.middle === middle && rowParsed.sub < 100;
                });
                if (nonStatusAddressRows.length > 0) {
                  middleGroupName = getMiddleGroupName(main, middle, nonStatusAddressRows);
                }
              }
            }
            
            dimGroupMiddleGroups.push({
              middle,
              name: middleGroupName,
              addresses
            });
          });
          
          // Use dim group name for main group name
          const t = getTranslation(lang);
          const raw = (dimGroup.groupName || '').trim();
          const mainGroupName = raw ? translateGroupNameForDisplay(raw, lang) : t.dimmer;
          
          mainGroups.push({
            main,
            name: mainGroupName,
            middleGroups: dimGroupMiddleGroups
          });
        });
      }
    }
    
    // Skip normal processing if we already split the main groups
    if (hasSplitMainGroups) {
      return; // Continue to next main group
    }
    
    // Get middle group numbers for this main group to help determine the correct dim group name
    const middleGroupNumbers = Array.from(middleGroupMap.keys());
    
    // For dimming: even if we don't split, we need to make sure the main group name
    // matches the correct dim group when there are multiple dim groups with different main groups
    let mainGroupName = getMainGroupName(main, middleGroupNumbers);
    if (template.teachByExampleConfig?.categories?.dimming) {
      const dimmingGroups = Array.isArray(template.teachByExampleConfig.categories.dimming) 
        ? template.teachByExampleConfig.categories.dimming 
        : [template.teachByExampleConfig.categories.dimming];
      
      // Find which dim group this main group belongs to
      for (const dimGroup of dimmingGroups) {
        if (dimGroup.exampleAddresses && dimGroup.exampleAddresses.length > 0) {
          const firstAddress = dimGroup.exampleAddresses[0];
          if (firstAddress.main === main) {
            // This main group belongs to this dim group
            const t = getTranslation(lang);
            const raw = (dimGroup.groupName || '').trim();
            if (raw) {
              mainGroupName = translateGroupNameForDisplay(raw, lang);
            } else if (dimGroup.linkedToSwitching && template.teachByExampleConfig.categories.switching) {
              mainGroupName = `${t.dimmer} / ${t.switch}`;
            } else {
              mainGroupName = t.dimmer;
            }
            break; // Found the matching dim group, use its name
          }
        }
      }
    }
    
    // Normal processing: all middle groups belong to the same dim group or no splitting needed
    sortedMiddleGroups.forEach(middle => {
      const addressRows = middleGroupMap.get(middle)!;
      
      // Sort addresses by sub number
      addressRows.sort((a, b) => {
        const parsedA = parseGroupAddress(a.groupAddress);
        const parsedB = parseGroupAddress(b.groupAddress);
        return parsedA.sub - parsedB.sub;
      });
      
      // Convert to HierarchicalGroupAddress
      const addresses: HierarchicalGroupAddress[] = addressRows.map(row => ({
        groupAddress: row.groupAddress,
        name: row.name,
        datapointType: row.datapointType,
        comment: row.comment
      }));
      
      // Get middle group name - for status addresses, use the non-status middle group name
      let middleGroupName = getMiddleGroupName(main, middle, addressRows);
      
      // If this middle group contains status addresses, try to find the corresponding non-status middle group name
      const hasStatusAddresses = addressRows.some(row => isStatusAddress(row.groupAddress, allAddressStrings));
      if (hasStatusAddresses) {
        // Check if there's a non-status address with sub - 100
        const firstAddress = addressRows[0];
        const parsed = parseGroupAddress(firstAddress.groupAddress);
        if (parsed.sub >= 100) {
          // This is a status-only middle group, find the corresponding non-status middle group
          // Get the non-status addresses (sub - 100) to determine the correct name
          const nonStatusAddressRows = rows.filter(row => {
            const rowParsed = parseGroupAddress(row.groupAddress);
            return rowParsed.main === main && rowParsed.middle === middle && rowParsed.sub < 100;
          });
          if (nonStatusAddressRows.length > 0) {
            middleGroupName = getMiddleGroupName(main, middle, nonStatusAddressRows);
          }
        }
      }
      
      middleGroups.push({
        middle,
        name: middleGroupName,
        addresses
      });
    });
    
    mainGroups.push({
      main,
      name: mainGroupName,
      middleGroups
    });
  });
  
  return { mainGroups };
};
