import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import {
  AnyDevice,
  HvacDevice,
  FloorDistributorActuatorData,
  FloorDistributorMode,
  RoomSwitchSensorData,
} from '../types/common';
import { uid } from '../utils/id';
import { generateChannelName } from '../utils/channelName';
import { isValidPhysicalAddress } from '../utils/physicalAddress';
import { useLanguage } from '../i18n/useTranslation';
import { translateUserInput, getStandardUserInput } from '../i18n/userInputTranslations';
import type { Language } from '../i18n/translations';

type Step = 'q1' | 'floorDistributor' | 'q2' | 'roomSwitches' | 'done';

interface InstallerPDFModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (options: {
    floorDistributorMode?: FloorDistributorMode;
    floorDistributorActuators?: FloorDistributorActuatorData[];
    climateZones?: Array<{ id: string; roomAddress: string; roomName: string; channelName: string }>;
    roomSwitchSensorData?: RoomSwitchSensorData[];
  }) => void;
  devices: AnyDevice[];
}

function getUniqueClimateZones(devices: AnyDevice[]): Array<{ id: string; roomAddress: string; roomName: string; channelName: string }> {
  const hvacDevices = devices.filter((d): d is HvacDevice => d.category === 'hvac');
  const seen = new Set<string>();
  const zones: Array<{ id: string; roomAddress: string; roomName: string; channelName: string }> = [];
  hvacDevices.forEach((device) => {
    device.zones.forEach((zone) => {
      const key = zone.id;
      if (!seen.has(key)) {
        seen.add(key);
        zones.push({
          id: zone.id,
          roomAddress: zone.roomAddress || '',
          roomName: zone.roomName || '',
          channelName: zone.channelName || '',
        });
      }
    });
  });
  return zones;
}

function getUsedPhysicalAddressesFromDevices(devices: AnyDevice[]): Set<string> {
  const used = new Set<string>();
  devices.forEach((device) => {
    if ('physicalAddress' in device && device.physicalAddress?.trim()) {
      used.add(device.physicalAddress.trim());
    }
  });
  return used;
}

function getUniqueRooms(devices: AnyDevice[]): Array<{ roomAddress: string; roomName: string }> {
  const rooms = new Map<string, { roomAddress: string; roomName: string }>();
  devices.forEach((device) => {
    if (device.category === 'hvac') {
      device.zones.forEach((zone) => {
        const key = `${zone.roomAddress}-${zone.roomName}`;
        const isEmpty = !zone.roomAddress?.trim() && !zone.roomName?.trim();
        if (!isEmpty && !rooms.has(key)) {
          rooms.set(key, { roomAddress: zone.roomAddress, roomName: zone.roomName });
        }
      });
    } else if (device.category !== 'central' && 'outputs' in device && device.outputs) {
      device.outputs.forEach((output) => {
        const isReserve = (output as { isReserve?: boolean }).isReserve === true;
        if (isReserve) return;
        const key = `${output.roomAddress}-${output.roomName}`;
        const isEmpty = !output.roomAddress?.trim() && !output.roomName?.trim();
        if (!isEmpty && !rooms.has(key)) {
          rooms.set(key, { roomAddress: output.roomAddress, roomName: output.roomName });
        }
      });
    }
  });
  return Array.from(rooms.values());
}

function translateRoomNameForDisplay(roomName: string, lang: Language): string {
  if (!roomName?.trim()) return roomName;
  const standard = getStandardUserInput(roomName, 'roomName') || roomName;
  return translateUserInput(standard, lang, 'roomName');
}

