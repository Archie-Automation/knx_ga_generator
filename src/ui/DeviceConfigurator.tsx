import { useMemo, useState, useEffect } from 'react';
import { BlindForm } from '../devices/blind/BlindForm';
import { DimmerForm } from '../devices/dimmer/DimmerForm';
import { HvacForm } from '../devices/hvac/HvacForm';
import { SwitchForm } from '../devices/switch/SwitchForm';
import { useAppStore } from '../store';
import { AnyDevice, DeviceCategory } from '../types/common';
import { useTranslation } from 'react-i18next';

export const DeviceConfigurator = () => {
  const { selectedCategories, addDevice, devices, setStep, template, removeDevice } = useAppStore();
  const { t } = useTranslation();
  
  const deviceLabel: Record<Exclude<DeviceCategory, 'central'>, string> = useMemo(() => ({
    switch: t('switch'),
    dimmer: t('dimmer'),
    blind: t('blind'),
    hvac: t('hvac')
  }), [t]);
  // Initialize actor counts with existing device counts
  const [actorCounts, setActorCounts] = useState<Record<Exclude<DeviceCategory, 'central'>, number>>(() => ({
    switch: devices.switch?.length ?? 0,
    dimmer: devices.dimmer?.length ?? 0,
    blind: devices.blind?.length ?? 0,
    hvac: devices.hvac?.length ?? 0
  }));

  // Update counts when devices change, but only if the count is less than the current count
  // This ensures that when actors are saved, the count doesn't decrease
  // The count should represent total (existing + new), not just existing
  useEffect(() => {
    setActorCounts(prev => ({
      switch: Math.max(prev.switch, devices.switch?.length ?? 0),
      dimmer: Math.max(prev.dimmer, devices.dimmer?.length ?? 0),
      blind: Math.max(prev.blind, devices.blind?.length ?? 0),
      hvac: Math.max(prev.hvac, devices.hvac?.length ?? 0)
    }));
  }, [devices.switch?.length, devices.dimmer?.length, devices.blind?.length, devices.hvac?.length]);

  const updateCount = (category: DeviceCategory, count: number) => {
    const currentCount = devices[category]?.length ?? 0;
    
    // If count is lower than existing, remove the last actors
    if (count < currentCount && category !== 'hvac' && category !== 'central') {
      const devicesToRemove = devices[category] || [];
      // Remove from the end (last actors first)
      for (let i = devicesToRemove.length - 1; i >= count; i--) {
        removeDevice(category, devicesToRemove[i].id);
      }
    }
    
    setActorCounts((prev) => ({ ...prev, [category]: count }));
  };

  const canContinue = useMemo(() => {
    // Allow continuing if at least one category has devices, or if central is selected
    if (selectedCategories.length === 0) return false;
    
    // If central is the only selected category, allow continuing
    if (selectedCategories.length === 1 && selectedCategories[0] === 'central') {
      return true;
    }
    
    // Check if at least one non-central category has devices
    const hasDevices = selectedCategories.some((cat) => {
      if (cat === 'central') return false; // Skip central in this check
      return devices[cat]?.length > 0;
    });
    
    return hasDevices;
  }, [devices, selectedCategories]);

  const renderForm = (category: DeviceCategory) => {
    const onSave = (device: AnyDevice) => {
      addDevice(device);
      // After saving, the device is added to existing, so count stays the same
      // The new actor list will be adjusted by the useEffect in the form
      // No need to change count here - it represents total (existing + new)
    };

    const onUpdate = (device: AnyDevice) => {
      const { updateDevice } = useAppStore.getState();
      updateDevice(category, device);
    };

    switch (category) {
      case 'switch':
        return (
          <SwitchForm
            onSave={onSave}
            onUpdate={onUpdate}
            count={actorCounts.switch}
            onCountChange={(n) => updateCount('switch', n)}
            existing={devices.switch}
          />
        );
      case 'dimmer':
        return (
          <DimmerForm
            onSave={onSave}
            onUpdate={onUpdate}
            count={actorCounts.dimmer}
            onCountChange={(n) => updateCount('dimmer', n)}
            existing={devices.dimmer}
          />
        );
      case 'blind':
        return (
          <BlindForm
            onSave={onSave}
            onUpdate={onUpdate}
            count={actorCounts.blind}
            onCountChange={(n) => updateCount('blind', n)}
            existing={devices.blind}
          />
        );
      case 'hvac':
        return <HvacForm onSave={onSave} onUpdate={onUpdate} existing={devices.hvac} />;
      case 'central':
        // Central is now handled via fixed group addresses, skip rendering
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div className="flex-between">
        <h3>{t.deviceConfigTitle}</h3>
        <span className="small">{t.template}: {template?.name ?? 'Geen'}</span>
      </div>
      {selectedCategories.length === 0 ? (
        <div className="small">{t('selectDeviceTypes')}</div>
      ) : (
        selectedCategories
          .filter((cat) => cat !== 'central') // Filter out central as it's handled via fixed group addresses
          .map((cat) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div className="label">{deviceLabel[cat as Exclude<DeviceCategory, 'central'>]}</div>
              {renderForm(cat)}
            </div>
          ))
      )}
      <div className="flex" style={{ marginTop: 10 }}>
        <button className="button secondary" onClick={() => setStep('devices')}>
          {t('back')}
        </button>
        <button
          className="button primary"
          disabled={!canContinue}
          onClick={() => setStep('overview')}
        >
          {t('next')}: {t('stepOverview')}
        </button>
      </div>
    </div>
  );
};
