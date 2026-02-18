// Pattern-based Group Address Generator
// Generates addresses using Teach by Example patterns

import {
  TeachByExampleTemplateConfig,
  TeachByExampleCategoryConfig,
  GroupAddressRow,
  AnyDevice
} from '../types/common';
import { generateAddressFromPattern } from './patternAnalyzer';
import { getTranslation, translateObjectName, Language } from '../i18n/translations';
import { translateUserInput, getStandardUserInput } from '../i18n/userInputTranslations';

/**
 * Generates group addresses using pattern-based approach
 */
import { NameDisplayOptions } from './index';

export function generateAddressesFromPattern(
  config: TeachByExampleTemplateConfig,
  devices: AnyDevice[],
  lang: string = 'nl',
  nameOptions?: NameDisplayOptions
): GroupAddressRow[] {
  const rows: GroupAddressRow[] = [];
  
  // Default name options (all enabled)
  const finalNameOptions: NameDisplayOptions = nameOptions || {
    showRoomAddress: true,
    showSwitchCode: true,
    showObjectName: true
  };

  // Migrate devices to standard versions (convert translated roomName/fixture to standard)
  // This ensures that even if devices were saved with translated values, they are converted to standard before translation
  const migratedDevices: AnyDevice[] = devices.map(device => {
    if ('outputs' in device && device.outputs) {
      return {
        ...device,
        outputs: device.outputs.map((output: any) => ({
          ...output,
          roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
          fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
        }))
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

  // Sort devices by physical address
  const sortedDevices = sortDevicesByPhysicalAddress(migratedDevices);

  // Process each category
  const categories = config.categories;

  // SWITCHING - support multiple switch groups
  const switchingConfig = categories.switching;
  if (switchingConfig) {
    // Normalize to array
    const switchingGroups = Array.isArray(switchingConfig) ? switchingConfig : [switchingConfig];
    const switchDevices = sortedDevices.filter(d => d.category === 'switch') as any[];
    
    // Check if dimming is linked to switching
    const dimmingConfig = categories.dimming;
    const dimmingGroups = dimmingConfig ? (Array.isArray(dimmingConfig) ? dimmingConfig : [dimmingConfig]) : [];
    const hasLinkedDimming = dimmingGroups.some(dg => dg.linkedToSwitching === true);
    
    // Process each switch group separately
    switchingGroups.forEach((switchGroup, groupIndex) => {
      // If switching is not enabled and dimming is not linked, skip
      // But if dimming is linked, we still need to process switch devices
      if (switchGroup.enabled === 'none' && !hasLinkedDimming) return;
      
      // Filter devices/outputs for this switch group
      const devicesForGroup = switchDevices.map(device => {
        const outputsForGroup = device.outputs.filter((output: any) => 
          (output.switchGroupIndex ?? 0) === groupIndex
        );
        if (outputsForGroup.length === 0) return null;
        return {
          ...device,
          outputs: outputsForGroup
        };
      }).filter(d => d !== null);
      
      if (devicesForGroup.length === 0) return;
      
      // If dimming is linked to switching, process switch and dimming devices together
      if (hasLinkedDimming) {
        // Find ALL linked dimming configs (there can be multiple)
        const linkedDimmingGroups = dimmingGroups.filter(dg => dg.linkedToSwitching === true);
        
        // Get dimming devices
        const dimmerDevices = sortedDevices.filter(d => d.category === 'dimmer') as any[];
        
        // Process each linked dimming group separately
        linkedDimmingGroups.forEach((linkedDimmingGroup) => {
          const actualDimGroupIndex = dimmingGroups.indexOf(linkedDimmingGroup);
          
          if (linkedDimmingGroup && linkedDimmingGroup.exampleAddresses && linkedDimmingGroup.exampleAddresses.length > 0) {
            // Get dimming devices for this specific dim group index
            const dimmingDevicesForGroup = dimmerDevices.map(device => {
              const outputsForGroup = device.outputs.filter((output: any) => 
                (output.dimGroupIndex ?? 0) === actualDimGroupIndex
              );
              if (outputsForGroup.length === 0) return null;
              return {
                ...device,
                outputs: outputsForGroup
              };
            }).filter(d => d !== null);
            
            // Get switch devices for this specific dim group index
            // When dimming is linked to switching, switch outputs should also have a dimGroupIndex
            // to determine which dim group they belong to
            const switchDevicesForGroup = devicesForGroup.map(device => {
              const outputsForGroup = device.outputs.filter((output: any) => 
                (output.dimGroupIndex ?? 0) === actualDimGroupIndex
              );
              if (outputsForGroup.length === 0) return null;
              return {
                ...device,
                outputs: outputsForGroup
              };
            }).filter(d => d !== null);
            
            if (dimmingDevicesForGroup.length === 0 && switchDevicesForGroup.length === 0) return; // Skip if no devices for this group
            
            // Combine switch and dimming devices, then sort by physical address
            const allDevices = [...switchDevicesForGroup, ...dimmingDevicesForGroup];
            const sortedCombinedDevices = sortDevicesByPhysicalAddress(allDevices);
            
            // Create a shared address counters Map so switch and dimming devices get sequential addresses
            const sharedCounters = new Map<string, number>();
            // Create a shared Set to track created sub-0 addresses so they're only created once
            const sharedSubZeroAddresses = new Set<string>();
            
            // Create configs for both switch and dimming
            const modifiedSwitchGroup: TeachByExampleCategoryConfig = {
              ...switchGroup,
              exampleAddresses: linkedDimmingGroup.exampleAddresses.map(addr => ({ ...addr })),
              // Ensure pattern is copied from switching if available, otherwise use dimming pattern
              pattern: switchGroup.pattern || linkedDimmingGroup.pattern,
              // Ensure enabled is set to 'full' so switch devices get addresses
              enabled: switchGroup.enabled || 'full'
            };
          
            const modifiedDimmingGroup: TeachByExampleCategoryConfig = {
              ...switchGroup,
              exampleAddresses: linkedDimmingGroup.exampleAddresses.map(addr => ({ ...addr })),
              // Ensure pattern is copied from switching if available
              pattern: switchGroup.pattern || linkedDimmingGroup.pattern,
              // Ensure enabled is set to 'full' so dimming devices get normal names
              enabled: linkedDimmingGroup.enabled || 'full'
            };
          
          // Process devices in sorted order (by physical address)
          // Each device is processed individually to maintain sequential addressing
          sortedCombinedDevices.forEach(device => {
            if (device.category === 'switch') {
              // Process switch device (they get "---" for dimmen, waarde, waarde status)
              processCategory(
                'switching',
                modifiedSwitchGroup,
                [device], // Process one device at a time
                rows,
                config,
                lang,
                false,
                groupIndex, // Pass group index
                true, // Mark that dimming is linked - will use "---" for dimmen, waarde, waarde status
                sharedCounters, // Pass shared counters
                sharedSubZeroAddresses, // Pass shared sub-0 addresses Set
                finalNameOptions // nameOptions
              );
            } else if (device.category === 'dimmer') {
              // Process dimming device (they get normal names)
              // Use actualDimGroupIndex instead of groupIndex so the correct dim group name is used
              processCategory(
                'dimming',
                modifiedDimmingGroup,
                [device], // Process one device at a time
                rows,
                config,
                lang,
                false, // Don't mark as unused - dimming devices should have normal names
                actualDimGroupIndex, // Pass actual dim group index, not switch group index
                false, // Not a switch with linked dimming
                sharedCounters, // Pass same shared counters to continue sequential numbering
                sharedSubZeroAddresses, // Pass same shared sub-0 addresses Set
                finalNameOptions // nameOptions
              );
            }
          });
        }
      });
      } else {
        // Fallback to normal processing if no dimming config found
        processCategory(
          'switching',
          switchGroup,
          devicesForGroup,
          rows,
          config,
          lang,
          false,
          groupIndex, // Pass group index
          false, // isSwitchWithLinkedDimming
          undefined, // sharedAddressCounters
          undefined, // sharedCreatedSubZeroAddresses
          finalNameOptions // nameOptions
        );
      }
    });
  }

  // DIMMING - support multiple dim groups
  const dimmingConfig = categories.dimming;
  if (dimmingConfig) {
    // Normalize to array
    const dimmingGroups = Array.isArray(dimmingConfig) ? dimmingConfig : [dimmingConfig];
    const dimmerDevices = sortedDevices.filter(d => d.category === 'dimmer') as any[];
    
    // Process each dim group separately
    dimmingGroups.forEach((dimGroup, groupIndex) => {
      if (dimGroup.enabled === 'none') return;
      
      // Debug: log all dimmer outputs and their dimGroupIndex values
      console.log(`[patternGenerator] Checking dim group ${groupIndex} (${dimGroup.groupName}):`);
      dimmerDevices.forEach(device => {
        device.outputs.forEach((output: any) => {
          console.log(`  Device ${device.id}, Output ${output.id}: dimGroupIndex = ${output.dimGroupIndex ?? 'undefined (defaults to 0)'}`);
        });
      });
      
      // Filter devices/outputs for this dim group
      const devicesForGroup = dimmerDevices.map(device => {
        const outputsForGroup = device.outputs.filter((output: any) => {
          const outputDimGroupIndex = output.dimGroupIndex ?? 0;
          const matches = outputDimGroupIndex === groupIndex;
          if (matches) {
            console.log(`[patternGenerator] Match found: device ${device.id}, output ${output.id}, dimGroupIndex ${outputDimGroupIndex} === groupIndex ${groupIndex}`);
          }
          return matches;
        });
        if (outputsForGroup.length === 0) return null;
        return {
          ...device,
          outputs: outputsForGroup
        };
      }).filter(d => d !== null);
      
      console.log(`[patternGenerator] Dim group ${groupIndex} (${dimGroup.groupName}): found ${devicesForGroup.length} devices with outputs`);
      
      if (devicesForGroup.length === 0) {
        console.log(`[patternGenerator] Dim group ${groupIndex} (${dimGroup.groupName}): skipping because no devices found`);
        return;
      }
      
      // Check if dimming is linked to switching
      if (dimGroup.linkedToSwitching && categories.switching) {
        // When dimming is linked to switching, dimming devices are already processed
        // together with switch devices in the switching section (sorted by physical address)
        // So we skip processing here to avoid duplicates
        console.log(`[patternGenerator] Dim group ${groupIndex} (${dimGroup.groupName}): skipping because linked to switching`);
        return;
      } else {
        console.log(`[patternGenerator] Calling processCategory for dim group ${groupIndex} (${dimGroup.groupName}) with ${devicesForGroup.length} devices`);
        const rowsBefore = rows.length;
        processCategory(
          'dimming',
          dimGroup,
          devicesForGroup,
          rows,
          config,
          lang,
          false,
          groupIndex, // Pass group index
          false, // isSwitchWithLinkedDimming
          undefined, // sharedAddressCounters
          undefined, // sharedCreatedSubZeroAddresses
          finalNameOptions // nameOptions
        );
        const rowsAfter = rows.length;
        console.log(`[patternGenerator] Generated ${rowsAfter - rowsBefore} addresses for dim group ${groupIndex} (${dimGroup.groupName})`);
        // Log first few addresses
        if (rowsAfter > rowsBefore) {
          const newRows = rows.slice(rowsBefore, rowsBefore + Math.min(3, rowsAfter - rowsBefore));
          newRows.forEach(row => {
            console.log(`  Address: ${row.groupAddress}, name: ${row.name}`);
          });
        }
      }
    });
  }

  // SHADING - support multiple blind groups
  const shadingConfig = categories.shading;
  if (shadingConfig) {
    // Normalize to array
    const shadingGroups = Array.isArray(shadingConfig) ? shadingConfig : [shadingConfig];
    const blindDevices = sortedDevices.filter(d => d.category === 'blind') as any[];
    
    // Process each blind group separately
    shadingGroups.forEach((shadeGroup, groupIndex) => {
      if (shadeGroup.enabled === 'none') return;
      
      // Filter devices/outputs for this blind group
      const devicesForGroup = blindDevices.map(device => {
        const outputsForGroup = device.outputs.filter((output: any) => 
          (output.blindGroupIndex ?? 0) === groupIndex
        );
        if (outputsForGroup.length === 0) return null;
        return {
          ...device,
          outputs: outputsForGroup
        };
      }).filter(d => d !== null);
      
      if (devicesForGroup.length === 0) return;
      
      processCategory(
        'shading',
        shadeGroup,
        devicesForGroup,
        rows,
        config,
        lang,
        false,
        groupIndex, // Pass group index
        false, // isSwitchWithLinkedDimming
        undefined, // sharedAddressCounters
        undefined, // sharedCreatedSubZeroAddresses
        finalNameOptions // nameOptions
      );
    });
  }

  // HVAC
  const hvacConfig = categories.hvac;
  if (hvacConfig) {
    // Normalize to array and process first config (HVAC typically has single config)
    const hvacGroups = Array.isArray(hvacConfig) ? hvacConfig : [hvacConfig];
    const hvacGroup = hvacGroups[0];
    if (hvacGroup && hvacGroup.enabled !== 'none') {
      const hvacDevices = sortedDevices.filter(d => d.category === 'hvac');
      processCategory(
        'hvac',
        hvacGroup,
        hvacDevices,
        rows,
        config,
        lang,
        false, // markAsUnused
        undefined, // dimGroupIndex
        false, // isSwitchWithLinkedDimming
        undefined, // sharedAddressCounters
        undefined, // sharedCreatedSubZeroAddresses
        finalNameOptions // nameOptions
      );
    }
  }

  // Generate fixed addresses (centraal and scène's) with auto-generate if enabled
  // Note: We need the full template config to access fixed addresses
  // This will be called from generateGroupAddresses in index.ts which has access to the template

  return rows;
}

function processCategory(
  categoryKey: string,
  categoryConfig: TeachByExampleCategoryConfig,
  devices: AnyDevice[],
  rows: GroupAddressRow[],
  templateConfig: TeachByExampleTemplateConfig,
  lang: string,
  markAsUnused: boolean = false,
  dimGroupIndex?: number, // For dimming: which dim group (0, 1, 2, etc.)
  isSwitchWithLinkedDimming: boolean = false, // For switching: if dimming is linked, use 5 objects with "---" for dimmen/waarde/waarde status
  sharedAddressCounters?: Map<string, number>, // Optional shared address counters for linked categories
  sharedCreatedSubZeroAddresses?: Set<string>, // Optional shared Set to track created sub-0 addresses for linked categories
  nameOptions?: NameDisplayOptions // Optional name display options
) {
  // Default name options (all enabled)
  const finalNameOptions: NameDisplayOptions = nameOptions || {
    showRoomAddress: true,
    showSwitchCode: true,
    showObjectName: true
  };
  // Check if we have a pattern and example addresses (for regular objects)
  const hasPattern = categoryConfig.pattern && categoryConfig.exampleAddresses.length > 0;
  const hasExtraObjects = categoryConfig.extraObjects && categoryConfig.extraObjects.length > 0;
  
  // If no pattern and no extra objects, nothing to process
  if (!hasPattern && !hasExtraObjects) {
    return; // No pattern analyzed yet and no extra objects
  }

  const pattern = categoryConfig.pattern;
  const unusedName = categoryKey === 'dimming' 
    ? (templateConfig.categories.dimming as any)?.unusedName || '---'
    : '---';

  // Handle HVAC separately (uses zones instead of outputs)
  // Note: finalNameOptions is available in the outer scope
  if (categoryKey === 'hvac') {
    if (!hasPattern || !pattern || categoryConfig.exampleAddresses.length === 0) {
      return; // Cannot process HVAC without pattern
    }

    // Analyze template to determine HVAC structure
    // First, analyze the example addresses to detect if they contain multiple zones
    const exampleAddresses = categoryConfig.exampleAddresses;
    const firstExample = exampleAddresses[0];
    
    // Group example addresses by zone to detect multiple zones
    // A zone is identified by:
    // 1. Different middle groups (if middleIncrement === 1)
    // 2. Different main groups (if mainIncrement === 1, extra main groups)
    // 3. Sub numbers that suggest multiple zones (e.g., if objectsPerZone can be determined)
    const middleIncrement = firstExample.middleIncrement ?? 0;
    const mainIncrement = firstExample.mainIncrement ?? 0;
    
    // Debug: log increments from example addresses
    console.log('[HVAC Pattern Analysis] Example addresses analysis:', {
      totalExamples: exampleAddresses.length,
      firstExample: {
        main: firstExample.main,
        middle: firstExample.middle,
        sub: firstExample.sub,
        mainIncrement: firstExample.mainIncrement,
        middleIncrement: firstExample.middleIncrement,
        subIncrement: firstExample.subIncrement
      },
      allIncrements: exampleAddresses.map((addr, idx) => ({
        index: idx,
        objectName: addr.objectName,
        main: addr.main,
        middle: addr.middle,
        sub: addr.sub,
        mainIncrement: addr.mainIncrement,
        middleIncrement: addr.middleIncrement,
        subIncrement: addr.subIncrement
      }))
    });
    
    // Determine HVAC mode:
    // - If middleIncrement === 1: every middle group is a zone, names are object names
    // - If middleIncrement !== 1 and objects share middle group: middle group name is send object name (lowest sub)
    const isZonePerMiddleGroup = middleIncrement === 1;
    const startMiddle = firstExample.middle;
    
    // Analyze example addresses to detect how many zones they represent
    // and what the pattern is for subsequent zones
    let objectsPerZone = exampleAddresses.length;
    let zonesInExamples = 1;
    
    if (isZonePerMiddleGroup) {
      // Mode 1: Each middle group = one zone
      // Count unique middle groups in example addresses
      const uniqueMiddles = new Set(exampleAddresses.map(addr => addr.middle));
      zonesInExamples = uniqueMiddles.size;
      objectsPerZone = exampleAddresses.length / zonesInExamples;
    } else if (mainIncrement === 1) {
      // Extra main groups: each main group = one zone (or part of zones)
      // Count unique main groups in example addresses
      const uniqueMains = new Set(exampleAddresses.map(addr => addr.main));
      if (uniqueMains.size > 1) {
        // Multiple main groups in examples = multiple zones
        zonesInExamples = uniqueMains.size;
        objectsPerZone = exampleAddresses.length / zonesInExamples;
      }
    } else {
      // Mode 2: Objects share middle groups
      // Check if sub numbers suggest multiple zones
      // If we can detect a pattern where sub numbers repeat (e.g., 1,2,3,1,2,3), that's multiple zones
      const subs = exampleAddresses.map(addr => addr.sub).sort((a, b) => a - b);
      const startSub = pattern?.startSub ?? subs[0];
      
      // Try to detect if subs repeat (suggesting multiple zones with same sub pattern)
      // For example: [1, 2, 3, 4, 5, 6] could be 2 zones of 3 objects each, or 3 zones of 2 objects each
      // Look for patterns where the difference between consecutive subs suggests zone boundaries
      if (subs.length > 2) {
        // Check if there's a clear pattern where subs reset (e.g., 1,2,3,1,2,3 or 1,2,1,2)
        // Try different zone counts to see if subs repeat
        for (let testZones = 2; testZones <= Math.floor(subs.length / 2); testZones++) {
          const testObjectsPerZone = Math.floor(subs.length / testZones);
          if (testObjectsPerZone * testZones === subs.length) {
            // Check if subs repeat in this pattern
            let matches = true;
            for (let zoneIdx = 0; zoneIdx < testZones && matches; zoneIdx++) {
              for (let objIdx = 0; objIdx < testObjectsPerZone && matches; objIdx++) {
                const expectedSub = startSub + objIdx;
                const actualSub = subs[zoneIdx * testObjectsPerZone + objIdx];
                // Allow some variation (e.g., status offset of 100)
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
    }
    
    console.log(`[HVAC Pattern Analysis] zonesInExamples=${zonesInExamples}, objectsPerZone=${objectsPerZone}, isZonePerMiddleGroup=${isZonePerMiddleGroup}`);
    
    // Track which main/middle combinations already have a sub-0 address created for HVAC
    const hvacCreatedSubZeroAddresses = new Set<string>();
    
    // Track created group addresses to prevent duplicates
    const createdAddresses = new Set<string>();
    
    // Helper function to check and add address, returns true if added (new), false if duplicate
    const addAddressIfUnique = (ga: string): boolean => {
      if (createdAddresses.has(ga)) {
        return false;
      }
      createdAddresses.add(ga);
      return true;
    };
    
    // Counter for zones (used to assign unique middle group numbers when middleIncrement === 1)
    let zoneCounter = 0;
    
    // Helper function to get main/middle for zone when middleIncrement === 1
    // Handles wrapping middle groups (0-7) and moving to extra main groups if needed
    const getZoneMainAndMiddle = (counter: number): { main: number; middle: number } => {
      const baseMain = pattern.fixedMain;
      const totalMiddleGroups = 8; // 0-7
      const middleOffset = counter % totalMiddleGroups;
      const middle = (startMiddle + middleOffset) % totalMiddleGroups;
      
      // Check if we need to use extra main groups
      if (counter >= totalMiddleGroups && pattern.extraMainGroups && pattern.extraMainGroups.length > 0) {
        const extraGroupIndex = Math.floor((counter - (totalMiddleGroups - startMiddle)) / totalMiddleGroups);
        if (extraGroupIndex < pattern.extraMainGroups.length) {
          const extraGroup = pattern.extraMainGroups[extraGroupIndex];
          const remainingZones = counter - (extraGroupIndex * totalMiddleGroups) - (totalMiddleGroups - startMiddle);
          return {
            main: extraGroup.main,
            middle: (extraGroup.middle + remainingZones) % totalMiddleGroups
          };
        }
      }
      
      return { main: baseMain, middle };
    };
    
    // For Mode 2: track sub counters per middle group AND zone to ensure unique addresses
    // Key: `${main}-${middle}`, Value: next sub number (resets per zone)
    const subCounters = new Map<string, number>();
    
    // Collect all unique zones from all devices first, then process them with a global index
    // Deduplicate zones based on roomAddress + roomName combination
    const allZones: Array<{ zone: any; deviceIndex: number }> = [];
    const seenZones = new Set<string>(); // Track seen zones by "roomAddress|roomName"
    devices.forEach((device, deviceIndex) => {
      if (device.category !== 'hvac' || !('zones' in device) || !device.zones) return;
      
      // Sort zones by channel number
      const sortedZones = [...device.zones].sort((a, b) => {
        const channelA = extractChannelNumber(a.channelName || 'K1');
        const channelB = extractChannelNumber(b.channelName || 'K1');
        return channelA - channelB;
      });
      
      sortedZones.forEach((zone) => {
        // Create unique key for zone: roomAddress only (not roomName, because roomName can be translated)
        // Zones with the same roomAddress are considered the same zone, regardless of roomName
        const zoneKey = zone.roomAddress || '';
        if (!seenZones.has(zoneKey)) {
          seenZones.add(zoneKey);
          allZones.push({ zone, deviceIndex });
        }
      });
    });
    
    // Now process all zones with a global zone index
    console.log('[HVAC Debug] Total zones to process:', allZones.length);
    allZones.forEach(({ zone }, globalZoneIndex) => {
        console.log(`[HVAC Debug] Processing zone ${globalZoneIndex}: ${buildZoneName(zone, lang as Language)}`);
        // Process each object from example (only if pattern exists)
        if (hasPattern && pattern) {
          console.log(`[HVAC Debug] exampleAddresses.length: ${categoryConfig.exampleAddresses.length}`);
          categoryConfig.exampleAddresses.forEach((exampleObj, objIndex) => {
            let address: { main: number; middle: number; sub: number };
            
            console.log(`[HVAC Debug] Zone ${globalZoneIndex}, Object ${objIndex}: isZonePerMiddleGroup=${isZonePerMiddleGroup}`);
            if (isZonePerMiddleGroup) {
              // Mode 1: Every middle group is a zone
              // Use increments from example address to determine how main/middle/sub change per zone
              const mainIncrement = exampleObj.mainIncrement ?? 0;
              const middleIncrement = exampleObj.middleIncrement ?? 0;
              const subIncrement = exampleObj.subIncrement ?? 0;
              
              // Calculate main and middle based on increments
              const baseMain = exampleObj.main;
              const baseMiddle = exampleObj.middle;
              
              // For Mode 1, middleIncrement should be 1 (each zone gets new middle group)
              // But we still use the increment from example address
              const main = baseMain + (mainIncrement * zoneCounter);
              const middle = baseMiddle + (middleIncrement * zoneCounter);
              
              // Validate main and middle are within valid ranges
              const validatedMain = Math.max(0, Math.min(31, main));
              const validatedMiddle = Math.max(0, Math.min(7, middle));
              
              const startSub = pattern.startSub ?? 1;
              
              let sub: number;
              if (subIncrement > 0) {
                // Use subIncrement: zone 0 gets exampleObj.sub, zone 1 gets exampleObj.sub + subIncrement, etc.
                sub = exampleObj.sub + (subIncrement * zoneCounter);
              } else {
                // No subIncrement: each zone gets same sub numbers (startSub + objIndex)
                sub = startSub + objIndex;
              }
              
              // Validate sub doesn't exceed 255
              if (sub > 255) {
                console.warn(`[HVAC Mode 1] Sub ${sub} exceeds 255 for zone ${zoneCounter}, object ${objIndex}. Clamping to 255.`);
                sub = 255;
              }
              if (sub < 0) {
                console.warn(`[HVAC Mode 1] Sub ${sub} is negative for zone ${zoneCounter}, object ${objIndex}. Clamping to 0.`);
                sub = 0;
              }
              
              address = {
                main: validatedMain,
                middle: validatedMiddle,
                sub: Math.max(0, Math.min(255, sub))
              };
            } else {
              // Mode 2: Objects share middle groups (with potential status offset)
              // Use increments from example address to determine how main/middle change per zone
              const mainIncrement = exampleObj.mainIncrement ?? 0;
              const middleIncrement = exampleObj.middleIncrement ?? 0;
              
              // Calculate main and middle based on increments
              const baseMain = exampleObj.main;
              const baseMiddle = exampleObj.middle;
              
              const mainGroup = baseMain + (mainIncrement * globalZoneIndex);
              const middleGroup = baseMiddle + (middleIncrement * globalZoneIndex);
              
              // Validate main and middle are within valid ranges
              const validatedMain = Math.max(0, Math.min(31, mainGroup));
              const validatedMiddle = Math.max(0, Math.min(7, middleGroup));
              
              if (mainGroup !== validatedMain) {
                console.warn(`[HVAC Mode 2] Main ${mainGroup} out of range for zone ${globalZoneIndex}. Using ${validatedMain}.`);
              }
              if (middleGroup !== validatedMiddle) {
                console.warn(`[HVAC Mode 2] Middle ${middleGroup} out of range for zone ${globalZoneIndex}. Using ${validatedMiddle}.`);
              }
              // Counter key: since middleGroup is already unique per zone, we can use just main-middle
              // This ensures each zone (middle group) has its own counter that resets
              const counterKey = `${validatedMain}-${validatedMiddle}`;
              
              // Determine sub based on pattern
              console.log(`[HVAC Debug] Pattern type: ${pattern.subGroupPattern}, startSub: ${pattern.startSub}`);
              let sub: number;
              // Get current sub counter value, or initialize with startSub
              const startSub = pattern.startSub ?? 1;
              const currentSub = subCounters.get(counterKey) ?? startSub;
              
              // Use increments from example address to determine how sub changes per zone
              const subIncrement = exampleObj.subIncrement ?? 0;
              
              if (pattern.subGroupPattern === 'increment') {
                // For increment pattern: each zone gets all objects with sub 1, 2, 3, etc.
                // But we need to use the subIncrement from example address to determine how sub changes per zone
                if (subIncrement > 0) {
                  // Use subIncrement: zone 0 gets exampleObj.sub, zone 1 gets exampleObj.sub + subIncrement, etc.
                  sub = exampleObj.sub + (subIncrement * globalZoneIndex);
                } else {
                  // No subIncrement: each zone gets same sub numbers (startSub + objIndex)
                  sub = startSub + objIndex;
                }
                console.log(`[HVAC Debug] Increment pattern: startSub=${startSub}, objIndex=${objIndex}, subIncrement=${subIncrement}, globalZoneIndex=${globalZoneIndex}, calculated sub=${sub}`);
              } else if (pattern.subGroupPattern === 'offset') {
                const offset = pattern.offsetValue ?? 100;
                if (subIncrement > 0) {
                  // Use subIncrement from example
                  sub = exampleObj.sub + (subIncrement * globalZoneIndex);
                } else {
                  sub = currentSub;
                  subCounters.set(counterKey, currentSub + offset);
                }
              } else {
                // Sequence pattern - use object's sub from example
                if (subIncrement > 0) {
                  // Use subIncrement from example
                  sub = exampleObj.sub + (subIncrement * globalZoneIndex);
                } else {
                  // Use pattern-based calculation
                  const baseSub = exampleObj.sub;
                  const objectOffset = currentSub - startSub;
                  sub = baseSub + objectOffset;
                  subCounters.set(counterKey, currentSub + 1);
                }
              }
              
              // Validate sub doesn't exceed 255
              if (sub > 255) {
                console.warn(`[HVAC] Sub ${sub} exceeds 255 for zone ${globalZoneIndex}, object ${objIndex}. Clamping to 255.`);
                sub = 255;
              }
              if (sub < 0) {
                console.warn(`[HVAC] Sub ${sub} is negative for zone ${globalZoneIndex}, object ${objIndex}. Clamping to 0.`);
                sub = 0;
              }
              
              address = {
                main: validatedMain,
                middle: validatedMiddle,
                sub: Math.max(0, Math.min(255, sub))
              };
            }

            // If startSub is 1, add an address with sub 0 and name "---" once per middle group
            const subZeroKey = `${address.main}-${address.middle}`;
            const subZeroGA = `${address.main}/${address.middle}/0`;
            if (pattern.startSub === 1 && !hvacCreatedSubZeroAddresses.has(subZeroKey) && addAddressIfUnique(subZeroGA)) {
              rows.push({
                groupAddress: subZeroGA,
                name: '---',
                datapointType: exampleObj.dpt || 'DPT1.001',
                comment: '', // No comment for sub-0 addresses
                _sortKey: {
                  physicalAddress: [0, 0, 0], // HVAC doesn't have physical address
                  channelNumber: 0, // Sub-0 addresses come first
                  objectIndex: -0.5 // Sort before the actual objects
                }
              });
              hvacCreatedSubZeroAddresses.add(subZeroKey);
            }

            // Determine if this object should be named or marked as unused
            const shouldName = !markAsUnused && 
              categoryConfig.enabled === 'full' && 
              exampleObj.enabled;

            // Determine name based on mode
            let name: string;
            const translatedObjectName = translateObjectName(exampleObj.objectName, lang as Language);
            // For HVAC: always show objectName (objectnaam checkbox only applies to switching, dimming, shading)
            if (isZonePerMiddleGroup) {
              // Mode 1: Names are zonenaam objectnaam
              const zoneName = buildZoneName(zone, lang as Language, finalNameOptions);
              // Always include objectName for HVAC
              const objectNamePart = translatedObjectName || '';
              name = shouldName
                ? `${zoneName} ${objectNamePart}`.trim().toLowerCase()
                : unusedName;
            } else {
              // Mode 2: Names are zonenaam objectnaam
              const zoneName = buildZoneName(zone, lang as Language, finalNameOptions);
              // Always include objectName for HVAC
              const objectNamePart = translatedObjectName || '';
              name = shouldName
                ? `${zoneName} ${objectNamePart}`.trim().toLowerCase()
                : unusedName;
            }

            const groupAddress = `${address.main}/${address.middle}/${address.sub}`;
            
            // Skip if address already exists (prevent duplicates)
            const isUnique = addAddressIfUnique(groupAddress);
            console.log(`[HVAC Debug] Zone ${globalZoneIndex}, Object ${objIndex} (${exampleObj.objectName}): groupAddress=${groupAddress}, sub=${address.sub}, isUnique=${isUnique}`);
            if (!isUnique) {
              console.log(`[HVAC Debug] SKIPPING duplicate address: ${groupAddress}`);
              return; // Skip this address, it's a duplicate
            }
            
            // Comments are empty for HVAC addresses
            rows.push({
              groupAddress,
              name,
              datapointType: exampleObj.dpt || 'DPT1.001',
              comment: '', // Comments are empty for HVAC
              _sortKey: {
                physicalAddress: [0, 0, 0], // HVAC doesn't have physical address
                channelNumber: extractChannelNumber(zone.channelName || 'K1'),
                objectIndex: objIndex
              }
            });
          });
        }

        // Process extra objects if any (always process, even without pattern)
        if (hasExtraObjects && categoryConfig.extraObjects) {
          categoryConfig.extraObjects.forEach((extraObj, extraObjIndex) => {
            let address: { main: number; middle: number; sub: number };
            let name: string;
            
            // Get increments from first example address if available, otherwise use 0
            // These increments are used per zone, not per extra object
            const firstExample = categoryConfig.exampleAddresses?.[0];
            const mainIncrement = firstExample?.mainIncrement ?? 0;
            const middleIncrement = firstExample?.middleIncrement ?? 0;
            const subIncrement = extraObj.subIncrement ?? firstExample?.subIncrement ?? 0;
            
            // If startSub is 1 for first zone, add a sub-0 address with "---" once per middle group
            if (globalZoneIndex === 0 && pattern && pattern.startSub === 1) {
              const subZeroKey = `${extraObj.main}-${extraObj.middle ?? (startMiddle + globalZoneIndex)}`;
              const mainForCheck = extraObj.main !== undefined ? extraObj.main : (isZonePerMiddleGroup ? getZoneMainAndMiddle(zoneCounter).main : pattern.fixedMain);
              const middleForCheck = extraObj.middle !== undefined ? extraObj.middle : (isZonePerMiddleGroup ? getZoneMainAndMiddle(zoneCounter).middle : (startMiddle + globalZoneIndex));
              const subZeroGA = `${mainForCheck}/${middleForCheck}/0`;
              
              if (!hvacCreatedSubZeroAddresses.has(subZeroKey) && addAddressIfUnique(subZeroGA)) {
                rows.push({
                  groupAddress: subZeroGA,
                  name: '---',
                  datapointType: extraObj.dpt || 'DPT1.001',
                  comment: '',
                  _sortKey: {
                    physicalAddress: [0, 0, 0],
                    channelNumber: 0,
                    objectIndex: -0.5
                  }
                });
                hvacCreatedSubZeroAddresses.add(subZeroKey);
              }
            }
            
            // Use main/middle/sub from extraObj if explicitly set, otherwise calculate from pattern/example
            if (isZonePerMiddleGroup) {
              // Mode 1: Extra objects also get zone-specific middle group
              // Use main/middle from extraObj if set, otherwise calculate from zone
              const { main: zoneMain, middle: zoneMiddle } = getZoneMainAndMiddle(zoneCounter);
              
              // Calculate main: use extraObj.main if set, otherwise use zone main with increment
              const baseMain = extraObj.main !== undefined ? extraObj.main : zoneMain;
              const main = baseMain + (mainIncrement * globalZoneIndex);
              
              // Calculate middle: use extraObj.middle if set, otherwise use zone middle with increment
              const baseMiddle = extraObj.middle !== undefined ? extraObj.middle : zoneMiddle;
              const middle = baseMiddle + (middleIncrement * globalZoneIndex);
              
              // Calculate sub: use extraObj.sub as base, then apply increment per zone
              // If extraObj.sub is not set, calculate from pattern startSub + number of example objects
              const patternStartSub = pattern?.startSub ?? 1;
              const baseSub = extraObj.sub !== undefined 
                ? extraObj.sub 
                : (patternStartSub + categoryConfig.exampleAddresses.length + extraObjIndex);
              const sub = baseSub + (subIncrement * globalZoneIndex);
              
              address = {
                main: Math.max(0, Math.min(31, main)),
                middle: Math.max(0, Math.min(7, middle)),
                sub: Math.max(0, Math.min(255, sub))
              };
            } else {
              // Mode 2: Extra objects use their configured middle group or zone's middle group
              // Calculate main: use extraObj.main if set, otherwise use pattern.fixedMain
              const baseMain = extraObj.main !== undefined ? extraObj.main : pattern.fixedMain;
              const main = baseMain + (mainIncrement * globalZoneIndex);
              
              // Calculate middle: use extraObj.middle if set, otherwise use zone's middle group
              const baseMiddle = extraObj.middle !== undefined ? extraObj.middle : (startMiddle + globalZoneIndex);
              const middle = baseMiddle + (middleIncrement * globalZoneIndex);
              
              const counterKey = `${main}-${middle}`;
              
              // Calculate sub based on pattern subGroupPattern and extraObj.sub
              let sub: number;
              if (extraObj.sub !== undefined) {
                // Use explicit sub from extraObj with increment per zone
                sub = extraObj.sub + (subIncrement * globalZoneIndex);
              } else if (pattern?.subGroupPattern === 'increment') {
                // For increment pattern: continue from last example object + increment per zone
                const lastExampleSub = categoryConfig.exampleAddresses.length > 0
                  ? categoryConfig.exampleAddresses[categoryConfig.exampleAddresses.length - 1].sub
                  : (pattern.startSub ?? 1);
                const baseSub = lastExampleSub + 1 + extraObjIndex;
                sub = baseSub + (subIncrement * globalZoneIndex);
              } else {
                // Sequence/offset pattern: use counter, but increment per zone
                if (!subCounters.has(counterKey)) {
                  const lastExampleSub = categoryConfig.exampleAddresses.length > 0
                    ? categoryConfig.exampleAddresses[categoryConfig.exampleAddresses.length - 1].sub
                    : (pattern.startSub ?? 1);
                  // Start counter after all example objects
                  subCounters.set(counterKey, lastExampleSub + 1);
                }
                const currentSub = subCounters.get(counterKey)!;
                // Add zone-based increment
                sub = currentSub + (subIncrement * globalZoneIndex);
                // Increment counter for next extra object in same zone
                subCounters.set(counterKey, currentSub + 1);
              }
              
              address = {
                main: Math.max(0, Math.min(31, main)),
                middle: Math.max(0, Math.min(7, middle)),
                sub: Math.max(0, Math.min(255, sub))
              };
            }
            
            // Build name: roomAddress + roomName + objectName (translated)
            // Format: "1.2 woonkamer gemeten temperatuur" (roomAddress roomName objectName)
            // For HVAC: always show objectName (objectnaam checkbox only applies to switching, dimming, shading)
            const zoneName = buildZoneName(zone, lang as Language, finalNameOptions);
            const translatedObjectName = translateObjectName(extraObj.name, lang as Language);
            // Always include objectName for HVAC
            const objectNamePart = translatedObjectName || '';
            name = objectNamePart ? `${zoneName} ${objectNamePart}`.trim().toLowerCase() : zoneName;

            const groupAddress = `${address.main}/${address.middle}/${address.sub}`;
            
            // Skip if address already exists (prevent duplicates)
            if (!addAddressIfUnique(groupAddress)) {
              return; // Skip this address, it's a duplicate
            }
            
            // Comments are empty for HVAC addresses
            rows.push({
              groupAddress,
              name,
              datapointType: extraObj.dpt || 'DPT1.001',
              comment: '', // Comments are empty for HVAC
              _sortKey: {
                physicalAddress: [0, 0, 0], // HVAC doesn't have physical address
                channelNumber: extractChannelNumber(zone.channelName || 'K1'),
                objectIndex: (hasPattern ? categoryConfig.exampleAddresses.length : 0) + extraObjIndex
              }
            });
          });
        }
        
        
        // Increment zone counter after processing all objects for this zone
        zoneCounter++;
    });
    return; // Early return for HVAC
  }

  // Global counter per object type (key: "main-middle-objIndex" or "objIndex" if increments vary)
  // This ensures sequential numbering across all devices and outputs
  // Use shared counter if provided (for linked categories), otherwise create new one
  const addressCounters = sharedAddressCounters || new Map<string, number>();
  
  // Track which main/middle combinations already have a sub-0 address created
  // This ensures sub-0 addresses are created only once per middle group
  // Use shared Set if provided (for linked categories), otherwise create new one
  const createdSubZeroAddresses = sharedCreatedSubZeroAddresses || new Set<string>();

  // Group devices by physical address and sort outputs by channel (for non-HVAC)
  devices.forEach((device) => {
    if (!('outputs' in device) || !device.outputs) return;

    // Filter outputs by groupIndex if specified for this category
    let outputsToProcess: any[] = device.outputs as any[];
    if (dimGroupIndex !== undefined) {
      if (categoryKey === 'dimming') {
        outputsToProcess = (device.outputs as any[]).filter((output: any) => 
          (output.dimGroupIndex ?? 0) === dimGroupIndex
        );
      } else if (categoryKey === 'switching') {
        outputsToProcess = (device.outputs as any[]).filter((output: any) => 
          (output.switchGroupIndex ?? 0) === dimGroupIndex
        );
      } else if (categoryKey === 'shading') {
        outputsToProcess = (device.outputs as any[]).filter((output: any) => 
          (output.blindGroupIndex ?? 0) === dimGroupIndex
        );
      }
    }

    // Sort outputs by channel number
    const sortedOutputs = [...outputsToProcess].sort((a, b) => {
      const channelA = extractChannelNumber(a.channelName);
      const channelB = extractChannelNumber(b.channelName);
      return channelA - channelB;
    });

    sortedOutputs.forEach((output, outputIndex) => {
      // Track which main/middle combinations we use for this output
      const usedCounterKeys = new Set<string>();
      
      // Process each object from example (only if pattern exists)
      if (hasPattern && pattern) {
        // Debug: log which dim group and main group we're using
        if (categoryKey === 'dimming' && dimGroupIndex !== undefined) {
          console.log('[patternGenerator] Processing dim group:', {
            dimGroupIndex,
            groupName: (categoryConfig as any).groupName,
            fixedMain: pattern.fixedMain,
            deviceCount: devices.length
          });
        }
        
        categoryConfig.exampleAddresses.forEach((exampleObj, objIndex) => {
          // Get increments from example address (these define how addresses change for next device)
          const mainIncrement = exampleObj.mainIncrement ?? 0;
          const middleIncrement = exampleObj.middleIncrement ?? 0;
          const subIncrement = exampleObj.subIncrement ?? 0;
          
          // Get base main and middle for this object type from the example address
          // Use the actual example address values as base, not the pattern
          const baseMain = exampleObj.main;
          let baseMiddle: number;
          if (pattern.middleGroupPattern === 'same') {
            baseMiddle = pattern.middleGroups?.[0] ?? exampleObj.middle;
          } else {
            if (pattern.middleGroups && objIndex < pattern.middleGroups.length) {
              baseMiddle = pattern.middleGroups[objIndex];
            } else {
              baseMiddle = exampleObj.middle;
            }
          }
          
          // Counter key should be per object type (objIndex) to handle different increments per object
          // This ensures each object type has its own counter
          const counterKey = `obj-${objIndex}`;
          usedCounterKeys.add(counterKey);
          const currentCounter = addressCounters.get(counterKey) || 0;
          
          // Calculate actual main, middle, and sub based on increments and counter
          // Start from the example address values and apply increments per device
          const main = baseMain + (mainIncrement * currentCounter);
          const middle = baseMiddle + (middleIncrement * currentCounter);
          
          // For sub, use subIncrement from example address if > 0, otherwise use pattern-based generation
          let sub: number;
          if (subIncrement > 0) {
            // Use subIncrement from example address
            sub = exampleObj.sub + (subIncrement * currentCounter);
          } else {
            // Use pattern-based sub generation
            const baseAddress = generateAddressFromPattern(
              pattern,
              objIndex,
              currentCounter
            );
            sub = baseAddress.sub;
          }
          
          // Create final address with increments applied
          const address = {
            main: Math.max(0, Math.min(31, main)),
            middle: Math.max(0, Math.min(7, middle)),
            sub: Math.max(0, Math.min(255, sub))
          };
          
          // Debug: log generated address for dimming
          if (categoryKey === 'dimming' && dimGroupIndex !== undefined && outputIndex === 0 && objIndex === 0) {
            console.log('[patternGenerator] Generated address for dim group:', {
              dimGroupIndex,
              groupName: (categoryConfig as any).groupName,
              address: `${address.main}/${address.middle}/${address.sub}`,
              deviceId: device.id,
              outputId: output.id
            });
          }

          // If startSub is 1, add an address with sub 0 and name "---" once per middle group
          // Check if we've already created a sub-0 address for this main/middle combination
          const subZeroKey = `${address.main}-${address.middle}`;
          if (pattern.startSub === 1 && !createdSubZeroAddresses.has(subZeroKey)) {
            const physicalAddr = 'physicalAddress' in device ? device.physicalAddress : 'n/a';
            rows.push({
              groupAddress: `${address.main}/${address.middle}/0`,
              name: '---',
              datapointType: exampleObj.dpt || 'DPT1.001',
              comment: '', // No comment for sub-0 addresses
              _sortKey: {
                physicalAddress: parsePhysicalAddress(physicalAddr),
                channelNumber: 0, // Sub-0 addresses come first
                objectIndex: -0.5 // Sort before the actual objects
              }
            });
            createdSubZeroAddresses.add(subZeroKey);
          }

          // Determine if this object should be named or marked as unused
          const shouldName = !markAsUnused && 
            categoryConfig.enabled === 'full' && 
            exampleObj.enabled;

          // For switch devices with linked dimming, use "---" for dimmen, waarde, and waarde status objects
          // But "aan/uit" and "aan/uit status" should always get normal names
          let name: string;
          if (isSwitchWithLinkedDimming) {
            const objectNameLower = exampleObj.objectName.toLowerCase().trim();
            // Normalize object name for comparison (handle both "aan/uit" and "aan / uit" variants)
            const normalizedName = objectNameLower.replace(/\s+/g, ' ');
            
            // Check if this is one of the objects that should be "---" for switch devices
            if (normalizedName === 'dimmen' || normalizedName === 'waarde' || normalizedName === 'waarde status') {
              name = '---';
            } else {
              // For "aan/uit" and "aan/uit status", always use normal name (even if shouldName is false)
              // Check for various formats: "aan/uit", "aan / uit", "aan/uit status", "aan / uit status"
              const isOnOff = normalizedName === 'aan/uit' || normalizedName === 'aan / uit' || 
                             normalizedName === 'aan/uit status' || normalizedName === 'aan / uit status';
              
              if (isOnOff) {
                // Always use normal name for aan/uit and aan/uit status
                name = buildNameFromOutput(output, exampleObj.objectName, lang as Language, finalNameOptions);
              } else {
                // For other objects, use normal name if shouldName is true, otherwise unusedName
                name = shouldName
                  ? buildNameFromOutput(output, exampleObj.objectName, lang as Language, finalNameOptions)
                  : unusedName;
              }
            }
          } else {
            name = shouldName
              ? buildNameFromOutput(output, exampleObj.objectName, lang as Language, finalNameOptions)
              : unusedName;
          }

          const t = getTranslation(lang as any);
          const physicalAddr = 'physicalAddress' in device ? device.physicalAddress : 'n/a';
          // Ensure output word starts with lowercase letter
          const outputWord = t.output.charAt(0).toLowerCase() + t.output.slice(1);
          rows.push({
            groupAddress: `${address.main}/${address.middle}/${address.sub}`,
            name,
            datapointType: exampleObj.dpt || 'DPT1.001',
            comment: `${physicalAddr} ${outputWord} ${output.channelName}`,
            _sortKey: {
              physicalAddress: parsePhysicalAddress(physicalAddr),
              channelNumber: extractChannelNumber(output.channelName),
              objectIndex: objIndex
            }
          });
        });
        
        // Increment counters for all object types used in this output
        // Each object type has its own counter, which is incremented after processing one device
        // The actual address increments (mainIncrement, middleIncrement, subIncrement) are applied
        // per object using their individual increments from the example addresses
        usedCounterKeys.forEach(counterKey => {
          const currentCounter = addressCounters.get(counterKey) || 0;
          // Increment by 1 (one device processed)
          // The actual address increments are applied per object using their individual increments
          addressCounters.set(counterKey, currentCounter + 1);
        });
      }

      // Process extra objects if any (always process, even without pattern)
      if (hasExtraObjects && categoryConfig.extraObjects) {
        categoryConfig.extraObjects.forEach((extraObj, extraObjIndex) => {
          // Extra objects use their fixed addresses (main/middle/sub)
          // They don't need a pattern

          // If pattern exists and startSub is 1, add a sub-0 address with "---" once per middle group
          // This should happen before the actual extra object address
          if (hasPattern && pattern && pattern.startSub === 1) {
            const subZeroKey = `${extraObj.main}-${extraObj.middle}`;
            if (!createdSubZeroAddresses.has(subZeroKey)) {
              const physicalAddr = 'physicalAddress' in device ? device.physicalAddress : 'n/a';
              rows.push({
                groupAddress: `${extraObj.main}/${extraObj.middle}/0`,
                name: '---',
                datapointType: extraObj.dpt || 'DPT1.001',
                comment: '', // No comment for sub-0 addresses
                _sortKey: {
                  physicalAddress: parsePhysicalAddress(physicalAddr),
                  channelNumber: 0, // Sub-0 addresses come first
                  objectIndex: -0.5 // Sort before the actual objects
                }
              });
              createdSubZeroAddresses.add(subZeroKey);
            }
          }

          // Extra objects always get names
          const name = buildNameFromOutput(output, extraObj.name, lang as Language, finalNameOptions);

          const t = getTranslation(lang as any);
          const physicalAddr = 'physicalAddress' in device ? device.physicalAddress : 'n/a';
          // Ensure output word starts with lowercase letter
          const outputWord = t.output.charAt(0).toLowerCase() + t.output.slice(1);
          rows.push({
            groupAddress: `${extraObj.main}/${extraObj.middle}/${extraObj.sub}`,
            name,
            datapointType: extraObj.dpt || 'DPT1.001',
            comment: `${physicalAddr} ${outputWord} ${output.channelName}`,
            _sortKey: {
              physicalAddress: parsePhysicalAddress(physicalAddr),
              channelNumber: extractChannelNumber(output.channelName),
              objectIndex: (hasPattern ? categoryConfig.exampleAddresses.length : 0) + extraObjIndex
            }
          });
        });
      }
    });
  });
}

// Helper function to build zone name (roomAddress + roomName, e.g., "0.1 entree")
// Translates roomName to the target language
function buildZoneName(zone: any, lang: Language = 'nl', nameOptions?: NameDisplayOptions): string {
  const addressPart = (nameOptions?.showRoomAddress !== false && zone.roomAddress && zone.roomAddress.trim()) ? `${zone.roomAddress} ` : '';
  
  // Translate roomName to target language
  let roomPart = '';
  if (zone.roomName && zone.roomName.trim()) {
    const standardRoomName = getStandardUserInput(zone.roomName, 'roomName') || zone.roomName;
    roomPart = translateUserInput(standardRoomName, lang, 'roomName');
  }
  
  return `${addressPart}${roomPart}`.trim();
}

function buildNameFromOutput(output: any, functionName?: string, lang: Language = 'nl', nameOptions?: NameDisplayOptions): string {
  // Build name similar to buildName
  // Format: roomAddress roomName fixture switchCode objectName
  // Translate roomName, fixture, and objectName to target language
  const addressPart = (nameOptions?.showRoomAddress !== false && output.roomAddress && output.roomAddress.trim()) ? output.roomAddress : '';
  
  let translatedRoomName = '';
  if (output.roomName && output.roomName.trim()) {
    const standardRoomName = getStandardUserInput(output.roomName, 'roomName') || output.roomName;
    translatedRoomName = translateUserInput(standardRoomName, lang, 'roomName');
  }
  
  let translatedFixture = '';
  if (output.fixture && output.fixture.trim()) {
    const standardFixture = getStandardUserInput(output.fixture, 'fixture') || output.fixture;
    translatedFixture = translateUserInput(standardFixture, lang, 'fixture');
  }
  
  // Translate object name (functionName) using translateObjectName
  let translatedObjectName = '';
  if (functionName && functionName.trim() && nameOptions?.showObjectName !== false) {
    translatedObjectName = translateObjectName(functionName, lang);
  }
  
  const parts = [
    addressPart,
    translatedRoomName,
    translatedFixture,
    (nameOptions?.showSwitchCode !== false && output.switchCode) ? output.switchCode : '',
    translatedObjectName
  ].filter(p => p && p.trim());
  
  return parts.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractChannelNumber(channelName: string): number {
  const match = channelName.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function parsePhysicalAddress(addr: string): number[] {
  try {
    return addr.split('.').map(Number);
  } catch {
    return [999, 999, 999];
  }
}

function sortDevicesByPhysicalAddress(devices: AnyDevice[]): AnyDevice[] {
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
}


