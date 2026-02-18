import { GroupAddressRow, TemplateConfig, FixedMiddleGroupTemplate, HierarchicalGroupAddressOverview } from '../types/common';
import { Language, getTranslation, translateFixedAddressName, translateObjectName } from '../i18n/translations';
import { translateUserInput, getStandardUserInput } from '../i18n/userInputTranslations';

// Helper function to capitalize first letter of a string
const capitalize = (str: string): string => {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Fix common encoding issues where UTF-8 characters are incorrectly decoded
// This fixes UTF-8 bytes that were interpreted as Latin-1/Windows-1252
// Example: "scÃ¨nes" -> "scènes", "atenuaciÃ³n" -> "atenuación"
const fixEncoding = (str: string): string => {
  if (!str) return str;
  
  // If string contains mojibake patterns (Ã followed by another character), fix them
  if (!str.includes('Ã')) {
    return str; // No encoding issues detected
  }
  
  let fixed = str;
  
  // Fix all UTF-8 misinterpretations systematically
  // Common patterns where UTF-8 bytes are interpreted as Latin-1:
  // Ã followed by various characters represents UTF-8 sequences
  
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
               .replace(/Ã§/g, 'ç')   // ç = UTF-8 C3 A7
               .replace(/Ã½/g, 'ý')   // ý = UTF-8 C3 BD
               .replace(/Ã¾/g, 'þ')   // þ = UTF-8 C3 BE
               .replace(/Ã/g, 'Á')    // Á = UTF-8 C3 81 (capital)
               .replace(/Ã/g, 'À')    // À = UTF-8 C3 80 (capital)
               .replace(/Ã/g, 'Ã')    // Ã = UTF-8 C3 83 (capital)
               .replace(/Ã/g, 'Ä')    // Ä = UTF-8 C3 84 (capital)
               .replace(/Ã/g, 'Å')    // Å = UTF-8 C3 85 (capital)
               .replace(/Ã/g, 'Æ')    // Æ = UTF-8 C3 86 (capital)
               .replace(/Ã/g, 'Ç')    // Ç = UTF-8 C3 87 (capital)
               .replace(/Ã/g, 'È')    // È = UTF-8 C3 88 (capital)
               .replace(/Ã/g, 'É')    // É = UTF-8 C3 89 (capital)
               .replace(/Ã/g, 'Ê')    // Ê = UTF-8 C3 8A (capital)
               .replace(/Ã/g, 'Ë')    // Ë = UTF-8 C3 8B (capital)
               .replace(/Ã/g, 'Ì')    // Ì = UTF-8 C3 8C (capital)
               .replace(/Ã/g, 'Í')    // Í = UTF-8 C3 8D (capital)
               .replace(/Ã/g, 'Î')    // Î = UTF-8 C3 8E (capital)
               .replace(/Ã/g, 'Ï')    // Ï = UTF-8 C3 8F (capital)
               .replace(/Ã/g, 'Ð')    // Ð = UTF-8 C3 90 (capital)
               .replace(/Ã/g, 'Ñ')    // Ñ = UTF-8 C3 91 (capital)
               .replace(/Ã/g, 'Ò')    // Ò = UTF-8 C3 92 (capital)
               .replace(/Ã/g, 'Ó')    // Ó = UTF-8 C3 93 (capital)
               .replace(/Ã/g, 'Ô')    // Ô = UTF-8 C3 94 (capital)
               .replace(/Ã/g, 'Õ')    // Õ = UTF-8 C3 95 (capital)
               .replace(/Ã/g, 'Ö')    // Ö = UTF-8 C3 96 (capital)
               .replace(/Ã/g, '×')    // × = UTF-8 C3 97
               .replace(/Ã/g, 'Ø')    // Ø = UTF-8 C3 98 (capital)
               .replace(/Ã/g, 'Ù')    // Ù = UTF-8 C3 99 (capital)
               .replace(/Ã/g, 'Ú')    // Ú = UTF-8 C3 9A (capital)
               .replace(/Ã/g, 'Û')    // Û = UTF-8 C3 9B (capital)
               .replace(/Ã/g, 'Ü')    // Ü = UTF-8 C3 9C (capital)
               .replace(/Ã/g, 'Ý')    // Ý = UTF-8 C3 9D (capital)
               .replace(/Ã/g, 'Þ')    // Þ = UTF-8 C3 9E (capital)
               .replace(/Ã/g, 'ß');   // ß = UTF-8 C3 9F
  
  // Specific common word fixes
  fixed = fixed.replace(/scÃ¨nes/gi, 'scènes')
               .replace(/scÃ©nes/gi, 'scènes')
               .replace(/atenuaciÃ³n/gi, 'atenuación')
               .replace(/posiciÃ³n/gi, 'posición');
  
  return fixed;
};

// Parse group address string (e.g., "1/0/0" or "1/0") into Main, Middle, Sub
const parseGroupAddress = (groupAddress: string): { main: number; middle: number; sub: number } => {
  const parts = groupAddress.split('/').map(Number);
  return {
    main: parts[0] || 0,
    middle: parts[1] || 0,
    sub: parts[2] || 0
  };
};

// Convert DPT format (e.g., "DPT1.001" -> "DPST-1-1")
const convertDPTFormat = (dpt: string): string => {
  const match = dpt.match(/DPT(\d+)\.(\d+)/);
  if (match) {
    const main = match[1];
    const sub = parseInt(match[2], 10).toString(); // Remove leading zeros
    return `DPST-${main}-${sub}`;
  }
  return dpt;
};

// Extract name from description by removing physical address prefix
// Example: "1.1.1 Uitgang K1" -> "Uitgang K1"
const extractNameFromDescription = (description: string): string => {
  if (!description) return '';
  
  // Pattern to match physical address at start (e.g., "1.1.1", "1.1.10", etc.)
  // Matches: digits.digits.digits followed by space
  const physicalAddressPattern = /^\d+\.\d+\.\d+\s+/;
  
  // Remove physical address prefix if present
  const name = description.replace(physicalAddressPattern, '');
  
  return name.trim() || description; // Fallback to original if no match
};

// Get category name in current language
const getCategoryName = (mainGroup: number, template: TemplateConfig, lang: Language): string => {
  const t = getTranslation(lang);
  
  // Check fixed addresses first
  if (template.devices.fixed?.mainGroups) {
    const fixedMainGroup = template.devices.fixed.mainGroups.find(mg => mg.main === mainGroup);
    if (fixedMainGroup) {
      return translateFixedAddressName(fixedMainGroup.name, lang);
    }
  }
  
  // Check teach by example config for category names
  if (template.teachByExampleConfig) {
    const categories = template.teachByExampleConfig.categories;
    
    // Check switching
    if (categories.switching) {
      const switchingGroups = Array.isArray(categories.switching) ? categories.switching : [categories.switching];
      for (const switchGroup of switchingGroups) {
        if (switchGroup.exampleAddresses && switchGroup.exampleAddresses.length > 0) {
          const firstAddress = switchGroup.exampleAddresses[0];
          if (firstAddress.main === mainGroup) {
            return t.switch;
          }
        }
      }
    }
    
    // Check dimming
    if (categories.dimming) {
      const dimmingGroups = Array.isArray(categories.dimming) ? categories.dimming : [categories.dimming];
      for (const dimGroup of dimmingGroups) {
        if (dimGroup.exampleAddresses && dimGroup.exampleAddresses.length > 0) {
          const firstAddress = dimGroup.exampleAddresses[0];
          if (firstAddress.main === mainGroup) {
            // If dimming is linked to switching, check if switching also uses this main group
            if (dimGroup.linkedToSwitching && categories.switching) {
              const switchingGroups = Array.isArray(categories.switching) ? categories.switching : [categories.switching];
              for (const switchGroup of switchingGroups) {
                if (switchGroup.exampleAddresses && switchGroup.exampleAddresses.length > 0) {
                  const switchFirstAddress = switchGroup.exampleAddresses[0];
                  if (switchFirstAddress.main === mainGroup) {
                    return `${t.dimmer} / ${t.switch}`;
                  }
                }
              }
            }
            return t.dimmer;
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
          if (firstAddress.main === mainGroup) {
            return t.blind;
          }
        }
      }
    }
    
    // Check hvac
    if (categories.hvac) {
      const hvacGroups = Array.isArray(categories.hvac) ? categories.hvac : [categories.hvac];
      for (const hvacGroup of hvacGroups) {
        if (hvacGroup.exampleAddresses && hvacGroup.exampleAddresses.length > 0) {
          const firstAddress = hvacGroup.exampleAddresses[0];
          if (firstAddress.main === mainGroup) {
            return t.hvac;
          }
        }
      }
    }
  }
  
  // Check device objects (old template structure)
  if (template.devices.switch.objects.length > 0) {
    const switchMain = template.devices.switch.objects[0]?.main;
    if (switchMain === mainGroup) {
      return t.switch;
    }
  }
  if (template.devices.dimmer) {
    const dimmerConfigs = Array.isArray(template.devices.dimmer) ? template.devices.dimmer : [template.devices.dimmer];
    for (const dimmerConfig of dimmerConfigs) {
      if (dimmerConfig.objects.length > 0) {
        const dimmerMain = dimmerConfig.objects[0]?.main;
        if (dimmerMain === mainGroup) {
          return t.dimmer;
        }
      }
    }
  }
  if (template.devices.blind.objects.length > 0) {
    const blindMain = template.devices.blind.objects[0]?.main;
    if (blindMain === mainGroup) {
      return t.blind;
    }
  }
  if (template.devices.hvac.objects.length > 0) {
    const hvacMain = template.devices.hvac.objects[0]?.main;
    if (hvacMain === mainGroup) {
      return t.hvac;
    }
  }
  
  // Default: return main group number as name (translated)
  const t_nl = getTranslation('nl');
  return `${t_nl.mainGroup || 'Hoofdgroep'} ${mainGroup}`;
};

// Get object name with bit info - translate and capitalize first letter of each word
const getObjectNameWithBit = (objectName: string, dpt: string, lang: Language): string => {
  // First translate the object name
  const translatedName = translateObjectName(objectName, lang);
  
  // Capitalize first letter of each word
  const capitalized = translatedName
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
  
  const is1Bit = dpt.startsWith('DPT1.');
  if (is1Bit) {
    return `${capitalized} (1bit)`;
  }
  return capitalized;
};

// Escape CSV value for semicolon delimiter
const escapeCsvValue = (value: string): string => {
  if (value === '') return '';
  // If value contains semicolon, quote, or newline, wrap in quotes and escape quotes
  // Also wrap values starting with minus sign to prevent Excel/ETS from treating them as formulas
  if (value.includes(';') || value.includes('"') || value.includes('\n') || value.includes('\r') || value.startsWith('-')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

// Build CSV row with new ETS structure: Main,Middle,Sub,Main,Middle,Sub,Central,Unfiltered,Description,DatapointType,Security
const buildCsvRow = (
  mainHierarchy: string,
  middleHierarchy: string,
  subHierarchy: string,
  main: number | string,
  middle: number | string,
  sub: number | string,
  central: string,
  unfiltered: string,
  description: string,
  datapointType: string,
  security: string
): string => {
  return [
    escapeCsvValue(mainHierarchy),
    escapeCsvValue(middleHierarchy),
    escapeCsvValue(subHierarchy),
    main === '' ? '' : main.toString(),
    middle === '' ? '' : middle.toString(),
    sub === '' ? '' : sub.toString(),
    escapeCsvValue(central),
    escapeCsvValue(unfiltered),
    escapeCsvValue(description),
    escapeCsvValue(datapointType),
    escapeCsvValue(security)
  ].join(';');
};

export const buildEtsCsv = (hierarchicalOverview: HierarchicalGroupAddressOverview, template: TemplateConfig, lang: Language = 'nl'): string => {
  // Header row with new ETS structure: Main;Middle;Sub;Main;Middle;Sub;Central;Unfiltered;Description;DatapointType;Security
  const headerRow = 'Main;Middle;Sub;Main;Middle;Sub;Central;Unfiltered;Description;DatapointType;Security';
  
  const csvRows: string[] = [headerRow];
  
  // Sort main groups by main number
  const sortedMainGroups = [...hierarchicalOverview.mainGroups].sort((a, b) => a.main - b.main);
  
  sortedMainGroups.forEach((mainGroup) => {
    // Add main group row: "Speciale functies,,#,1,,,,,,,Auto"
    // Main hierarchy = category name, Sub hierarchy = "#", Main = main number, rest empty
    // CRITICAL: Fix encoding issues at the source - the name comes from hierarchical overview
    // which may already contain corrupted strings from localStorage
    let fixedMainName = mainGroup.name || '';
    
    // Step 1: Apply fixEncoding to handle all mojibake patterns
    fixedMainName = fixEncoding(fixedMainName);
    
    // Step 2: Normalize to NFC for consistent representation
    fixedMainName = fixedMainName.normalize('NFC');
    
    // Step 3: Final check - if still contains mojibake, try direct replacement
    if (fixedMainName.includes('Ã')) {
      // Last resort: direct string replacement for known patterns
      fixedMainName = fixedMainName.replace(/scÃ¨nes/gi, 'scènes')
                                   .replace(/scÃ©nes/gi, 'scènes')
                                   .replace(/atenuaciÃ³n/gi, 'atenuación')
                                   .replace(/posiciÃ³n/gi, 'posición')
                                   // General UTF-8 fixes
                                   .replace(/Ã³/g, 'ó')
                                   .replace(/Ã©/g, 'é')
                                   .replace(/Ã¨/g, 'è')
                                   .replace(/Ã¡/g, 'á')
                                   .replace(/Ã­/g, 'í')
                                   .replace(/Ãº/g, 'ú')
                                   .replace(/Ã±/g, 'ñ');
    }
    
    // Step 4: Capitalize first letter for display
    const normalizedMainName = capitalize(fixedMainName);
    
    csvRows.push(buildCsvRow(
      normalizedMainName,     // Main hierarchy (category name from overview, normalized)
      '',                 // Middle hierarchy (empty for main group)
      '#',                // Sub hierarchy (always "#" for groups)
      mainGroup.main,     // Main number
      '',                 // Middle (empty for main group)
      '',                 // Sub (empty for main group)
      '',                 // Central
      '',                 // Unfiltered
      '',                 // Description (empty for main group)
      '',                 // DatapointType (empty for main group)
      'Auto'              // Security
    ));
    
    // Sort middle groups by middle number
    const sortedMiddleGroups = [...mainGroup.middleGroups].sort((a, b) => a.middle - b.middle);
    
    sortedMiddleGroups.forEach((middleGroup) => {
      // Add middle group row: " ,Centrale functies,#,1,0,,,,,,Auto"
      // Main hierarchy = one space (indentation), Middle hierarchy = middle group name, Main and Middle numbers filled
      // CRITICAL: Fix encoding issues at the source - same multi-step process as main groups
      let fixedMiddleName = middleGroup.name || '';
      
      // Step 1: Apply fixEncoding to handle all mojibake patterns
      fixedMiddleName = fixEncoding(fixedMiddleName);
      
      // Step 2: Normalize to NFC for consistent representation
      fixedMiddleName = fixedMiddleName.normalize('NFC');
      
      // Step 3: Final check - if still contains mojibake, try direct replacement
      if (fixedMiddleName.includes('Ã')) {
        // Last resort: direct string replacement for known patterns
        fixedMiddleName = fixedMiddleName.replace(/scÃ¨nes/gi, 'scènes')
                                         .replace(/scÃ©nes/gi, 'scènes')
                                         .replace(/atenuaciÃ³n/gi, 'atenuación')
                                         .replace(/posiciÃ³n/gi, 'posición')
                                         // General UTF-8 fixes
                                         .replace(/Ã³/g, 'ó')
                                         .replace(/Ã©/g, 'é')
                                         .replace(/Ã¨/g, 'è')
                                         .replace(/Ã¡/g, 'á')
                                         .replace(/Ã­/g, 'í')
                                         .replace(/Ãº/g, 'ú')
                                         .replace(/Ã±/g, 'ñ');
      }
      
      // Step 4: Capitalize first letter for display
      const normalizedMiddleName = capitalize(fixedMiddleName);
      csvRows.push(buildCsvRow(
        ' ',                // Main hierarchy (one space for indentation)
        normalizedMiddleName,   // Middle hierarchy (middle group name from overview, normalized)
        '#',                // Sub hierarchy (always "#" for groups)
        mainGroup.main,     // Main number
        middleGroup.middle, // Middle number
        '',                 // Sub (empty for middle group)
        '',                 // Central
        '',                 // Unfiltered
        '',                 // Description (empty for middle group)
        '',                 // DatapointType (empty for middle group)
        'Auto'              // Security
      ));
      
      // Add address rows: " , ,Alles uit,1,0,0,,,,DPST-1-1,Auto"
      middleGroup.addresses.forEach((addr) => {
        const { main, middle, sub } = parseGroupAddress(addr.groupAddress);
        
        // Use name from address for Sub hierarchy column (not Description!)
        // Name field contains the full name (roomAddress + roomName + fixture + switchCode)
        // IMPORTANT: Translate room names and fixture names to the target language
        // The name may already be translated, but we need to ensure it's in the correct language
        let name = addr.name || '';
        
        // The name in hierarchicalOverview is already translated to the current language
        // when it was generated, so we can use it directly. However, we still need to
        // fix encoding issues.
        
        // Step 1: Apply fixEncoding
        name = fixEncoding(name);
        
        // Step 2: Normalize to NFC
        name = name.normalize('NFC');
        
        // Step 3: Final check for mojibake
        if (name.includes('Ã')) {
          name = name.replace(/scÃ¨nes/gi, 'scènes')
                     .replace(/scÃ©nes/gi, 'scènes')
                     .replace(/atenuaciÃ³n/gi, 'atenuación')
                     .replace(/posiciÃ³n/gi, 'posición')
                     .replace(/Ã³/g, 'ó')
                     .replace(/Ã©/g, 'é')
                     .replace(/Ã¨/g, 'è')
                     .replace(/Ã¡/g, 'á')
                     .replace(/Ã­/g, 'í')
                     .replace(/Ãº/g, 'ú')
                     .replace(/Ã±/g, 'ñ');
        }
        
        // ETS requires a name for each group address - use fallback if empty
        if (!name || name.trim() === '') {
          // Fallback to group address if no name available
          name = addr.groupAddress;
        }
        
        // Use comment (physical address + channel) for Description column
        const description = addr.comment || '';
        
        csvRows.push(buildCsvRow(
          ' ',                              // Main hierarchy (one space for indentation)
          ' ',                              // Middle hierarchy (one space for indentation)
          name,                             // Sub hierarchy (name goes here)
          main,                             // Main number
          middle,                           // Middle number
          sub,                              // Sub number
          '',                               // Central (not available in hierarchical structure, leave empty)
          '',                               // Unfiltered (not available in hierarchical structure, leave empty)
          description,                      // Description (comment with physical address + channel, e.g., "1.1.1 – K1")
          convertDPTFormat(addr.datapointType), // DatapointType
          'Auto'                            // Security
        ));
      });
    });
  });
  
  // Join with Windows line endings
  return csvRows.join('\r\n');
};

// Convert Unicode string to Windows-1252 (ISO-8859-1 compatible) bytes
// Windows-1252 is a superset of ISO-8859-1 and works better with ETS
const encodeWindows1252 = (str: string): Uint8Array => {
  const bytes: number[] = [];
  
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    
    // ASCII range (0-127) - direct mapping
    if (charCode < 128) {
      bytes.push(charCode);
    }
    // Windows-1252 range (128-255) - map common characters
    else if (charCode >= 128 && charCode <= 255) {
      // Most characters in this range map directly
      bytes.push(charCode);
    }
    // Unicode characters beyond 255 - map to Windows-1252 equivalents
    else {
      // Common accented characters mapping to Windows-1252
      const charMap: Record<number, number> = {
        // Common European characters
        0x00C0: 0xC0, // À
        0x00C1: 0xC1, // Á
        0x00C2: 0xC2, // Â
        0x00C3: 0xC3, // Ã
        0x00C4: 0xC4, // Ä
        0x00C5: 0xC5, // Å
        0x00C6: 0xC6, // Æ
        0x00C7: 0xC7, // Ç
        0x00C8: 0xC8, // È
        0x00C9: 0xC9, // É
        0x00CA: 0xCA, // Ê
        0x00CB: 0xCB, // Ë
        0x00CC: 0xCC, // Ì
        0x00CD: 0xCD, // Í
        0x00CE: 0xCE, // Î
        0x00CF: 0xCF, // Ï
        0x00D0: 0xD0, // Ð
        0x00D1: 0xD1, // Ñ
        0x00D2: 0xD2, // Ò
        0x00D3: 0xD3, // Ó
        0x00D4: 0xD4, // Ô
        0x00D5: 0xD5, // Õ
        0x00D6: 0xD6, // Ö
        0x00D8: 0xD8, // Ø
        0x00D9: 0xD9, // Ù
        0x00DA: 0xDA, // Ú
        0x00DB: 0xDB, // Û
        0x00DC: 0xDC, // Ü
        0x00DD: 0xDD, // Ý
        0x00DE: 0xDE, // Þ
        0x00DF: 0xDF, // ß
        0x00E0: 0xE0, // à
        0x00E1: 0xE1, // á
        0x00E2: 0xE2, // â
        0x00E3: 0xE3, // ã
        0x00E4: 0xE4, // ä
        0x00E5: 0xE5, // å
        0x00E6: 0xE6, // æ
        0x00E7: 0xE7, // ç
        0x00E8: 0xE8, // è
        0x00E9: 0xE9, // é
        0x00EA: 0xEA, // ê
        0x00EB: 0xEB, // ë
        0x00EC: 0xEC, // ì
        0x00ED: 0xED, // í
        0x00EE: 0xEE, // î
        0x00EF: 0xEF, // ï
        0x00F0: 0xF0, // ð
        0x00F1: 0xF1, // ñ
        0x00F2: 0xF2, // ò
        0x00F3: 0xF3, // ó
        0x00F4: 0xF4, // ô
        0x00F5: 0xF5, // õ
        0x00F6: 0xF6, // ö
        0x00F8: 0xF8, // ø
        0x00F9: 0xF9, // ù
        0x00FA: 0xFA, // ú
        0x00FB: 0xFB, // û
        0x00FC: 0xFC, // ü
        0x00FD: 0xFD, // ý
        0x00FE: 0xFE, // þ
        0x00FF: 0xFF, // ÿ
      };
      
      if (charMap[charCode]) {
        bytes.push(charMap[charCode]);
      } else {
        // Character not in Windows-1252 - replace with '?' or closest match
        bytes.push(0x3F); // '?'
      }
    }
  }
  
  return new Uint8Array(bytes);
};

/** Returns CSV content as Windows-1252 bytes for ETS. Use with saveFileWithDialog for "Save As". */
export function getCsvBytes(content: string): Uint8Array {
  const normalizedContent = content.normalize('NFC');
  return encodeWindows1252(normalizedContent);
}

export const downloadCsv = (content: string, filename: string) => {
  // ETS requires Windows-1252 (or ISO-8859-1) encoding, NOT UTF-8
  const windows1252Bytes = getCsvBytes(content);
  const blob = new Blob([windows1252Bytes], { type: 'text/csv;charset=windows-1252;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};
