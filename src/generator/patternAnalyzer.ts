// Pattern Analyzer for Teach by Example system
// Analyzes example addresses to detect patterns

import { ExampleAddress, GroupPattern, MiddleGroupPattern, SubGroupPattern } from '../types/common';

/**
 * Analyzes example addresses to detect the pattern
 * @param exampleAddresses Array of example addresses for one device/zone
 * @returns Analyzed pattern
 */
export function analyzeGroupPattern(exampleAddresses: ExampleAddress[]): GroupPattern {
  if (exampleAddresses.length === 0) {
    throw new Error('Geen voorbeeldadressen opgegeven');
  }

  // Validate all addresses have valid values
  for (let i = 0; i < exampleAddresses.length; i++) {
    const addr = exampleAddresses[i];
    if (isNaN(addr.main) || addr.main < 0 || addr.main > 31) {
      throw new Error(`Object ${i + 1} (${addr.objectName || 'onbekend'}): Hoofdgroep ${addr.main} is ongeldig (moet tussen 0 en 31 zijn)`);
    }
    if (isNaN(addr.middle) || addr.middle < 0 || addr.middle > 7) {
      throw new Error(`Object ${i + 1} (${addr.objectName || 'onbekend'}): Middengroep ${addr.middle} is ongeldig (moet tussen 0 en 7 zijn)`);
    }
    if (isNaN(addr.sub) || addr.sub < 0 || addr.sub > 255) {
      throw new Error(`Object ${i + 1} (${addr.objectName || 'onbekend'}): Subgroep ${addr.sub} is ongeldig (moet tussen 0 en 255 zijn)`);
    }
  }

  // All addresses should have the same main group
  const mainGroups = exampleAddresses.map(a => a.main);
  const uniqueMains = [...new Set(mainGroups)];
  if (uniqueMains.length !== 1) {
    const mainGroupsStr = uniqueMains.join(', ');
    throw new Error(`Niet alle adressen hebben dezelfde hoofdgroep. Gevonden hoofdgroepen: ${mainGroupsStr}. Alle objecten moeten dezelfde hoofdgroep gebruiken.`);
  }
  const fixedMain = uniqueMains[0];

  // Analyze middle group pattern
  const middleGroups = exampleAddresses.map(a => a.middle);
  const uniqueMiddles = [...new Set(middleGroups)];
  const middleGroupPattern: MiddleGroupPattern = uniqueMiddles.length === 1 ? 'same' : 'perType';

  // Analyze sub group pattern
  const subGroups = exampleAddresses.map(a => a.sub).sort((a, b) => a - b);
  
  // Check if sub groups are sequential (increment by 1)
  let isSequential = true;
  for (let i = 1; i < subGroups.length; i++) {
    if (subGroups[i] !== subGroups[i - 1] + 1) {
      isSequential = false;
      break;
    }
  }

  // Check if there's a consistent offset
  let offsetValue: number | undefined;
  let subGroupPattern: SubGroupPattern;
  
  if (isSequential && subGroups.length > 1) {
    // Check if it's a simple increment or has an offset
    const firstSub = subGroups[0];
    const secondSub = subGroups[1];
    const diff = secondSub - firstSub;
    
    if (diff === 1) {
      subGroupPattern = 'increment';
    } else {
      subGroupPattern = 'offset';
      offsetValue = diff;
    }
  } else if (subGroups.length === 1) {
    // Only one object, assume increment pattern
    subGroupPattern = 'increment';
  } else {
    // Non-sequential, check for offset pattern (e.g., 5, 105, 205)
    const firstSub = subGroups[0];
    const possibleOffsets: number[] = [];
    
    for (let i = 1; i < subGroups.length; i++) {
      const diff = subGroups[i] - firstSub;
      if (diff > 0 && diff % 100 === 0) {
        possibleOffsets.push(diff);
      }
    }
    
    if (possibleOffsets.length > 0 && possibleOffsets.every(o => o === possibleOffsets[0])) {
      subGroupPattern = 'offset';
      offsetValue = possibleOffsets[0];
    } else {
      // Custom sequence - use increment as fallback but store the sequence
      subGroupPattern = 'sequence';
    }
  }

  const pattern: GroupPattern = {
    fixedMain,
    middleGroupPattern,
    subGroupPattern,
    offsetValue,
    objectsPerDevice: exampleAddresses.length,
    middleGroups: middleGroupPattern === 'perType' ? uniqueMiddles : undefined,
    startSub: subGroups[0]
  };

  return pattern;
}

/**
 * Generates a group address based on pattern and device/zone index
 * @param pattern Analyzed pattern
 * @param objectIndex Index of the object within the device (0-based)
 * @param deviceIndex Index of the device/zone (0-based, starting from 0)
 * @returns Group address as {main, middle, sub}
 */
export function generateAddressFromPattern(
  pattern: GroupPattern,
  objectIndex: number,
  deviceIndex: number
): { main: number; middle: number; sub: number } {
  const main = pattern.fixedMain;
  
  // Determine middle group
  let middle: number;
  if (pattern.middleGroupPattern === 'same') {
    // All objects use the same middle group
    middle = pattern.middleGroups?.[0] ?? 1;
  } else {
    // Different middle group per object type
    if (pattern.middleGroups && objectIndex < pattern.middleGroups.length) {
      middle = pattern.middleGroups[objectIndex];
    } else {
      // Fallback: use first middle group or increment
      middle = pattern.middleGroups?.[0] ?? 1 + objectIndex;
    }
  }
  
  // Determine sub group
  let sub: number;
  const startSub = pattern.startSub ?? 1;
  
  if (pattern.subGroupPattern === 'increment') {
    // Sequential: device 0 gets startSub, device 1 gets startSub+1, etc.
    // Within device: object 0, object 1, etc.
    sub = startSub + deviceIndex;
  } else if (pattern.subGroupPattern === 'offset') {
    // Offset pattern: device 0 gets startSub, device 1 gets startSub+offset
    const offset = pattern.offsetValue ?? 100;
    sub = startSub + (deviceIndex * offset);
  } else {
    // Sequence pattern: use the original sequence
    // For now, fallback to increment
    sub = startSub + deviceIndex;
  }
  
  return { main, middle, sub };
}


