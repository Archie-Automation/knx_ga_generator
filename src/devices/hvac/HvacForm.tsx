import { useState, useEffect, useMemo, useCallback, useRef, startTransition } from 'react';
import { HvacDevice, HvacZone, DeviceCategory, AnyDevice } from '../../types/common';
import { uid } from '../../utils/id';
import { useAppStore } from '../../store';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../i18n/useTranslation'; // Keep for lang access temporarily
import { translateUserInput, getStandardUserInput } from '../../i18n/userInputTranslations';

interface Props {
  onSave: (device: HvacDevice) => void;
  onUpdate?: (device: HvacDevice) => void;
  existing: HvacDevice[];
}

const ZoneLegend = ({ maxZones }: { maxZones: number | null }) => {
  const { t } = useTranslation();
  return (
    <div className="card" style={{ backgroundColor: 'var(--color-bg)', padding: 12, marginTop: 8 }}>
      <div className="small" style={{ lineHeight: 1.6 }}>
        <div>
          <strong>{t('floorRoom')}</strong> → {t('floorRoomExample')}
        </div>
        <div>
          <strong>{t('roomName')}</strong> → {t('roomNameExample')}
        </div>
        {maxZones !== null && (
          <div style={{ marginTop: 8, fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1rem' }}>
            {t('maximumNumberOfZones')}: {maxZones} ({t('seeTemplateSettings') || 'zie instellingen template'})
          </div>
        )}
      </div>
    </div>
  );
};

export const HvacForm = ({ onSave, onUpdate, existing }: Props) => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { template } = useAppStore();
  const prevLangRef = useRef<typeof lang>(lang);
  
  // Calculate maximum number of zones based on template configuration
  const maxZones = useMemo(() => {
    if (!template?.teachByExampleConfig?.categories?.hvac) return null;
    
    const hvacConfig = template.teachByExampleConfig.categories.hvac;
    const hvacGroups = Array.isArray(hvacConfig) ? hvacConfig : [hvacConfig];
    if (hvacGroups.length === 0) return null;
    
    const group = hvacGroups[0]; // Use first group
    const pattern = group.pattern;
    if (!pattern) return null;
    
    // Get start middle group from first example address
    const startMiddle = group.exampleAddresses?.[0]?.middle ?? 0;
    // Check middle group increment
    const middleIncrement = group.exampleAddresses?.[0]?.middleIncrement ?? 0;
    
    // If middle increment is +1, calculate max zones
    if (middleIncrement === 1) {
      // Zones per main group = 8 - startMiddle
      // If startMiddle is 0: 8 - 0 = 8 zones (middengroep 0-7)
      // If startMiddle is 1: 8 - 1 = 7 zones (middengroep 1-7)
      // Max middle group is 7, so max zones = 8 - startMiddle (middengroep 0-7 = 8 zones)
      const zonesPerMainGroup = 8 - startMiddle;
      
      // Count zones from first main group
      let totalZones = zonesPerMainGroup;
      
      // Add zones from each extra main group if they exist
      if (pattern.extraMainGroups && pattern.extraMainGroups.length > 0) {
        pattern.extraMainGroups.forEach(extraGroup => {
          const extraStartMiddle = extraGroup.middle;
          const extraZonesPerGroup = 8 - extraStartMiddle;
          totalZones += extraZonesPerGroup;
        });
      }
      
      return totalZones;
    }
    
    return null;
  }, [template]);
  
  // Load all zones from existing devices with device mapping
  const allExistingZones = useMemo(() => {
    return existing.flatMap(device => device.zones.map(zone => ({ zone, deviceId: device.id })));
  }, [existing]);

  const [zones, setZones] = useState<HvacZone[]>([]);
  const [draftZones, setDraftZones] = useState<Map<string, HvacZone>>(new Map());
  const [zoneToDeviceMap, setZoneToDeviceMap] = useState<Map<string, string>>(new Map());
  // Track zones that were saved via saveZone to prevent duplicate processing in save()
  const zonesSavedViaSaveZoneRef = useRef<Set<string>>(new Set());

  // Track existing zone IDs for comparison
  const existingZoneIdsString = useMemo(() => {
    const ids = allExistingZones.map(({ zone }) => zone.id).sort().join(',');
    return ids;
  }, [allExistingZones]);

  // Use a ref to track the last processed IDs to avoid unnecessary updates
  const lastProcessedIdsRef = useRef<string>('');
  // Use a ref to track if this is the initial load to prevent false positives in hasUnsavedChanges
  const isInitialLoadRef = useRef(true);

  // Initialize zones from existing devices
  useEffect(() => {
    // Skip if IDs haven't actually changed
    if (existingZoneIdsString === lastProcessedIdsRef.current) {
      return;
    }
    
    // Mark these updates as non-urgent to prevent blocking the UI
    startTransition(() => {
      lastProcessedIdsRef.current = existingZoneIdsString;
      
      // Get IDs of all existing zones
      const existingZoneIds = new Set(allExistingZones.map(({ zone }) => zone.id));
      
      // Use React's automatic batching (React 18+) to combine state updates
      // This ensures only one re-render instead of three
      setZones(prev => {
        // Filter out zones that are now in existing (they were just saved)
        const newZones = prev.filter(z => !existingZoneIds.has(z.id));
        
        if (allExistingZones.length > 0) {
          const loadedZones = allExistingZones.map(({ zone }) => {
            // Translate roomName when loading from existing devices
            const translatedRoomName = zone.roomName && zone.roomName.trim() 
              ? translateUserInput(zone.roomName, lang, 'roomName')
              : zone.roomName;
            return {
              ...zone,
              roomName: translatedRoomName
            };
          });
          // Combine: loaded existing zones + new zones that haven't been saved yet
          // Use a Map to ensure uniqueness by ID
          const zoneMap = new Map<string, HvacZone>();
          // First add existing zones
          loadedZones.forEach(zone => zoneMap.set(zone.id, zone));
          // Then add new zones (they won't overwrite existing ones)
          newZones.forEach(zone => {
            if (!zoneMap.has(zone.id)) {
              zoneMap.set(zone.id, zone);
            }
          });
          return Array.from(zoneMap.values());
        }
        
        return newZones;
      });
      
      // Update drafts for existing zones
      setDraftZones(prev => {
        const newDrafts = new Map(prev);
        // Remove drafts for zones that are now in existing (they were just saved)
        existingZoneIds.forEach(id => newDrafts.delete(id));
        // Add drafts for existing zones (with translated roomName)
        allExistingZones.forEach(({ zone }) => {
          // Ensure we use standard versions first, then translate for UI display
          const standardRoomName = getStandardUserInput(zone.roomName, 'roomName') || zone.roomName;
          const translatedRoomName = standardRoomName && standardRoomName.trim() 
            ? translateUserInput(standardRoomName, lang, 'roomName')
            : zone.roomName;
          newDrafts.set(zone.id, { ...zone, roomName: translatedRoomName });
        });
        return newDrafts;
      });
      
      // Update zone to device map
      setZoneToDeviceMap(prev => {
        const newMap = new Map(prev);
        // Remove mappings for zones that are now in existing (will be re-added)
        existingZoneIds.forEach(id => newMap.delete(id));
        // Add mappings for existing zones
        allExistingZones.forEach(({ zone, deviceId }) => {
          newMap.set(zone.id, deviceId);
        });
        return newMap;
      });
      
      // Clear saved zones ref for zones that are now in existing (they're already saved)
      // Keep only zones that were saved via saveZone but aren't yet in existing
      zonesSavedViaSaveZoneRef.current.forEach(zoneId => {
        if (existingZoneIds.has(zoneId)) {
          zonesSavedViaSaveZoneRef.current.delete(zoneId);
        }
      });
      
      // Mark that initial load is complete after a short delay to allow state to settle
      if (isInitialLoadRef.current) {
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    });
  }, [existingZoneIdsString, allExistingZones, lang]); // Trigger when existing zone IDs change or language changes

  // Auto-save all draft changes when language changes
  useEffect(() => {
    // Only auto-save if language actually changed (not on initial mount)
    if (prevLangRef.current !== lang && prevLangRef.current !== undefined && prevLangRef.current !== null && onUpdate) {
      // Auto-save all zones before translating
      // Use a small delay to ensure draftZones state is up to date
      const timeoutId = setTimeout(() => {
        const currentDraftZones = new Map(draftZones);
        // Get all zones that need to be saved
        const zonesToSave = zones.map(z => {
          const draft = currentDraftZones.get(z.id) || z;
          return {
            ...draft,
            roomName: getStandardUserInput(draft.roomName, 'roomName') || draft.roomName
          };
        });
        
        if (zonesToSave.length > 0) {
          // Save zones using the existing save logic
          // Group zones by device
          const zonesByDevice = new Map<string, HvacZone[]>();
          zonesToSave.forEach(zone => {
            const deviceId = zoneToDeviceMap.get(zone.id);
            if (deviceId) {
              if (!zonesByDevice.has(deviceId)) {
                zonesByDevice.set(deviceId, []);
              }
              zonesByDevice.get(deviceId)!.push(zone);
            }
          });
          
          // Update each device
          zonesByDevice.forEach((updatedZones, deviceId) => {
            const device = existing.find(d => d.id === deviceId);
            if (device) {
              // Convert zones to standard format before saving
              const standardZones = device.zones.map(z => {
                const updated = updatedZones.find(uz => uz.id === z.id);
                if (updated) {
                  return {
                    ...updated,
                    roomName: getStandardUserInput(updated.roomName, 'roomName') || updated.roomName
                  };
                }
                return z;
              });
              
              const updatedDevice: HvacDevice = {
                ...device,
                zones: standardZones
              };
              onUpdate(updatedDevice);
            }
          });
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, zones, existing]); // onUpdate is intentionally excluded - it's stable and only uses store function

  // Translate user input when language changes
  useEffect(() => {
    // Only translate if language actually changed (not on initial mount)
    if (prevLangRef.current === lang) {
      // On initial mount or if language hasn't changed, just set the ref
      if (prevLangRef.current === undefined || prevLangRef.current === null) {
        prevLangRef.current = lang;
      }
      return;
    }
    
    const prevLang = prevLangRef.current;
    
    // Translate zones - convert to standard name first, then translate to new language
    setZones(prev => prev.map(zone => {
      // Get standard (Dutch) name first to ensure we translate from the correct source
      const standardRoomName = getStandardUserInput(zone.roomName, 'roomName') || zone.roomName;
      const translatedRoomName = standardRoomName && standardRoomName.trim() 
        ? translateUserInput(standardRoomName, lang, 'roomName')
        : zone.roomName;
      
      return {
        ...zone,
        roomName: translatedRoomName
      };
    }));
    
    // Translate draft zones - convert to standard name first, then translate to new language
    setDraftZones(prev => {
      const updated = new Map(prev);
      prev.forEach((zone, zoneId) => {
        // Get standard (Dutch) name first to ensure we translate from the correct source
        const standardRoomName = getStandardUserInput(zone.roomName, 'roomName') || zone.roomName;
        const translatedRoomName = standardRoomName && standardRoomName.trim() 
          ? translateUserInput(standardRoomName, lang, 'roomName')
          : zone.roomName;
        
        updated.set(zoneId, {
          ...zone,
          roomName: translatedRoomName
        });
      });
      return updated;
    });
    
    prevLangRef.current = lang;
  }, [lang]);

  const getDraftZone = (id: string): HvacZone => {
    return draftZones.get(id) || zones.find(z => z.id === id) || {
      id,
      roomAddress: '',
      roomName: '',
      channelName: ''
    };
  };

  // Get total zone count (existing + new)
  // Count unique zones by ID to avoid duplicates
  const getTotalZoneCount = useCallback((): number => {
    const uniqueZoneIds = new Set(zones.map(z => z.id));
    return uniqueZoneIds.size;
  }, [zones]);

  // Check if a roomAddress is already used by another zone (only within HVAC zones)
  const isRoomAddressDuplicate = (roomAddress: string, excludeZoneId: string): boolean => {
    if (!roomAddress || !roomAddress.trim()) return false;
    
    const trimmedAddress = roomAddress.trim();
    
    // Get set of existing zone IDs for quick lookup
    const existingZoneIds = new Set(allExistingZones.map(({ zone }) => zone.id));
    
    // Check all existing zones from all HVAC devices only
    for (const { zone } of allExistingZones) {
      if (zone.id !== excludeZoneId && zone.roomAddress && zone.roomAddress.trim() === trimmedAddress) {
        return true;
      }
    }
    
    // Check all draft zones (including current zones being edited)
    // Only check drafts that are not yet saved (not in allExistingZones)
    for (const [zoneId, draftZone] of draftZones.entries()) {
      if (zoneId !== excludeZoneId && 
          !existingZoneIds.has(zoneId) && // Only check unsaved zones
          draftZone.roomAddress && 
          draftZone.roomAddress.trim() === trimmedAddress) {
        return true;
      }
    }
    
    // Check zones in the zones array (new zones not yet in drafts)
    // Only check zones that are not yet saved (not in allExistingZones)
    for (const zone of zones) {
      if (zone.id !== excludeZoneId && 
          !existingZoneIds.has(zone.id) && // Only check unsaved zones
          zone.roomAddress && 
          zone.roomAddress.trim() === trimmedAddress) {
        return true;
      }
    }
    
    return false;
  };

  const addZone = () => {
    // Check if we've reached the maximum number of zones
    // Count all zones: existing (saved) + new (not yet saved)
    if (maxZones !== null) {
      const totalZoneCount = getTotalZoneCount();
      
      if (totalZoneCount >= maxZones) {
        alert(`Het maximum aantal zones (${maxZones}) is bereikt. ${t('seeTemplateSettings') || 'zie instellingen template'}.`);
        return;
      }
    }
    
    const nextIdx = zones.length + 1;
    const newZone: HvacZone = {
      id: uid(),
      roomAddress: `1.${nextIdx}`,
      roomName: `zone ${nextIdx}`,
      channelName: `Z${nextIdx}`
    };
    setZones(prev => [...prev, newZone]);
    setDraftZones(prev => new Map(prev).set(newZone.id, { ...newZone }));
  };

  // Helper function to sync roomName to all outputs/kanalen/zones with the same roomAddress
  const syncRoomNameToAllDevices = (roomAddress: string, newRoomName: string, excludeZoneId?: string) => {
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
              // Skip if this is the zone being edited
              if (excludeZoneId && zone.id === excludeZoneId) {
                return zone;
              }
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
    
    // Update all draft zones
    setDraftZones(prev => {
      const newMap = new Map(prev);
      let anyChanges = false;
      
      for (const [draftZoneId, draftZone] of newMap.entries()) {
        if (draftZone.roomAddress === roomAddress && draftZone.roomName !== newRoomName) {
          // Skip if this is the zone being edited
          if (excludeZoneId && draftZoneId === excludeZoneId) {
            continue;
          }
          anyChanges = true;
          newMap.set(draftZoneId, { ...draftZone, roomName: newRoomName });
        }
      }
      
      return anyChanges ? newMap : prev;
    });
  };

  // Helper function to find room name by room address from all devices
  const findRoomNameByAddress = (roomAddress: string, currentZoneId: string): string | null => {
    if (!roomAddress || !roomAddress.trim()) return null;
    
    // First check the global cache (for cross-form roomName sharing)
    const { getRoomNameFromCache, devices: allDevices } = useAppStore.getState();
    const cachedRoomName = getRoomNameFromCache(roomAddress);
    if (cachedRoomName) {
      console.log('[HvacForm] Found roomName in cache:', cachedRoomName, 'for roomAddress:', roomAddress);
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
            // Skip the current zone being edited
            if (zone.id === currentZoneId) {
              continue;
            }
            if (zone.roomName && zone.roomName.trim()) {
              return zone.roomName;
            }
          }
        }
      }
    }
    
    // Check all draft zones (including current zones)
    for (const [draftZoneId, draftZone] of draftZones.entries()) {
      if (draftZone.roomAddress === roomAddress && draftZone.roomName) {
        // Skip the current zone being edited
        if (draftZoneId === currentZoneId) {
          continue;
        }
        if (draftZone.roomName && draftZone.roomName.trim()) {
          return draftZone.roomName;
        }
      }
    }
    
    return null;
  };

  const updateDraftZone = (id: string, key: keyof HvacZone, value: string) => {
    const draft = getDraftZone(id);
    const updated = { ...draft, [key]: value };
    
    // When roomAddress is entered, check if it's a duplicate and if there's an existing roomName for this address
    if (key === 'roomAddress') {
      // Check for duplicate roomAddress
      if (value && value.trim() && isRoomAddressDuplicate(value.trim(), id)) {
        alert(`Verdiepings.Ruimte nummer "${value.trim()}" wordt al gebruikt door een andere zone. Zones moeten uniek zijn.`);
        return; // Don't update if duplicate
      }
      
      const existingRoomName = findRoomNameByAddress(value, id);
      if (existingRoomName) {
        // Check if current roomName is empty or a default "zone X" value
        const currentRoomName = updated.roomName || '';
        const isDefaultZoneName = /^zone\s+\d+$/i.test(currentRoomName.trim());
        
        // Auto-fill if roomName is empty or is a default "zone X" value
        if (!currentRoomName.trim() || isDefaultZoneName) {
          const translatedRoomName = translateUserInput(existingRoomName, lang, 'roomName');
          updated.roomName = translatedRoomName;
          const { updateRoomAddressCache } = useAppStore.getState();
          updateRoomAddressCache(value, translatedRoomName);
        }
      } else {
        // Unknown room address or cleared: clear roomName to prevent confusion (old name from previous address)
        updated.roomName = '';
      }
    } else if (key === 'roomName') {
      // Update the cache when roomName is changed
      if (updated.roomAddress && updated.roomAddress.trim()) {
        const { updateRoomAddressCache } = useAppStore.getState();
        updateRoomAddressCache(updated.roomAddress, value);
      }
      // When roomName is changed, sync it to all other outputs/kanalen/zones with the same roomAddress
      const roomAddressToSync = updated.roomAddress;
      if (roomAddressToSync && roomAddressToSync.trim()) {
        // Sync to all other devices/zones with the same roomAddress
        syncRoomNameToAllDevices(roomAddressToSync, value, id);
      }
    }
    
    setDraftZones(prev => new Map(prev).set(id, updated));
  };

  const removeZone = (id: string) => {
    // Check if zone is from existing device
    const deviceId = zoneToDeviceMap.get(id);
    if (deviceId && onUpdate) {
      // Find the device this zone belongs to
      const device = existing.find(d => d.id === deviceId);
      if (device) {
        const updatedDevice: HvacDevice = {
          ...device,
          zones: device.zones.filter(z => z.id !== id)
        };
        onUpdate(updatedDevice);
      }
    }
    setZones(prev => prev.filter(z => z.id !== id));
    setDraftZones(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    setZoneToDeviceMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const saveZone = (zoneId: string) => {
    const draft = draftZones.get(zoneId);
    if (!draft) return;

    // Validate roomAddress is required
    if (!draft.roomAddress || !draft.roomAddress.trim()) {
      alert('Verdiepings.Ruimte nummer is verplicht voor zones.');
      return;
    }

    // Check for duplicate roomAddress
    if (isRoomAddressDuplicate(draft.roomAddress.trim(), zoneId)) {
      alert(`Verdiepings.Ruimte nummer "${draft.roomAddress.trim()}" wordt al gebruikt door een andere zone. Zones moeten uniek zijn.`);
      return;
    }

    const deviceId = zoneToDeviceMap.get(zoneId);
    if (deviceId && onUpdate) {
      // Update existing zone
      const device = existing.find(d => d.id === deviceId);
      if (device) {
        // Convert roomName to standard before saving
        const standardDraft = {
          ...draft,
          roomName: getStandardUserInput(draft.roomName, 'roomName') || draft.roomName
        };
        const updatedDevice: HvacDevice = {
          ...device,
          zones: device.zones.map(z => z.id === zoneId ? standardDraft : z)
        };
        onUpdate(updatedDevice);
        
        // Mark this zone as saved via saveZone to prevent duplicate processing in save()
        zonesSavedViaSaveZoneRef.current.add(zoneId);
        
        // Also update the zone in local state to keep it in sync
        // This ensures the zone state matches what was saved
        setZones(prev => prev.map(z => z.id === zoneId ? {
          ...draft,
          roomName: translateUserInput(standardDraft.roomName, lang, 'roomName') || standardDraft.roomName
        } : z));
      }
    } else {
      // Save as new zone (will be part of new device)
      const updatedZones = zones.map(z => z.id === zoneId ? draft : z);
      setZones(updatedZones);
    }

    // Clear draft
    setDraftZones(prev => {
      const newMap = new Map(prev);
      newMap.delete(zoneId);
      return newMap;
    });
  };

  const save = () => {
    // Save all zones (both new and existing with changes)
    // Get all zones that need to be saved (new zones + existing zones with changes)
    // Convert translated roomNames back to standard (Dutch) names before saving
    const zonesToSave = zones.map(z => {
      const draft = draftZones.get(z.id) || z;
      return {
        ...draft,
        roomName: getStandardUserInput(draft.roomName, 'roomName')
      };
    });
    
    if (zonesToSave.length === 0) {
      return;
    }
    
    // Validate all zones have roomAddress
    for (const zone of zonesToSave) {
      if (!zone.roomAddress || !zone.roomAddress.trim()) {
        alert('Alle zones moeten een Verdiepings.Ruimte nummer hebben.');
        return;
      }
    }
    
    // Check for duplicates within the zones to save
    const roomAddresses = new Set<string>();
    for (const zone of zonesToSave) {
      const roomAddr = zone.roomAddress.trim();
      if (roomAddresses.has(roomAddr)) {
        alert(`Meerdere zones hebben hetzelfde Verdiepings.Ruimte nummer "${roomAddr}". Zones moeten uniek zijn.`);
        return;
      }
      roomAddresses.add(roomAddr);
    }
    
    // Check for duplicates against existing zones (exclude zones that are being updated)
    for (const zone of zonesToSave) {
      if (isRoomAddressDuplicate(zone.roomAddress.trim(), zone.id)) {
        alert(`Verdiepings.Ruimte nummer "${zone.roomAddress.trim()}" wordt al gebruikt door een andere zone. Zones moeten uniek zijn.`);
        return;
      }
    }
    
    // Separate new zones from existing zones
    // Filter out zones that were already saved via saveZone to prevent duplicates
    const zonesToProcess = zonesToSave.filter(z => !zonesSavedViaSaveZoneRef.current.has(z.id));
    
    const newZones = zonesToProcess.filter(z => !allExistingZones.some(ez => ez.zone.id === z.id));
    const existingZonesWithChanges = zonesToProcess.filter(z => {
      const existingZoneData = allExistingZones.find(ez => ez.zone.id === z.id);
      if (!existingZoneData) return false;
      const existingZone = existingZoneData.zone;
      // Compare with standard (Dutch) names since zonesToSave already has standard names
      const existingRoomNameStandard = getStandardUserInput(existingZone.roomName, 'roomName');
      return (
        z.roomAddress !== existingZone.roomAddress ||
        z.roomName !== existingRoomNameStandard ||
        z.channelName !== existingZone.channelName
      );
    });
    
    // Clear the saved zones ref after processing (they will be in existing on next save)
    zonesSavedViaSaveZoneRef.current.clear();
    
    // If there are new zones, add them to an existing device or create a new one
    if (newZones.length > 0) {
      // Try to find an existing HVAC device to add zones to
      // Prefer the first device that exists
      if (existing.length > 0 && onUpdate) {
        // Add new zones to the first existing device
        const firstDevice = existing[0];
        const updatedDevice: HvacDevice = {
          ...firstDevice,
          zones: [...firstDevice.zones, ...newZones]
        };
        onUpdate(updatedDevice);
      } else {
        // No existing device, create a new one
        const device: HvacDevice = {
          id: uid(),
          category: 'hvac',
          zones: newZones
        };
        onSave(device);
      }
    }
    
    // Update existing zones with changes
    if (existingZonesWithChanges.length > 0 && onUpdate) {
      // Group zones by device
      const zonesByDevice = new Map<string, HvacZone[]>();
      existingZonesWithChanges.forEach(zone => {
        const deviceId = zoneToDeviceMap.get(zone.id);
        if (deviceId) {
          if (!zonesByDevice.has(deviceId)) {
            zonesByDevice.set(deviceId, []);
          }
          zonesByDevice.get(deviceId)!.push(zone);
        }
      });
      
      // Update each device
      zonesByDevice.forEach((updatedZones, deviceId) => {
        const device = existing.find(d => d.id === deviceId);
        if (device) {
          // Convert zones to standard format before saving (store standard version, not translated)
          const standardZones = device.zones.map(z => {
            const updated = updatedZones.find(uz => uz.id === z.id);
            if (updated) {
              return {
                ...updated,
                roomName: getStandardUserInput(updated.roomName, 'roomName') || updated.roomName
              };
            }
            return z;
          });
          
          const updatedDevice: HvacDevice = {
            ...device,
            zones: standardZones
          };
          onUpdate(updatedDevice);
        }
      });
    }
  };

  const hasUnsavedChanges = (zoneId: string): boolean => {
    // Don't show unsaved changes during initial load (first 200ms after component mount)
    // This prevents false positives when loading a project
    if (isInitialLoadRef.current) {
      return false;
    }
    
    const draft = draftZones.get(zoneId);
    if (!draft) return false;

    const existingZoneData = allExistingZones.find(({ zone }) => zone.id === zoneId);
    if (existingZoneData) {
      const existingZone = existingZoneData.zone;
      // Convert both to standard (Dutch) names for comparison
      const draftRoomNameStandard = getStandardUserInput(draft.roomName, 'roomName');
      const existingRoomNameStandard = getStandardUserInput(existingZone.roomName, 'roomName');
      return (
        draft.roomAddress !== existingZone.roomAddress ||
        draftRoomNameStandard !== existingRoomNameStandard ||
        draft.channelName !== existingZone.channelName
      );
    }

    // For new zones, check against the zone in zones array
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return false;
    // Convert both to standard (Dutch) names for comparison
    const draftRoomNameStandard = getStandardUserInput(draft.roomName, 'roomName');
    const zoneRoomNameStandard = getStandardUserInput(zone.roomName, 'roomName');
    return (
      draft.roomAddress !== zone.roomAddress ||
      draftRoomNameStandard !== zoneRoomNameStandard ||
      draft.channelName !== zone.channelName
    );
  };

  // Check if a new zone (not yet saved) has any data filled in (excluding default values)
  const hasUnsavedData = (zone: HvacZone): boolean => {
    // Check if roomAddress is filled (and not just default)
    if (zone.roomAddress && zone.roomAddress.trim()) {
      // Check if it's not a default pattern like "1.1", "1.2", etc.
      const isDefaultPattern = /^\d+\.\d+$/.test(zone.roomAddress.trim());
      if (isDefaultPattern) {
        // If it's a default pattern, still check if roomName is customized
        const defaultRoomName = zone.roomName && /^zone\s+\d+$/i.test(zone.roomName.trim());
        if (!defaultRoomName && zone.roomName && zone.roomName.trim()) {
          return true; // Custom room name even with default address
        }
      } else {
        return true; // Custom room address
      }
    }
    
    // Check if roomName is filled and not default "zone X"
    if (zone.roomName && zone.roomName.trim()) {
      const isDefaultRoomName = /^zone\s+\d+$/i.test(zone.roomName.trim());
      if (!isDefaultRoomName) {
        return true; // Custom room name
      }
    }
    
    // Check if channelName is customized (not default "Z1", "Z2", etc.)
    if (zone.channelName && zone.channelName.trim()) {
      const isDefaultChannelName = /^Z\d+$/i.test(zone.channelName.trim());
      if (!isDefaultChannelName) {
        return true; // Custom channel name
      }
    }
    
    return false;
  };

  return (
    <div className="card">
      <div className="flex-between">
        <h4>{t.hvacZones}</h4>
        <span className="small">
          {(() => {
            // Count unique zones by ID to avoid counting duplicates across devices
            const uniqueZoneIds = new Set<string>();
            existing.forEach(device => {
              device.zones.forEach(zone => uniqueZoneIds.add(zone.id));
            });
            return uniqueZoneIds.size;
          })()} {t('zonesAdded')}
        </span>
      </div>
      <div className="small" style={{ marginTop: 8, marginBottom: 12 }}>
        {t('addClimateZonesDescription')}
      </div>
          {zones.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <ZoneLegend maxZones={maxZones} />
          {maxZones !== null && getTotalZoneCount() >= maxZones && (
            <div style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: 8, border: '1px solid rgba(255, 193, 7, 0.3)' }}>
              <p className="small" style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-warning)' }}>
                Maximum aantal zones ({maxZones}) bereikt. {t('seeTemplateSettings') || 'zie instellingen template'}.
              </p>
            </div>
          )}
          <div className="small" style={{ marginBottom: 8, fontWeight: 'bold' }}>
            {t('zones')}:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {zones.map((zone, idx) => {
            const draft = getDraftZone(zone.id);
            const hasChanges = hasUnsavedChanges(zone.id);
            const isExisting = allExistingZones.some(({ zone: ez }) => ez.id === zone.id);
            const hasData = !isExisting && hasUnsavedData(draft);
            
            return (
              <div
                key={zone.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: 6,
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: 8,
                  position: 'relative',
                  ...(isExisting ? {
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: hasChanges ? 'var(--color-danger)' : 'var(--color-primary)',
                  } : hasData ? {
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-danger)',
                  } : {}),
                }}
              >
                <div className="grid grid-6" style={{ gap: 6 }}>
                  <label className="grid">
                    <span className="small">{t('floorRoom')}</span>
                    <input
                      className="input"
                      placeholder="-1.1 of 1.1"
                      value={draft.roomAddress}
                      onChange={(e) => {
                        let cleaned = e.target.value;
                        if (cleaned.startsWith('-')) {
                          cleaned = '-' + cleaned.slice(1).replace(/[^0-9.]/g, '');
                        } else {
                          cleaned = cleaned.replace(/[^0-9.]/g, '');
                        }
                        updateDraftZone(zone.id, 'roomAddress', cleaned);
                      }}
                      style={{ width: '100%', maxWidth: 80 }}
                    />
                  </label>
                  <label className="grid">
                    <span className="small">{t('roomName')}</span>
                    <input
                      className="input"
                      placeholder={t('roomNamePlaceholder') || 'woonkamer'}
                      value={draft.roomName}
                      onChange={(e) => updateDraftZone(zone.id, 'roomName', e.target.value.toLowerCase())}
                      style={{ width: '100%' }}
                    />
                  </label>
                  <div style={{ gridColumn: 'span 3' }}></div>
                  <div className="grid" style={{ gridColumn: 'span 1', textAlign: 'right' }}>
                    <div
                      className="small"
                      style={{
                        fontWeight: 'bold',
                        ...(isExisting ? {
                          color: hasChanges ? 'var(--color-danger)' : 'var(--color-primary)',
                        } : {}),
                      }}
                    >
                      {isExisting ? `${t('savedZone')} ${idx + 1}` : `${t('zoneNumber')} ${idx + 1}`}
                      {isExisting && hasChanges && (
                        <span style={{ marginLeft: 8, fontSize: '0.85em', fontWeight: 'normal' }}>
                          ({t('unsavedChanges') || 'Niet opgeslagen wijzigingen'})
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="button danger"
                        onClick={() => removeZone(zone.id)}
                        style={{ fontSize: '0.875rem', padding: '4px 8px' }}
                        title={t('removeZone')}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
          <div style={{ marginTop: 12 }}>
            <button 
              className="button ghost" 
              onClick={addZone}
              disabled={maxZones !== null && getTotalZoneCount() >= maxZones}
              title={maxZones !== null && getTotalZoneCount() >= maxZones ? `Maximum aantal zones (${maxZones}) bereikt. ${t('seeTemplateSettings') || 'zie instellingen template'}.` : ''}
            >
              {t('addZone')}
            </button>
          </div>
        </div>
      )}
      {zones.length === 0 && (
        <div style={{ marginTop: 12 }}>
          <button 
            className="button ghost" 
            onClick={addZone}
            disabled={maxZones !== null && getTotalZoneCount() >= maxZones}
            title={maxZones !== null && getTotalZoneCount() >= maxZones ? `Maximum aantal zones (${maxZones}) bereikt. ${t('seeTemplateSettings') || 'zie instellingen template'}.` : ''}
          >
            {t('addZone')}
          </button>
        </div>
      )}
      {(zones.some(z => !allExistingZones.some(({ zone: ez }) => ez.id === z.id)) || 
        zones.some(z => hasUnsavedChanges(z.id))) && (
        <div className="flex" style={{ marginTop: 12 }}>
          <button className="button primary" onClick={save} disabled={zones.length === 0}>
            {t.saveZones || 'Zone\'s opslaan'}
          </button>
        </div>
      )}
    </div>
  );
};
