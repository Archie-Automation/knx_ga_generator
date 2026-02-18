import { useState, useEffect, useMemo, useRef } from 'react';
import { DimmerDevice, DimmerOutput, DimmerTemplate, DeviceCategory, AnyDevice } from '../../types/common';
import { uid } from '../../utils/id';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../i18n/useTranslation'; // Keep for lang access temporarily
import { translateUserInput, getStandardUserInput } from '../../i18n/userInputTranslations';
import { useAppStore } from '../../store';

interface Props {
  onSave: (device: DimmerDevice) => void;
  onUpdate?: (device: DimmerDevice) => void;
  count: number;
  onCountChange: (count: number) => void;
  existing: DimmerDevice[];
}

interface ActorData {
  id: string;
  manufacturer: string;
  model: string;
  physicalAddress: string;
  channelCount: number;
  outputs: DimmerOutput[];
}

// Extract channel number from channelName (e.g., "K1" -> 1, "D2" -> 2, "CH3" -> 3)
const extractChannelNumber = (channelName: string): number => {
  const match = channelName.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

// Parse da channel name (e.g., "da2.1" -> { group: 2, channel: 1 })
const parseDaChannelName = (channelName: string): { group: number; channel: number } | null => {
  const match = channelName.toLowerCase().match(/^da(\d+)\.(\d+)$/);
  if (match) {
    return {
      group: parseInt(match[1], 10),
      channel: parseInt(match[2], 10)
    };
  }
  return null;
};

// Generate next da channel name from a given da channel name
// e.g., da2.1 -> da2.2, da2.32 -> da3.1 (but limit to group 2, channel 32 max)
const getNextDaFromChannel = (daChannel: string): string => {
  const parsed = parseDaChannelName(daChannel);
  if (!parsed) return 'da1.1';
  
  let { group, channel } = parsed;
  channel++;
  
  // If channel exceeds 32, move to next group (but max group is 2)
  if (channel > 32) {
    if (group < 2) {
      group++;
      channel = 1;
    } else {
      // Already at group 2, channel 32 - can't go further, stay at da2.32
      channel = 32;
    }
  }
  
  // Ensure group doesn't exceed 2
  const finalGroup = Math.min(2, group);
  // Ensure channel doesn't exceed 32
  const finalChannel = Math.min(32, channel);
  
  return `da${finalGroup}.${finalChannel}`;
};

// Validate and format da channel input
// User can input just numbers like "1.18" or "2.1", which will be converted to "da1.18" or "da2.1"
// Only allows format: group.channel where group is 1-2 and channel is 1-32
const validateDaChannelInput = (value: string, currentValue: string): string => {
  // Remove "da" prefix if present (case insensitive) to get just the numbers
  let cleaned = value.replace(/^[Dd]a/i, '').trim();
  
  // Only allow digits and dots
  cleaned = cleaned.replace(/[^0-9.]/g, '');
  
  // Split by dots
  const parts = cleaned.split('.');
  
  // Limit to 2 parts (group.channel)
  if (parts.length > 2) {
    parts.splice(2);
  }
  
  const validatedParts: string[] = [];
  for (let i = 0; i < 2; i++) {
    let part = parts[i] || '';
    
    if (part === '') {
      // If part is empty, keep it empty for typing
      validatedParts.push('');
      continue;
    }
    
    const num = parseInt(part, 10);
    if (isNaN(num)) {
      validatedParts.push('');
    } else if (i === 0) {
      // First part: group (1-2 only)
      const group = Math.min(2, Math.max(1, num));
      validatedParts.push(group.toString());
    } else {
      // Second part: channel (1-32)
      const channel = Math.min(32, Math.max(1, num));
      validatedParts.push(channel.toString());
    }
  }
  
  // If we have both parts, return with "da" prefix
  if (validatedParts[0] && validatedParts[1]) {
    return `da${validatedParts[0]}.${validatedParts[1]}`;
  }
  
  // If we're still typing, return partial format
  if (validatedParts[0] && !validatedParts[1]) {
    return `da${validatedParts[0]}.`;
  }
  
  // If empty or invalid, return empty
  return '';
};

// Get next da channel name based on existing da channel names
// If user manually entered da1.17, next should be da1.18, up to da1.32, then da2.1
// Accepts both 'Da' and 'da' format for backwards compatibility
// Only supports groups 1-2, channels 1-32
const getNextDaChannelName = (existingChannelNames: string[]): string => {
  // Find all da format channels (case insensitive)
  const daChannels = existingChannelNames
    .map(name => {
      const match = name.match(/^[Dd]a(\d+)\.(\d+)$/i);
      if (match) {
        const group = parseInt(match[1], 10);
        const channel = parseInt(match[2], 10);
        // Only consider valid groups (1-2) and channels (1-32)
        if (group >= 1 && group <= 2 && channel >= 1 && channel <= 32) {
          return {
            group: group,
            channel: channel,
            full: name
          };
        }
      }
      return null;
    })
    .filter((x): x is { group: number; channel: number; full: string } => x !== null);
  
  if (daChannels.length === 0) {
    // No da channels yet, start with da1.1 (lowercase)
    return 'da1.1';
  }
  
  // Find the highest channel in each group
  const groupMaxChannels = new Map<number, number>();
  daChannels.forEach(da => {
    const currentMax = groupMaxChannels.get(da.group) || 0;
    if (da.channel > currentMax) {
      groupMaxChannels.set(da.group, da.channel);
    }
  });
  
  // Find the highest group (max 2)
  const maxGroup = Math.min(2, Math.max(...Array.from(groupMaxChannels.keys())));
  const maxChannelInGroup = groupMaxChannels.get(maxGroup) || 0;
  
  // If current group has room (up to 32), continue in same group
  if (maxChannelInGroup < 32 && maxGroup <= 2) {
    return `da${maxGroup}.${maxChannelInGroup + 1}`;
  }
  
  // If at group 1, channel 32, move to group 2
  if (maxGroup === 1 && maxChannelInGroup >= 32) {
    return 'da2.1';
  }
  
  // If at group 2, channel 32, can't go further - return da2.32
  return 'da2.32';
};

// Generate channel name based on manufacturer and channel index (1-based)
const generateChannelName = (manufacturer: string, channelIndex: number, isDimmer: boolean = false, channelCount: number = 0, existingChannelNames: string[] = []): string => {
  const mfr = manufacturer.toLowerCase().trim();
  
  // Special case for dimmers with more than 8 channels
  // ALL channels (from 1st onwards) use da format when channelCount > 8
  if (isDimmer && channelCount > 8) {
    // Check if there are already da format channels - if so, continue the sequence
    const hasDaChannels = existingChannelNames.some(name => /^[Dd]a\d+\.\d+$/i.test(name));
    if (hasDaChannels) {
      return getNextDaChannelName(existingChannelNames);
    }
    
    // Otherwise, start with da1.1 for channel 1
    // da1.1, da1.2, ..., da1.16 (channels 1-16)
    // da2.1, da2.2, ..., da2.16 (channels 17-32)
    // da3.1, da3.2, ..., da3.16 (channels 33-48)
    // da4.1, da4.2, ..., da4.16 (channels 49-64)
    const group = Math.floor((channelIndex - 1) / 16) + 1;
    const channelInGroup = ((channelIndex - 1) % 16) + 1;
    return `da${group}.${channelInGroup}`;
  }
  
  // Gira or Jung: A1, A2, A3, etc.
  if (mfr === 'gira' || mfr === 'jung') {
    return `A${channelIndex}`;
  }
  
  // MDT or ABB: A, B, C, etc. (alphabetic)
  if (mfr === 'mdt' || mfr === 'abb') {
    // Convert 1-based index to letter (1 -> A, 2 -> B, etc.)
    const letter = String.fromCharCode(64 + channelIndex); // 65 is 'A'
    return letter;
  }
  
  // Theben, Hager, Zennio, or Berker: C1, C2, C3, etc.
  if (mfr === 'theben' || mfr === 'hager' || mfr === 'zennio' || mfr === 'berker') {
    return `C${channelIndex}`;
  }
  
  // Default: K1, K2, K3, etc.
  return `K${channelIndex}`;
};

// Validate roomAddress format: allows negative floor numbers (e.g., -1.2)
const validateRoomAddress = (value: string): string => {
  // Allow minus sign only at the start
  let cleaned = value;
  if (cleaned.startsWith('-')) {
    cleaned = '-' + cleaned.slice(1).replace(/[^0-9.]/g, '');
  } else {
    cleaned = cleaned.replace(/[^0-9.]/g, '');
  }
  return cleaned;
};

// Validate physical address format: X.Y.Z where X and Y are 0-15, Z is 0-255
// Always requires exactly 3 numbers with dots: 0.0.0 to 15.15.255
const validatePhysicalAddress = (value: string): string => {
  // Remove any characters that are not digits or dots
  let cleaned = value.replace(/[^0-9.]/g, '');
  
  // Split by dots to validate each part
  const parts = cleaned.split('.');
  
  // Limit to 3 parts maximum
  if (parts.length > 3) {
    parts.splice(3);
  }
  
  // Validate and limit each part, always ensure we have 3 parts
  const validatedParts: string[] = [];
  for (let i = 0; i < 3; i++) {
    let part = parts[i] || '';
    
    if (part === '') {
      // If part is empty and we're building the address, keep it empty for typing
      validatedParts.push('');
      continue;
    }
    
    const num = parseInt(part, 10);
    if (isNaN(num)) {
      validatedParts.push('');
    } else if (i < 2) {
      // First two parts: 0-15
      validatedParts.push(Math.min(15, Math.max(0, num)).toString());
    } else {
      // Third part: 0-255
      validatedParts.push(Math.min(255, Math.max(0, num)).toString());
    }
  }
  
  return validatedParts.join('.');
};

// Validate if physical address is complete and valid (for save operations)
const isValidPhysicalAddress = (value: string): boolean => {
  if (!value || !value.trim()) return false;
  
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  
  for (let i = 0; i < 3; i++) {
    const part = parts[i];
    if (!part || part.trim() === '') return false;
    
    const num = parseInt(part, 10);
    if (isNaN(num)) return false;
    
    if (i < 2) {
      // First two parts: 0-15
      if (num < 0 || num > 15) return false;
    } else {
      // Third part: 0-255
      if (num < 0 || num > 255) return false;
    }
  }
  
  return true;
};

// Get next available physical address
// Uses the pattern (X.Y) from the highest existing address, increments only Z
// If no addresses exist, starts with 1.1.1
// Example: if 1.1.1 and 1.2.1 exist, next will be 1.2.2 (follows the pattern of highest address)
const getNextPhysicalAddress = (existingAddresses: string[]): string => {
  if (existingAddresses.length === 0) {
    return '1.1.1';
  }
  
  // Find the highest address (by comparing X, then Y, then Z)
  let maxFirst = 1;
  let maxSecond = 1;
  let maxThird = 0;
  
  existingAddresses.forEach(addr => {
    if (isValidPhysicalAddress(addr)) {
      const parts = addr.split('.');
      const first = parseInt(parts[0], 10);
      const second = parseInt(parts[1], 10);
      const third = parseInt(parts[2], 10);
      
      // Compare addresses: first priority is first number, then second, then third
      if (first > maxFirst || 
          (first === maxFirst && second > maxSecond) ||
          (first === maxFirst && second === maxSecond && third > maxThird)) {
        maxFirst = first;
        maxSecond = second;
        maxThird = third;
      }
    }
  });
  
  // Use the pattern (X.Y) from the highest address, increment only Z
  let nextThird = maxThird + 1;
  
  // Handle overflow - if third number exceeds 255, increment second number
  if (nextThird > 255) {
    nextThird = 1;
    maxSecond++;
    if (maxSecond > 15) {
      maxSecond = 1;
      maxFirst++;
      if (maxFirst > 15) {
        // Reset to 1.1.1 if all addresses used
        maxFirst = 1;
        maxSecond = 1;
        nextThird = 1;
      }
    }
  }
  
  return `${maxFirst}.${maxSecond}.${nextThird}`;
};

export const DimmerForm = ({ onSave, onUpdate, count, onCountChange, existing }: Props) => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { template } = useAppStore();
  const [inputValue, setInputValue] = useState<string>(count.toString());
  const prevLangRef = useRef<typeof lang>(lang);
  
  // Update input value when count prop changes
  useEffect(() => {
    setInputValue(count.toString());
  }, [count]);
  const [actors, setActors] = useState<ActorData[]>([]);
  
  // Get available dim groups from template (teachByExampleConfig)
  const dimGroups = useMemo(() => {
    if (!template?.teachByExampleConfig?.categories?.dimming) return [];
    const dimmingConfig = template.teachByExampleConfig.categories.dimming;
    
    if (Array.isArray(dimmingConfig)) {
      return dimmingConfig.map((group, idx) => {
        // Use groupName from teachByExampleConfig (user-entered name), with fallback to default
        const groupName = group.groupName || `Dimgroep ${idx + 1}`;
        return {
          index: idx,
          name: groupName,
          config: group
        };
      });
    } else {
      // Single group - use groupName from teachByExampleConfig, with fallback
      const groupName = dimmingConfig.groupName || 'Dimgroep';
      return [{
        index: 0,
        name: groupName,
        config: dimmingConfig
      }];
    }
  }, [template]);
  
  // Check if there's only one dim group (hide selector if true)
  const hasSingleDimGroup = dimGroups.length === 1;
  
  // Track draft changes for existing actors (local state before saving)
  const [draftActors, setDraftActors] = useState<Map<string, ActorData>>(new Map());
  
  // Helper function to translate standard model names
  const translateModelName = (model: string): string => {
    if (!model || !model.trim()) return model;
    const normalizedModel = model.toLowerCase().trim();
    
    // List of all possible model names in all languages (normalized)
    // These are the base/dutch values and all known translations
    const dimmerVariants = ['dimmer', 'dim actor', 'atenuador', 'variateur'];
    const switchVariants = ['switch actuator', 'schakelaar actor', 'schakel actor', 'actuador de interruptor', 'actionneur d\'interrupteur', 'schaltaktor'];
    const blindVariants = ['jaloezie actor', 'blind actuator', 'actuador de persiana', 'actionneur de store', 'jalousieaktor'];
    
    // Check if it matches any dimmer variant OR if it matches the current language's default
    if (dimmerVariants.includes(normalizedModel) || normalizedModel === t('defaultDimmerModel')?.toLowerCase()) {
      return t('defaultDimmerModel') || model;
    }
    // Check if it matches any switch variant OR if it matches the current language's default
    if (switchVariants.includes(normalizedModel) || normalizedModel === t('defaultSwitchModel')?.toLowerCase()) {
      return t('defaultSwitchModel') || model;
    }
    // Check if it matches any blind variant OR if it matches the current language's default
    if (blindVariants.includes(normalizedModel) || normalizedModel === t('defaultBlindModel')?.toLowerCase()) {
      return t('defaultBlindModel') || model;
    }
    return model;
  };

  // Initialize draft actors from existing devices - translate outputs when loading
  // Use a ref to track if this is the initial load to prevent false positives in hasUnsavedChanges
  const isInitialLoadRef = useRef(true);
  
  useEffect(() => {
    const drafts = new Map<string, ActorData>();
    existing.forEach(device => {
      drafts.set(device.id, {
        id: device.id,
        manufacturer: device.manufacturer,
        model: translateModelName(device.model),
        physicalAddress: device.physicalAddress,
        channelCount: device.channelCount,
        outputs: device.outputs.map(output => {
          // Ensure we use standard versions first, then translate for UI display
          const standardRoomName = getStandardUserInput(output.roomName, 'roomName') || output.roomName;
          const translatedRoomName = standardRoomName && standardRoomName.trim() 
            ? translateUserInput(standardRoomName, lang, 'roomName')
            : output.roomName;
          const standardFixture = getStandardUserInput(output.fixture, 'fixture') || output.fixture;
          const translatedFixture = standardFixture && standardFixture.trim()
            ? translateUserInput(standardFixture, lang, 'fixture')
            : output.fixture;
          return {
            ...output,
            roomName: translatedRoomName,
            fixture: translatedFixture
          };
        })
      });
    });
    setDraftActors(drafts);
    
    // Mark that initial load is complete after a short delay to allow state to settle
    if (isInitialLoadRef.current) {
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [existing, lang, t]);

  // Auto-save all draft changes when language changes
  useEffect(() => {
    // Only auto-save if language actually changed (not on initial mount)
    if (prevLangRef.current !== lang && prevLangRef.current !== undefined && prevLangRef.current !== null && onUpdate) {
      // Auto-save all devices before translating to ensure standard versions are saved
      // Use a small delay to allow current edits to complete
      const timeoutId = setTimeout(() => {
        // Collect all devices that need to be saved
        const devicesToSave: Array<{ device: DimmerDevice; isDraft: boolean }> = [];
        
        setDraftActors(currentDraftActors => {
          existing.forEach(device => {
            const draft = currentDraftActors.get(device.id);
            if (draft) {
              // Convert outputs to standard format before saving (skip validation for auto-save)
              const standardOutputs = getSortedOutputs(draft.outputs).map(output => ({
                ...output,
                roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
                fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
              }));
              
              const deviceToSave: DimmerDevice = {
                id: draft.id,
                category: 'dimmer',
                manufacturer: draft.manufacturer,
                model: draft.model,
                physicalAddress: draft.physicalAddress,
                channelCount: draft.channelCount,
                outputs: standardOutputs
              };
              
              devicesToSave.push({ device: deviceToSave, isDraft: true });
            } else {
              // No draft, but ensure existing device is in standard format
              const standardOutputs = getSortedOutputs(device.outputs).map(output => ({
                ...output,
                roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
                fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
              }));
              
              // Only update if outputs changed (to avoid unnecessary updates)
              const needsUpdate = standardOutputs.some((stdOut, idx) => {
                const origOut = device.outputs[idx];
                return !origOut || stdOut.roomName !== origOut.roomName || stdOut.fixture !== origOut.fixture;
              });
              
              if (needsUpdate) {
                const deviceToSave: DimmerDevice = {
                  ...device,
                  outputs: standardOutputs
                };
                devicesToSave.push({ device: deviceToSave, isDraft: false });
              }
            }
          });
          
          return currentDraftActors;
        });
        
        // Save all devices after state update
        setTimeout(() => {
          devicesToSave.forEach(({ device: deviceToSave }) => {
            onUpdate(deviceToSave);
          });
          
          // After saving, re-initialize draftActors from updated store devices
          // This ensures hasUnsavedChanges works correctly after language change
          // Read directly from store to get the latest data
          setTimeout(() => {
            const { devices: allDevices } = useAppStore.getState();
            const updatedDevices = allDevices.dimmer;
            const drafts = new Map<string, ActorData>();
            updatedDevices.forEach(device => {
              drafts.set(device.id, {
                id: device.id,
                manufacturer: device.manufacturer,
                model: translateModelName(device.model),
                physicalAddress: device.physicalAddress,
                channelCount: device.channelCount,
                outputs: device.outputs.map(output => {
                  // Translate roomName and fixture when loading from existing devices
                  const standardRoomName = getStandardUserInput(output.roomName, 'roomName') || output.roomName;
                  const translatedRoomName = standardRoomName && standardRoomName.trim() 
                    ? translateUserInput(standardRoomName, lang, 'roomName')
                    : output.roomName;
                  const standardFixture = getStandardUserInput(output.fixture, 'fixture') || output.fixture;
                  const translatedFixture = standardFixture && standardFixture.trim()
                    ? translateUserInput(standardFixture, lang, 'fixture')
                    : output.fixture;
                  return {
                    ...output,
                    roomName: translatedRoomName,
                    fixture: translatedFixture
                  };
                })
              });
            });
            setDraftActors(drafts);
          }, 200);
        }, 50);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, existing]); // onUpdate is intentionally excluded - it's stable and only uses store function

  // Translate user input when language changes
  useEffect(() => {
    // Only translate if language actually changed (not on initial mount)
    if (prevLangRef.current !== lang) {
      const prevLang = prevLangRef.current;
      
      // Translate actors - convert to standard name first, then translate to new language
      setActors(prev => prev.map(actor => ({
        ...actor,
        model: translateModelName(actor.model),
        outputs: actor.outputs.map(output => {
          // Get standard (Dutch) name first to ensure we translate from the correct source
          const standardRoomName = getStandardUserInput(output.roomName, 'roomName') || output.roomName;
          const translatedRoomName = standardRoomName && standardRoomName.trim() 
            ? translateUserInput(standardRoomName, lang, 'roomName')
            : output.roomName;
          
          // Get standard (Dutch) name first to ensure we translate from the correct source
          const standardFixture = getStandardUserInput(output.fixture, 'fixture') || output.fixture;
          const translatedFixture = standardFixture && standardFixture.trim()
            ? translateUserInput(standardFixture, lang, 'fixture')
            : output.fixture;
          
          return {
            ...output,
            roomName: translatedRoomName,
            fixture: translatedFixture
          };
        })
      })));
      
      // Translate draft actors - convert to standard name first, then translate to new language
      setDraftActors(prev => {
        const updated = new Map(prev);
        prev.forEach((actor, deviceId) => {
          updated.set(deviceId, {
            ...actor,
            model: translateModelName(actor.model),
            outputs: actor.outputs.map(output => {
              // Get standard (Dutch) name first to ensure we translate from the correct source
              const standardRoomName = getStandardUserInput(output.roomName, 'roomName') || output.roomName;
              const translatedRoomName = standardRoomName && standardRoomName.trim() 
                ? translateUserInput(standardRoomName, lang, 'roomName')
                : output.roomName;
              
              // Get standard (Dutch) name first to ensure we translate from the correct source
              const standardFixture = getStandardUserInput(output.fixture, 'fixture') || output.fixture;
              // Don't translate if it's the reserve text
              const translatedFixture = standardFixture && standardFixture.trim() && standardFixture !== getStandardUserInput(t('reserve'), 'fixture')
                ? translateUserInput(standardFixture, lang, 'fixture')
                : output.fixture;
              
              return {
                ...output,
                roomName: translatedRoomName,
                fixture: translatedFixture
              };
            })
          });
        });
        return updated;
      });
      
      prevLangRef.current = lang;
    } else {
      // On initial mount, just set the ref
      prevLangRef.current = lang;
    }
  }, [lang, t]);

  // Initialize actors when count changes or existing changes
  // Count represents total desired actors (existing + new)
  // So new actors needed = count - existing.length
  useEffect(() => {
    setActors(prev => {
      const existingCount = existing.length;
      const desiredNewActorsCount = Math.max(0, count - existingCount);
      
      // If existing increased, we need to remove only the actor that was saved
      // Check if any actors in prev match existing devices (by physical address)
      // Only remove actors that have a valid physical address matching an existing device
      const existingAddresses = new Set(existing.map(d => d.physicalAddress).filter(addr => addr && addr.trim()));
      const actorsToKeep = prev.filter(a => {
        // Always keep actors without physical address or with invalid address
        if (!a.physicalAddress || !a.physicalAddress.trim()) {
          return true;
        }
        // Only remove if the physical address matches an existing device
        return !existingAddresses.has(a.physicalAddress);
      });
      const actorsToKeepCount = actorsToKeep.length;
      
      // Only add new actors if we need more
      if (desiredNewActorsCount > actorsToKeepCount) {
        const newActors: ActorData[] = [];
        // Collect all existing physical addresses from all device types
        const { devices: allDevices } = useAppStore.getState();
        const allAddresses = [
          ...allDevices.switch.map(d => d.physicalAddress).filter(addr => addr && addr.trim()),
          ...allDevices.dimmer.map(d => d.physicalAddress).filter(addr => addr && addr.trim()),
          ...allDevices.blind.map(d => d.physicalAddress).filter(addr => addr && addr.trim()),
          ...actorsToKeep.map(a => a.physicalAddress).filter(addr => addr && addr.trim())
        ];
        
        for (let i = actorsToKeepCount; i < desiredNewActorsCount; i++) {
          const nextAddress = getNextPhysicalAddress(allAddresses);
          allAddresses.push(nextAddress);
          
          newActors.push({
            id: uid(),
            manufacturer: '',
            model: t('defaultDimmerModel') || 'Dim actor',
            physicalAddress: nextAddress,
            channelCount: 0,
            outputs: []
          });
        }
        return [...actorsToKeep, ...newActors];
      } else if (desiredNewActorsCount < actorsToKeepCount) {
        // Remove actors from the end (only new actors, not saved ones)
        // This happens when count is reduced
        return actorsToKeep.slice(0, desiredNewActorsCount);
      }
      
      // If counts match, just return the filtered list
      return actorsToKeep;
    });
  }, [count, existing.length]);

  // Auto-create outputs when channelCount changes
  const updateActorChannelCount = (actorId: string, newCount: number) => {
    if (newCount < 0 || newCount > 64) return;
    
    setActors(prevActors => prevActors.map(actor => {
      if (actor.id === actorId) {
        const newOutputs: DimmerOutput[] = [];
        const previousCount = actor.channelCount;
        const was8OrLess = previousCount <= 8;
        const isNowMoreThan8 = newCount > 8;
        
        // If transitioning from <=8 to >8 channels, update ALL existing channel names to da format
        if (was8OrLess && isNowMoreThan8) {
          // Update all existing outputs to da format
          for (let i = 0; i < actor.outputs.length && i < newCount; i++) {
            const channelIndex = i + 1;
            const channelName = generateChannelName(actor.manufacturer, channelIndex, true, newCount, newOutputs.map(o => o.channelName));
            newOutputs.push({
              ...actor.outputs[i],
              channelName: channelName
            });
          }
        } else {
          // Keep existing outputs as-is (don't change manually edited channel names)
          for (let i = 0; i < actor.outputs.length && i < newCount; i++) {
            newOutputs.push(actor.outputs[i]);
          }
        }
        
        // Add new outputs if needed
        const existingChannelNames = newOutputs.map(o => o.channelName);
        for (let i = actor.outputs.length; i < newCount; i++) {
          const channelIndex = i + 1;
          const channelName = generateChannelName(actor.manufacturer, channelIndex, true, newCount, existingChannelNames);
          existingChannelNames.push(channelName);
          
          newOutputs.push({
            id: uid(),
            roomAddress: '',
            roomName: '',
            fixture: '',
            channelName: channelName,
            switchCode: '',
            dimMode: 'auto',
            functions: ['onOff', 'dimming', 'statusOnOff', 'statusDim'],
            isReserve: false
          });
        }
        
        return { ...actor, channelCount: newCount, outputs: newOutputs };
      }
      return actor;
    }));
  };

  const updateActor = (actorId: string, updates: Partial<ActorData>) => {
    setActors(prev => prev.map(a => {
      if (a.id === actorId) {
        const updated = { ...a, ...updates };
        
        // If manufacturer changed, update all channel names (but preserve order)
        if (updates.manufacturer !== undefined && updates.manufacturer !== a.manufacturer) {
          const existingChannelNames: string[] = [];
          updated.outputs = updated.outputs.map((output, index) => {
            const channelName = generateChannelName(updated.manufacturer, index + 1, true, updated.channelCount, existingChannelNames);
            existingChannelNames.push(channelName);
            return {
              ...output,
              channelName: channelName
            };
          });
        }
        
        return updated;
      }
      return a;
    }));
  };

  // Helper function to sync roomName to all outputs/kanalen/zones with the same roomAddress
  const syncRoomNameToAllDevices = (roomAddress: string, newRoomName: string, excludeActorId?: string, excludeOutputId?: string) => {
    if (!roomAddress || !roomAddress.trim() || !newRoomName || !newRoomName.trim()) return;
    
    const { devices: allDevices, updateDevice } = useAppStore.getState();
    
    // Update all saved devices
    const allDeviceTypes: Array<{ category: DeviceCategory; devices: AnyDevice[] }> = [
      { category: 'switch', devices: allDevices.switch },
      { category: 'dimmer', devices: allDevices.dimmer },
      { category: 'blind', devices: allDevices.blind },
      { category: 'hvac', devices: allDevices.hvac },
      { category: 'central', devices: allDevices.central }
    ];
    
    for (const { category, devices } of allDeviceTypes) {
      devices.forEach(device => {
        let hasChanges = false;
        
        if ('outputs' in device && device.outputs) {
          const updatedOutputs = device.outputs.map(output => {
            if ('roomAddress' in output && 
                output.roomAddress === roomAddress && 
                'roomName' in output &&
                output.roomName !== newRoomName) {
              hasChanges = true;
              return { ...output, roomName: newRoomName };
            }
            return output;
          });
          
          if (hasChanges) {
            updateDevice(category, { ...device, outputs: updatedOutputs } as AnyDevice);
          }
        }
        
        if ('zones' in device && device.zones) {
          const updatedZones = device.zones.map(zone => {
            if (zone.roomAddress === roomAddress && zone.roomName !== newRoomName) {
              hasChanges = true;
              return { ...zone, roomName: newRoomName };
            }
            return zone;
          });
          
          if (hasChanges) {
            updateDevice(category, { ...device, zones: updatedZones } as AnyDevice);
          }
        }
      });
    }
    
    // Update all actors (new actors that haven't been saved yet)
    setActors(prev => prev.map(actor => {
      let hasChanges = false;
      const updatedOutputs = actor.outputs.map(output => {
        if ('roomAddress' in output && 
            output.roomAddress === roomAddress && 
            'roomName' in output &&
            output.roomName !== newRoomName) {
          // Skip if this is the output being edited
          if (excludeActorId && excludeOutputId && actor.id === excludeActorId && output.id === excludeOutputId) {
            return output;
          }
          hasChanges = true;
          return { ...output, roomName: newRoomName };
        }
        return output;
      });
      
      return hasChanges ? { ...actor, outputs: updatedOutputs } : actor;
    }));
    
    // Update all draft actors
    setDraftActors(prev => {
      const newMap = new Map(prev);
      let anyChanges = false;
      
      for (const [draftDeviceId, draftActor] of newMap.entries()) {
        let hasChanges = false;
        const updatedOutputs = draftActor.outputs.map(output => {
          if ('roomAddress' in output && 
              output.roomAddress === roomAddress && 
              'roomName' in output &&
              output.roomName !== newRoomName) {
            // Skip if this is the output being edited
            if (excludeActorId && excludeOutputId && draftDeviceId === excludeActorId && output.id === excludeOutputId) {
              return output;
            }
            hasChanges = true;
            return { ...output, roomName: newRoomName };
          }
          return output;
        });
        
        if (hasChanges) {
          anyChanges = true;
          newMap.set(draftDeviceId, { ...draftActor, outputs: updatedOutputs });
        }
      }
      
      return anyChanges ? newMap : prev;
    });
  };

  // Helper function to find room name by room address from all devices
  const findRoomNameByAddress = (roomAddress: string, currentActorId: string, currentOutputId: string): string | null => {
    if (!roomAddress || !roomAddress.trim()) return null;
    
    // First check the global cache (for cross-form roomName sharing)
    const { getRoomNameFromCache, devices: allDevices } = useAppStore.getState();
    const cachedRoomName = getRoomNameFromCache(roomAddress);
    if (cachedRoomName) {
      console.log('[DimmerForm] Found roomName in cache:', cachedRoomName, 'for roomAddress:', roomAddress);
      return cachedRoomName;
    }
    
    // Check all saved devices
    const allDeviceTypes = [
      ...allDevices.switch.map(d => ({ category: 'switch' as const, device: d })),
      ...allDevices.dimmer.map(d => ({ category: 'dimmer' as const, device: d })),
      ...allDevices.blind.map(d => ({ category: 'blind' as const, device: d })),
      ...allDevices.hvac.map(d => ({ category: 'hvac' as const, device: d })),
      ...allDevices.central.map(d => ({ category: 'central' as const, device: d }))
    ];
    
    for (const { device } of allDeviceTypes) {
      if ('outputs' in device && device.outputs) {
        for (const output of device.outputs) {
          if ('roomAddress' in output && output.roomAddress === roomAddress && 'roomName' in output) {
            const roomName = output.roomName;
            if (roomName && roomName.trim()) {
              return roomName;
            }
          }
        }
      }
      if ('zones' in device && device.zones) {
        for (const zone of device.zones) {
          if (zone.roomAddress === roomAddress && zone.roomName) {
            if (zone.roomName && zone.roomName.trim()) {
              return zone.roomName;
            }
          }
        }
      }
    }
    
    // Check all actors (including current actor)
    for (const actor of actors) {
      if (actor.outputs) {
        for (const output of actor.outputs) {
          if ('roomAddress' in output && output.roomAddress === roomAddress && 'roomName' in output) {
            // Skip the current output being edited
            if (actor.id === currentActorId && output.id === currentOutputId) {
              continue;
            }
            const roomName = output.roomName;
            if (roomName && roomName.trim()) {
              return roomName;
            }
          }
        }
      }
    }
    
    return null;
  };

  const updateOutput = (actorId: string, outputId: string, key: keyof DimmerOutput, value: string | boolean | number) => {
    const reserveText = t('reserve') || 'reserve';
    setActors(prev => prev.map(actor => {
      if (actor.id === actorId) {
        let roomAddressToSync: string | null = null;
        let roomNameToSync: string | null = null;
        
        const outputIndex = actor.outputs.findIndex(o => o.id === outputId);
        let updatedOutputs = actor.outputs.map((o, index) => {
          if (o.id === outputId) {
            const updated = { ...o, [key]: value };
            
            // If isReserve is set to true, clear the room fields and set fixture to "reserve"
            if (key === 'isReserve' && value === true) {
              updated.roomAddress = '';
              updated.roomName = '';
              updated.switchCode = '';
              // Set fixture to translated "reserve"
              updated.fixture = reserveText;
            } else if (key === 'isReserve' && value === false) {
              // If isReserve is set to false, clear the fixture if it was "reserve"
              if (updated.fixture === reserveText) {
                updated.fixture = '';
              }
        } else if (key === 'roomAddress' && typeof value === 'string') {
          // When roomAddress is entered, check if there's an existing roomName for this address
          const existingRoomName = findRoomNameByAddress(value, actorId, outputId);
          if (existingRoomName && (!updated.roomName || !updated.roomName.trim())) {
            // Auto-fill if roomName is empty and we have a known room for this address
            const translatedRoomName = translateUserInput(existingRoomName, lang, 'roomName');
            updated.roomName = translatedRoomName;
            const { updateRoomAddressCache } = useAppStore.getState();
            updateRoomAddressCache(value, translatedRoomName);
          } else if (!existingRoomName) {
            // Unknown room address or cleared: clear roomName to prevent confusion (old name from previous address)
            updated.roomName = '';
          }
        } else if (key === 'roomName' && typeof value === 'string') {
          // When roomName is changed, we'll sync it after updating all outputs
          roomAddressToSync = updated.roomAddress;
          roomNameToSync = value;
        }
        return updated;
      }
      return o;
    });
    
    // If roomName was changed, sync it to all other outputs with the same roomAddress
    if (roomNameToSync && roomAddressToSync && roomAddressToSync.trim()) {
      // Update the cache when roomName is changed
      const { updateRoomAddressCache } = useAppStore.getState();
      updateRoomAddressCache(roomAddressToSync, roomNameToSync);
      
      // Update all other outputs in the same actor with the same roomAddress
      updatedOutputs.forEach((otherOutput, otherIdx) => {
        if (otherOutput.id !== outputId && 
            'roomAddress' in otherOutput && 
            otherOutput.roomAddress === roomAddressToSync &&
            'roomName' in otherOutput) {
          updatedOutputs[otherIdx] = { ...otherOutput, roomName: roomNameToSync };
        }
      });
      
      // Sync to all other devices/actors with the same roomAddress
      syncRoomNameToAllDevices(roomAddressToSync, roomNameToSync, actorId, outputId);
    }
        
        let newChannelCount = actor.channelCount;
        
        // If channelName was changed to a da format, update following channels
        if (key === 'channelName' && typeof value === 'string' && outputIndex >= 0) {
          const newChannelName = (value as string).toLowerCase().trim();
          const isDaFormat = /^da\d+\.\d+$/i.test(newChannelName);
          
          if (isDaFormat) {
            const parsed = parseDaChannelName(newChannelName);
            if (parsed) {
              const { group, channel } = parsed;
              // Number of channels AFTER the current one (not including the current one)
              const remainingChannels = updatedOutputs.length - (outputIndex + 1);
              
              // Calculate how many channels can fit in the remaining space
              // Group 1: channels 1-32, Group 2: channels 1-32
              // Note: The current channel counts as 1, so we have max 31 more channels available
              let maxChannelsAvailable = 0;
              if (group === 1) {
                // From current channel in group 1 to end of group 1, then all of group 2
                // Current channel is already counted, so remaining in group 1 + all of group 2
                maxChannelsAvailable = (32 - channel) + 32; // Remaining in group 1 (excluding current) + all of group 2
              } else if (group === 2) {
                // Only remaining channels in group 2 (excluding the current channel)
                maxChannelsAvailable = 32 - channel; // Max 31 channels after current (da2.2 to da2.32)
              }
              
              // If we need more channels than available, reduce the number of outputs
              if (remainingChannels > maxChannelsAvailable) {
                newChannelCount = outputIndex + 1 + maxChannelsAvailable;
                // Slice BEFORE updating channel names to ensure correct length
                updatedOutputs = updatedOutputs.slice(0, newChannelCount);
              }
              
              // Update all following channels to continue the da sequence
              // Only update channels that still exist after potential slice
              let currentDa = newChannelName;
              for (let i = outputIndex + 1; i < updatedOutputs.length; i++) {
                currentDa = getNextDaFromChannel(currentDa);
                updatedOutputs[i] = {
                  ...updatedOutputs[i],
                  channelName: currentDa
                };
              }
            }
          }
        }
        
        return { ...actor, outputs: updatedOutputs, channelCount: newChannelCount };
      }
      return actor;
    }));
  };

  // Keep outputs in their original order (don't sort - user may have manually edited channel names)
  const getSortedOutputs = (outputs: DimmerOutput[]): DimmerOutput[] => {
    // Return outputs as-is to preserve user's manual ordering
    return [...outputs];
  };

  // Get draft actor or fallback to existing
  const getDraftActor = (deviceId: string): ActorData | undefined => {
    return draftActors.get(deviceId);
  };

  // Check if actor has unsaved changes
  // Compare using standard versions to avoid false positives from translations
  const hasUnsavedChanges = (deviceId: string): boolean => {
    // Don't show unsaved changes during initial load (first 200ms after component mount)
    // This prevents false positives when loading a project
    if (isInitialLoadRef.current) {
      return false;
    }
    
    const existingDevice = existing.find(d => d.id === deviceId);
    const draft = draftActors.get(deviceId);
    if (!existingDevice || !draft) return false;
    
    // Compare basic properties
    if (
      draft.manufacturer !== existingDevice.manufacturer ||
      draft.model !== existingDevice.model ||
      draft.physicalAddress !== existingDevice.physicalAddress ||
      draft.channelCount !== existingDevice.channelCount
    ) {
      return true;
    }
    
    // Compare outputs using standard versions
    if (draft.outputs.length !== existingDevice.outputs.length) {
      return true;
    }
    
    for (let i = 0; i < draft.outputs.length; i++) {
      const draftOutput = draft.outputs[i];
      const existingOutput = existingDevice.outputs[i];
      
      // Get standard versions for comparison
      const draftRoomName = getStandardUserInput(draftOutput.roomName, 'roomName') || draftOutput.roomName;
      const existingRoomName = getStandardUserInput(existingOutput.roomName, 'roomName') || existingOutput.roomName;
      const draftFixture = getStandardUserInput(draftOutput.fixture, 'fixture') || draftOutput.fixture;
      const existingFixture = getStandardUserInput(existingOutput.fixture, 'fixture') || existingOutput.fixture;
      
      if (
        draftOutput.roomAddress !== existingOutput.roomAddress ||
        draftRoomName !== existingRoomName ||
        draftFixture !== existingFixture ||
        draftOutput.switchCode !== existingOutput.switchCode ||
        draftOutput.channelName !== existingOutput.channelName ||
        draftOutput.isReserve !== existingOutput.isReserve ||
        draftOutput.dimGroupIndex !== existingOutput.dimGroupIndex ||
        JSON.stringify(draftOutput.functions) !== JSON.stringify(existingOutput.functions)
      ) {
        return true;
      }
    }
    
    return false;
  };

  // Check if a new actor (not yet saved) has any data filled in
  const hasUnsavedData = (actor: ActorData): boolean => {
    // Check if basic fields are filled
    if (actor.manufacturer && actor.manufacturer.trim()) return true;
    if (actor.model && actor.model.trim()) return true;
    if (actor.physicalAddress && actor.physicalAddress.trim()) return true;
    if (actor.channelCount > 0) {
      // Check if any outputs have data
      if (actor.outputs && actor.outputs.length > 0) {
        return actor.outputs.some(output => {
          if (output.isReserve) return false; // Reserve outputs don't count
          return (
            (output.roomAddress && output.roomAddress.trim()) ||
            (output.roomName && output.roomName.trim()) ||
            (output.fixture && output.fixture.trim())
          );
        });
      }
    }
    return false;
  };

  // Update draft actor (local state, not saved yet)
  const updateDraftActor = (deviceId: string, updates: Partial<ActorData>) => {
    const currentDraft = draftActors.get(deviceId);
    if (!currentDraft) return;
    
    const updatedDraft: ActorData = {
      ...currentDraft,
      ...updates
    };
    
    // If manufacturer changed, update all channel names (but preserve order)
    if (updates.manufacturer !== undefined && updates.manufacturer !== currentDraft.manufacturer) {
      const existingChannelNames: string[] = [];
      updatedDraft.outputs = updatedDraft.outputs.map((output, index) => {
        const channelIndex = index + 1;
        const channelName = generateChannelName(updatedDraft.manufacturer, channelIndex, true, updatedDraft.channelCount, existingChannelNames);
        existingChannelNames.push(channelName);
        return {
          ...output,
          channelName: channelName
        };
      });
    }
    
    setDraftActors(prev => {
      const newMap = new Map(prev);
      newMap.set(deviceId, updatedDraft);
      return newMap;
    });
  };

  // Update draft output
  const updateDraftOutput = (deviceId: string, outputId: string, key: keyof DimmerOutput, value: string | boolean | number) => {
    const currentDraft = draftActors.get(deviceId);
    if (!currentDraft) return;
    const reserveText = t('reserve') || 'reserve';
    
    let roomAddressToSync: string | null = null;
    let roomNameToSync: string | null = null;
    
    const outputIndex = currentDraft.outputs.findIndex(o => o.id === outputId);
    let updatedOutputs = currentDraft.outputs.map((o, index) => {
      if (o.id === outputId) {
        const updated = { ...o, [key]: value };
        
        // If isReserve is set to true, clear the room fields and set fixture to "reserve"
        if (key === 'isReserve' && value === true) {
          updated.roomAddress = '';
          updated.roomName = '';
          updated.switchCode = '';
          // Set fixture to translated "reserve"
          updated.fixture = reserveText;
        } else if (key === 'isReserve' && value === false) {
          // If isReserve is set to false, clear the fixture if it was "reserve"
          if (updated.fixture === reserveText) {
            updated.fixture = '';
          }
        } else if (key === 'roomAddress' && typeof value === 'string') {
          // When roomAddress is entered, check if there's an existing roomName for this address
          const existingRoomName = findRoomNameByAddress(value, deviceId, outputId);
          if (existingRoomName && (!updated.roomName || !updated.roomName.trim())) {
            const translatedRoomName = translateUserInput(existingRoomName, lang, 'roomName');
            updated.roomName = translatedRoomName;
          } else if (!existingRoomName) {
            // Unknown room address or cleared: clear roomName to prevent confusion (old name from previous address)
            updated.roomName = '';
          }
        } else if (key === 'roomName' && typeof value === 'string') {
          // When roomName is changed, we'll sync it after updating all outputs
          roomAddressToSync = updated.roomAddress;
          roomNameToSync = value;
        }
        return updated;
      }
      return o;
    });
    
    // If roomName was changed, sync it to all other outputs with the same roomAddress
    if (roomNameToSync && roomAddressToSync && roomAddressToSync.trim()) {
      // Update all other outputs in the same draft actor with the same roomAddress
      updatedOutputs.forEach((otherOutput, otherIdx) => {
        if (otherOutput.id !== outputId && 
            'roomAddress' in otherOutput && 
            otherOutput.roomAddress === roomAddressToSync &&
            'roomName' in otherOutput) {
          updatedOutputs[otherIdx] = { ...otherOutput, roomName: roomNameToSync };
        }
      });
      
      // Sync to all other devices/actors with the same roomAddress
      syncRoomNameToAllDevices(roomAddressToSync, roomNameToSync, deviceId, outputId);
    }
    
    let newChannelCount = currentDraft.channelCount;
    
    // If channelName was changed to a da format, update following channels
    if (key === 'channelName' && typeof value === 'string' && outputIndex >= 0) {
      const newChannelName = (value as string).toLowerCase().trim();
      const isDaFormat = /^da\d+\.\d+$/i.test(newChannelName);
      
      if (isDaFormat) {
        const parsed = parseDaChannelName(newChannelName);
        if (parsed) {
          const { group, channel } = parsed;
          // Number of channels AFTER the current one (not including the current one)
          const remainingChannels = updatedOutputs.length - (outputIndex + 1);
          
              // Calculate how many channels can fit in the remaining space
              // Group 1: channels 1-32, Group 2: channels 1-32
              // Note: The current channel counts as 1, so we have max 31 more channels available
              let maxChannelsAvailable = 0;
              if (group === 1) {
                // From current channel in group 1 to end of group 1, then all of group 2
                // Current channel is already counted, so remaining in group 1 + all of group 2
                maxChannelsAvailable = (32 - channel) + 32; // Remaining in group 1 (excluding current) + all of group 2
              } else if (group === 2) {
                // Only remaining channels in group 2 (excluding the current channel)
                maxChannelsAvailable = 32 - channel; // Max 31 channels after current (da2.2 to da2.32)
              }
          
          // If we need more channels than available, reduce the number of outputs
          if (remainingChannels > maxChannelsAvailable) {
            const newCount = outputIndex + 1 + maxChannelsAvailable;
            // Slice BEFORE updating channel names to ensure correct length
            updatedOutputs = updatedOutputs.slice(0, newCount);
            newChannelCount = newCount;
          }
          
          // Update all following channels to continue the da sequence
          // Only update channels that still exist after potential slice
          let currentDa = newChannelName;
          for (let i = outputIndex + 1; i < updatedOutputs.length; i++) {
            currentDa = getNextDaFromChannel(currentDa);
            updatedOutputs[i] = {
              ...updatedOutputs[i],
              channelName: currentDa
            };
          }
        }
      }
    }
    
    updateDraftActor(deviceId, {
      outputs: getSortedOutputs(updatedOutputs),
      channelCount: newChannelCount
    });
  };

  // Update draft channel count
  const updateDraftChannelCount = (deviceId: string, newCount: number) => {
    if (newCount < 0 || newCount > 64) return;
    
    const currentDraft = draftActors.get(deviceId);
    if (!currentDraft) return;
    
    const newOutputs: DimmerOutput[] = [];
    const previousCount = currentDraft.channelCount;
    const was8OrLess = previousCount <= 8;
    const isNowMoreThan8 = newCount > 8;
    
    // If transitioning from <=8 to >8 channels, update ALL existing channel names to da format
    if (was8OrLess && isNowMoreThan8) {
      // Update all existing outputs to da format
      for (let i = 0; i < currentDraft.outputs.length && i < newCount; i++) {
        const channelIndex = i + 1;
        const channelName = generateChannelName(currentDraft.manufacturer, channelIndex, true, newCount, newOutputs.map(o => o.channelName));
        newOutputs.push({
          ...currentDraft.outputs[i],
          channelName: channelName
        });
      }
    } else {
      // Keep existing outputs as-is (don't change manually edited channel names)
      for (let i = 0; i < currentDraft.outputs.length && i < newCount; i++) {
        newOutputs.push(currentDraft.outputs[i]);
      }
    }
    
    // Add new outputs if needed
    const existingChannelNames = newOutputs.map(o => o.channelName);
    for (let i = currentDraft.outputs.length; i < newCount; i++) {
      const channelIndex = i + 1;
      const channelName = generateChannelName(currentDraft.manufacturer, channelIndex, true, newCount, existingChannelNames);
      existingChannelNames.push(channelName);
      
      newOutputs.push({
        id: uid(),
        roomAddress: '',
        roomName: '',
        fixture: '',
        channelName: channelName,
        switchCode: '',
        dimMode: 'auto',
        functions: ['onOff', 'dimming', 'statusOnOff', 'statusDim'],
        isReserve: false
      });
    }
    
    updateDraftActor(deviceId, {
      channelCount: newCount,
      outputs: getSortedOutputs(newOutputs)
    });
  };

  // Save draft changes to actual device
  const saveDraftChanges = (deviceId: string) => {
    const draft = draftActors.get(deviceId);
    if (!draft || !onUpdate) return;
    
    // Validate physical address is required
    if (!draft.physicalAddress || !draft.physicalAddress.trim()) {
      alert(t('physicalAddressRequired') || 'Fysiek adres is verplicht');
      return;
    }
    
    // Validate physical address format: getal1.getal2.getal3 (0-15.0-15.0-255)
    if (!isValidPhysicalAddress(draft.physicalAddress)) {
      alert(t('physicalAddressFormatError'));
      return;
    }
    
    // Check for duplicate physical addresses across all device types (Theben: fysieke adressen mogen dubbel voorkomen)
    if (draft.physicalAddress && draft.manufacturer !== 'theben') {
      const { devices: allDevices } = useAppStore.getState();
      const allOtherAddresses = [
        ...allDevices.switch.map(d => d.physicalAddress),
        ...allDevices.dimmer.filter(d => d.id !== deviceId).map(d => d.physicalAddress),
        ...allDevices.blind.map(d => d.physicalAddress)
      ].filter(addr => addr && addr.trim());
      const allNewActorAddresses = actors.map(a => a.physicalAddress).filter(addr => addr && addr.trim());
      
      if (allOtherAddresses.includes(draft.physicalAddress) || 
          allNewActorAddresses.includes(draft.physicalAddress)) {
        alert(t('duplicatePhysicalAddress') || `Fysiek adres ${draft.physicalAddress} bestaat al!`);
        return;
      }
    }
    
    // Validate outputs: if not reserve, roomAddress, roomName and fixture are required
    for (const output of draft.outputs) {
      if (!output.isReserve) {
        if (!output.roomAddress || !output.roomAddress.trim()) {
          alert(t('roomAddressRequired') || 'Verdieping.Ruimte is verplicht voor gebruikte kanalen');
          return;
        }
        if (!output.roomName || !output.roomName.trim()) {
          alert(t('roomNameRequired') || 'Ruimte naam is verplicht voor gebruikte kanalen');
          return;
        }
        if (!output.fixture || !output.fixture.trim()) {
          alert(t('fixtureRequired') || 'Type lamp / functie is verplicht voor gebruikte kanalen');
          return;
        }
      }
    }
    
    // Convert outputs to standard format before saving (store standard version, not translated)
    const standardOutputs = getSortedOutputs(draft.outputs).map(output => ({
      ...output,
      roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
      fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
    }));
    
    const device: DimmerDevice = {
      id: draft.id,
      category: 'dimmer',
      manufacturer: draft.manufacturer,
      model: draft.model,
      physicalAddress: draft.physicalAddress,
      channelCount: draft.channelCount,
      outputs: standardOutputs
    };
    
    onUpdate(device);
  };

  const saveActor = (actor: ActorData, index: number) => {
    // Check if channelCount is greater than 0 (must be first check)
    const channelCount = actor.channelCount ?? 0;
    if (channelCount <= 0) {
      alert(t('actorCannotBeSavedNoChannels'));
      return;
    }
    
    // Check if actor has any outputs
    if (!actor.outputs || actor.outputs.length === 0) {
      alert(t('actorCannotBeSavedNoData'));
      return;
    }
    
    // Check if all outputs are on reserve - if so, that's valid
    const allReserve = actor.outputs.every(output => output.isReserve);
    
    // If not all are reserve, check if non-reserve outputs have required data
    if (!allReserve) {
      const hasAnyData = actor.outputs.some(output => {
        if (output.isReserve) return false;
        return (output.roomAddress && output.roomAddress.trim()) ||
               (output.roomName && output.roomName.trim()) ||
               (output.fixture && output.fixture.trim());
      });
      
      if (!hasAnyData) {
        alert(t('actorCannotBeSavedNoData'));
        return;
      }
    }
    
    // Validate physical address is required
    if (!actor.physicalAddress || !actor.physicalAddress.trim()) {
      alert(t('physicalAddressRequired') || 'Fysiek adres is verplicht');
      return;
    }
    
    // Validate physical address format: getal1.getal2.getal3 (0-15.0-15.0-255)
    if (!isValidPhysicalAddress(actor.physicalAddress)) {
      alert(t('physicalAddressFormatError'));
      return;
    }
    
    // Check for duplicate physical addresses across all device types (Theben: fysieke adressen mogen dubbel voorkomen)
    if (actor.manufacturer !== 'theben') {
      const { devices: allDevices } = useAppStore.getState();
      const allPhysicalAddresses = [
        ...allDevices.switch.map(d => d.physicalAddress),
        ...allDevices.dimmer.map(d => d.physicalAddress),
        ...allDevices.blind.map(d => d.physicalAddress),
        ...actors.filter((a, idx) => idx !== index).map(a => a.physicalAddress)
      ].filter(addr => addr && addr.trim());
      
      if (allPhysicalAddresses.includes(actor.physicalAddress)) {
        alert(t.duplicatePhysicalAddress || `Fysiek adres ${actor.physicalAddress} bestaat al!`);
        return;
      }
    }
    
    // Validate outputs: if not reserve, roomAddress, roomName and fixture are required
    for (const output of actor.outputs) {
      if (!output.isReserve) {
        if (!output.roomAddress || !output.roomAddress.trim()) {
          alert(t('roomAddressRequired') || 'Verdieping.Ruimte is verplicht voor gebruikte kanalen');
          return;
        }
        if (!output.roomName || !output.roomName.trim()) {
          alert(t('roomNameRequired') || 'Ruimte naam is verplicht voor gebruikte kanalen');
          return;
        }
        if (!output.fixture || !output.fixture.trim()) {
          alert(t('fixtureRequired') || 'Type lamp / functie is verplicht voor gebruikte kanalen');
          return;
        }
      }
    }
    
    // Convert outputs to standard format before saving (store standard version, not translated)
    const standardOutputs = getSortedOutputs(actor.outputs).map(output => ({
      ...output,
      roomName: getStandardUserInput(output.roomName, 'roomName') || output.roomName,
      fixture: getStandardUserInput(output.fixture, 'fixture') || output.fixture
    }));
    
    const device: DimmerDevice = {
      id: uid(),
      category: 'dimmer',
      manufacturer: actor.manufacturer,
      model: actor.model,
      physicalAddress: actor.physicalAddress,
      channelCount: actor.channelCount,
      outputs: standardOutputs
    };
    onSave(device);
    
    // The actor will be automatically removed from the actors list
    // by the useEffect when existing is updated
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
          <span className="small">{t('actorCount')}:</span>
          <input
            className="input"
            type="number"
            min={0}
            style={{ width: 60 }}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
          />
          {inputValue !== count.toString() && (
            <button
              className="button primary"
              onClick={() => {
                const newCount = Number(inputValue);
                if (!isNaN(newCount) && newCount >= 0) {
                  onCountChange(newCount);
                } else {
                  setInputValue(count.toString());
                }
              }}
              style={{ fontSize: '0.875rem', padding: '6px 12px' }}
            >
              {t('confirm')}
            </button>
          )}
        </label>
        <span className="small">
          {existing.length} {t('ofActorsAdded')}
        </span>
      </div>

      {/* Show existing saved actors */}
      {existing.map((device, actorIdx) => {
        const draft = getDraftActor(device.id) || {
          id: device.id,
          manufacturer: device.manufacturer,
          model: translateModelName(device.model),
          physicalAddress: device.physicalAddress,
          channelCount: device.channelCount,
          outputs: device.outputs.map(output => {
            // Translate roomName and fixture when displaying
            const standardRoomName = getStandardUserInput(output.roomName, 'roomName') || output.roomName;
            const translatedRoomName = standardRoomName && standardRoomName.trim() 
              ? translateUserInput(standardRoomName, lang, 'roomName')
              : output.roomName;
            const standardFixture = getStandardUserInput(output.fixture, 'fixture') || output.fixture;
            const translatedFixture = standardFixture && standardFixture.trim()
              ? translateUserInput(standardFixture, lang, 'fixture')
              : output.fixture;
            return {
              ...output,
              roomName: translatedRoomName,
              fixture: translatedFixture
            };
          })
        };
        const hasChanges = hasUnsavedChanges(device.id);
        const sortedOutputs = getSortedOutputs(draft.outputs);
        
        return (
          <div 
            key={device.id} 
            className="card" 
            style={{ 
              marginTop: 12, 
              borderColor: hasChanges ? 'var(--color-danger)' : 'var(--color-primary)', 
              borderWidth: 2 
            }}
          >
            <div className="flex-between" style={{ marginBottom: 8 }}>
              <div className="small" style={{ color: hasChanges ? 'var(--color-danger)' : 'var(--color-primary)', fontWeight: 'bold' }}>
                {t('saved')} {t('dimmer')} {actorIdx + 1}
                {hasChanges && <span style={{ marginLeft: 8 }}>({t('unsavedChanges') || 'Niet opgeslagen wijzigingen'})</span>}
              </div>
              <div className="flex" style={{ gap: 8 }}>
                {hasChanges && (
                  <button
                    className="button primary"
                    onClick={() => saveDraftChanges(device.id)}
                    style={{ fontSize: '0.875rem', padding: '6px 12px' }}
                  >
                    {t('saveChanges') || 'Wijzigingen opslaan'}
                  </button>
                )}
                <button
                  className="button danger"
                  onClick={() => {
                    if (confirm(`Weet je zeker dat je ${t('saved')} ${t('dimmer')} ${actorIdx + 1} wilt verwijderen?`)) {
                      const { removeDevice } = useAppStore.getState();
                      removeDevice('dimmer', device.id);
                    }
                  }}
                  style={{ fontSize: '0.875rem', padding: '6px 12px' }}
                  title="Verwijderen"
                >
                  🗑️
                </button>
              </div>
            </div>
            {/* Actor header: Merk, Model, Aantal uitgangen, Fysiek adres on 1 line */}
            <div className="grid grid-4" style={{ marginBottom: 12, gap: 8 }}>
              <label className="grid">
                <span className="small">{t('manufacturer')}</span>
                <input
                  className="input"
                  value={draft.manufacturer}
                  onChange={(e) => updateDraftActor(device.id, { manufacturer: e.target.value.toLowerCase() })}
                />
              </label>
              <label className="grid">
                <span className="small">{t('model')}</span>
                <input
                  className="input"
                  value={draft.model}
                  onChange={(e) => updateDraftActor(device.id, { model: e.target.value.toLowerCase() })}
                />
              </label>
              <label className="grid">
                <span className="small">{t('channelCount')}</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={64}
                  value={draft.channelCount}
                  onChange={(e) => {
                    const newCount = Number(e.target.value);
                    updateDraftChannelCount(device.id, newCount);
                  }}
                />
              </label>
              <label className="grid">
                <span className="small">
                  {t('physicalAddress')}
                  <span style={{ color: 'var(--color-danger)' }}> *</span>
                </span>
                <input
                  className="input"
                  value={draft.physicalAddress}
                  onChange={(e) => {
                    updateDraftActor(device.id, { physicalAddress: e.target.value });
                  }}
                  required
                />
              </label>
            </div>

            {/* Channels appear directly below when channelCount > 0 */}
            {draft.channelCount > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="small" style={{ marginBottom: 8, fontWeight: 'bold' }}>
                  {t('channels')}:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {sortedOutputs.map((output) => (
                    <div key={output.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 8 }}>
                      <div className="grid grid-6" style={{ gap: 8 }}>
                        <label className="grid">
                          <span className="small">
                            {t('floorRoom')}
                            {!output.isReserve && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                          </span>
                          <input
                            className="input"
                            placeholder={!output.isReserve ? "0.1" : undefined}
                            value={output.roomAddress}
                            onChange={(e) => {
                              const value = validateRoomAddress(e.target.value);
                              // Update roomAddress - auto-fill logic is in updateDraftOutput
                              updateDraftOutput(device.id, output.id, 'roomAddress', value);
                            }}
                            disabled={output.isReserve || false}
                            required={!output.isReserve}
                            style={{ width: '100%', maxWidth: 80 }}
                          />
                        </label>
                        <label className="grid">
                          <span className="small">
                            {t('roomName')}
                            {!output.isReserve && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                          </span>
                          <input
                            className="input"
                            placeholder={!output.isReserve ? t('roomNamePlaceholder') : undefined}
                            value={output.roomName}
                            onChange={(e) => updateDraftOutput(device.id, output.id, 'roomName', e.target.value.toLowerCase())}
                            disabled={output.isReserve || false}
                            required={!output.isReserve}
                          />
                        </label>
                        <label className="grid">
                          <span className="small">
                            {t('fixture')}
                            {!output.isReserve && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                          </span>
                          <input
                            className="input"
                            placeholder={!output.isReserve ? "spots" : undefined}
                            value={output.fixture}
                            onChange={(e) => updateDraftOutput(device.id, output.id, 'fixture', e.target.value.toLowerCase())}
                            disabled={output.isReserve || false}
                            required={!output.isReserve}
                          />
                        </label>
                        <label className="grid">
                          <span className="small">{t('switchCode')}</span>
                          <input
                            className="input"
                            placeholder={!output.isReserve ? "u3" : undefined}
                            value={output.switchCode || ''}
                            onChange={(e) => updateDraftOutput(device.id, output.id, 'switchCode', e.target.value.toLowerCase())}
                            disabled={output.isReserve || false}
                            style={{ width: '100%', maxWidth: 80 }}
                          />
                        </label>
                        <label className="grid">
                          <span className="small">{t('channel')}</span>
                          <input
                            className="input"
                            placeholder={!output.isReserve ? (draft.channelCount > 8 ? "1.1" : "k1") : undefined}
                            value={output.channelName}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              // If channelCount > 8, validate as da format (allow just numbers like "1.18" or "2.1")
                              if (draft.channelCount > 8) {
                                const validated = validateDaChannelInput(inputValue, output.channelName);
                                updateDraftOutput(device.id, output.id, 'channelName', validated);
                              } else {
                                updateDraftOutput(device.id, output.id, 'channelName', inputValue.toLowerCase());
                              }
                            }}
                            style={{ width: '100%', maxWidth: 80 }}
                          />
                        </label>
                        {!hasSingleDimGroup && (
                          <label className="grid">
                            <span className="small">Groep</span>
                            <select
                              className="input"
                              value={output.dimGroupIndex ?? 0}
                              onChange={(e) => updateDraftOutput(device.id, output.id, 'dimGroupIndex', Number(e.target.value))}
                            >
                              {dimGroups.map((group) => (
                                <option key={group.index} value={group.index}>
                                  {group.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <div className="flex" style={{ alignItems: 'center', gap: 4 }}>
                          <input
                            type="checkbox"
                            checked={output.isReserve || false}
                            onChange={(e) => updateDraftOutput(device.id, output.id, 'isReserve', e.target.checked)}
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                          />
                          <span className="small">{t('channelUnused') || 'Kanaal niet gebruikt'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {count > 0 && (
        <>
          {actors.map((actor, actorIdx) => {
            const sortedOutputs = getSortedOutputs(actor.outputs);
            const hasData = hasUnsavedData(actor);
            return (
              <div 
                key={actor.id} 
                className="card" 
                style={{ 
                  marginTop: 12,
                  borderColor: hasData ? 'var(--color-danger)' : undefined,
                  borderWidth: hasData ? 2 : undefined
                }}
              >
                {/* Actor header with delete button */}
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <div className="small" style={{ fontWeight: 'bold' }}>
                    {t('dimmer')} {existing.length + actorIdx + 1} (nieuw)
                  </div>
                  <button
                    className="button danger"
                    onClick={() => {
                      if (confirm(`Weet je zeker dat je deze nieuwe ${t('dimmer')} aktor wilt verwijderen?`)) {
                        setActors(prev => {
                          const newActors = prev.filter(a => a.id !== actor.id);
                          // Synchronize count: existing + new actors
                          const newCount = existing.length + newActors.length;
                          onCountChange(newCount);
                          return newActors;
                        });
                      }
                    }}
                    style={{ fontSize: '0.875rem', padding: '6px 12px' }}
                    title="Verwijderen"
                  >
                    🗑️
                  </button>
                </div>
                {/* Actor header: Merk, Model, Aantal uitgangen, Fysiek adres on 1 line */}
                <div className="grid grid-4" style={{ marginBottom: 12, gap: 8 }}>
                  <label className="grid">
                    <span className="small">{t('manufacturer')}</span>
                    <input
                      className="input"
                      value={actor.manufacturer}
                      onChange={(e) => updateActor(actor.id, { manufacturer: e.target.value.toLowerCase() })}
                    />
                  </label>
                  <label className="grid">
                    <span className="small">{t('model')}</span>
                    <input
                      className="input"
                      value={actor.model}
                      onChange={(e) => updateActor(actor.id, { model: e.target.value.toLowerCase() })}
                    />
                  </label>
                  <label className="grid">
                    <span className="small">{t('channelCount')}</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      max={64}
                      value={actor.channelCount}
                      onChange={(e) => {
                        const newCount = Number(e.target.value);
                        updateActorChannelCount(actor.id, newCount);
                      }}
                    />
                  </label>
                  <label className="grid">
                    <span className="small">
                      {t('physicalAddress')}
                      <span style={{ color: 'var(--color-danger)' }}> *</span>
                    </span>
                    <input
                      className="input"
                      value={actor.physicalAddress}
                      onChange={(e) => {
                        updateActor(actor.id, { physicalAddress: e.target.value });
                      }}
                      required
                    />
                  </label>
                </div>

                {/* Channels appear directly below when channelCount > 0 */}
                {actor.channelCount > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div className="small" style={{ marginBottom: 8, fontWeight: 'bold' }}>
                      {t('channels')}:
                    </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {sortedOutputs.map((output) => (
                        <div key={output.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 8 }}>
                          <div className="grid grid-6" style={{ gap: 8 }}>
                            <label className="grid">
                              <span className="small">
                                {t('floorRoom')}
                                {!output.isReserve && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                              </span>
                              <input
                                className="input"
                                placeholder={!output.isReserve ? "0.1" : undefined}
                                value={output.roomAddress}
                                  onChange={(e) => {
                                    const value = validateRoomAddress(e.target.value);
                                    
                                    // Find existing roomName for this address if roomName is empty
                                    let roomNameToSet = output.roomName;
                                    if (value && (!output.roomName || !output.roomName.trim())) {
                                    const existingRoomName = findRoomNameByAddress(value, actor.id, output.id);
                                    if (existingRoomName) {
                                      // Translate the roomName to the current language
                                      roomNameToSet = translateUserInput(existingRoomName, lang, 'roomName');
                                    }
                                    }
                                    
                                    // Update both roomAddress and roomName in one go
                                    updateOutput(actor.id, output.id, 'roomAddress', value);
                                    if (roomNameToSet !== output.roomName) {
                                      updateOutput(actor.id, output.id, 'roomName', roomNameToSet);
                                    }
                                  }}
                                disabled={output.isReserve || false}
                                required={!output.isReserve}
                                style={{ width: '100%', maxWidth: 80 }}
                              />
                            </label>
                            <label className="grid">
                              <span className="small">
                                {t('roomName')}
                                {!output.isReserve && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                              </span>
                              <input
                                className="input"
                                placeholder={!output.isReserve ? t('roomNamePlaceholder') : undefined}
                                value={output.roomName}
                                onChange={(e) => updateOutput(actor.id, output.id, 'roomName', e.target.value.toLowerCase())}
                                disabled={output.isReserve || false}
                                required={!output.isReserve}
                              />
                            </label>
                            <label className="grid">
                              <span className="small">
                                {t('fixture')}
                                {!output.isReserve && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                              </span>
                              <input
                                className="input"
                                placeholder={!output.isReserve ? "spots" : undefined}
                                value={output.fixture}
                                onChange={(e) => updateOutput(actor.id, output.id, 'fixture', e.target.value.toLowerCase())}
                                disabled={output.isReserve || false}
                                required={!output.isReserve}
                              />
                            </label>
                            <label className="grid">
                              <span className="small">{t('switchCode')}</span>
                              <input
                                className="input"
                                placeholder={!output.isReserve ? "u3" : undefined}
                                value={output.switchCode || ''}
                                onChange={(e) => updateOutput(actor.id, output.id, 'switchCode', e.target.value.toLowerCase())}
                                disabled={output.isReserve || false}
                                style={{ width: '100%', maxWidth: 80 }}
                              />
                            </label>
                            <label className="grid">
                              <span className="small">{t('channel')}</span>
                              <input
                                className="input"
                                placeholder={!output.isReserve ? (actor.channelCount > 8 ? "1.1" : "k1") : undefined}
                                value={output.channelName}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  // If channelCount > 8, validate as da format (allow just numbers like "1.18" or "2.1")
                                  if (actor.channelCount > 8) {
                                    const validated = validateDaChannelInput(inputValue, output.channelName);
                                    updateOutput(actor.id, output.id, 'channelName', validated);
                                  } else {
                                    updateOutput(actor.id, output.id, 'channelName', inputValue.toLowerCase());
                                  }
                                }}
                                style={{ width: '100%', maxWidth: 80 }}
                              />
                            </label>
                            {!hasSingleDimGroup && (
                              <label className="grid">
                                <span className="small">Groep</span>
                                <select
                                  className="input"
                                  value={output.dimGroupIndex ?? 0}
                                  onChange={(e) => updateOutput(actor.id, output.id, 'dimGroupIndex', Number(e.target.value))}
                                >
                                  {dimGroups.map((group) => (
                                    <option key={group.index} value={group.index}>
                                      {group.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                            <div className="flex" style={{ alignItems: 'center', gap: 4 }}>
                              <input
                                type="checkbox"
                                checked={output.isReserve || false}
                                onChange={(e) => updateOutput(actor.id, output.id, 'isReserve', e.target.checked)}
                                style={{ width: 18, height: 18, cursor: 'pointer' }}
                              />
                              <span className="small">{t('channelUnused') || 'Kanaal niet gebruikt'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex" style={{ marginTop: 12 }}>
                  <button
                    className="button primary"
                    onClick={() => saveActor(actor, actorIdx)}
                  >
                    {t('save')} {t('dimmer')} {existing.length + actorIdx + 1}
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