export function InstallerPDFModal({ open, onClose, onGenerate, devices }: InstallerPDFModalProps) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { saveInstallerPdfOptions, getInstallerPdfOptions, currentProjectId } = useAppStore();
  const [step, setStep] = useState<Step>('q1');
  const [includeFloorDistributor, setIncludeFloorDistributor] = useState<boolean | null>(null);
  const [includeRoomSwitches, setIncludeRoomSwitches] = useState<boolean | null>(null);
  const [floorDistributorMode, setFloorDistributorMode] = useState<FloorDistributorMode | null>(null);
  const [actuatorCount, setActuatorCount] = useState<number>(1);
  const [floorDistributorActuators, setFloorDistributorActuators] = useState<FloorDistributorActuatorData[]>([]);
  const [roomSwitchSensorData, setRoomSwitchSensorData] = useState<RoomSwitchSensorData[]>([]);
  const [customTypeComponentIds, setCustomTypeComponentIds] = useState<Set<string>>(new Set());

  const climateZones = useMemo(() => getUniqueClimateZones(devices), [devices]);

  // Load saved installer PDF options from project when modal opens
  useEffect(() => {
    if (open && currentProjectId) {
      const saved = getInstallerPdfOptions();
      if (saved) {
        if (saved.includeFloorDistributor !== undefined) setIncludeFloorDistributor(saved.includeFloorDistributor);
        if (saved.includeRoomSwitches !== undefined) setIncludeRoomSwitches(saved.includeRoomSwitches);
        if (saved.floorDistributorMode) setFloorDistributorMode(saved.floorDistributorMode);
        if (saved.floorDistributorActuators?.length) {
          setFloorDistributorActuators(saved.floorDistributorActuators);
          setActuatorCount(saved.floorDistributorActuators.length);
        }
        if (saved.roomSwitchSensorData?.length) setRoomSwitchSensorData(saved.roomSwitchSensorData);
        // Restore step: if we have room switches data, user was at that step; else floor distributor; else q2 if no floor; else q1
        if (saved.includeRoomSwitches && saved.roomSwitchSensorData?.length) {
          setStep('roomSwitches');
        } else if (saved.includeFloorDistributor && saved.floorDistributorMode) {
          setStep('floorDistributor');
        } else if (saved.includeFloorDistributor === false) {
          setStep('q2');
        } else if (saved.includeFloorDistributor) {
          setStep('floorDistributor');
        }
      }
    }
  }, [open, currentProjectId]);
  const uniqueRooms = useMemo(() => getUniqueRooms(devices), [devices]);
  const usedPhysicalAddressesFromConfig = useMemo(() => getUsedPhysicalAddressesFromDevices(devices), [devices]);

  const resetAndClose = () => {
    setStep('q1');
    setIncludeFloorDistributor(null);
    setIncludeRoomSwitches(null);
    setFloorDistributorMode(null);
    setActuatorCount(1);
    setFloorDistributorActuators([]);
    setRoomSwitchSensorData([]);
    setCustomTypeComponentIds(new Set());
    onClose();
  };

  const handleQ1Yes = () => {
    setIncludeFloorDistributor(true);
    setFloorDistributorMode(null);
    setActuatorCount(1);
    setFloorDistributorActuators([createEmptyActuator()]);
    setStep('floorDistributor');
  };

  const createEmptyActuator = (): FloorDistributorActuatorData => ({
    id: uid(),
    manufacturer: '',
    physicalAddress: '',
    position: '',
    channelCount: 1,
    channels: [{ zoneId: '' }],
  });

  const handleQ1No = () => {
    setIncludeFloorDistributor(false);
    if (currentProjectId) {
      saveInstallerPdfOptions({ includeFloorDistributor: false });
    }
    setStep('q2');
  };

  const handleFloorDistributorNext = () => {
    if (floorDistributorMode === null) return; // Must select mode first
    // Save floor distributor data to project (per-step save)
    if (currentProjectId) {
      saveInstallerPdfOptions({
        includeFloorDistributor: true,
        floorDistributorMode,
        floorDistributorActuators,
        climateZones,
      });
    }
    setStep('q2');
  };

  const handleFloorDistributorBack = () => {
    setStep('q1');
  };

  const handleQ2Back = () => {
    if (includeFloorDistributor) {
      setStep('floorDistributor');
    } else {
      setStep('q1');
    }
  };

  const handleRoomSwitchesBack = () => {
    setStep('q2');
  };

  const handleQ2Yes = () => {
    setIncludeRoomSwitches(true);
    // Don't auto-create components per room – rooms can have 0 switches/sensors
    setRoomSwitchSensorData([]);
    if (currentProjectId) {
      saveInstallerPdfOptions({
        includeRoomSwitches: true,
        roomSwitchSensorData: [],
      });
    }
    setStep('roomSwitches');
  };

  // Save room switch data when it changes (while on roomSwitches step) so work is not lost on close
  useEffect(() => {
    if (!open || !currentProjectId || step !== 'roomSwitches' || !includeRoomSwitches) return;
    const timer = setTimeout(() => {
      saveInstallerPdfOptions({ roomSwitchSensorData });
    }, 500); // Debounce to avoid saving on every keystroke
    return () => clearTimeout(timer);
  }, [roomSwitchSensorData, step, includeRoomSwitches, open, currentProjectId]);

  const handleQ2No = () => {
    setIncludeRoomSwitches(false);
    // Save to project before generating PDF (room switches = no)
    if (currentProjectId) {
      saveInstallerPdfOptions({
        includeFloorDistributor: includeFloorDistributor ?? undefined,
        includeRoomSwitches: false,
        floorDistributorMode: includeFloorDistributor && floorDistributorMode ? floorDistributorMode : undefined,
        floorDistributorActuators: includeFloorDistributor ? floorDistributorActuators : undefined,
        climateZones: includeFloorDistributor ? climateZones : undefined,
      });
    }
    setStep('done');
    onGenerate({
      floorDistributorMode: includeFloorDistributor && floorDistributorMode ? floorDistributorMode : undefined,
      floorDistributorActuators: includeFloorDistributor ? floorDistributorActuators : undefined,
      climateZones: includeFloorDistributor ? climateZones : undefined,
    });
    resetAndClose();
  };

  const handleRoomSwitchesGenerate = () => {
    const filteredRoomData = roomSwitchSensorData.filter((r) => r.physicalAddress.trim());
    // Save to project before generating PDF (all data complete)
    if (currentProjectId) {
      saveInstallerPdfOptions({
        includeFloorDistributor: includeFloorDistributor ?? undefined,
        includeRoomSwitches: true,
        floorDistributorMode: includeFloorDistributor && floorDistributorMode ? floorDistributorMode : undefined,
        floorDistributorActuators: includeFloorDistributor ? floorDistributorActuators : undefined,
        climateZones: includeFloorDistributor ? climateZones : undefined,
        roomSwitchSensorData: filteredRoomData,
      });
    }
    setStep('done');
    onGenerate({
      floorDistributorMode: includeFloorDistributor && floorDistributorMode ? floorDistributorMode : undefined,
      floorDistributorActuators: includeFloorDistributor ? floorDistributorActuators : undefined,
      climateZones: includeFloorDistributor ? climateZones : undefined,
      roomSwitchSensorData: filteredRoomData,
    });
    resetAndClose();
  };

  const setActuatorCountAndSync = (count: number) => {
    setActuatorCount(count);
    setFloorDistributorActuators((prev) => {
      const next = [...prev];
      while (next.length < count) {
        next.push(createEmptyActuator());
      }
      return next.slice(0, count);
    });
  };

  const updateActuator = (index: number, updates: Partial<FloorDistributorActuatorData>) => {
    setFloorDistributorActuators((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const setActuatorChannelCount = (actuatorIndex: number, count: number) => {
    setFloorDistributorActuators((prev) => {
      const next = [...prev];
      const act = next[actuatorIndex];
      const channels = [...act.channels];
      while (channels.length < count) channels.push({ zoneId: '' });
      next[actuatorIndex] = { ...act, channelCount: count, channels: channels.slice(0, count) };
      return next;
    });
  };

  const setActuatorChannelZone = (actuatorIndex: number, channelIndex: number, zoneId: string) => {
    setFloorDistributorActuators((prev) => {
      const next = [...prev];
      const act = next[actuatorIndex];
      const channels = [...act.channels];
      channels[channelIndex] = { ...channels[channelIndex], zoneId };
      next[actuatorIndex] = { ...act, channels };
      return next;
    });
  };

  const setActuatorAllChannelsMode = (actuatorIndex: number, channelMode: 'heating' | 'cooling') => {
    setFloorDistributorActuators((prev) => {
      const next = [...prev];
      const act = next[actuatorIndex];
      const channels = act.channels.map((ch) => ({ ...ch, channelMode }));
      next[actuatorIndex] = { ...act, channels };
      return next;
    });
  };

  const setActuatorChannelMode = (actuatorIndex: number, channelIndex: number, channelMode: 'heating' | 'cooling') => {
    setFloorDistributorActuators((prev) => {
      const next = [...prev];
      const act = next[actuatorIndex];
      const channels = [...act.channels];
      channels[channelIndex] = { ...channels[channelIndex], channelMode };
      next[actuatorIndex] = { ...act, channels };
      return next;
    });
  };

  const addRoomComponent = (roomAddress: string, roomName: string, roomId?: string) => {
    setRoomSwitchSensorData((prev) => [
      ...prev,
      {
        id: uid(),
        roomAddress,
        roomName,
        physicalAddress: '',
        position: '',
        type: 'switch',
        ...(roomId && { roomId }),
      },
    ]);
  };

  const addEmptyRoom = () => {
    const newRoomId = uid();
    addRoomComponent('', '', newRoomId);
  };

  const updateRoomComponent = (id: string, updates: Partial<RoomSwitchSensorData>) => {
    setRoomSwitchSensorData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const updateRoomAddressAndName = (roomKey: string, roomAddress: string, roomName: string) => {
    setRoomSwitchSensorData((prev) =>
      prev.map((r) => {
        const isExtraRoom = r.roomId === roomKey;
        const isAddrNameRoom = roomKey.includes('\x00') && `${r.roomAddress}\x00${r.roomName}` === roomKey;
        if (isExtraRoom || isAddrNameRoom) {
          return { ...r, roomAddress, roomName, roomId: undefined };
        }
        return r;
      })
    );
  };

  const removeRoomComponent = (id: string) => {
    setRoomSwitchSensorData((prev) => prev.filter((r) => r.id !== id));
  };

  const removeRoom = (_roomKey: string, components: RoomSwitchSensorData[]) => {
    const idsToRemove = new Set(components.map((c) => c.id));
    setRoomSwitchSensorData((prev) => prev.filter((r) => !idsToRemove.has(r.id)));
  };

  const getRoomComponents = (roomAddress: string, roomName: string) =>
    roomSwitchSensorData.filter((r) => r.roomAddress === roomAddress && r.roomName === roomName);

  const getRoomComponentsByRoomId = (roomId: string) =>
    roomSwitchSensorData.filter((r) => r.roomId === roomId);

  // Derive all rooms: project rooms (uniqueRooms) + extra manually added rooms + saved data
  // Rooms can have 0 components – no switches/sensors required per room
  const allRoomsForSwitches = useMemo(() => {
    const rooms: Array<{ roomKey: string; roomAddress: string; roomName: string; roomId?: string }> = [];
    const seen = new Set<string>();
    // Add all project rooms (even with 0 components)
    uniqueRooms.forEach((r) => {
      const key = `${r.roomAddress}\x00${r.roomName}`;
      if (!seen.has(key)) {
        seen.add(key);
        rooms.push({ roomKey: key, roomAddress: r.roomAddress, roomName: r.roomName });
      }
    });
    // Add rooms from roomSwitchSensorData (saved components + extra rooms with roomId)
    roomSwitchSensorData.forEach((r) => {
      if (r.roomAddress?.trim() || r.roomName?.trim()) {
        const key = `${r.roomAddress}\x00${r.roomName}`;
        if (!seen.has(key)) {
          seen.add(key);
          rooms.push({ roomKey: key, roomAddress: r.roomAddress, roomName: r.roomName });
        }
      } else if (r.roomId && !seen.has(r.roomId)) {
        seen.add(r.roomId);
        rooms.push({ roomKey: r.roomId, roomAddress: r.roomAddress || '', roomName: r.roomName || '', roomId: r.roomId });
      }
    });
    return rooms;
  }, [uniqueRooms, roomSwitchSensorData]);

  const checkActuatorAddressDuplicate = (addr: string, excludeActuatorIndex: number): boolean => {
    const a = addr?.trim();
    if (!a) return false;
    if (usedPhysicalAddressesFromConfig.has(a)) return true;
    for (let i = 0; i < floorDistributorActuators.length; i++) {
      if (i !== excludeActuatorIndex && floorDistributorActuators[i].physicalAddress?.trim() === a) return true;
    }
    for (const r of roomSwitchSensorData) {
      if (r.physicalAddress?.trim() === a) return true;
    }
    return false;
  };

  const hasAnyDuplicateAddresses = useMemo(() => {
    const seen = new Set<string>();
    for (const a of usedPhysicalAddressesFromConfig) seen.add(a);
    for (let i = 0; i < floorDistributorActuators.length; i++) {
      const a = floorDistributorActuators[i].physicalAddress?.trim();
      if (a) {
        if (seen.has(a)) return true;
        seen.add(a);
      }
    }
    for (const r of roomSwitchSensorData) {
      const a = r.physicalAddress?.trim();
      if (a) {
        if (seen.has(a)) return true;
        seen.add(a);
      }
    }
    return false;
  }, [usedPhysicalAddressesFromConfig, floorDistributorActuators, roomSwitchSensorData]);

  const hasActuatorDuplicateAddresses = useMemo(() => {
    const seen = new Set<string>();
    for (const a of usedPhysicalAddressesFromConfig) seen.add(a);
    for (const act of floorDistributorActuators) {
      const a = act.physicalAddress?.trim();
      if (a) {
        if (seen.has(a)) return true;
        seen.add(a);
      }
    }
    return false;
  }, [usedPhysicalAddressesFromConfig, floorDistributorActuators]);

  const hasFloorDistributorMissingAddresses = useMemo(
    () => floorDistributorActuators.some((a) => !a.physicalAddress?.trim()),
    [floorDistributorActuators]
  );

  const hasFloorDistributorInvalidAddresses = useMemo(
    () =>
      floorDistributorActuators.some(
        (a) => a.physicalAddress?.trim() && !isValidPhysicalAddress(a.physicalAddress)
      ),
    [floorDistributorActuators]
  );

  const hasRoomSwitchesMissingAddresses = useMemo(
    () => roomSwitchSensorData.some((r) => !r.physicalAddress?.trim()),
    [roomSwitchSensorData]
  );

  const hasRoomSwitchesInvalidAddresses = useMemo(
    () =>
      roomSwitchSensorData.some(
        (r) => r.physicalAddress?.trim() && !isValidPhysicalAddress(r.physicalAddress)
      ),
    [roomSwitchSensorData]
  );

  const checkRoomComponentAddressDuplicate = (addr: string, excludeId: string): boolean => {
    const a = addr?.trim();
    if (!a) return false;
    if (usedPhysicalAddressesFromConfig.has(a)) return true;
    for (const act of floorDistributorActuators) {
      if (act.physicalAddress?.trim() === a) return true;
    }
    for (const r of roomSwitchSensorData) {
      if (r.id !== excludeId && r.physicalAddress?.trim() === a) return true;
    }
    return false;
  };

  if (!open) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && resetAndClose()}
    >
      <div
        className="card no-hover"
        style={{ maxWidth: 720, margin: 'auto', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step: Question 1 */}
        {step === 'q1' && (
          <>
            <h2 style={{ marginBottom: 12, fontSize: '1.25rem' }}>
              {t('installerPdfQ1Title')}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              {t('installerPdfQ1Text')}
            </p>
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="button primary" onClick={handleQ1Yes}>
                {t('yes')}
              </button>
              <button type="button" className="button ghost" onClick={handleQ1No}>
                {t('no')}
              </button>
              <button type="button" className="button ghost" onClick={resetAndClose}>
                {t('cancel')}
              </button>
            </div>
          </>
        )}

        {/* Step: Floor distributor form */}
        {step === 'floorDistributor' && (
          <>
            <h2 style={{ marginBottom: 12, fontSize: '1.25rem' }}>
              {t('installerPdfFloorDistributorTitle')}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              {t('installerPdfFloorDistributorHint')}
            </p>
            {/* Mode selection - once for all zones */}
            <div className="card" style={{ marginBottom: 12, padding: 10 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                {t('installerPdfFloorDistributorModeLabel')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(['heating', 'cooling', 'combined', 'separate'] as const).map((mode) => (
                  <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="floorDistributorMode"
                      checked={floorDistributorMode === mode}
                      onChange={() => setFloorDistributorMode(mode)}
                    />
                    <span>{t(`installerPdfFloorDistributorMode_${mode}`)}</span>
                  </label>
                ))}
              </div>
            </div>
            {climateZones.length === 0 ? (
              <p className="small" style={{ marginBottom: 16, fontStyle: 'italic' }}>
                {t('installerPdfNoClimateZones')}
              </p>
            ) : floorDistributorMode ? (
              <div style={{ marginBottom: 12, maxHeight: 420, overflowY: 'auto' }}>
                <div className="card" style={{ marginBottom: 10, padding: 10 }}>
                  <label className="grid">
                    <span className="small">{t('installerPdfActuatorCount')}</span>
                    <input
                      type="number"
                      className="input"
                      min={1}
                      max={20}
                      value={actuatorCount}
                      onChange={(e) => setActuatorCountAndSync(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  </label>
                </div>
                {floorDistributorActuators.map((actuator, actIdx) => (
                  <div key={actuator.id} className="card" style={{ marginBottom: 10, padding: 10 }}>
                    <div className="label" style={{ marginBottom: 6 }}>{t('installerPdfActuator')} {actIdx + 1}</div>
                    <div className="grid grid-4" style={{ gap: 8, marginBottom: 8 }}>
                      <label className="grid">
                        <span className="small">{t('manufacturer')}</span>
                        <input
                          className="input"
                          value={actuator.manufacturer}
                          onChange={(e) => updateActuator(actIdx, { manufacturer: e.target.value })}
                          placeholder={t('installerPdfActuatorManufacturerPlaceholder')}
                        />
                      </label>
                      <label className="grid">
                        <span className="small">{t('physicalAddress')}</span>
                        <input
                          className={`input ${(!actuator.physicalAddress?.trim() || !isValidPhysicalAddress(actuator.physicalAddress) || checkActuatorAddressDuplicate(actuator.physicalAddress, actIdx)) ? 'input-error' : ''}`}
                          value={actuator.physicalAddress}
                          onChange={(e) => updateActuator(actIdx, { physicalAddress: e.target.value })}
                          placeholder="1.1.1"
                        />
                        {actuator.physicalAddress?.trim() && !isValidPhysicalAddress(actuator.physicalAddress) && (
                          <span className="small danger" style={{ marginTop: 2 }}>{t('physicalAddressFormatErrorShort')}</span>
                        )}
                        {checkActuatorAddressDuplicate(actuator.physicalAddress, actIdx) && (
                          <span className="small danger" style={{ marginTop: 2 }}>{t('duplicatePhysicalAddress')}</span>
                        )}
                      </label>
                      <label className="grid">
                        <span className="small">{t('installerPdfActuatorPosition')}</span>
                        <input
                          className="input"
                          value={actuator.position}
                          onChange={(e) => updateActuator(actIdx, { position: e.target.value })}
                          placeholder={t('installerPdfActuatorPositionPlaceholder')}
                        />
                      </label>
                      <label className="grid">
                        <span className="small">{t('installerPdfActuatorChannelCount')}</span>
                        <input
                          type="number"
                          className="input"
                          min={1}
                          max={32}
                          value={actuator.channelCount}
                          onChange={(e) => setActuatorChannelCount(actIdx, Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                      </label>
                    </div>
                    <div className="small" style={{ marginBottom: 4 }}>{t('installerPdfChannelZoneMapping')}</div>
                    {actuator.channels.map((ch, chIdx) => {
                      const chMode = ch.channelMode ?? 'heating';
                      const modeLabel = floorDistributorMode === 'separate'
                        ? (chMode === 'cooling' ? (t('cooling') ?? 'Koelen') : (t('heating') ?? 'Verwarmen'))
                        : floorDistributorMode === 'heating'
                          ? (t('heating') ?? 'Verwarmen')
                          : floorDistributorMode === 'cooling'
                            ? (t('cooling') ?? 'Koelen')
                            : (t('installerPdfCombinedLabel') ?? 'Verwarmen/koelen');
                      const isFirstChannel = chIdx === 0;
                      return (
                        <div key={chIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className="small" style={{ minWidth: 32 }}>
                            {generateChannelName(actuator.manufacturer, chIdx + 1, false, actuator.channelCount)}
                          </span>
                          <select
                            className="input"
                            value={ch.zoneId}
                            onChange={(e) => setActuatorChannelZone(actIdx, chIdx, e.target.value)}
                            style={{ flex: 1, minWidth: 120 }}
                          >
                            <option value="">{t('installerPdfZoneNotAssigned')}</option>
                            {climateZones.map((z) => (
                              <option key={z.id} value={z.id}>
                                {z.roomAddress} {translateRoomNameForDisplay(z.roomName, lang)}
                              </option>
                            ))}
                          </select>
                          {floorDistributorMode === 'separate' ? (
                            <select
                              className="input"
                              value={chMode}
                              onChange={(e) => {
                                const mode = e.target.value as 'heating' | 'cooling';
                                if (isFirstChannel) {
                                  setActuatorAllChannelsMode(actIdx, mode);
                                } else {
                                  setActuatorChannelMode(actIdx, chIdx, mode);
                                }
                              }}
                              style={{ minWidth: 120 }}
                            >
                              <option value="heating">{t('heating') ?? 'Verwarmen'}</option>
                              <option value="cooling">{t('cooling') ?? 'Koelen'}</option>
                            </select>
                          ) : (
                            <span className="small" style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                              ({modeLabel})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <p className="small" style={{ marginBottom: 16, fontStyle: 'italic' }}>
                {t('installerPdfSelectModeFirst')}
              </p>
            )}
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {hasFloorDistributorMissingAddresses && (
                <span className="small danger" style={{ alignSelf: 'center' }}>{t('physicalAddressRequired')}</span>
              )}
              {hasFloorDistributorInvalidAddresses && (
                <span className="small danger" style={{ alignSelf: 'center', whiteSpace: 'pre-line' }}>{t('physicalAddressFormatError')}</span>
              )}
              {hasActuatorDuplicateAddresses && (
                <span className="small danger" style={{ alignSelf: 'center' }}>{t('duplicatePhysicalAddress')}</span>
              )}
              <button type="button" className="button ghost" onClick={handleFloorDistributorBack}>
                {t('back')}
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleFloorDistributorNext}
                disabled={
                  !floorDistributorMode ||
                  hasFloorDistributorMissingAddresses ||
                  hasFloorDistributorInvalidAddresses ||
                  hasActuatorDuplicateAddresses
                }
              >
                {t('next')}
              </button>
              <button type="button" className="button ghost" onClick={resetAndClose}>
                {t('cancel')}
              </button>
            </div>
          </>
        )}

        {/* Step: Question 2 */}
        {step === 'q2' && (
          <>
            <h2 style={{ marginBottom: 12, fontSize: '1.25rem' }}>
              {t('installerPdfQ2Title')}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              {t('installerPdfQ2Text')}
            </p>
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="button ghost" onClick={handleQ2Back}>
                {t('back')}
              </button>
              <button type="button" className="button primary" onClick={handleQ2Yes}>
                {t('yes')}
              </button>
              <button type="button" className="button ghost" onClick={handleQ2No}>
                {t('no')}
              </button>
              <button type="button" className="button ghost" onClick={resetAndClose}>
                {t('cancel')}
              </button>
            </div>
          </>
        )}

        {/* Step: Room switches/sensors form */}
        {step === 'roomSwitches' && (
          <>
            <h2 style={{ marginBottom: 12, fontSize: '1.25rem' }}>
              {t('installerPdfRoomSwitchesTitle')}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              {t('installerPdfRoomSwitchesHint')}
            </p>
            <div style={{ marginBottom: 16, maxHeight: 360, overflowY: 'auto' }}>
                {allRoomsForSwitches.length === 0 ? (
                  <p className="small" style={{ marginBottom: 12, fontStyle: 'italic' }}>
                    {t('installerPdfNoRooms')}
                  </p>
                ) : null}
                {allRoomsForSwitches.map((room) => {
                  const components = room.roomId
                    ? getRoomComponentsByRoomId(room.roomId)
                    : getRoomComponents(room.roomAddress, room.roomName);
                  const isExtraRoom = !!room.roomId;
                  return (
                    <div key={room.roomKey} className="card" style={{ marginBottom: 12, padding: 12 }}>
                      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {isExtraRoom ? (
                          <>
                            <input
                              className="input"
                              value={room.roomAddress}
                              onChange={(e) => updateRoomAddressAndName(room.roomKey, e.target.value, room.roomName)}
                              placeholder="0.1"
                              style={{ width: 60 }}
                            />
                            <input
                              className="input"
                              value={room.roomName}
                              onChange={(e) => updateRoomAddressAndName(room.roomKey, room.roomAddress, e.target.value)}
                              placeholder={t('roomNamePlaceholder')}
                              style={{ flex: 1, minWidth: 100 }}
                            />
                          </>
                        ) : (
                          <span className="label" style={{ margin: 0 }}>
                            {room.roomAddress} {translateRoomNameForDisplay(room.roomName, lang)}
                          </span>
                        )}
                        {components.length > 0 && (
                          <button
                            type="button"
                            className="button ghost"
                            onClick={() => removeRoom(room.roomKey, components)}
                            style={{ color: 'var(--color-danger)', marginLeft: 'auto', padding: '4px 8px' }}
                            title={t('installerPdfRemoveRoom')}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {components.map((comp) => {
                        const isCustomType = customTypeComponentIds.has(comp.id) || (comp.type && comp.type !== 'switch' && comp.type !== 'sensor');
                        return (
                          <div key={comp.id} style={{ marginBottom: 8 }}>
                            <div className="grid" style={{ gap: 8, gridTemplateColumns: '1fr 1fr auto auto', alignItems: 'end' }}>
                              <div>
                                <input
                                  className={`input ${(!comp.physicalAddress?.trim() || !isValidPhysicalAddress(comp.physicalAddress) || checkRoomComponentAddressDuplicate(comp.physicalAddress, comp.id)) ? 'input-error' : ''}`}
                                  value={comp.physicalAddress}
                                  onChange={(e) => updateRoomComponent(comp.id, { physicalAddress: e.target.value })}
                                  placeholder={t('installerPdfPhysicalAddress')}
                                />
                                {comp.physicalAddress?.trim() && !isValidPhysicalAddress(comp.physicalAddress) && (
                                  <span className="small danger" style={{ display: 'block', marginTop: 4 }}>{t('physicalAddressFormatErrorShort')}</span>
                                )}
                                {checkRoomComponentAddressDuplicate(comp.physicalAddress, comp.id) && (
                                  <span className="small danger" style={{ display: 'block', marginTop: 4 }}>{t('duplicatePhysicalAddress')}</span>
                                )}
                              </div>
                              <input
                                className="input"
                                value={comp.position}
                                onChange={(e) => updateRoomComponent(comp.id, { position: e.target.value })}
                                placeholder={t('installerPdfPosition')}
                              />
                              <div style={{ minWidth: 140 }}>
                                <select
                                  className="input"
                                  value={isCustomType ? 'custom' : comp.type || 'switch'}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === 'custom') {
                                      setCustomTypeComponentIds((prev) => new Set(prev).add(comp.id));
                                      updateRoomComponent(comp.id, { type: comp.type && comp.type !== 'switch' && comp.type !== 'sensor' ? comp.type : '' });
                                    } else {
                                      setCustomTypeComponentIds((prev) => {
                                        const next = new Set(prev);
                                        next.delete(comp.id);
                                        return next;
                                      });
                                      updateRoomComponent(comp.id, { type: v });
                                    }
                                  }}
                                  style={{ width: '100%' }}
                                >
                                  <option value="switch">{t('installerPdfTypeSwitch')}</option>
                                  <option value="sensor">{t('installerPdfTypeSensor')}</option>
                                  <option value="custom">{t('installerPdfTypeOther')}</option>
                                </select>
                              </div>
                              <button
                                type="button"
                                className="button ghost"
                                onClick={() => {
                                  removeRoomComponent(comp.id);
                                  setCustomTypeComponentIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(comp.id);
                                    return next;
                                  });
                                }}
                                style={{ color: 'var(--color-danger)' }}
                              >
                                ×
                              </button>
                            </div>
                            {isCustomType && (
                              <div style={{ marginTop: 6, marginBottom: 4 }}>
                                <input
                                  className="input"
                                  value={comp.type}
                                  onChange={(e) => updateRoomComponent(comp.id, { type: e.target.value })}
                                  placeholder={t('installerPdfTypeCustomPlaceholder')}
                                  style={{ maxWidth: 200 }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className="button ghost"
                        onClick={() => addRoomComponent(room.roomAddress, room.roomName, room.roomId)}
                        style={{ marginTop: 4 }}
                      >
                        + {t('installerPdfAddComponent')}
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="button ghost"
                  onClick={addEmptyRoom}
                  style={{ marginTop: 8, width: '100%' }}
                >
                  + {t('installerPdfAddRoom')}
                </button>
              </div>
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {hasRoomSwitchesMissingAddresses && (
                <span className="small danger" style={{ alignSelf: 'center' }}>{t('physicalAddressRequired')}</span>
              )}
              {hasRoomSwitchesInvalidAddresses && (
                <span className="small danger" style={{ alignSelf: 'center', whiteSpace: 'pre-line' }}>{t('physicalAddressFormatError')}</span>
              )}
              {hasAnyDuplicateAddresses && (
                <span className="small danger" style={{ alignSelf: 'center' }}>{t('duplicatePhysicalAddress')}</span>
              )}
              <button type="button" className="button ghost" onClick={handleRoomSwitchesBack}>
                {t('back')}
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleRoomSwitchesGenerate}
                disabled={
                  hasRoomSwitchesMissingAddresses ||
                  hasRoomSwitchesInvalidAddresses ||
                  hasAnyDuplicateAddresses
                }
              >
                {t('generateInstallerPDF')}
              </button>
              <button type="button" className="button ghost" onClick={resetAndClose}>
                {t('cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
